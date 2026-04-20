import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { RentalModality, TransmissionType } from '@prisma/client';

export class RatesSearchQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  vendorId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  rentadoraId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  carModelId: number;

  @IsEnum(TransmissionType)
  transmission: TransmissionType;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  saleRateTypeId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pickupLocationId?: number;

  /// Provincia del pickup (Location tipo=PROVINCE). Opcional; el motor filtra
  /// tarifas cuyo VendorRateGroup restringe provincias a ésta.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pickupProvinceId?: number;

  /// Modalidad preferida (AVAILABILITY/RISK/OFFICIAL).
  @IsOptional()
  @IsEnum(RentalModality)
  modality?: RentalModality;

  @IsDateString()
  pickupAt: string;

  @IsDateString()
  dropoffAt: string;
}
