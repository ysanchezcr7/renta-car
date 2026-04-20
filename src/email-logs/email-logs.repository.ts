import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmailLogsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.EmailLogUncheckedCreateInput) {
    return this.prisma.emailLog.create({ data });
  }

  findManyPaginated(params: {
    where: Prisma.EmailLogWhereInput;
    skip: number;
    take: number;
  }) {
    return Promise.all([
      this.prisma.emailLog.findMany({
        where: params.where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.emailLog.count({ where: params.where }),
    ]);
  }
}
