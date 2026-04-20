import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { getPagination } from 'src/common/utils/pagination';

@Injectable()
export class AgenciesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.AgencyUncheckedCreateInput) {
    return this.prisma.agency.create({ data });
  }

  async findAll(query: PaginationQueryDto) {
    const { skip, limit } = getPagination(query);
    const q = query.search?.trim();
    const where: Prisma.AgencyWhereInput = q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { legalName: { contains: q, mode: 'insensitive' } },
            { tradeName: { contains: q, mode: 'insensitive' } },
            { contactEmail: { contains: q, mode: 'insensitive' } },
            { taxId: { contains: q, mode: 'insensitive' } },
            { responsibleFullName: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {};

    const [items, total] = await this.prisma.$transaction([
      this.prisma.agency.findMany({ where, skip, take: limit, orderBy: { id: 'desc' } }),
      this.prisma.agency.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: number) {
    return this.prisma.agency.findUnique({ where: { id } });
  }

  async update(id: number, data: Prisma.AgencyUpdateInput) {
    return this.prisma.agency.update({ where: { id }, data });
  }
}
