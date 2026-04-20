import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { getPagination } from 'src/common/utils/pagination';

@Injectable()
export class VendorsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.VendorCreateInput) {
    return this.prisma.vendor.create({ data });
  }

  async findAll(query: PaginationQueryDto) {
    const { skip, limit } = getPagination(query);
    const where: Prisma.VendorWhereInput = query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { code: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.vendor.findMany({ where, skip, take: limit, orderBy: { id: 'desc' } }),
      this.prisma.vendor.count({ where }),
    ]);
    return { items, total };
  }

  findById(id: number) {
    return this.prisma.vendor.findUnique({ where: { id } });
  }

  update(id: number, data: Prisma.VendorUpdateInput) {
    return this.prisma.vendor.update({ where: { id }, data });
  }
}
