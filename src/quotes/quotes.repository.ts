import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

const quoteInclude = {
  saleRateType: true,
  client: true,
  category: true,
  carModel: true,
  season: true,
  vendor: true,
  rentadora: true,
  pickupLocationRef: true,
} satisfies Prisma.QuoteInclude;

export type QuoteWithRelations = Prisma.QuoteGetPayload<{ include: typeof quoteInclude }>;

@Injectable()
export class QuotesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.QuoteUncheckedCreateInput) {
    return this.prisma.quote.create({
      data,
      include: quoteInclude,
    });
  }

  findById(id: number, agencyId?: number): Promise<QuoteWithRelations | null> {
    return this.prisma.quote.findFirst({
      where: { id, ...(agencyId != null ? { agencyId } : {}) },
      include: quoteInclude,
    });
  }
}
