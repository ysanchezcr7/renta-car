import { Expose } from 'class-transformer';
import {
  CommissionType,
  ReservationPaymentSnapshotStatus,
  ReservationStatus,
  TransmissionType,
  VoucherSnapshotStatus,
} from '@prisma/client';

export class ReservationResponseDto {
  @Expose() id: number;
  @Expose() agencyId: number;
  @Expose() quoteId: number;
  @Expose() status: ReservationStatus;

  @Expose() rentadoraId: number | null;
  @Expose() categoryId: number | null;
  @Expose() carModelId: number | null;
  @Expose() transmission: TransmissionType | null;

  @Expose() saleRateTypeId: number | null;
  @Expose() vendorPaymentRateTypeId: number | null;

  @Expose() saleTotal: string;
  @Expose() vendorTotalCost: string;
  @Expose() profitTotal: string;

  @Expose() commissionType: CommissionType | null;
  @Expose() commissionValue: string | null;
  @Expose() commissionAmount: string | null;

  @Expose() paymentSnapshotStatus: ReservationPaymentSnapshotStatus;
  @Expose() voucherStatus: VoucherSnapshotStatus;

  @Expose() vendorId: number | null;
  @Expose() saleDailyPrice: string | null;
  @Expose() vendorDailyPrice: string | null;

  @Expose() voucherCode: string | null;
  @Expose() voucherUrl: string | null;
  @Expose() voucherReceivedAt: Date | null;
  @Expose() voucherSentAt: Date | null;

  @Expose() createdAt: Date;
  @Expose() updatedAt: Date;
}
