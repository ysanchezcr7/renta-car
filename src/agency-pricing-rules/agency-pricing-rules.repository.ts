import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { getPagination } from 'src/common/utils/pagination';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AgencyPricingRulesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.AgencyPricingRuleUncheckedCreateInput) {
    return this.prisma.agencyPricingRule.create({ data });
  }

  async findAll(query: PaginationQueryDto, agencyId?: number) {
    const { skip, limit } = getPagination(query);
    const where: Prisma.AgencyPricingRuleWhereInput = {
      ...(agencyId ? { agencyId } : {}),
      ...(query.search
        ? { OR: [{ key: { contains: query.search } }, { value: { contains: query.search } }] }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.agencyPricingRule.findMany({
        where,
        skip,
        take: limit,
        include: { agency: true },
        orderBy: { id: 'desc' },
      }),
      this.prisma.agencyPricingRule.count({ where }),
    ]);
    return { items, total };
  }

  findById(id: number) {
    return this.prisma.agencyPricingRule.findUnique({ where: { id }, include: { agency: true } });
  }

  update(id: number, data: Prisma.AgencyPricingRuleUpdateInput) {
    return this.prisma.agencyPricingRule.update({ where: { id }, data });
  }

  findActiveByAgencyAndKey(agencyId: number, key: string) {
    return this.prisma.agencyPricingRule.findFirst({
      where: { agencyId, key, isActive: true },
    });
  }
}

