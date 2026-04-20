import { TransmissionType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

/// Seguro/relevo de responsabilidad por tier de edad para esta fila de tarifa.
export class VendorRateInsuranceDto {
  @IsInt()
  @IsPositive()
  ageTierId: number;

  @IsNumber()
  @Min(0)
  dailyPrice: number;

  @IsOptional()
  @IsString()
  currency?: string;
}

export class CreateVendorRateDto {
  /// Oferta (VendorRateGroup) a la que pertenece la fila. Opcional para compatibilidad.
  @IsOptional()
  @IsInt()
  @IsPositive()
  rateGroupId?: number;

  @IsInt()
  @IsPositive()
  vendorId: number;

  @IsInt()
  @IsPositive()
  rentadoraId: number;

  @IsOptional()
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @IsInt()
  carModelId?: number;

  @IsOptional()
  @IsEnum(TransmissionType)
  transmission?: TransmissionType;

  @IsOptional()
  @IsInt()
  seasonId?: number;

  @IsInt()
  @IsPositive()
  rateTypeId: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minDays?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxDays?: number;

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validTo?: string;

  @IsNumber()
  @Min(0)
  dailyPrice: number;

  /// Precio de cada día extra después del tramo contratado (columna "DIA EXTRA" del PDF).
  @IsOptional()
  @IsNumber()
  @Min(0)
  extraDayPrice?: number;

  /// Cargo fijo por gasolina/tanque.
  @IsOptional()
  @IsNumber()
  @Min(0)
  fuelFee?: number;

  /// Depósito de garantía (reembolsable, no se cobra como ingreso).
  @IsOptional()
  @IsNumber()
  @Min(0)
  securityDeposit?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  locationId?: number;

  /// Seguros por tier de edad aplicables a esta fila (se crean/reemplazan junto con el VendorRate).
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VendorRateInsuranceDto)
  insurances?: VendorRateInsuranceDto[];
}

