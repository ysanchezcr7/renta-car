import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const reservationInclude = {
  rentadora: { select: { id: true, code: true, name: true } },
  category: { select: { id: true, code: true, name: true } },
  carModel: { select: { id: true, code: true, name: true } },
  saleRateType: { select: { id: true, code: true, name: true } },
  vendorPaymentRateType: { select: { id: true, code: true, name: true } },
  vendor: { select: { id: true, code: true, name: true } },
  quote: {
    select: {
      id: true,
      status: true,
      pickupAt: true,
      dropoffAt: true,
      saleTotal: true,
    },
  },
} satisfies Prisma.ReservationInclude;

export type ReservationWithRelations = Prisma.ReservationGetPayload<{
  include: typeof reservationInclude;
}>;

@Injectable()
export class ReservationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.ReservationUncheckedCreateInput) {
    return this.prisma.reservation.create({
      data,
      include: reservationInclude,
    });
  }

  findById(id: number, agencyId?: number): Promise<ReservationWithRelations | null> {
    return this.prisma.reservation.findFirst({
      where: { id, ...(agencyId != null ? { agencyId } : {}) },
      include: reservationInclude,
    });
  }

  findByQuoteId(quoteId: number) {
    return this.prisma.reservation.findUnique({
      where: { quoteId },
      include: reservationInclude,
    });
  }
}
