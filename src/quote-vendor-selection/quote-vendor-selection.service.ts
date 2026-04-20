import {
  BadRequestException,
  ConflictException,
  GoneException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, QuoteStatus, RateLayer, Role } from '@prisma/client';
import type { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { AVAILABILITY_TTL_MS } from './constants/availability.constants';
import { RequestVendorAvailabilityDto } from './dto/request-vendor-availability.dto';
import { SelectVendorRateDto } from './dto/select-vendor-rate.dto';

const BLOCKED_REQUEST_STATUSES: QuoteStatus[] = [
  QuoteStatus.CANCELLED,
  QuoteStatus.EXPIRED,
  QuoteStatus.AVAILABILITY_APPROVED,
  QuoteStatus.AGENCY_ACCEPTED,
  QuoteStatus.AWAITING_PAYMENT,
  QuoteStatus.PAYMENT_RECEIVED,
  QuoteStatus.REQUEST_SUBMITTED_TO_VENDOR,
  QuoteStatus.PROCESSING_VOUCHER,
  QuoteStatus.VOUCHER_RECEIVED,
  QuoteStatus.VOUCHER_SENT,
];

@Injectable()
export class QuoteVendorSelectionService {
  constructor(private readonly prisma: PrismaService) {}

  isAvailabilityWindowOpen(quote: {
    availabilityExpiresAt: Date | null;
  }): boolean {
    if (!quote.availabilityExpiresAt) return false;
    return quote.availabilityExpiresAt.getTime() > Date.now();
  }

  async requestVendorAvailability(
    quoteId: number,
    dto: RequestVendorAvailabilityDto,
    user: UserActiveInterface,
  ) {
    const quote = await this.loadQuoteForMutation(quoteId, user);
    if (BLOCKED_REQUEST_STATUSES.includes(quote.status)) {
      throw new ConflictException({
        success: false,
        code: 'QUOTE_STATUS_BLOCKS_AVAILABILITY_REQUEST',
        message: 'El estado actual de la cotización no permite solicitar disponibilidad.',
        status: quote.status,
      });
    }

    const link = await this.prisma.vendorRentadora.findFirst({
      where: {
        vendorId: dto.vendorId,
        rentadoraId: dto.rentadoraId,
        isActive: true,
      },
    });
    if (!link) {
      throw new BadRequestException('El vendor no está vinculado a esa rentadora.');
    }

    const now = new Date();
    const expires = new Date(now.getTime() + AVAILABILITY_TTL_MS);

    const notesSuffix = dto.notes?.trim()
      ? `\n[Solicitud disponibilidad ${now.toISOString()}] ${dto.notes.trim()}`
      : '';

    const updated = await this.prisma.quote.update({
      where: { id: quoteId },
      data: {
        status: QuoteStatus.PENDING_VENDOR_AVAILABILITY,
        availabilityRequestedAt: now,
        availabilityExpiresAt: expires,
        availabilityVendorId: dto.vendorId,
        availabilityRentadoraId: dto.rentadoraId,
        notes: quote.notes ? `${quote.notes}${notesSuffix}` : notesSuffix.trim() || undefined,
      },
      include: {
        availabilityVendor: true,
        availabilityRentadora: true,
      },
    });

    return {
      message: 'Ventana de disponibilidad iniciada (2 horas).',
      data: {
        quoteId: updated.id,
        status: updated.status,
        availabilityRequestedAt: updated.availabilityRequestedAt,
        availabilityExpiresAt: updated.availabilityExpiresAt,
        availabilityVendorId: updated.availabilityVendorId,
        availabilityRentadoraId: updated.availabilityRentadoraId,
        ttlMs: AVAILABILITY_TTL_MS,
      },
    };
  }

  async selectVendorRate(quoteId: number, dto: SelectVendorRateDto, user: UserActiveInterface) {
    const quote = await this.loadQuoteForMutation(quoteId, user);

    if (quote.status !== QuoteStatus.PENDING_VENDOR_AVAILABILITY) {
      throw new ConflictException({
        success: false,
        code: 'QUOTE_NOT_PENDING_AVAILABILITY',
        message:
          'La cotización debe estar en PENDING_VENDOR_AVAILABILITY para registrar la tarifa de costo.',
        status: quote.status,
      });
    }

    if (!this.isAvailabilityWindowOpen(quote)) {
      throw new GoneException({
        success: false,
        code: 'AVAILABILITY_EXPIRED',
        message:
          'La ventana de disponibilidad expiró. Solicite una nueva consulta (POST request-vendor-availability).',
        availabilityExpiresAt: quote.availabilityExpiresAt,
      });
    }

    const vendorRate = await this.prisma.vendorRate.findFirst({
      where: {
        id: dto.vendorRateId,
        vendorId: dto.vendorId,
        rentadoraId: dto.rentadoraId,
        isActive: true,
      },
    });
    if (!vendorRate) {
      throw new BadRequestException('La tarifa de vendor no coincide con vendor/rentadora o está inactiva.');
    }

    const paymentRateType = await this.prisma.rateType.findFirst({
      where: {
        id: dto.vendorPaymentRateTypeId,
        isActive: true,
        layer: RateLayer.VENDOR_COST,
      },
    });
    if (!paymentRateType) {
      throw new BadRequestException('Tipo de tarifa de pago al vendor inválido (debe ser capa VENDOR_COST).');
    }

    const d = (n: number) => new Prisma.Decimal(n);

    const fuel = dto.vendorFuelFee ?? 0;
    const airport = dto.vendorAirportFee ?? 0;
    const transfer = dto.vendorTransferFee ?? 0;
    const extra = dto.vendorExtraDayFee ?? 0;
    const feesSum = fuel + airport + transfer + extra;

    const vendorInsuranceTotal =
      dto.vendorInsuranceTotal != null
        ? d(dto.vendorInsuranceTotal)
        : quote.billingDays != null && dto.vendorInsuranceDaily != null
          ? d(dto.vendorInsuranceDaily).mul(quote.billingDays)
          : null;

    const vendorFeesTotal =
      dto.vendorFeesTotal != null ? d(dto.vendorFeesTotal) : feesSum > 0 ? d(feesSum) : null;

    const selectedAt = new Date();
    const approvedOption = dto.approvedOption ?? true;
    const selectedManually = dto.selectedManually ?? true;

    const result = await this.prisma.$transaction(async (tx) => {
      const selection = await tx.quoteVendorSelection.create({
        data: {
          quoteId,
          selectedByUserId: user.id ?? undefined,
          vendorId: dto.vendorId,
          rentadoraId: dto.rentadoraId,
          vendorRateId: dto.vendorRateId,
          vendorPaymentRateTypeId: dto.vendorPaymentRateTypeId,
          vendorDailyPrice: d(dto.vendorDailyPrice),
          vendorInsuranceDaily:
            dto.vendorInsuranceDaily != null ? d(dto.vendorInsuranceDaily) : null,
          vendorFuelFee: dto.vendorFuelFee != null ? d(dto.vendorFuelFee) : null,
          vendorAirportFee: dto.vendorAirportFee != null ? d(dto.vendorAirportFee) : null,
          vendorTransferFee: dto.vendorTransferFee != null ? d(dto.vendorTransferFee) : null,
          vendorExtraDayFee: dto.vendorExtraDayFee != null ? d(dto.vendorExtraDayFee) : null,
          vendorTotalCost: d(dto.vendorTotalCost),
          vendorInsuranceTotal,
          vendorFeesTotal,
          approvedOption,
          selectedManually,
          selectedAt,
          notes: dto.notes?.trim() || null,
        },
      });

      const updatedQuote = await tx.quote.update({
        where: { id: quoteId },
        data: {
          status: QuoteStatus.AVAILABILITY_APPROVED,
          vendorId: dto.vendorId,
          rentadoraId: dto.rentadoraId,
          vendorPaymentRateTypeId: dto.vendorPaymentRateTypeId,
          vendorDailyPrice: d(dto.vendorDailyPrice),
          vendorInsuranceDaily:
            dto.vendorInsuranceDaily != null ? d(dto.vendorInsuranceDaily) : null,
          vendorFuelFee: dto.vendorFuelFee != null ? d(dto.vendorFuelFee) : null,
          vendorAirportFee: dto.vendorAirportFee != null ? d(dto.vendorAirportFee) : null,
          vendorTransferFee: dto.vendorTransferFee != null ? d(dto.vendorTransferFee) : null,
          vendorExtraDayFee: dto.vendorExtraDayFee != null ? d(dto.vendorExtraDayFee) : null,
          vendorTotalCost: d(dto.vendorTotalCost),
          vendorInsuranceTotal,
          vendorFeesTotal,
          notes: dto.notes?.trim()
            ? [quote.notes, `[Selección vendor ${selectedAt.toISOString()}] ${dto.notes.trim()}`]
                .filter((x): x is string => Boolean(x && String(x).trim()))
                .join('\n')
            : quote.notes,
        },
      });

      return { selection, quote: updatedQuote };
    });

    return {
      message: 'Tarifa de vendor registrada y cotización actualizada.',
      data: {
        quoteId: result.quote.id,
        status: result.quote.status,
        vendorSelectionId: result.selection.id,
      },
    };
  }

  private async loadQuoteForMutation(quoteId: number, user: UserActiveInterface) {
    const agencyId = user.role === Role.SUPER_ADMIN ? undefined : user.agencyId ?? undefined;
    const quote = await this.prisma.quote.findFirst({
      where: { id: quoteId, ...(agencyId != null ? { agencyId } : {}) },
    });
    if (!quote) throw new NotFoundException('Cotización no encontrada.');
    return quote;
  }
}
