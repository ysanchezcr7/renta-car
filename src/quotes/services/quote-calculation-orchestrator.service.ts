import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  DriverLicenseKind,
  Prisma,
  QuoteStatus,
  RateLayer,
  Role,
  TransmissionType,
} from '@prisma/client';
import type { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { CommissionsRepository } from 'src/commissions/commissions.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateQuoteDto } from '../dto/create-quote.dto';
import { RatesSearchQueryDto } from '../dto/rates-search-query.dto';
import { QuoteDayRangeService } from './quote-day-range.service';
import { QuoteEligibilityService } from './quote-eligibility.service';
import { QuoteRentalDaysService } from './quote-rental-days.service';
import { QuoteRateSelectionService } from './quote-rate-selection.service';
import { QuoteSalePricingService } from './quote-sale-pricing.service';
import { QuoteSeasonMinDaysService } from './quote-season-min-days.service';
import { QuoteSeasonService } from './quote-season.service';
import { QuoteConfigService } from './quote-config.service';

export type PreparedQuoteRecord = Prisma.QuoteUncheckedCreateInput;

type DriverResolution = {
  ageDecimal: number;
  driverAgeYears: number;
  licenseKind: DriverLicenseKind;
  licenseIssuedAt: Date;
};

@Injectable()
export class QuoteCalculationOrchestratorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rentalDays: QuoteRentalDaysService,
    private readonly dayRange: QuoteDayRangeService,
    private readonly seasonSvc: QuoteSeasonService,
    private readonly seasonMinDays: QuoteSeasonMinDaysService,
    private readonly eligibility: QuoteEligibilityService,
    private readonly rateSelection: QuoteRateSelectionService,
    private readonly salePricing: QuoteSalePricingService,
    private readonly quoteConfig: QuoteConfigService,
    private readonly commissionsRepo: CommissionsRepository,
  ) {}

  async buildQuoteFromDto(
    dto: CreateQuoteDto,
    user: UserActiveInterface,
  ): Promise<{ data: PreparedQuoteRecord; warnings: string[] }> {
    const warnings: string[] = [];
    const pickupAt = new Date(dto.pickupAt);
    const dropoffAt = new Date(dto.dropoffAt);
    if (dropoffAt <= pickupAt) {
      throw new BadRequestException('dropoffAt debe ser posterior a pickupAt.');
    }

    const agencyId = this.resolveAgencyId(dto, user);

    const vendorLink = await this.prisma.vendorRentadora.findFirst({
      where: { vendorId: dto.vendorId, rentadoraId: dto.rentadoraId, isActive: true },
    });
    if (!vendorLink) {
      throw new BadRequestException('El vendor no está asociado a la rentadora indicada.');
    }

    const model = await this.prisma.carModel.findFirst({
      where: { id: dto.carModelId, categoryId: dto.categoryId, isActive: true },
      include: { category: true },
    });
    if (!model || model.category.rentadoraId !== dto.rentadoraId) {
      throw new BadRequestException('El modelo no pertenece a la categoría/rentadora indicada.');
    }

    if (model.transmission !== dto.transmission) {
      throw new BadRequestException('La transmisión no coincide con la del modelo.');
    }

    const rateType = await this.prisma.rateType.findFirst({
      where: { id: dto.saleRateTypeId, isActive: true, layer: RateLayer.SALE },
    });
    if (!rateType) {
      throw new BadRequestException('Tipo de tarifa de venta inválido o inactivo.');
    }

    let pickupLabel = dto.pickupLocation;
    let pickupLocationId: number | null = dto.pickupLocationId ?? null;
    let pickupProvinceId: number | null = null;
    let isAirportPickup = false;
    if (pickupLocationId != null) {
      const loc = await this.prisma.location.findFirst({
        where: { id: pickupLocationId, isActive: true },
      });
      if (!loc) throw new NotFoundException('Ubicación de pickup no encontrada.');
      pickupLabel = loc.name;
      isAirportPickup = loc.isAirport;
      // Resolvemos pickupProvinceId a partir del campo `province` (texto) de la Location,
      // buscando una Location tipo 'PROVINCE' con nombre equivalente. Si no existe, queda null.
      if (loc.province) {
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

    const driverCtx = await this.resolveDriverContext(dto, pickupAt, agencyId);

    const ageEval = this.eligibility.evaluateAge(driverCtx.ageDecimal);
    const licIssues = this.eligibility.evaluateLicense(
      driverCtx.licenseKind,
      driverCtx.licenseIssuedAt,
      pickupAt,
    );
    const elig = this.eligibility.mergeEligibility(
      {
        eligible: ageEval.issues.length === 0,
        requiresRiskInsurance: ageEval.requiresRiskInsurance,
        issues: ageEval.issues,
      },
      licIssues,
    );
    this.eligibility.assertEligibleOrThrow(elig);

    const rental = this.rentalDays.computeBillingDays(pickupAt, dropoffAt);
    if (rental.billingDays <= 0) {
      throw new BadRequestException('No se pudo calcular una duración de renta válida.');
    }

    const season = await this.seasonSvc.resolveSeasonForPickup(pickupAt);
    if (!season) {
      warnings.push('No hay temporada definida para la fecha de pickup.');
    }

    const seasonCode = season?.code ?? 'UNKNOWN';
    const requiredMin = await this.seasonMinDays.resolveRequiredMinDays(seasonCode, agencyId);
    if (rental.billingDays < requiredMin) {
      throw new UnprocessableEntityException({
        success: false,
        code: 'QUOTE_MIN_DAYS_NOT_MET',
        message: `La renta no cumple el mínimo de ${requiredMin} día(s) para la temporada/reglas vigentes.`,
        details: { requiredMin, billingDays: rental.billingDays, seasonCode },
      });
    }

    const rangeLabel = this.dayRange.resolveDayRangeLabel(rental.billingDays);
    if (!rangeLabel) {
      warnings.push(
        `Los días facturables (${rental.billingDays}) están fuera de los rangos estándar 3–6, 7–13 o 14–30; puede requerir tarifa manual.`,
      );
    }

    let requiresManualReview = false;
    let reviewReason: string | null = null;

    if (!season) {
      requiresManualReview = true;
      reviewReason = 'Sin temporada para la fecha de pickup.';
    }

    let selectedRate: Awaited<
      ReturnType<QuoteRateSelectionService['findBestSaleRate']>
    >['rate'] = null;
    let rateConflict = false;
    let overrideApplied = false;
    let overrideMap: Record<number, number> | undefined;

    if (season) {
      const sel = await this.rateSelection.findBestSaleRate({
        vendorId: dto.vendorId,
        rentadoraId: dto.rentadoraId,
        categoryId: dto.categoryId,
        carModelId: dto.carModelId,
        transmission: dto.transmission,
        seasonId: season.id,
        rateTypeId: dto.saleRateTypeId,
        billingDays: rental.billingDays,
        pickupAt,
        pickupLocationId,
        pickupProvinceId,
        modality: dto.modality ?? null,
      });
      rateConflict = sel.conflict;
      overrideApplied = sel.overrideApplied;
      overrideMap = sel.overrideMap;
      if (sel.conflict) {
        requiresManualReview = true;
        reviewReason = 'Múltiples tarifas de venta con la misma especificidad; revisión manual.';
      } else if (!sel.rate) {
        requiresManualReview = true;
        reviewReason = reviewReason
          ? `${reviewReason} Además, no hay tarifa de venta coincidente.`
          : 'No hay tarifa de venta coincidente para los filtros indicados.';
      } else {
        selectedRate = sel.rate;
      }
    } else {
      requiresManualReview = true;
      reviewReason = reviewReason ?? 'Sin temporada; no se buscó tarifa.';
    }

    const feeConfig = await this.quoteConfig.loadFeeConfig();
    const commissionRow =
      (await this.commissionsRepo.findActiveByAgencyId(agencyId)) ??
      (await this.commissionsRepo.findActiveGlobal());

    const commission =
      commissionRow != null ? { type: commissionRow.type, value: commissionRow.value } : null;

    const priceMaskRow = await this.prisma.agencyCategoryPriceMask.findUnique({
      where: {
        agencyId_categoryId: {
          agencyId,
          categoryId: dto.categoryId,
        },
      },
    });

    const pricing =
      selectedRate != null
        ? this.salePricing.computeSalePricing({
            dailyPrice: selectedRate.dailyPrice,
            billingDays: rental.billingDays,
            requiresRiskInsurance: elig.requiresRiskInsurance,
            feeConfig,
            isAirportPickup,
            includeTransfer: dto.includeTransfer ?? false,
            extraDayFromHourRule: rental.extraDayFromHourRule,
            commission,
            priceMask: priceMaskRow,
            rateExtraDayPrice: selectedRate.extraDayPrice ?? null,
            rateFuelFee: selectedRate.fuelFee ?? null,
            rateSecurityDeposit: selectedRate.securityDeposit ?? null,
            driverAgeYears: driverCtx.driverAgeYears,
            rateInsurances: (selectedRate.insurances ?? []).map((ins) => ({
              dailyPrice: ins.dailyPrice,
              ageTier: ins.ageTier
                ? {
                    ageMin: ins.ageTier.ageMin,
                    ageMax: ins.ageTier.ageMax,
                    code: ins.ageTier.code,
                  }
                : null,
            })),
          })
        : null;

    const status = requiresManualReview ? QuoteStatus.MANUAL_REVIEW : QuoteStatus.QUOTE_REQUESTED;

    const metadata: Prisma.JsonObject = {
      rental,
      rangeLabel,
      rateConflict,
      warnings,
      seasonId: season?.id ?? null,
      seasonCode,
      modality: dto.modality ?? null,
      pickupProvinceId,
      rateGroupId: selectedRate?.rateGroupId ?? null,
      overrideApplied,
      overrideMap: overrideMap ?? null,
      insuranceResolution: pricing?.insuranceResolution
        ? {
            source: pricing.insuranceResolution.source,
            matchedTier: pricing.insuranceResolution.matchedTier ?? null,
            reason: pricing.insuranceResolution.reason ?? null,
          }
        : null,
      securityDeposit: pricing?.saleSecurityDeposit?.toString() ?? null,
      priceMask:
        pricing?.priceMask != null
          ? {
              mode: pricing.priceMask.mode,
              profit: pricing.priceMask.profit.toString(),
              dailyAdd: pricing.priceMask.dailyAdd.toString(),
            }
          : null,
    };

    const data: PreparedQuoteRecord = {
      agencyId,
      clientId: dto.clientId ?? undefined,
      createdByUserId: user.id ?? undefined,
      status,
      pickupLocation: pickupLabel,
      dropoffLocation: dto.dropoffLocation,
      pickupAt,
      dropoffAt,
      driverAge: driverCtx.driverAgeYears,
      pickupLocationId: pickupLocationId ?? undefined,
      rentadoraId: dto.rentadoraId,
      categoryId: dto.categoryId,
      carModelId: dto.carModelId,
      seasonId: season?.id ?? undefined,
      transmission: dto.transmission,
      billingDays: rental.billingDays,
      rentalDayRangeLabel: rangeLabel ?? undefined,
      vendorId: dto.vendorId,
      saleRateTypeId: dto.saleRateTypeId,
      saleDailyPrice: pricing?.saleDailyPrice,
      saleInsuranceDaily: pricing?.saleInsuranceDaily,
      saleFuelFee: pricing?.saleFuelFee,
      saleAirportFee: pricing?.saleAirportFee,
      saleTransferFee: pricing?.saleTransferFee,
      saleExtraDayFee: pricing?.saleExtraDayFee,
      saleInsuranceTotal: pricing?.saleInsuranceTotal,
      saleFeesTotal: pricing?.saleFeesTotal,
      commissionType: pricing?.commissionType ?? undefined,
      commissionValue: pricing?.commissionValue ?? undefined,
      commissionAmount: pricing?.commissionAmount,
      saleTotal: pricing?.saleTotal,
      requiresManualReview,
      reviewReason: reviewReason ?? undefined,
      calculationMetadata: metadata,
    };

    return { data, warnings };
  }

  private resolveAgencyId(dto: CreateQuoteDto, user: UserActiveInterface): number {
    if (user.role === Role.SUPER_ADMIN) {
      if (dto.agencyId == null) {
        throw new BadRequestException('agencyId es obligatorio para SUPER_ADMIN.');
      }
      return dto.agencyId;
    }
    if (!user.agencyId) {
      throw new BadRequestException('El usuario no tiene agencia asignada.');
    }
    return user.agencyId;
  }

  private async resolveDriverContext(
    dto: CreateQuoteDto,
    pickupAt: Date,
    agencyId: number,
  ): Promise<DriverResolution> {
    if (dto.clientId != null) {
      const client = await this.prisma.client.findUnique({ where: { id: dto.clientId } });
      if (!client) throw new NotFoundException('Cliente no encontrado.');
      if (client.agencyId !== agencyId) {
        throw new BadRequestException('El cliente no pertenece a la agencia del cotizador.');
      }
      if (!client.dateOfBirth || !client.licenseKind || !client.licenseIssuedAt) {
        throw new UnprocessableEntityException({
          success: false,
          code: 'CLIENT_PROFILE_INCOMPLETE',
          message:
            'El cliente debe tener dateOfBirth, licenseKind y licenseIssuedAt para cotizar.',
        });
      }
      const ageDecimal = this.eligibility.ageDecimalAtDate(client.dateOfBirth, pickupAt);
      return {
        ageDecimal,
        driverAgeYears: Math.floor(ageDecimal),
        licenseKind: client.licenseKind,
        licenseIssuedAt: client.licenseIssuedAt,
      };
    }
    if (!dto.driver) {
      throw new BadRequestException(
        'Sin clientId debe enviarse driver (dateOfBirth, licenseKind, licenseIssuedAt).',
      );
    }
    const dob = new Date(dto.driver.dateOfBirth);
    const licenseIssuedAt = new Date(dto.driver.licenseIssuedAt);
    const ageDecimal = this.eligibility.ageDecimalAtDate(dob, pickupAt);
    return {
      ageDecimal,
      driverAgeYears: Math.floor(ageDecimal),
      licenseKind: dto.driver.licenseKind,
      licenseIssuedAt,
    };
  }

  async previewRatesSearch(dto: RatesSearchQueryDto) {
    const rateType = await this.prisma.rateType.findFirst({
      where: { id: dto.saleRateTypeId, isActive: true, layer: RateLayer.SALE },
    });
    if (!rateType) {
      throw new BadRequestException('Tipo de tarifa de venta inválido o inactivo.');
    }

    const pickupAt = new Date(dto.pickupAt);
    const dropoffAt = new Date(dto.dropoffAt);
    const rental = this.rentalDays.computeBillingDays(pickupAt, dropoffAt);
    const season = await this.seasonSvc.resolveSeasonForPickup(pickupAt);
    const rangeLabel = this.dayRange.resolveDayRangeLabel(rental.billingDays);
    if (!season) {
      return {
        billingDays: rental.billingDays,
        rentalBreakdown: rental,
        season: null,
        rangeLabel,
        matches: [],
        selectedRateId: null,
        conflict: false,
        requiresManualReview: true,
        reason: 'Sin temporada para la fecha de pickup.',
      };
    }
    const sel = await this.rateSelection.findBestSaleRate({
      vendorId: dto.vendorId,
      rentadoraId: dto.rentadoraId,
      categoryId: dto.categoryId,
      carModelId: dto.carModelId,
      transmission: dto.transmission,
      seasonId: season.id,
      rateTypeId: dto.saleRateTypeId,
      billingDays: rental.billingDays,
      pickupAt,
      pickupLocationId: dto.pickupLocationId ?? null,
      pickupProvinceId: dto.pickupProvinceId ?? null,
      modality: dto.modality ?? null,
    });
    return {
      billingDays: rental.billingDays,
      rentalBreakdown: rental,
      season: { id: season.id, code: season.code, name: season.name },
      rangeLabel,
      matchCount: sel.candidates.length,
      selectedRateId: sel.rate?.id ?? null,
      conflict: sel.conflict,
      overrideApplied: sel.overrideApplied,
      overrideMap: sel.overrideMap ?? null,
      requiresManualReview: !sel.rate || sel.conflict,
      reason: sel.conflict
        ? 'Conflicto de tarifas (misma especificidad).'
        : !sel.rate
          ? 'Sin tarifa coincidente.'
          : null,
      candidateIds: sel.candidates.map((c) => c.id),
    };
  }

  async computeClientEligibility(clientId: number, agencyId: number | undefined, pickupAt: Date) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, ...(agencyId != null ? { agencyId } : {}) },
    });
    if (!client) throw new NotFoundException('Cliente no encontrado.');
    if (!client.dateOfBirth || !client.licenseKind || !client.licenseIssuedAt) {
      return {
        eligible: false,
        requiresRiskInsurance: false,
        issues: [
          {
            code: 'CLIENT_PROFILE_INCOMPLETE',
            message: 'Faltan fecha de nacimiento o datos de licencia.',
          },
        ],
      };
    }
    const ageDecimal = this.eligibility.ageDecimalAtDate(client.dateOfBirth, pickupAt);
    const ageEval = this.eligibility.evaluateAge(ageDecimal);
    const lic = this.eligibility.evaluateLicense(
      client.licenseKind,
      client.licenseIssuedAt,
      pickupAt,
    );
    return this.eligibility.mergeEligibility(
      {
        eligible: ageEval.issues.length === 0,
        requiresRiskInsurance: ageEval.requiresRiskInsurance,
        issues: ageEval.issues,
      },
      lic,
    );
  }
}
