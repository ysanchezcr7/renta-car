import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { getPagination } from 'src/common/utils/pagination';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CategoriasRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.CategoryUncheckedCreateInput) {
    return this.prisma.category.create({ data });
  }

  async findAll(query: PaginationQueryDto) {
    const { skip, limit } = getPagination(query);
    const where: Prisma.CategoryWhereInput = query.search
      ? { OR: [{ code: { contains: query.search } }, { name: { contains: query.search } }] }
      : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.category.findMany({
        where,
        skip,
        take: limit,
        include: { rentadora: true },
        orderBy: { id: 'desc' },
      }),
      this.prisma.category.count({ where }),
    ]);
    return { items, total };
  }

  findById(id: number) {
    return this.prisma.category.findUnique({ where: { id }, include: { rentadora: true } });
  }

  update(id: number, data: Prisma.CategoryUpdateInput) {
    return this.prisma.category.update({ where: { id }, data });
  }
}

