import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { getPagination } from 'src/common/utils/pagination';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AgeTiersRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.AgeTierUncheckedCreateInput) {
    return this.prisma.ageTier.create({ data });
  }

  async findAll(query: PaginationQueryDto) {
    const { skip, limit } = getPagination(query);
    const where: Prisma.AgeTierWhereInput = query.search
      ? {
          OR: [
            { code: { contains: query.search, mode: 'insensitive' } },
            { name: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [items, total] = await this.prisma.$transaction([
      this.prisma.ageTier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { ageMin: 'asc' },
      }),
      this.prisma.ageTier.count({ where }),
    ]);
    return { items, total };
  }

  findActive() {
    return this.prisma.ageTier.findMany({
      where: { isActive: true },
      orderBy: { ageMin: 'asc' },
    });
  }

  findById(id: number) {
    return this.prisma.ageTier.findUnique({ where: { id } });
  }

  findByCode(code: string) {
    return this.prisma.ageTier.findUnique({ where: { code } });
  }

  update(id: number, data: Prisma.AgeTierUpdateInput) {
    return this.prisma.ageTier.update({ where: { id }, data });
  }

  softDelete(id: number) {
    return this.prisma.ageTier.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
