import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

/** Solo referencia al quote; montos y snapshots se toman siempre del servidor. */
export class CreateReservationDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quoteId: number;
}
