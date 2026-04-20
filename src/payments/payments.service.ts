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
  Role,
} from '@prisma/client';
import type { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { createResponse } from 'src/common/helpers/response-response';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfirmQuotePaymentDto } from './dto/confirm-quote-payment.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentResponseDto } from './dto/response/payment-response.dto';
import { PaymentsRepository } from './payments.repository';

const QUOTE_STATUSES_FOR_AWAITING_PAYMENT: QuoteStatus[] = [
  QuoteStatus.AVAILABILITY_APPROVED,
  QuoteStatus.AGENCY_ACCEPTED,
];

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repo: PaymentsRepository,
  ) {}

  private resolveAgencyId(dto: CreatePaymentDto, user: UserActiveInterface): number {
    if (user.role === Role.SUPER_ADMIN) {
      if (dto.agencyId == null) {
        throw new BadRequestException('agencyId es obligatorio para SUPER_ADMIN.');
      }
      return dto.agencyId;
    }
    if (!user.agencyId) {
      throw new BadRequestException('El usuario no tiene agencia asignada.');
    }
    return user.agencyId;
  }

  async create(dto: CreatePaymentDto, user: UserActiveInterface) {
    const agencyId = this.resolveAgencyId(dto, user);
    const paymentDate = new Date(dto.paymentDate);

    if (dto.paymentKind === PaymentKind.CLIENT) {
      if (dto.quoteId == null) {
        throw new BadRequestException('quoteId es obligatorio para pagos CLIENT.');
      }
      if (dto.reservationId != null) {
        throw new BadRequestException('Un pago CLIENT no debe llevar reservationId.');
      }
      const quote = await this.prisma.quote.findFirst({
        where: { id: dto.quoteId, agencyId },
      });
      if (!quote) {
        throw new NotFoundException('Cotización no encontrada o no pertenece a la agencia.');
      }
    } else {
      if (dto.reservationId == null) {
        throw new BadRequestException('reservationId es obligatorio para pagos VENDOR.');
      }
      if (dto.quoteId != null) {
        throw new BadRequestException('Un pago VENDOR no debe llevar quoteId; use reservationId.');
      }
      const reservation = await this.prisma.reservation.findFirst({
        where: { id: dto.reservationId, agencyId },
      });
      if (!reservation) {
        throw new NotFoundException('Reserva no encontrada o no pertenece a la agencia.');
      }
    }

    const verifyNow = dto.verifyNow === true;
    const now = new Date();

    const data: Prisma.PaymentUncheckedCreateInput = {
      agencyId,
      paymentKind: dto.paymentKind,
      quoteId: dto.quoteId ?? undefined,
      reservationId: dto.reservationId ?? undefined,
      amount: new Prisma.Decimal(dto.amount),
      paymentDate,
      paymentMethod: dto.paymentMethod.trim(),
      paymentReference: dto.paymentReference?.trim() || undefined,
      status: verifyNow ? PaymentStatus.RECEIVED : PaymentStatus.PENDING,
      verifiedByUserId: verifyNow ? (user.id ?? undefined) : undefined,
      verifiedAt: verifyNow ? now : undefined,
    };

    const created = await this.repo.create(data);
    return createResponse(
      PaymentResponseDto,
      verifyNow ? 'Pago registrado y verificado manualmente.' : 'Pago registrado (pendiente de verificación).',
      this.mapPayment(created),
    );
  }

  async markQuoteAwaitingPayment(quoteId: number, user: UserActiveInterface) {
    const quote = await this.loadQuoteScoped(quoteId, user);
    if (!QUOTE_STATUSES_FOR_AWAITING_PAYMENT.includes(quote.status)) {
      throw new ConflictException({
        success: false,
        code: 'QUOTE_STATUS_INVALID_FOR_AWAITING_PAYMENT',
        message:
          'Solo se puede pasar a AWAITING_PAYMENT desde AVAILABILITY_APPROVED o AGENCY_ACCEPTED.',
        currentStatus: quote.status,
      });
    }
    const updated = await this.prisma.quote.update({
      where: { id: quoteId },
      data: { status: QuoteStatus.AWAITING_PAYMENT },
    });
    return {
      success: true,
      message: 'Cotización marcada como en espera de pago del cliente.',
      data: { quoteId: updated.id, status: updated.status },
    };
  }

  async confirmQuotePayment(
    quoteId: number,
    user: UserActiveInterface,
    dto: ConfirmQuotePaymentDto,
  ) {
    const quote = await this.loadQuoteScoped(quoteId, user);
    if (quote.status !== QuoteStatus.AWAITING_PAYMENT) {
      throw new ConflictException({
        success: false,
        code: 'QUOTE_NOT_AWAITING_PAYMENT',
        message:
          'La cotización debe estar en AWAITING_PAYMENT para confirmar el pago del cliente.',
        currentStatus: quote.status,
      });
    }

    const pending = await this.repo.findPendingClientPaymentsForQuote(quoteId, quote.agencyId);
    if (pending.length === 0) {
      throw new BadRequestException({
        success: false,
        code: 'NO_PENDING_CLIENT_PAYMENT',
        message:
          'No hay pago de cliente pendiente. Registre el pago con POST /payments (paymentKind CLIENT) antes de confirmar.',
      });
    }

    let payment = pending[0];
    if (dto.paymentId != null) {
      const found = pending.find((p) => p.id === dto.paymentId);
      if (!found) {
        throw new BadRequestException(
          'El paymentId no corresponde a un pago pendiente de cliente para esta cotización.',
        );
      }
      payment = found;
    } else if (pending.length > 1) {
      throw new BadRequestException(
        'Hay varios pagos de cliente pendientes; envíe paymentId en el cuerpo.',
      );
    }

    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.RECEIVED,
          verifiedByUserId: user.id ?? undefined,
          verifiedAt: now,
        },
      }),
      this.prisma.quote.update({
        where: { id: quoteId },
        data: { status: QuoteStatus.PAYMENT_RECEIVED },
      }),
    ]);

    const verified = await this.repo.findById(payment.id);
    return createResponse(
      PaymentResponseDto,
      'Pago de cliente verificado. Cotización en PAYMENT_RECEIVED.',
      this.mapPayment(verified!),
    );
  }

  private async loadQuoteScoped(quoteId: number, user: UserActiveInterface) {
    const agencyId = user.role === Role.SUPER_ADMIN ? undefined : user.agencyId ?? undefined;
    const quote = await this.prisma.quote.findFirst({
      where: { id: quoteId, ...(agencyId != null ? { agencyId } : {}) },
    });
    if (!quote) throw new NotFoundException('Cotización no encontrada.');
    return quote;
  }

  mapPayment(row: {
    amount: unknown;
    [key: string]: unknown;
  }) {
    return {
      ...row,
      amount: row.amount != null ? String(row.amount) : '0',
    };
  }
}
