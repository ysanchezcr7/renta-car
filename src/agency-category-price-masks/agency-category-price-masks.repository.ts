import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const includeCategory = { category: true } as const;

@Injectable()
export class AgencyCategoryPriceMasksRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByAgencyAndCategory(agencyId: number, categoryId: number) {
    return this.prisma.agencyCategoryPriceMask.findUnique({
      where: {
        agencyId_categoryId: { agencyId, categoryId },
      },
    });
  }

  findManyByAgency(agencyId: number) {
    return this.prisma.agencyCategoryPriceMask.findMany({
      where: { agencyId },
      include: includeCategory,
      orderBy: { categoryId: 'asc' },
    });
  }

  upsert(
    agencyId: number,
    data: {
      categoryId: number;
      percentageEnabled: boolean;
      percentageValue: Prisma.Decimal;
      fixedTotalEnabled: boolean;
      fixedTotalValue: Prisma.Decimal;
      fixedPerDayEnabled: boolean;
      fixedPerDayValue: Prisma.Decimal;
    },
  ) {
    const {
      categoryId,
      percentageEnabled,
      percentageValue,
      fixedTotalEnabled,
      fixedTotalValue,
      fixedPerDayEnabled,
      fixedPerDayValue,
    } = data;
    return this.prisma.agencyCategoryPriceMask.upsert({
      where: { agencyId_categoryId: { agencyId, categoryId } },
      create: {
        agencyId,
        categoryId,
        percentageEnabled,
        percentageValue,
        fixedTotalEnabled,
        fixedTotalValue,
        fixedPerDayEnabled,
        fixedPerDayValue,
      },
      update: {
        percentageEnabled,
        percentageValue,
        fixedTotalEnabled,
        fixedTotalValue,
        fixedPerDayEnabled,
        fixedPerDayValue,
      },
      include: includeCategory,
    });
  }

  deleteByAgencyAndCategory(agencyId: number, categoryId: number) {
    return this.prisma.agencyCategoryPriceMask.delete({
      where: { agencyId_categoryId: { agencyId, categoryId } },
    });
  }
}
