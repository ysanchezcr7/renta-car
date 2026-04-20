import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class ConfirmQuotePaymentDto {
  /** Si hay varios pagos PENDING de cliente para el quote, indicar cuál confirmar */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  paymentId?: number;
}
