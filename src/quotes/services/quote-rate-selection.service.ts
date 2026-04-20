import { Injectable } from '@nestjs/common';
import { Prisma, RentalModality, TransmissionType } from '@prisma/client';
import { VendorRatesRepository } from 'src/vendor-rates/vendor-rates.repository';

export type RateSearchContext = {
  /// Opcional en búsqueda multi-vendor. Si se omite, se buscan tarifas de
  /// cualquier vendor (y `findActiveOverridesForVendor` evalúa overrides globales).
  vendorId?: number | null;
  /// Opcional en búsqueda multi-vendor. Si se omite, no se filtra por rentadora.
  rentadoraId?: number | null;
  categoryId: number;
  /// Opcional: si se omite, aplican tarifas wildcard (carModelId=null) de cualquier modelo.
  carModelId?: number | null;
  transmission: TransmissionType;
  seasonId: number;
  rateTypeId: number;
  billingDays: number;
  pickupAt: Date;
  pickupLocationId?: number | null;
  /// Provincia del pickup (Location type=PROVINCE). Si está presente, se valida
  /// cobertura contra VendorRateGroupProvince del grupo de la tarifa.
  pickupProvinceId?: number | null;
  /// Modalidad preferida (AVAILABILITY/RISK/OFFICIAL). Opcional: si se omite
  /// no se filtra por modalidad (backward compat).
  modality?: RentalModality | null;
};

/// Tarifa con relaciones cargadas tal como las devuelve `searchMatchingSaleRates`.
/// Asegura que el consumidor tenga acceso a `insurances[].ageTier` y al `rateGroup`.
export type VendorRateRow = Prisma.VendorRateGetPayload<{
  include: {
    rateType: true;
    vendor: true;
    rentadora: true;
    category: true;
    carModel: true;
    season: true;
    location: true;
    rateGroup: { include: { provinces: true } };
    insurances: { include: { ageTier: true } };
  };
}>;

export type RateSelectionResult = {
  rate: VendorRateRow | null;
  candidates: VendorRateRow[];
  conflict: boolean;
  /// true si se aplicó un override de grupo (ej. "según tarifa oficial").
  overrideApplied: boolean;
  /// Mapa sourceGroupId → replacementGroupId aplicado en esta búsqueda.
  overrideMap?: Record<number, number>;
};

@Injectable()
export class QuoteRateSelectionService {
  constructor(private readonly vendorRates: VendorRatesRepository) {}

  async findBestSaleRate(ctx: RateSearchContext): Promise<RateSelectionResult> {
    // 1) Precargar overrides activos para el vendor (o globales si vendorId es null)
    //    en la fecha de pickup.
    const overrideMap = await this.vendorRates.findActiveOverridesForVendor(
      ctx.vendorId ?? null,
      ctx.pickupAt,
    );

    // 2) Buscar candidatos con filtros extendidos (modality + provincia del grupo).
    const rawCandidates = await this.vendorRates.searchMatchingSaleRates(ctx);
    if (rawCandidates.length === 0) {
      return {
        rate: null,
        candidates: [],
        conflict: false,
        overrideApplied: false,
        overrideMap: Object.fromEntries(overrideMap),
      };
    }

    // 3) Aplicar overrides: si una tarifa pertenece a un grupo con override activo,
    //    excluirla (se prefiere la del grupo de reemplazo, que también aparecerá
    //    entre los candidatos si existe).
    const filtered = rawCandidates.filter((r) => {
      if (r.rateGroupId == null) return true;
      return !overrideMap.has(r.rateGroupId);
    });

    const overrideApplied = filtered.length !== rawCandidates.length;
    const candidates = filtered.length > 0 ? filtered : rawCandidates;

    const scored = candidates.map((r) => ({ r, score: this.scoreSpecificity(r, ctx) }));
    scored.sort((a, b) => b.score - a.score);
    const best = scored[0].score;
    const top = scored.filter((s) => s.score === best);
    if (top.length > 1) {
      return {
        rate: null,
        candidates,
        conflict: true,
        overrideApplied,
        overrideMap: Object.fromEntries(overrideMap),
      };
    }
    return {
      rate: top[0].r,
      candidates,
      conflict: false,
      overrideApplied,
      overrideMap: Object.fromEntries(overrideMap),
    };
  }

  /**
   * Mayor puntaje = tarifa más específica (menos comodines).
   */
  private scoreSpecificity(
    rate: VendorRateRow,
    ctx: RateSearchContext,
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

    // Bonus por pertenencia a un VendorRateGroup (oferta cargada del PDF):
    // las tarifas agrupadas son más específicas que filas sueltas antiguas.
    if (rate.rateGroupId != null) s += 1;

    return s;
  }
}
