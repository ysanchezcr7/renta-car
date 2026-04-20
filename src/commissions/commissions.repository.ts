import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { getPagination } from 'src/common/utils/pagination';

@Injectable()
export class CommissionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.AgencyCommissionProfileUncheckedCreateInput) {
    return this.prisma.agencyCommissionProfile.create({ data });
  }

  async findAll(query: PaginationQueryDto) {
    const { skip, limit } = getPagination(query);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.agencyCommissionProfile.findMany({
        skip,
        take: limit,
        include: { agency: true },
        orderBy: { id: 'desc' },
      }),
      this.prisma.agencyCommissionProfile.count(),
    ]);
    return { items, total };
  }

  findById(id: number) {
    return this.prisma.agencyCommissionProfile.findUnique({
      where: { id },
      include: { agency: true },
    });
  }

  update(id: number, data: Prisma.AgencyCommissionProfileUpdateInput) {
    return this.prisma.agencyCommissionProfile.update({ where: { id }, data });
  }

  findActiveByAgencyId(agencyId: number) {
    return this.prisma.agencyCommissionProfile.findFirst({
      where: { agencyId, isActive: true },
    });
  }

  findActiveGlobal() {
    return this.prisma.globalCommissionProfile.findFirst({
      where: { isActive: true },
      orderBy: { id: 'desc' },
    });
  }
}
