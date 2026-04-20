import { Injectable, Logger } from '@nestjs/common';
import { Prisma, RateLayer } from '@prisma/client';
import { CommissionsRepository } from 'src/commissions/commissions.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { VendorRatesRepository } from 'src/vendor-rates/vendor-rates.repository';
import { SearchQuoteOptionsDto } from '../dto/search-quote-options.dto';
import type {
  QuoteOptionInternalDto,
  QuoteSearchResponseDto,
} from '../dto/response/quote-search-response.dto';
import {
  QuoteRateSelectionService,
  type VendorRateRow,
} from './quote-rate-selection.service';
import { QuoteSalePricingService } from './quote-sale-pricing.service';
import { QuoteConfigService } from './quote-config.service';
import { QuoteRentalDaysService } from './quote-rental-days.service';
import { QuoteSeasonService } from './quote-season.service';
import { QuoteSeasonMinDaysService } from './quote-season-min-days.service';
import { QuoteDayRangeService } from './quote-day-range.service';
import { QuoteEligibilityService } from './quote-eligibility.service';

/**
 * Motor de cotización multi-vendor.
 *
 * Flujo completo (según especificación del negocio):
 *   1) Recibe fechas, ubicación, categoría, transmisión y edad.
 *   2) Calcula días de renta.
 *   3) Detecta temporada activa.
 *   4) Consulta tarifas activas de MÚLTIPLES vendors (una sola query amplia).
 *   5) Filtra por rango de días, ubicación, tipo de tarifa, transmisión y modalidad.
 *   6) Calcula precio base = dailyPrice × billingDays.
 *   7) Suma extras por día (seguro por edad) y extras fijos (gasolina, aeropuerto).
 *   8) Compara resultados entre vendors.
 *   9) Devuelve una o varias ofertas (ordenadas por precio ascendente).
 *  10) El endpoint público luego decide cuánta info exponer al cliente.
 */
@Injectable()
export class QuoteMultiVendorSearchService {
  private readonly logger = new Logger(QuoteMultiVendorSearchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vendorRates: VendorRatesRepository,
    private readonly rateSelection: QuoteRateSelectionService,
    private readonly salePricing: QuoteSalePricingService,
    private readonly quoteConfig: QuoteConfigService,
    private readonly rentalDays: QuoteRentalDaysService,
    private readonly seasonSvc: QuoteSeasonService,
    private readonly seasonMinDays: QuoteSeasonMinDaysService,
    private readonly dayRange: QuoteDayRangeService,
    private readonly eligibility: QuoteEligibilityService,
    private readonly commissionsRepo: CommissionsRepository,
  ) {}

  async searchOptions(
    dto: SearchQuoteOptionsDto,
    agencyId?: number | null,
  ): Promise<QuoteSearchResponseDto> {
    const globalWarnings: string[] = [];
    const pickupAt = new Date(dto.pickupAt);
    const dropoffAt = new Date(dto.dropoffAt);

    if (dropoffAt <= pickupAt) {
      return this.emptyResult(globalWarnings.concat('dropoffAt debe ser posterior a pickupAt.'));
    }

    // 1-2) Días de renta
    const rental = this.rentalDays.computeBillingDays(pickupAt, dropoffAt);
    if (rental.billingDays <= 0) {
      return this.emptyResult(globalWarnings.concat('No se pudo calcular una duración de renta válida.'));
    }

    // RateType debe existir y ser capa de venta
    const rateType = await this.prisma.rateType.findFirst({
      where: { id: dto.saleRateTypeId, isActive: true, layer: RateLayer.SALE },
    });
    if (!rateType) {
      return this.emptyResult(globalWarnings.concat('Tipo de tarifa de venta inválido o inactivo.'));
    }

    // 3) Temporada
    const season = await this.seasonSvc.resolveSeasonForPickup(pickupAt);
    if (!season) {
      return this.emptyResult(globalWarnings.concat('No hay temporada definida para la fecha de pickup.'));
    }
    const requiredMin = await this.seasonMinDays.resolveRequiredMinDays(season.code, agencyId ?? undefined);
    if (rental.billingDays < requiredMin) {
      return this.emptyResult(
        globalWarnings.concat(
          `La renta no cumple el mínimo de ${requiredMin} día(s) para la temporada ${season.code}.`,
        ),
      );
    }
    const rangeLabel = this.dayRange.resolveDayRangeLabel(rental.billingDays);

    // Resolver provincia desde pickupLocationId si no viene explícita
    let pickupProvinceId: number | null = dto.pickupProvinceId ?? null;
    let isAirportPickup = false;
    if (dto.pickupLocationId != null) {
      const loc = await this.prisma.location.findFirst({
        where: { id: dto.pickupLocationId, isActive: true },
      });
      if (loc) {
        isAirportPickup = loc.isAirport;
        if (pickupProvinceId == null && loc.province) {
          const provinceLoc = await this.prisma.location.findFirst({
            where: {
              type: 'PROVINCE',
              isActive: true,
              name: { equals: loc.province, mode: 'insensitive' },
            },
            select: { id: true },
          });
          pickupProvinceId = provinceLoc?.id ?? null;
        }
      }
    }

    // Edad del conductor (entrada directa o derivada de DOB)
    const driverAgeYears = this.resolveDriverAge(dto, pickupAt);
    if (driverAgeYears == null) {
      return this.emptyResult(
        globalWarnings.concat('Debe indicarse la edad del conductor (driverAgeYears o driverDob).'),
      );
    }
    const ageEval = this.eligibility.evaluateAge(driverAgeYears);
    if (ageEval.issues.length > 0) {
      return this.emptyResult(globalWarnings.concat(ageEval.issues.map((i) => i.message)));
    }

    // 4-5) Consulta multi-vendor con todos los filtros ya aplicados por el repo
    const allCandidates = await this.vendorRates.searchMatchingSaleRates({
      vendorId: null,
      rentadoraId: dto.rentadoraId ?? null,
      categoryId: dto.categoryId,
      carModelId: dto.carModelId ?? null,
      transmission: dto.transmission,
      seasonId: season.id,
      rateTypeId: dto.saleRateTypeId,
      billingDays: rental.billingDays,
      pickupAt,
      pickupLocationId: dto.pickupLocationId ?? null,
      pickupProvinceId,
      modality: dto.modality ?? null,
    });

    if (allCandidates.length === 0) {
      return this.emptyResult(globalWarnings.concat('No hay tarifas activas que coincidan con los filtros.'));
    }

    // Overrides globales (sin vendorId) -> excluir tarifas cuyos grupos sean reemplazados.
    const overrideMap = await this.vendorRates.findActiveOverridesForVendor(
      null,
      pickupAt,
    );
    const filtered = allCandidates.filter((r) => {
      if (r.rateGroupId == null) return true;
      return !overrideMap.has(r.rateGroupId);
    });
    const workingSet = filtered.length > 0 ? filtered : allCandidates;

    // Agrupar por (vendorId, rentadoraId, rateGroupId ?? 0) -> una opción por combo.
    // Dentro de cada combo, elegir la fila más específica (mejor scoreSpecificity).
    const grouped = this.groupRates(workingSet);

    // Config y comisión (cargadas UNA sola vez y reutilizadas por opción).
    const feeConfig = await this.quoteConfig.loadFeeConfig();
    const commissionRow = agencyId
      ? ((await this.commissionsRepo.findActiveByAgencyId(agencyId)) ??
        (await this.commissionsRepo.findActiveGlobal()))
      : await this.commissionsRepo.findActiveGlobal();
    const commission = commissionRow
      ? { type: commissionRow.type, value: commissionRow.value }
      : null;

    const options: QuoteOptionInternalDto[] = [];

    for (const [, rows] of grouped) {
      const best = this.pickBest(rows, {
        categoryId: dto.categoryId,
        carModelId: dto.carModelId ?? null,
        transmission: dto.transmission,
        seasonId: season.id,
        pickupLocationId: dto.pickupLocationId ?? null,
      });
      if (!best) continue;

      // Máscara de agencia sobre la categoría (si aplica).
      const priceMaskRow = agencyId
        ? await this.prisma.agencyCategoryPriceMask.findUnique({
            where: {
              agencyId_categoryId: {
                agencyId,
                categoryId: dto.categoryId,
              },
            },
          })
        : null;

      const optionWarnings: string[] = [];
      const pricing = this.salePricing.computeSalePricing({
        dailyPrice: best.dailyPrice,
        billingDays: rental.billingDays,
        requiresRiskInsurance: ageEval.requiresRiskInsurance,
        feeConfig,
        isAirportPickup,
        includeTransfer: dto.includeTransfer ?? false,
        extraDayFromHourRule: rental.extraDayFromHourRule,
        commission,
        priceMask: priceMaskRow,
        rateExtraDayPrice: best.extraDayPrice ?? null,
        rateFuelFee: best.fuelFee ?? null,
        rateSecurityDeposit: best.securityDeposit ?? null,
        driverAgeYears,
        rateInsurances: (best.insurances ?? []).map((ins) => ({
          dailyPrice: ins.dailyPrice,
          ageTier: ins.ageTier
            ? {
                ageMin: ins.ageTier.ageMin,
                ageMax: ins.ageTier.ageMax,
                code: ins.ageTier.code,
              }
            : null,
        })),
      });

      if (pricing.insuranceResolution.source === 'FEE_CONFIG' && best.insurances?.length) {
        optionWarnings.push(
          `Seguro: edad ${driverAgeYears} fuera de tiers del rate; se usó feeConfig global.`,
        );
      }

      options.push({
        optionId: 0, // se asigna al final tras ordenar
        saleTotal: pricing.saleTotal.toFixed(2),
        saleDailyPrice: pricing.saleDailyPrice.toFixed(2),
        billingDays: rental.billingDays,
        currency: best.currency,
        saleInsuranceDaily: pricing.saleInsuranceDaily.toFixed(2),
        saleInsuranceTotal: pricing.saleInsuranceTotal.toFixed(2),
        saleFuelFee: pricing.saleFuelFee.toFixed(2),
        saleAirportFee: pricing.saleAirportFee.toFixed(2),
        saleTransferFee: pricing.saleTransferFee.toFixed(2),
        saleExtraDayFee: pricing.saleExtraDayFee.toFixed(2),
        saleFeesTotal: pricing.saleFeesTotal.toFixed(2),
        saleSecurityDeposit: pricing.saleSecurityDeposit.toFixed(2),
        commissionAmount: pricing.commissionAmount.toFixed(2),
        modality: best.rateGroup?.modality ?? null,
        categoryName: best.category?.name ?? null,
        rangeLabel,
        vendorId: best.vendorId,
        vendorName: best.vendor?.name ?? null,
        rentadoraId: best.rentadoraId,
        rentadoraName: best.rentadora?.name ?? null,
        vendorRateId: best.id,
        rateGroupId: best.rateGroupId,
        rateGroupName: best.rateGroup?.name ?? null,
        overrideApplied: filtered.length !== allCandidates.length,
        insuranceSource: pricing.insuranceResolution.source,
        warnings: optionWarnings,
      });
    }

    // 9) Ordenar por saleTotal ASC y asignar optionId
    options.sort((a, b) => {
      const at = new Prisma.Decimal(a.saleTotal);
      const bt = new Prisma.Decimal(b.saleTotal);
      return at.comparedTo(bt);
    });
    options.forEach((o, i) => (o.optionId = i));

    // Contar vendors únicos evaluados (informativo)
    const evaluatedVendors = new Set(workingSet.map((r) => r.vendorId)).size;

    return {
      summary: {
        billingDays: rental.billingDays,
        seasonId: season.id,
        seasonCode: season.code,
        rangeLabel: rangeLabel ?? null,
        pickupProvinceId,
        evaluatedVendors,
      },
      options,
      recommendedOptionId: options.length > 0 ? 0 : null,
      warnings: globalWarnings,
    };
  }

  // --- Helpers privados ---

  private resolveDriverAge(
    dto: SearchQuoteOptionsDto,
    pickupAt: Date,
  ): number | null {
    if (dto.driverAgeYears != null) return dto.driverAgeYears;
    if (dto.driverDob) {
      const dob = new Date(dto.driverDob);
      const decimal = this.eligibility.ageDecimalAtDate(dob, pickupAt);
      return Math.floor(decimal);
    }
    return null;
  }

  /// Agrupa por (vendorId, rentadoraId, rateGroupId). Cada combo representa
  /// una "oferta" distinta. Varias filas del mismo combo suelen ser tramos
  /// de días (ya se prefiltran por billingDays en el repo).
  private groupRates(rows: VendorRateRow[]): Map<string, VendorRateRow[]> {
    const map = new Map<string, VendorRateRow[]>();
    for (const r of rows) {
      const key = `${r.vendorId}|${r.rentadoraId}|${r.rateGroupId ?? 0}`;
      const bucket = map.get(key) ?? [];
      bucket.push(r);
      map.set(key, bucket);
    }
    return map;
  }

  /// Elige la tarifa más específica dentro de un grupo. Reusa la misma
  /// lógica de scoring que el selector single-vendor, pero inline.
  private pickBest(
    rows: VendorRateRow[],
    ctx: {
      categoryId: number;
      carModelId: number | null;
      transmission: VendorRateRow['transmission'];
      seasonId: number;
      pickupLocationId: number | null;
    },
  ): VendorRateRow | null {
    if (rows.length === 0) return null;
    const scored = rows.map((r) => ({ r, s: this.scoreSpecificity(r, ctx) }));
    scored.sort((a, b) => b.s - a.s);
    // En empates quedamos con la primera (mismo score = equivalente para este grupo).
    return scored[0].r;
  }

  private scoreSpecificity(
    rate: VendorRateRow,
    ctx: {
      categoryId: number;
      carModelId: number | null;
      transmission: VendorRateRow['transmission'];
      seasonId: number;
      pickupLocationId: number | null;
    },
  ): number {
    let s = 0;
    if (
      rate.carModelId != null &&
      ctx.carModelId != null &&
      rate.carModelId === ctx.carModelId
    )
      s += 5;
    else if (rate.carModelId == null) s += 1;

    if (rate.categoryId != null && rate.categoryId === ctx.categoryId) s += 4;
    else if (rate.categoryId == null) s += 1;

    if (rate.transmission != null && rate.transmission === ctx.transmission) s += 2;
    else if (rate.transmission == null) s += 1;

    if (rate.seasonId != null && rate.seasonId === ctx.seasonId) s += 2;
    else if (rate.seasonId == null) s += 1;

    if (ctx.pickupLocationId != null) {
      if (rate.locationId != null && rate.locationId === ctx.pickupLocationId) s += 4;
      else if (rate.locationId == null) s += 2;
    } else {
      s += 1;
    }

    if (rate.rateGroupId != null) s += 1;
    return s;
  }

  private emptyResult(warnings: string[]): QuoteSearchResponseDto {
    return {
      summary: {
        billingDays: 0,
        seasonId: null,
        seasonCode: null,
        rangeLabel: null,
        pickupProvinceId: null,
        evaluatedVendors: 0,
      },
      options: [],
      recommendedOptionId: null,
      warnings,
    };
  }
}
