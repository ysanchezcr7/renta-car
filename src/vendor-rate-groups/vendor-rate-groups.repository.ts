import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { getPagination } from 'src/common/utils/pagination';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class VendorRateGroupsRepository {
  constructor(private readonly prisma: PrismaService) {}

  get client() {
    return this.prisma;
  }

  createGroup(data: Prisma.VendorRateGroupUncheckedCreateInput) {
    return this.prisma.vendorRateGroup.create({ data });
  }

  async findAll(query: PaginationQueryDto) {
    const { skip, limit } = getPagination(query);
    const where: Prisma.VendorRateGroupWhereInput = query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { notes: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [items, total] = await this.prisma.$transaction([
      this.prisma.vendorRateGroup.findMany({
        where,
        skip,
        take: limit,
        orderBy: { validFrom: 'desc' },
        include: {
          vendor: true,
          season: true,
          provinces: { include: { location: true } },
          _count: { select: { rates: true, overridesFrom: true } },
        },
      }),
      this.prisma.vendorRateGroup.count({ where }),
    ]);
    return { items, total };
  }

  findById(id: number) {
    return this.prisma.vendorRateGroup.findUnique({
      where: { id },
      include: {
        vendor: true,
        season: true,
        provinces: { include: { location: true } },
        overridesFrom: { include: { replacementGroup: true } },
        rates: {
          include: {
            rentadora: true,
            category: true,
            carModel: true,
            rateType: true,
            insurances: { include: { ageTier: true } },
          },
        },
      },
    });
  }

  updateGroup(id: number, data: Prisma.VendorRateGroupUpdateInput) {
    return this.prisma.vendorRateGroup.update({ where: { id }, data });
  }

  softDelete(id: number) {
    return this.prisma.vendorRateGroup.update({
      where: { id },
      data: { isActive: false },
    });
  }

  replaceProvinces(rateGroupId: number, locationIds: number[]) {
    return this.prisma.$transaction([
      this.prisma.vendorRateGroupProvince.deleteMany({
        where: { rateGroupId },
      }),
      this.prisma.vendorRateGroupProvince.createMany({
        data: locationIds.map((locationId) => ({ rateGroupId, locationId })),
        skipDuplicates: true,
      }),
    ]);
  }

  replaceOverrides(
    rateGroupId: number,
    overrides: {
      replacementGroupId: number;
      overrideFrom: Date;
      overrideTo: Date;
      notes?: string;
    }[],
  ) {
    return this.prisma.$transaction([
      this.prisma.vendorRateOverride.deleteMany({
        where: { rateGroupId },
      }),
      this.prisma.vendorRateOverride.createMany({
        data: overrides.map((o) => ({ rateGroupId, ...o })),
      }),
    ]);
  }
}
