import { Injectable, Logger } from '@nestjs/common';
import { CommissionType, Prisma } from '@prisma/client';
import {
  computePriceMaskEffect,
  type PriceMaskRow,
} from 'src/agency-category-price-masks/utils/price-mask.calculator';
import { QuoteFeeConfig } from './quote-config.service';

/// Seguro del VendorRate con su tier de edad ya cargado.
/// (Forma equivalente a `VendorRateInsurance & { ageTier: AgeTier }` de Prisma.)
export type RateInsuranceRow = {
  dailyPrice: Prisma.Decimal;
  ageTier: { ageMin: number; ageMax: number; code?: string } | null;
};

export type SalePricingInput = {
  dailyPrice: Prisma.Decimal;
  billingDays: number;
  /// Requiere seguro "de riesgo" (solo se usa como fallback si no hay tiers por-rate).
  requiresRiskInsurance: boolean;
  feeConfig: QuoteFeeConfig;
  isAirportPickup: boolean;
  includeTransfer: boolean;
  extraDayFromHourRule: boolean;
  commission: { type: CommissionType; value: Prisma.Decimal } | null;
  /** Máscara de margen agencia sobre el subtotal de renta (días × diario base). */
  priceMask?: PriceMaskRow | null;

  // --- NUEVO: campos del VendorRate seleccionado (PDF) ---

  /// Precio específico del día extra (del PDF "DIA EXTRA"). Si null → usa saleDailyPrice.
  rateExtraDayPrice?: Prisma.Decimal | null;
  /// Cargo único de gasolina del VendorRate. Si null → usa feeConfig.fuelFee.
  rateFuelFee?: Prisma.Decimal | null;
  /// Depósito de garantía (solo informativo; no se suma al total).
  rateSecurityDeposit?: Prisma.Decimal | null;

  // --- NUEVO: seguro por edad (Fase 5.3) ---

  /// Edad del conductor al momento del pickup (años enteros).
  driverAgeYears?: number | null;
  /// Lista de seguros del VendorRate con su AgeTier asociado.
  /// Si hay coincidencia por edad, se usa ese precio; si no, fallback al feeConfig.
  rateInsurances?: RateInsuranceRow[];
};

export type SalePricingBreakdown = {
  saleDailyPrice: Prisma.Decimal;
  rentalSubtotal: Prisma.Decimal;
  saleInsuranceDaily: Prisma.Decimal;
  saleFuelFee: Prisma.Decimal;
  saleAirportFee: Prisma.Decimal;
  saleTransferFee: Prisma.Decimal;
  saleExtraDayFee: Prisma.Decimal;
  saleInsuranceTotal: Prisma.Decimal;
  saleFeesTotal: Prisma.Decimal;
  commissionType: CommissionType | null;
  commissionValue: Prisma.Decimal | null;
  commissionAmount: Prisma.Decimal;
  saleTotal: Prisma.Decimal;
  priceMask?: {
    mode: string;
    profit: Prisma.Decimal;
    dailyAdd: Prisma.Decimal;
  } | null;
  /// Depósito de garantía informativo (retenido, no se cobra como ingreso).
  saleSecurityDeposit: Prisma.Decimal;
  /// Metadata de la selección de seguro (qué tier se aplicó, origen del precio, etc.).
  insuranceResolution: InsuranceResolution;
};

export type InsuranceResolution = {
  /// Fuente del precio del seguro utilizado.
  source: 'RATE_TIER' | 'FEE_CONFIG' | 'NONE';
  /// AgeTier matcheado cuando source=RATE_TIER.
  matchedTier?: { ageMin: number; ageMax: number; code?: string } | null;
  /// Motivo cuando source!=RATE_TIER (ej. "no insurances configured", "age out of tiers").
  reason?: string;
};

@Injectable()
export class QuoteSalePricingService {
  private readonly logger = new Logger(QuoteSalePricingService.name);

  computeSalePricing(input: SalePricingInput): SalePricingBreakdown {
    const {
      dailyPrice,
      billingDays,
      requiresRiskInsurance,
      feeConfig,
      extraDayFromHourRule,
    } = input;

    const zero = new Prisma.Decimal(0);

    // --- Máscara de agencia sobre el diario base ---
    const baseRentalSubtotal = dailyPrice.mul(billingDays);
    const maskFx = computePriceMaskEffect(
      input.priceMask ?? null,
      baseRentalSubtotal,
      dailyPrice,
      billingDays,
    );
    const rentalSubtotal = baseRentalSubtotal.add(maskFx.profit);
    const saleDailyPrice = dailyPrice.add(maskFx.dailyAdd);

    const priceMaskMeta =
      maskFx.mode === 'NONE'
        ? null
        : {
            mode: maskFx.mode,
            profit: maskFx.profit,
            dailyAdd: maskFx.dailyAdd,
          };

    // --- Día extra: usa el extraDayPrice del rate si existe, si no saleDailyPrice ---
    const saleExtraDayFee = extraDayFromHourRule
      ? (input.rateExtraDayPrice ?? saleDailyPrice)
      : zero;

    // --- Fees: fuelFee del rate con fallback a feeConfig global ---
    const saleFuelFee = input.rateFuelFee ?? feeConfig.fuelFee;
    const saleAirportFee = input.isAirportPickup ? feeConfig.airportFee : zero;
    const saleTransferFee = input.includeTransfer ? feeConfig.transferFee : zero;

    // --- Seguro por edad (Fase 5.3) con fallback al global ---
    const insuranceResolution = this.resolveInsuranceDaily({
      rateInsurances: input.rateInsurances,
      driverAgeYears: input.driverAgeYears ?? null,
      requiresRiskInsurance,
      feeConfig,
    });
    const saleInsuranceDaily = insuranceResolution.dailyPrice;

    const saleInsuranceTotal = saleInsuranceDaily.mul(billingDays);
    const saleFeesTotal = saleFuelFee.add(saleAirportFee).add(saleTransferFee);

    const subtotalBeforeCommission = rentalSubtotal
      .add(saleInsuranceTotal)
      .add(saleFeesTotal);

    let commissionAmount = zero;
    let commissionType: CommissionType | null = null;
    let commissionValue: Prisma.Decimal | null = null;

    if (input.commission) {
      commissionType = input.commission.type;
      commissionValue = input.commission.value;
      if (input.commission.type === CommissionType.PERCENTAGE) {
        commissionAmount = subtotalBeforeCommission
          .mul(input.commission.value)
          .div(new Prisma.Decimal(100));
      } else {
        commissionAmount = input.commission.value;
      }
    }

    const saleTotal = subtotalBeforeCommission.add(commissionAmount);

    return {
      saleDailyPrice,
      rentalSubtotal,
      saleInsuranceDaily,
      saleFuelFee,
      saleAirportFee,
      saleTransferFee,
      saleExtraDayFee,
      saleInsuranceTotal,
      saleFeesTotal,
      commissionType,
      commissionValue,
      commissionAmount,
      saleTotal,
      priceMask: priceMaskMeta,
      saleSecurityDeposit: input.rateSecurityDeposit ?? zero,
      insuranceResolution: {
        source: insuranceResolution.source,
        matchedTier: insuranceResolution.matchedTier ?? null,
        reason: insuranceResolution.reason,
      },
    };
  }

  /**
   * Resuelve el precio diario del seguro de responsabilidad:
   * 1) Si el VendorRate trae `rateInsurances`, busca el tier que cubra la edad del conductor.
   * 2) Si no hay coincidencia o no se pasó edad, hace fallback al feeConfig (requiresRiskInsurance → riskInsuranceDaily ó 0).
   */
  private resolveInsuranceDaily(params: {
    rateInsurances?: RateInsuranceRow[];
    driverAgeYears: number | null;
    requiresRiskInsurance: boolean;
    feeConfig: QuoteFeeConfig;
  }): {
    dailyPrice: Prisma.Decimal;
    source: InsuranceResolution['source'];
    matchedTier?: { ageMin: number; ageMax: number; code?: string } | null;
    reason?: string;
  } {
    const { rateInsurances, driverAgeYears, requiresRiskInsurance, feeConfig } = params;
    const zero = new Prisma.Decimal(0);

    if (rateInsurances && rateInsurances.length > 0) {
      if (driverAgeYears == null) {
        return {
          dailyPrice: requiresRiskInsurance ? feeConfig.riskInsuranceDaily : zero,
          source: 'FEE_CONFIG',
          reason: 'driverAgeYears missing; using feeConfig fallback',
        };
      }
      const match = rateInsurances.find(
        (ins) =>
          ins.ageTier != null &&
          driverAgeYears >= ins.ageTier.ageMin &&
          driverAgeYears <= ins.ageTier.ageMax,
      );
      if (match && match.ageTier) {
        return {
          dailyPrice: match.dailyPrice,
          source: 'RATE_TIER',
          matchedTier: {
            ageMin: match.ageTier.ageMin,
            ageMax: match.ageTier.ageMax,
            code: match.ageTier.code,
          },
        };
      }
      this.logger.warn(
        `Driver age ${driverAgeYears} no matched AgeTier in VendorRate insurances; falling back to feeConfig.`,
      );
      return {
        dailyPrice: requiresRiskInsurance ? feeConfig.riskInsuranceDaily : zero,
        source: 'FEE_CONFIG',
        reason: `driver age ${driverAgeYears} out of rate insurance tiers`,
      };
    }

    // Sin tiers por-rate: comportamiento actual
    if (requiresRiskInsurance) {
      return {
        dailyPrice: feeConfig.riskInsuranceDaily,
        source: 'FEE_CONFIG',
        reason: 'no rate insurances; requiresRiskInsurance=true',
      };
    }
    return {
      dailyPrice: zero,
      source: 'NONE',
      reason: 'no rate insurances; requiresRiskInsurance=false',
    };
  }
}
