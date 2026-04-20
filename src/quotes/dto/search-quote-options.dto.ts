import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  Min,
  ValidateIf,
  IsNumber,
  Max,
  IsString,
} from 'class-validator';
import {
  DriverLicenseKind,
  RentalModality,
  TransmissionType,
} from '@prisma/client';

/**
 * Input del motor de cotización multi-vendor.
 *
 * Requisitos (según especificación del negocio):
 *  - Entrada: fechas, ubicación, categoría, transmisión y edad del conductor.
 *  - NO se exige vendor/rentadora; el motor evalúa todos los activos.
 *  - `driverAgeYears` puede enviarse directo o derivarse de `driverDob`.
 */
export class SearchQuoteOptionsDto {
  // --- Producto (qué se busca) ---

  @IsInt()
  @Min(1)
  categoryId: number;

  /// Opcional: si se envía, se priorizan tarifas de ese modelo concreto; si no,
  /// se consideran tarifas "comodín" de la categoría.
  @IsOptional()
  @IsInt()
  @Min(1)
  carModelId?: number;

  @IsEnum(TransmissionType)
  transmission: TransmissionType;

  /// Tipo de tarifa de venta a evaluar (p.ej. "EXTREMA ALTA"). Obligatorio
  /// porque nuestra BD separa tarifas por `RateType`.
  @IsInt()
  @Min(1)
  saleRateTypeId: number;

  // --- Fechas y ubicación ---

  @IsDateString()
  pickupAt: string;

  @IsDateString()
  dropoffAt: string;

  @IsString()
  pickupLocation: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  pickupLocationId?: number;

  /// Provincia del pickup (Location tipo=PROVINCE). Si no se envía, se intenta
  /// derivar automáticamente del `pickupLocationId`.
  @IsOptional()
  @IsInt()
  @Min(1)
  pickupProvinceId?: number;

  @IsString()
  dropoffLocation: string;

  // --- Conductor (para elegibilidad + seguro por edad) ---

  /// Edad del conductor en años. Si no se manda, se calcula desde `driverDob`.
  @ValidateIf((o: SearchQuoteOptionsDto) => o.driverDob == null)
  @IsNumber()
  @Min(0)
  @Max(120)
  driverAgeYears?: number;

  @IsOptional()
  @IsDateString()
  driverDob?: string;

  @IsOptional()
  @IsEnum(DriverLicenseKind)
  driverLicenseKind?: DriverLicenseKind;

  @IsOptional()
  @IsDateString()
  driverLicenseIssuedAt?: string;

  // --- Filtros opcionales ---

  /// Restringir a una rentadora específica (ej. solo CUBACAR). Si se omite,
  /// se evalúan todas las rentadoras asociadas a los vendors activos.
  @IsOptional()
  @IsInt()
  @Min(1)
  rentadoraId?: number;

  /// Restringir a una modalidad (RISK/AVAILABILITY/OFFICIAL). Si se omite,
  /// se devuelven opciones de todas las modalidades disponibles.
  @IsOptional()
  @IsEnum(RentalModality)
  modality?: RentalModality;

  /// Extras opcionales para el total.
  @IsOptional()
  @Type(() => Boolean)
  includeTransfer?: boolean;
}
