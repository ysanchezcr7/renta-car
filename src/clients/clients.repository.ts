import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { getPagination } from 'src/common/utils/pagination';

@Injectable()
export class ClientsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.ClientUncheckedCreateInput) {
    return this.prisma.client.create({ data });
  }

  async findAll(query: PaginationQueryDto, agencyId?: number) {
    const { skip, limit } = getPagination(query);
    const where: Prisma.ClientWhereInput = {
      ...(agencyId ? { agencyId } : {}),
      ...(query.search
        ? {
            OR: [
              { firstName: { contains: query.search, mode: 'insensitive' } },
              { lastName: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.client.findMany({ where, skip, take: limit, orderBy: { id: 'desc' } }),
      this.prisma.client.count({ where }),
    ]);
    return { items, total };
  }

  findById(id: number, agencyId?: number) {
    return this.prisma.client.findFirst({
      where: { id, ...(agencyId ? { agencyId } : {}) },
    });
  }

  update(id: number, data: Prisma.ClientUpdateInput) {
    return this.prisma.client.update({ where: { id }, data });
  }

  remove(id: number) {
    return this.prisma.client.delete({ where: { id } });
  }
}
