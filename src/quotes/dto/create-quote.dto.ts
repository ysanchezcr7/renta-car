import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsDefined,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { DriverLicenseKind, RentalModality, TransmissionType } from '@prisma/client';

export class QuoteDriverSnapshotDto {
  @IsDateString()
  dateOfBirth: string;

  @IsEnum(DriverLicenseKind)
  licenseKind: DriverLicenseKind;

  @IsDateString()
  licenseIssuedAt: string;
}

export class CreateQuoteDto {
  @ValidateIf((o: CreateQuoteDto) => o.clientId == null)
  @IsDefined({ message: 'Sin clientId debe enviarse driver' })
  @ValidateNested()
  @Type(() => QuoteDriverSnapshotDto)
  driver?: QuoteDriverSnapshotDto;

  @IsOptional()
  @IsInt()
  @Min(1)
  clientId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  agencyId?: number;

  @IsInt()
  @Min(1)
  vendorId: number;

  @IsInt()
  @Min(1)
  rentadoraId: number;

  @IsInt()
  @Min(1)
  categoryId: number;

  @IsInt()
  @Min(1)
  carModelId: number;

  @IsEnum(TransmissionType)
  transmission: TransmissionType;

  @IsInt()
  @Min(1)
  saleRateTypeId: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  pickupLocationId?: number;

  @IsString()
  pickupLocation: string;

  @IsString()
  dropoffLocation: string;

  @IsDateString()
  pickupAt: string;

  @IsDateString()
  dropoffAt: string;

  @IsOptional()
  @IsBoolean()
  includeTransfer?: boolean;

  /// Modalidad de tarifa preferida (AVAILABILITY/RISK/OFFICIAL). Cuando se
  /// omite, el motor no filtra por modalidad (compat. hacia atrás).
  @IsOptional()
  @IsEnum(RentalModality)
  modality?: RentalModality;
}
