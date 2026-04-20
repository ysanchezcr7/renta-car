import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatusHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.StatusHistoryUncheckedCreateInput) {
    return this.prisma.statusHistory.create({ data });
  }

  findManyPaginated(params: {
    where: Prisma.StatusHistoryWhereInput;
    skip: number;
    take: number;
  }) {
    return Promise.all([
      this.prisma.statusHistory.findMany({
        where: params.where,
        skip: params.skip,
        take: params.take,
        orderBy: { changedAt: 'desc' },
        include: {
          createdBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          adminApprovedBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.statusHistory.count({ where: params.where }),
    ]);
  }
}
