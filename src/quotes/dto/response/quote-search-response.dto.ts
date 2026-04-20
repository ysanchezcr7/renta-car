import { RentalModality } from '@prisma/client';

/**
 * Una oferta devuelta por el motor de cotización multi-vendor.
 *
 * Se separa en:
 *  - Bloque "público" (visible al cliente final): sólo precios de venta.
 *  - Bloque "interno" (visible a la agencia): identifica vendor/tarifa,
 *    se usa para luego crear el Quote formal con `vendorRateId`.
 */
export class QuoteOptionPublicDto {
  /// Identificador de la opción dentro del resultado (index 0..N-1).
  optionId: number;

  /// Precio final que pagará el cliente (con seguros, fees, comisión).
  saleTotal: string;
  saleDailyPrice: string;
  billingDays: number;
  currency: string;

  saleInsuranceDaily: string;
  saleInsuranceTotal: string;
  saleFuelFee: string;
  saleAirportFee: string;
  saleTransferFee: string;
  saleExtraDayFee: string;
  saleFeesTotal: string;
  saleSecurityDeposit: string;

  commissionAmount: string;

  /// Modalidad de la tarifa (RISK/AVAILABILITY/OFFICIAL). Informativo para la UI.
  modality: RentalModality | null;

  /// Nombre de la categoría (ej. "Económico"). Ayuda al cliente a identificar
  /// qué está comprando sin exponer el vendor.
  categoryName: string | null;

  /// Etiqueta del tramo de días aplicado ("3-6", "7-13", "14+"). Para la UI.
  rangeLabel: string | null;
}

/**
 * Detalles internos de la opción. NO se expone al cliente final.
 * La agencia los necesita para trazar la selección y para el POST /quotes
 * (donde se pasa `vendorRateId` y el vendor).
 */
export class QuoteOptionInternalDto extends QuoteOptionPublicDto {
  vendorId: number;
  vendorName: string | null;
  rentadoraId: number;
  rentadoraName: string | null;
  vendorRateId: number;
  rateGroupId: number | null;
  rateGroupName: string | null;

  /// Bandera: se aplicó un override de grupo (ej. "según tarifa oficial").
  overrideApplied: boolean;

  /// Fuente del precio del seguro (RATE_TIER | FEE_CONFIG | NONE) para auditoría.
  insuranceSource: 'RATE_TIER' | 'FEE_CONFIG' | 'NONE';

  /// Warnings individuales de esta opción (ej. "fuera de tier de edad, usado fallback").
  warnings: string[];
}

/// Metadata global del resultado (válida para todas las opciones).
export class QuoteSearchSummaryDto {
  billingDays: number;
  seasonId: number | null;
  seasonCode: string | null;
  rangeLabel: string | null;
  pickupProvinceId: number | null;
  evaluatedVendors: number;
}

/**
 * Respuesta del endpoint `POST /quotes/search`.
 * Se devuelve SIEMPRE la versión "internal" porque el endpoint es para la
 * agencia. Cuando un cliente final quiera ver la oferta elegida, se construye
 * `ClientQuoteResponseDto` desde la opción ganadora.
 */
export class QuoteSearchResponseDto {
  summary: QuoteSearchSummaryDto;
  /// Opciones ordenadas por `saleTotal` ascendente.
  options: QuoteOptionInternalDto[];
  /// Opción recomendada por defecto (la más barata). null si no hay opciones.
  recommendedOptionId: number | null;
  /// Advertencias globales (sin temporada, sin tarifas, etc.).
  warnings: string[];
}

/**
 * Respuesta pública de un Quote ya creado (visible al cliente final).
 * Filtra todos los campos del bloque vendor.
 */
export class ClientQuoteResponseDto {
  id: number;
  status: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupAt: Date;
  dropoffAt: Date;

  billingDays: number | null;
  currency: string;

  saleTotal: string | null;
  saleDailyPrice: string | null;
  saleInsuranceDaily: string | null;
  saleInsuranceTotal: string | null;
  saleFuelFee: string | null;
  saleAirportFee: string | null;
  saleTransferFee: string | null;
  saleExtraDayFee: string | null;
  saleFeesTotal: string | null;

  categoryName: string | null;
  modelName: string | null;
  rangeLabel: string | null;

  createdAt: Date;
}
