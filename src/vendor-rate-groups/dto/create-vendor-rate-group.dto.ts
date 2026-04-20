import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { RentalModality } from '@prisma/client';

export class VendorRateGroupOverrideDto {
  @IsInt()
  @IsPositive()
  replacementGroupId: number;

  @IsDateString()
  overrideFrom: string;

  @IsDateString()
  overrideTo: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateVendorRateGroupDto {
  @IsInt()
  @IsPositive()
  vendorId: number;

  @IsString()
  @Length(1, 200)
  name: string;

  @IsEnum(RentalModality)
  modality: RentalModality;

  @IsOptional()
  @IsInt()
  @IsPositive()
  seasonId?: number;

  @IsDateString()
  validFrom: string;

  @IsDateString()
  validTo: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;

  /// IDs de Location que cubre la oferta. Vacío o ausente = todas las provincias.
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  provinceLocationIds?: number[];

  /// Overrides (sub-rangos que reemplazan por otra oferta, p.ej. OFICIAL).
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VendorRateGroupOverrideDto)
  overrides?: VendorRateGroupOverrideDto[];
}
