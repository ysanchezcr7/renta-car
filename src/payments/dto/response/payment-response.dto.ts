import { Expose } from 'class-transformer';
import { PaymentKind, PaymentStatus } from '@prisma/client';

export class PaymentResponseDto {
  @Expose() id: number;
  @Expose() agencyId: number;
  @Expose() paymentKind: PaymentKind;
  @Expose() quoteId: number | null;
  @Expose() reservationId: number | null;
  @Expose() status: PaymentStatus;
  @Expose() amount: string;
  @Expose() currency: string;
  @Expose() paymentDate: Date;
  @Expose() paymentMethod: string;
  @Expose() paymentReference: string | null;
  @Expose() verifiedByUserId: number | null;
  @Expose() verifiedAt: Date | null;
  @Expose() createdAt: Date;
  @Expose() updatedAt: Date;
}
