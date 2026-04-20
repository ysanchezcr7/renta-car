import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class RequestVendorAvailabilityDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  vendorId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  rentadoraId: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
