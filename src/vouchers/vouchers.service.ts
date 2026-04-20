import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DocumentKind,
  EmailEventType,
  Prisma,
  QuoteStatus,
  ReservationStatus,
  Role,
  VoucherRecordStatus,
  VoucherSnapshotStatus,
} from '@prisma/client';
import type { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { EmailLogsService } from 'src/email-logs/email-logs.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProcessVoucherDto } from './dto/process-voucher.dto';
import { SendVoucherDto } from './dto/send-voucher.dto';

@Injectable()
export class VouchersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailLogsService: EmailLogsService,
  ) {}

  async processVoucher(
    reservationId: number,
    dto: ProcessVoucherDto,
    user: UserActiveInterface,
  ) {
    const reservation = await this.loadReservationWithQuote(reservationId, user);

    if (
      reservation.status !== ReservationStatus.SUBMITTED_TO_VENDOR &&
      reservation.status !== ReservationStatus.CONFIRMED
    ) {
      throw new ConflictException({
        code: 'RESERVATION_NOT_READY_FOR_VOUCHER',
        message:
          'El voucher se gestiona tras enviar la reserva al vendor (SUBMITTED_TO_VENDOR o posterior).',
        status: reservation.status,
      });
    }

    const hasVendorInput =
      (dto.vendorVoucherFile != null && dto.vendorVoucherFile.trim() !== '') ||
      (dto.cloudUrl != null && dto.cloudUrl.trim() !== '');
    const hasInternalInput =
      dto.internalVoucherFile != null && dto.internalVoucherFile.trim() !== '';

    if (!hasVendorInput && !hasInternalInput && (dto.notes == null || dto.notes.trim() === '')) {
      throw new BadRequestException(
        'Indique al menos vendorVoucherFile, cloudUrl, internalVoucherFile o notas.',
      );
    }

    const existing = await this.prisma.voucher.findUnique({
      where: { reservationId },
    });

    const mergedVendorFile = dto.vendorVoucherFile?.trim() || existing?.vendorVoucherFile || null;
    const mergedInternalFile =
      dto.internalVoucherFile?.trim() || existing?.internalVoucherFile || null;
    const mergedCloud = dto.cloudUrl?.trim() || existing?.cloudUrl || null;

    const hasVendor = !!(mergedVendorFile || mergedCloud);
    const hasInternal = !!mergedInternalFile;

    const nextStatus = this.resolveVoucherRecordStatus(hasVendor, hasInternal, existing?.status);

    const voucher = await this.prisma.voucher.upsert({
      where: { reservationId },
      create: {
        reservationId,
        vendorVoucherFile: mergedVendorFile,
        internalVoucherFile: mergedInternalFile,
        cloudUrl: mergedCloud,
        status: nextStatus,
        notes: dto.notes?.trim() || undefined,
      },
      update: {
        ...(dto.vendorVoucherFile != null ? { vendorVoucherFile: mergedVendorFile } : {}),
        ...(dto.internalVoucherFile != null ? { internalVoucherFile: mergedInternalFile } : {}),
        ...(dto.cloudUrl != null ? { cloudUrl: mergedCloud } : {}),
        ...(dto.notes != null ? { notes: dto.notes.trim() } : {}),
        status: nextStatus,
      },
    });

    const resData: Prisma.ReservationUpdateInput = {};
    if (hasVendor) {
      resData.voucherStatus = VoucherSnapshotStatus.RECEIVED;
      resData.voucherReceivedAt = new Date();
      if (mergedCloud) {
        resData.voucherUrl = mergedCloud;
      }
    }
    if (hasInternal) {
      resData.voucherStatus = VoucherSnapshotStatus.RECEIVED;
    }

    const quoteData: Prisma.QuoteUpdateInput = {};
    if (hasVendor && reservation.quote) {
      if (
        reservation.quote.status === QuoteStatus.REQUEST_SUBMITTED_TO_VENDOR ||
        reservation.quote.status === QuoteStatus.PROCESSING_VOUCHER
      ) {
        quoteData.status = QuoteStatus.VOUCHER_RECEIVED;
      }
    }

    if (Object.keys(resData).length > 0) {
      await this.prisma.reservation.update({
        where: { id: reservationId },
        data: resData,
      });
    }
    if (Object.keys(quoteData).length > 0) {
      await this.prisma.quote.update({
        where: { id: reservation.quoteId },
        data: quoteData,
      });
    }

    await this.createDocumentsForNewFiles(
      reservation.agencyId,
      reservationId,
      voucher.id,
      dto,
      existing,
    );

    await this.emailLogsService.record({
      agencyId: reservation.agencyId,
      entityType: 'RESERVATION',
      entityId: reservationId,
      emailType: 'VOUCHER',
      quoteId: reservation.quoteId,
      reservationId,
      eventType: hasInternal
        ? EmailEventType.VOUCHER_INTERNAL_READY
        : EmailEventType.VOUCHER_VENDOR_REGISTERED,
      payload: {
        voucherId: voucher.id,
        status: nextStatus,
          byUserId: user.id ?? undefined,
      } as Prisma.JsonObject,
      status: 'SENT',
      sentAt: new Date(),
    });

    return {
      success: true,
      message: 'Voucher actualizado.',
      data: {
        voucherId: voucher.id,
        reservationId,
        voucherStatus: nextStatus,
        reservationVoucherStatus: resData.voucherStatus ?? reservation.voucherStatus,
        quoteStatus: quoteData.status ?? reservation.quote?.status,
      },
    };
  }

  async sendVoucherToAgency(
    reservationId: number,
    dto: SendVoucherDto,
    user: UserActiveInterface,
  ) {
    const reservation = await this.loadReservationWithQuote(reservationId, user);

    const voucher = await this.prisma.voucher.findUnique({
      where: { reservationId },
    });
    if (!voucher) {
      throw new BadRequestException(
        'No hay registro de voucher; use primero POST process-voucher.',
      );
    }

    const hasFinalDoc = !!(voucher.internalVoucherFile?.trim() || voucher.cloudUrl?.trim());
    if (!hasFinalDoc) {
      throw new BadRequestException({
        code: 'VOUCHER_NOT_READY_TO_SEND',
        message:
          'Debe existir voucher interno (internalVoucherFile) o URL final (cloudUrl) antes de enviar a la agencia.',
      });
    }

    if (voucher.status === VoucherRecordStatus.SENT) {
      throw new ConflictException('El voucher ya fue marcado como enviado.');
    }

    if (voucher.status !== VoucherRecordStatus.INTERNAL_READY && voucher.status !== VoucherRecordStatus.VENDOR_UPLOADED) {
      throw new BadRequestException({
        code: 'VOUCHER_INVALID_STATE',
        message: 'El voucher debe tener archivos registrados (process-voucher) antes de enviar.',
        currentStatus: voucher.status,
      });
    }

    const sentAt = new Date();

    await this.prisma.$transaction([
      this.prisma.voucher.update({
        where: { id: voucher.id },
        data: {
          status: VoucherRecordStatus.SENT,
          sentAt,
        },
      }),
      this.prisma.reservation.update({
        where: { id: reservationId },
        data: {
          voucherStatus: VoucherSnapshotStatus.SENT,
          voucherSentAt: sentAt,
        },
      }),
      this.prisma.quote.update({
        where: { id: reservation.quoteId },
        data: { status: QuoteStatus.VOUCHER_SENT },
      }),
    ]);

    await this.emailLogsService.record({
      agencyId: reservation.agencyId,
      entityType: 'RESERVATION',
      entityId: reservationId,
      emailType: 'VOUCHER',
      quoteId: reservation.quoteId,
      reservationId,
      eventType: EmailEventType.VOUCHER_SENT_TO_AGENCY,
      recipientEmail: dto.toEmail?.trim() || null,
      subject: dto.subject?.trim() || 'Voucher enviado a la agencia',
      payload: {
        voucherId: voucher.id,
        message: dto.message ?? null,
          byUserId: user.id ?? undefined,
      } as Prisma.JsonObject,
      status: 'SENT',
      sentAt,
    });

    return {
      success: true,
      message: 'Voucher marcado como enviado a la agencia y log de email registrado.',
      data: {
        voucherId: voucher.id,
        reservationId,
        sentAt,
        quoteStatus: QuoteStatus.VOUCHER_SENT,
      },
    };
  }

  private resolveVoucherRecordStatus(
    hasVendor: boolean,
    hasInternal: boolean,
    previous: VoucherRecordStatus | undefined,
  ): VoucherRecordStatus {
    if (hasInternal) return VoucherRecordStatus.INTERNAL_READY;
    if (hasVendor) return VoucherRecordStatus.VENDOR_UPLOADED;
    return previous ?? VoucherRecordStatus.PENDING;
  }

  private async loadReservationWithQuote(reservationId: number, user: UserActiveInterface) {
    const agencyId = user.role === Role.SUPER_ADMIN ? undefined : user.agencyId ?? undefined;
    const reservation = await this.prisma.reservation.findFirst({
      where: { id: reservationId, ...(agencyId != null ? { agencyId } : {}) },
      include: { quote: true },
    });
    if (!reservation) throw new NotFoundException('Reserva no encontrada.');
    return reservation;
  }

  private async createDocumentsForNewFiles(
    agencyId: number,
    reservationId: number,
    voucherId: number,
    dto: ProcessVoucherDto,
    existing: { vendorVoucherFile: string | null; internalVoucherFile: string | null } | null,
  ) {
    const rows: Prisma.DocumentCreateManyInput[] = [];
    if (
      dto.vendorVoucherFile?.trim() &&
      dto.vendorVoucherFile.trim() !== existing?.vendorVoucherFile
    ) {
      rows.push({
        agencyId,
        reservationId,
        voucherId,
        kind: DocumentKind.VENDOR_VOUCHER,
        fileKey: dto.vendorVoucherFile.trim(),
        cloudUrl: dto.cloudUrl?.trim() || undefined,
      });
    }
    if (
      dto.internalVoucherFile?.trim() &&
      dto.internalVoucherFile.trim() !== existing?.internalVoucherFile
    ) {
      rows.push({
        agencyId,
        reservationId,
        voucherId,
        kind: DocumentKind.INTERNAL_VOUCHER,
        fileKey: dto.internalVoucherFile.trim(),
      });
    }
    if (rows.length) {
      await this.prisma.document.createMany({ data: rows });
    }
  }
}
