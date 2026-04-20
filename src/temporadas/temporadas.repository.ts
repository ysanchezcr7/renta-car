import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { getPagination } from 'src/common/utils/pagination';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TemporadasRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.SeasonCreateInput) {
    return this.prisma.season.create({ data });
  }

  async findAll(query: PaginationQueryDto) {
    const { skip, limit } = getPagination(query);
    const where: Prisma.SeasonWhereInput = query.search
      ? { OR: [{ code: { contains: query.search } }, { name: { contains: query.search } }] }
      : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.season.findMany({ where, skip, take: limit, orderBy: { id: 'desc' } }),
      this.prisma.season.count({ where }),
    ]);
    return { items, total };
  }

  findById(id: number) {
    return this.prisma.season.findUnique({ where: { id } });
  }

  update(id: number, data: Prisma.SeasonUpdateInput) {
    return this.prisma.season.update({ where: { id }, data });
  }

  remove(id: number) {
    return this.prisma.season.delete({ where: { id } });
  }
}

