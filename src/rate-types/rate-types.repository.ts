import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { getPagination } from 'src/common/utils/pagination';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RateTypesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.RateTypeCreateInput) {
    return this.prisma.rateType.create({ data });
  }

  async findAll(query: PaginationQueryDto) {
    const { skip, limit } = getPagination(query);
    const where: Prisma.RateTypeWhereInput = query.search
      ? { OR: [{ code: { contains: query.search } }, { name: { contains: query.search } }] }
      : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.rateType.findMany({ where, skip, take: limit, orderBy: { id: 'desc' } }),
      this.prisma.rateType.count({ where }),
    ]);
    return { items, total };
  }

  findById(id: number) {
    return this.prisma.rateType.findUnique({ where: { id } });
  }

  update(id: number, data: Prisma.RateTypeUpdateInput) {
    return this.prisma.rateType.update({ where: { id }, data });
  }
}

