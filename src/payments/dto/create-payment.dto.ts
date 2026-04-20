import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { PaymentKind } from '@prisma/client';

export class CreatePaymentDto {
  @IsEnum(PaymentKind)
  paymentKind: PaymentKind;

  /** Obligatorio si paymentKind = CLIENT */
  @ValidateIf((o: CreatePaymentDto) => o.paymentKind === PaymentKind.CLIENT)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quoteId?: number;

  /** Obligatorio si paymentKind = VENDOR */
  @ValidateIf((o: CreatePaymentDto) => o.paymentKind === PaymentKind.VENDOR)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  reservationId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  agencyId?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsDateString()
  paymentDate: string;

  /** Ej. ZELLE, transferencia */
  @IsString()
  @MinLength(1)
  paymentMethod: string;

  @IsOptional()
  @IsString()
  paymentReference?: string;

  /**
   * Si true, el admin confirma el pago en el mismo alta (sin pasarela; p. ej. ya revisó Zelle).
   * No cambia el estado del quote: use POST /quotes/:id/confirm-payment para el flujo cliente.
   */
  @IsOptional()
  verifyNow?: boolean;
}
