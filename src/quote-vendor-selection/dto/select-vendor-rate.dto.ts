import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class SelectVendorRateDto {
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
  vendorRateId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  vendorPaymentRateTypeId: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  vendorDailyPrice: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  vendorInsuranceDaily?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  vendorFuelFee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  vendorAirportFee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  vendorTransferFee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  vendorExtraDayFee?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  vendorTotalCost: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  vendorInsuranceTotal?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  vendorFeesTotal?: number;

  @IsOptional()
  @IsBoolean()
  approvedOption?: boolean;

  @IsOptional()
  @IsBoolean()
  selectedManually?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}
