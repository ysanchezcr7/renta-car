import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { getPagination } from 'src/common/utils/pagination';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BusinessRulesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.BusinessRuleCreateInput) {
    return this.prisma.businessRule.create({ data });
  }

  async findAll(query: PaginationQueryDto) {
    const { skip, limit } = getPagination(query);
    const where: Prisma.BusinessRuleWhereInput = query.search
      ? { ruleKey: { contains: query.search, mode: 'insensitive' } }
      : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.businessRule.findMany({ where, skip, take: limit, orderBy: { id: 'desc' } }),
      this.prisma.businessRule.count({ where }),
    ]);
    return { items, total };
  }

  findById(id: number) {
    return this.prisma.businessRule.findUnique({ where: { id } });
  }

  update(id: number, data: Prisma.BusinessRuleUpdateInput) {
    return this.prisma.businessRule.update({ where: { id }, data });
  }

  findManyActiveByKeys(keys: string[]) {
    if (keys.length === 0) return Promise.resolve([]);
    return this.prisma.businessRule.findMany({
      where: { ruleKey: { in: keys }, isActive: true },
    });
  }
}

