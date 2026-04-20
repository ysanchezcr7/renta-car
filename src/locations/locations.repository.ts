import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { getPagination } from 'src/common/utils/pagination';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class LocationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.LocationCreateInput) {
    return this.prisma.location.create({ data });
  }

  async findAll(query: PaginationQueryDto) {
    const { skip, limit } = getPagination(query);
    const where: Prisma.LocationWhereInput = query.search
      ? { name: { contains: query.search, mode: 'insensitive' } }
      : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.location.findMany({ where, skip, take: limit, orderBy: { id: 'desc' } }),
      this.prisma.location.count({ where }),
    ]);
    return { items, total };
  }

  findById(id: number) {
    return this.prisma.location.findUnique({ where: { id } });
  }

  update(id: number, data: Prisma.LocationUpdateInput) {
    return this.prisma.location.update({ where: { id }, data });
  }
}

