import { Injectable } from '@nestjs/common';
import { PaymentKind, PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const paymentInclude = {
  verifiedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
} satisfies Prisma.PaymentInclude;

export type PaymentWithVerifier = Prisma.PaymentGetPayload<{ include: typeof paymentInclude }>;

@Injectable()
export class PaymentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.PaymentUncheckedCreateInput) {
    return this.prisma.payment.create({
      data,
      include: paymentInclude,
    });
  }

  findById(id: number, agencyId?: number) {
    return this.prisma.payment.findFirst({
      where: { id, ...(agencyId != null ? { agencyId } : {}) },
      include: paymentInclude,
    });
  }

  findPendingClientPaymentsForQuote(quoteId: number, agencyId: number) {
    return this.prisma.payment.findMany({
      where: {
        quoteId,
        agencyId,
        paymentKind: PaymentKind.CLIENT,
        status: PaymentStatus.PENDING,
      },
      orderBy: { id: 'desc' },
      include: paymentInclude,
    });
  }
}
