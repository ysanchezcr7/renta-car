import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PaymentKind,
  PaymentStatus,
  Prisma,
  QuoteStatus,
  ReservationPaymentSnapshotStatus,
  ReservationStatus,
  Role,
  VoucherSnapshotStatus,
} from '@prisma/client';
import type { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { createResponse } from 'src/common/helpers/response-response';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationResponseDto } from './dto/response/reservation-response.dto';
import { computeProfitTotal } from './reservation-snapshot.util';
import {
  canSubmitToVendor,
  nextStatusAfterSubmitToVendor,
  quoteStatusAfterSubmitToVendor,
} from './reservation-state.machine';
import { ReservationsRepository } from './reservations.repository';

@Injectable()
export class ReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repo: ReservationsRepository,
  ) {}

  async create(dto: CreateReservationDto, user: UserActiveInterface) {
    const quote = await this.prisma.quote.findFirst({
      where: {
        id: dto.quoteId,
        ...(user.role !== Role.SUPER_ADMIN && user.agencyId != null
          ? { agencyId: user.agencyId }
          : {}),
      },
      include: { reservation: true },
    });

    if (!quote) {
      throw new NotFoundException('Cotización no encontrada o sin acceso.');
    }

    if (quote.reservation) {
      throw new ConflictException('Esta cotización ya tiene reserva formal.');
    }

    this.assertQuoteBusinessRules(quote);

    await this.assertClientPaymentConfirmed(quote.id, quote.agencyId);

    const saleTotal = quote.saleTotal;
    const vendorTotalCost = quote.vendorTotalCost;
    if (saleTotal == null || vendorTotalCost == null) {
      throw new BadRequestException(
        'La cotización no tiene saleTotal o vendorTotalCost en servidor; no se puede reservar.',
      );
    }

    const profitTotal = computeProfitTotal(saleTotal, vendorTotalCost);

    const data: Prisma.ReservationUncheckedCreateInput = {
      agencyId: quote.agencyId,
      quoteId: quote.id,
      status: ReservationStatus.CREATED,
      rentadoraId: quote.rentadoraId!,
      categoryId: quote.categoryId!,
      carModelId: quote.carModelId!,
      transmission: quote.transmission!,
      saleRateTypeId: quote.saleRateTypeId!,
      vendorPaymentRateTypeId: quote.vendorPaymentRateTypeId!,
      saleDailyPrice: quote.saleDailyPrice ?? undefined,
      saleTotal,
      vendorTotalCost,
      profitTotal,
      commissionType: quote.commissionType ?? undefined,
      commissionValue: quote.commissionValue ?? undefined,
      commissionAmount: quote.commissionAmount ?? undefined,
      paymentSnapshotStatus: ReservationPaymentSnapshotStatus.CLIENT_CONFIRMED,
      voucherStatus: VoucherSnapshotStatus.NOT_ISSUED,
      vendorId: quote.vendorId ?? undefined,
      vendorDailyPrice: quote.vendorDailyPrice ?? undefined,
    };

    const created = await this.repo.create(data);
    return createResponse(
      ReservationResponseDto,
      'Reserva creada con snapshot desde la cotización.',
      this.mapReservation(created),
    );
  }

  async findOne(id: number, user: UserActiveInterface) {
    const agencyId = user.role === Role.SUPER_ADMIN ? undefined : user.agencyId ?? undefined;
    const row = await this.repo.findById(id, agencyId);
    if (!row) throw new NotFoundException('Reserva no encontrada.');
    return createResponse(
      ReservationResponseDto,
      'Reserva obtenida.',
      this.mapReservation(row),
    );
  }

  async submitToVendor(id: number, user: UserActiveInterface) {
    const agencyId = user.role === Role.SUPER_ADMIN ? undefined : user.agencyId ?? undefined;
    const reservation = await this.repo.findById(id, agencyId);
    if (!reservation) throw new NotFoundException('Reserva no encontrada.');

    if (!canSubmitToVendor(reservation.status)) {
      throw new ConflictException({
        code: 'RESERVATION_INVALID_TRANSITION',
        message: 'Solo se puede enviar al vendor desde estado CREATED.',
        currentStatus: reservation.status,
      });
    }

    const nextRes = nextStatusAfterSubmitToVendor();
    const nextQuote = quoteStatusAfterSubmitToVendor();

    await this.prisma.$transaction([
      this.prisma.reservation.update({
        where: { id: reservation.id },
        data: {
          status: nextRes,
          voucherStatus: VoucherSnapshotStatus.PENDING,
        },
      }),
      this.prisma.quote.update({
        where: { id: reservation.quoteId },
        data: { status: nextQuote },
      }),
    ]);

    const updated = await this.repo.findById(reservation.id, agencyId);
    return createResponse(
      ReservationResponseDto,
      'Reserva enviada al vendor; voucher pendiente.',
      this.mapReservation(updated!),
    );
  }

  private assertQuoteBusinessRules(quote: {
    status: QuoteStatus;
    requiresManualReview: boolean;
    availabilityExpiresAt: Date | null;
    rentadoraId: number | null;
    categoryId: number | null;
    carModelId: number | null;
    transmission: unknown;
    saleRateTypeId: number | null;
    vendorPaymentRateTypeId: number | null;
    vendorId: number | null;
  }) {
    if (quote.status !== QuoteStatus.PAYMENT_RECEIVED) {
      throw new BadRequestException({
        code: 'QUOTE_NOT_PAID',
        message: 'El quote debe estar en PAYMENT_RECEIVED con pago de cliente confirmado.',
        status: quote.status,
      });
    }

    if (quote.requiresManualReview) {
      throw new BadRequestException(
        'No se puede reservar una cotización que sigue en revisión manual de tarifa.',
      );
    }

    if (quote.availabilityExpiresAt != null && quote.availabilityExpiresAt.getTime() <= Date.now()) {
      throw new BadRequestException({
        code: 'AVAILABILITY_EXPIRED',
        message:
          'La ventana de disponibilidad expiró. Solicite de nuevo disponibilidad (quotes) antes de reservar.',
      });
    }

    const missing: string[] = [];
    if (quote.rentadoraId == null) missing.push('rentadoraId');
    if (quote.categoryId == null) missing.push('categoryId');
    if (quote.carModelId == null) missing.push('carModelId');
    if (quote.transmission == null) missing.push('transmission');
    if (quote.saleRateTypeId == null) missing.push('saleRateTypeId');
    if (quote.vendorPaymentRateTypeId == null) missing.push('vendorPaymentRateTypeId');
    if (quote.vendorId == null) missing.push('vendorId');

    if (missing.length > 0) {
      throw new BadRequestException({
        code: 'QUOTE_INCOMPLETE_SNAPSHOT',
        message: `Faltan datos obligatorios en la cotización: ${missing.join(', ')}.`,
      });
    }
  }

  private async assertClientPaymentConfirmed(quoteId: number, agencyId: number) {
    const confirmed = await this.prisma.payment.findFirst({
      where: {
        quoteId,
        agencyId,
        paymentKind: PaymentKind.CLIENT,
        status: PaymentStatus.RECEIVED,
      },
    });
    if (!confirmed) {
      throw new BadRequestException({
        code: 'CLIENT_PAYMENT_NOT_CONFIRMED',
        message:
          'Debe existir un pago de cliente verificado (CLIENT + RECEIVED) para este quote.',
      });
    }
  }

  private mapReservation(row: {
    saleTotal: unknown;
    vendorTotalCost: unknown;
    profitTotal: unknown;
    commissionValue: unknown;
    commissionAmount: unknown;
    saleDailyPrice: unknown;
    vendorDailyPrice: unknown;
    [key: string]: unknown;
  }) {
    const dec = (v: unknown) => (v != null ? String(v) : null);
    return {
      ...row,
      saleTotal: dec(row.saleTotal),
      vendorTotalCost: dec(row.vendorTotalCost),
      profitTotal: dec(row.profitTotal),
      commissionValue: dec(row.commissionValue),
      commissionAmount: dec(row.commissionAmount),
      saleDailyPrice: dec(row.saleDailyPrice),
      vendorDailyPrice: dec(row.vendorDailyPrice),
    };
  }
}
