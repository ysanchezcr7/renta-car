import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { getPagination } from 'src/common/utils/pagination';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ModelosRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.CarModelUncheckedCreateInput) {
    return this.prisma.carModel.create({ data });
  }

  async findAll(query: PaginationQueryDto) {
    const { skip, limit } = getPagination(query);
    const where: Prisma.CarModelWhereInput = query.search
      ? { OR: [{ code: { contains: query.search } }, { name: { contains: query.search } }] }
      : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.carModel.findMany({
        where,
        skip,
        take: limit,
        include: { category: true },
        orderBy: { id: 'desc' },
      }),
      this.prisma.carModel.count({ where }),
    ]);
    return { items, total };
  }

  findById(id: number) {
    return this.prisma.carModel.findUnique({ where: { id }, include: { category: true } });
  }

  update(id: number, data: Prisma.CarModelUpdateInput) {
    return this.prisma.carModel.update({ where: { id }, data });
  }
}

