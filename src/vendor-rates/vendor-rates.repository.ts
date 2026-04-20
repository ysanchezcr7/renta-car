import { Injectable } from '@nestjs/common';
import { Prisma, RentalModality, TransmissionType } from '@prisma/client';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { getPagination } from 'src/common/utils/pagination';
import { PrismaService } from 'src/prisma/prisma.service';
import { VendorRateInsuranceDto } from './dto/create-vendor-rate.dto';

@Injectable()
export class VendorRatesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.VendorRateUncheckedCreateInput) {
    return this.prisma.vendorRate.create({ data });
  }

  async findAll(query: PaginationQueryDto) {
    const { skip, limit } = getPagination(query);
    const where: Prisma.VendorRateWhereInput = query.search
      ? { currency: { contains: query.search } }
      : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.vendorRate.findMany({
        where,
        skip,
        take: limit,
        include: {
          vendor: true,
          rentadora: true,
          category: true,
          carModel: true,
          season: true,
          rateType: true,
          rateGroup: true,
          insurances: { include: { ageTier: true } },
        },
        orderBy: { id: 'desc' },
      }),
      this.prisma.vendorRate.count({ where }),
    ]);
    return { items, total };
  }

  findById(id: number) {
    return this.prisma.vendorRate.findUnique({ where: { id } });
  }

  findByIdWithRelations(id: number) {
    return this.prisma.vendorRate.findUnique({
      where: { id },
      include: {
        vendor: true,
        rentadora: true,
        category: true,
        carModel: true,
        season: true,
        rateType: true,
        rateGroup: true,
        location: true,
        insurances: { include: { ageTier: true } },
      },
    });
  }

  update(id: number, data: Prisma.VendorRateUpdateInput) {
    return this.prisma.vendorRate.update({ where: { id }, data });
  }

  /// Reemplaza la lista completa de seguros de una fila de tarifa.
  replaceInsurances(vendorRateId: number, insurances: VendorRateInsuranceDto[]) {
    return this.prisma.$transaction([
      this.prisma.vendorRateInsurance.deleteMany({
        where: { vendorRateId },
      }),
      this.prisma.vendorRateInsurance.createMany({
        data: insurances.map((ins) => ({
          vendorRateId,
          ageTierId: ins.ageTierId,
          dailyPrice: ins.dailyPrice,
          currency: ins.currency ?? 'USD',
        })),
        skipDuplicates: true,
      }),
    ]);
  }

  /**
   * Tarifas de venta candidatas. Filtros:
   * - vendor, rentadora, categoría, modelo, transmisión, temporada, rateType.
   * - Rango de días (minDays/maxDays) y vigencia (validFrom/validTo).
   * - Ubicación opcional a nivel de VendorRate.
   * - `modality`: si se pasa, restringe a VendorRate o VendorRateGroup con esa modalidad.
   * - `pickupProvinceId`: si se pasa y un VendorRate pertenece a un grupo con provincias
   *    declaradas, solo se considera cuando la provincia está cubierta. Grupos sin provincias
   *    se asumen cobertura total.
   */
  /// Si `vendorId` y/o `rentadoraId` son `null/undefined`, no se filtra por ese
  /// criterio y se devuelven tarifas de TODOS los vendors/rentadoras que encajen
  /// con el resto de filtros. Útil para búsquedas multi-vendor.
  searchMatchingSaleRates(params: {
    vendorId?: number | null;
    rentadoraId?: number | null;
    categoryId: number;
    carModelId?: number | null;
    transmission: TransmissionType;
    seasonId: number;
    rateTypeId: number;
    billingDays: number;
    pickupAt: Date;
    pickupLocationId?: number | null;
    pickupProvinceId?: number | null;
    modality?: RentalModality | null;
  }) {
    const {
      vendorId,
      rentadoraId,
      categoryId,
      carModelId,
      transmission,
      seasonId,
      rateTypeId,
      billingDays,
      pickupAt,
      pickupLocationId,
      pickupProvinceId,
      modality,
    } = params;

    const locationClause: Prisma.VendorRateWhereInput =
      pickupLocationId != null
        ? {
            OR: [{ locationId: null }, { locationId: pickupLocationId }],
          }
        : {};

    // Si se pide modality, la fila debe pertenecer a un VendorRateGroup con esa modalidad.
    // (La modalidad vive a nivel de grupo; filas sueltas sin grupo no se filtran por modalidad.)
    const modalityClause: Prisma.VendorRateWhereInput = modality
      ? { rateGroup: { modality } }
      : {};

    // Cobertura por provincia vía VendorRateGroup:
    // - Sin rateGroup => se permite (sin restricción de grupo).
    // - Con rateGroup y sin provincias declaradas => cobertura total.
    // - Con rateGroup y provincias declaradas => debe incluir pickupProvinceId.
    const provinceClause: Prisma.VendorRateWhereInput =
      pickupProvinceId != null
        ? {
            OR: [
              { rateGroupId: null },
              { rateGroup: { provinces: { none: {} } } },
              { rateGroup: { provinces: { some: { locationId: pickupProvinceId } } } },
            ],
          }
        : {};

    return this.prisma.vendorRate.findMany({
      where: {
        ...(vendorId != null ? { vendorId } : {}),
        ...(rentadoraId != null ? { rentadoraId } : {}),
        rateTypeId,
        isActive: true,
        AND: [
          { OR: [{ categoryId: null }, { categoryId }] },
          carModelId != null
            ? { OR: [{ carModelId: null }, { carModelId }] }
            : {},
          { OR: [{ transmission: null }, { transmission }] },
          { OR: [{ seasonId: null }, { seasonId }] },
          {
            OR: [{ minDays: null }, { minDays: { lte: billingDays } }],
          },
          {
            OR: [{ maxDays: null }, { maxDays: { gte: billingDays } }],
          },
          {
            OR: [{ validFrom: null }, { validFrom: { lte: pickupAt } }],
          },
          {
            OR: [{ validTo: null }, { validTo: { gte: pickupAt } }],
          },
          locationClause,
          modalityClause,
          provinceClause,
        ],
      },
      include: {
        rateType: true,
        vendor: true,
        rentadora: true,
        category: true,
        carModel: true,
        season: true,
        location: true,
        rateGroup: { include: { provinces: true } },
        insurances: { include: { ageTier: true } },
      },
      orderBy: { id: 'asc' },
    });
  }

  /**
   * Resuelve overrides activos: dado un pickupAt, busca sub-rangos de `VendorRateOverride`
   * que apliquen a los grupos del vendor indicado (o a TODOS los vendors si `vendorId=null`)
   * y devuelve un mapa `sourceGroupId -> replacementGroupId`.
   */
  async findActiveOverridesForVendor(vendorId: number | null, pickupAt: Date) {
    const overrides = await this.prisma.vendorRateOverride.findMany({
      where: {
        overrideFrom: { lte: pickupAt },
        overrideTo: { gte: pickupAt },
        ...(vendorId != null ? { rateGroup: { vendorId } } : {}),
      },
      select: {
        rateGroupId: true,
        replacementGroupId: true,
      },
    });
    const map = new Map<number, number>();
    for (const ov of overrides) {
      map.set(ov.rateGroupId, ov.replacementGroupId);
    }
    return map;
  }
}
