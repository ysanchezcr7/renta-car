import { Injectable } from '@nestjs/common';
import { PaymentKind, PaymentStatus, Prisma } from '@prisma/client';
import type { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { resolveAgencyFilterForRead } from 'src/common/utils/agency-scope';
import { PrismaService } from 'src/prisma/prisma.service';
import { successResponse } from 'src/common/helpers/response-response';
import { DashboardMetricsQueryDto } from './dto/dashboard-metrics-query.dto';

function buildDateRange(
  dateFrom?: string,
  dateTo?: string,
): Prisma.DateTimeFilter | undefined {
  if (!dateFrom && !dateTo) return undefined;
  const filter: Prisma.DateTimeFilter = {};
  if (dateFrom) filter.gte = new Date(dateFrom);
  if (dateTo) filter.lte = new Date(dateTo);
  return filter;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getMetrics(user: UserActiveInterface, query: DashboardMetricsQueryDto) {
    const scope = resolveAgencyFilterForRead(user, query.agencyId);
    const createdRange = buildDateRange(query.dateFrom, query.dateTo);
    const paymentDateRange = buildDateRange(query.dateFrom, query.dateTo);

    const agencyWhere =
      scope.agencyId != null
        ? { agencyId: scope.agencyId }
        : ({} as Record<string, never>);

    const quoteWhere: Prisma.QuoteWhereInput = {
      ...agencyWhere,
      ...(createdRange ? { createdAt: createdRange } : {}),
    };

    const reservationWhere: Prisma.ReservationWhereInput = {
      ...agencyWhere,
      ...(createdRange ? { createdAt: createdRange } : {}),
    };

    const paymentBase: Prisma.PaymentWhereInput = {
      ...agencyWhere,
      status: PaymentStatus.RECEIVED,
      ...(paymentDateRange ? { paymentDate: paymentDateRange } : {}),
    };

    const [
      totalQuotes,
      totalReservations,
      clientPaymentsAgg,
      vendorPaymentsAgg,
      profitAgg,
      reservationsByStatus,
    ] = await Promise.all([
      this.prisma.quote.count({ where: quoteWhere }),
      this.prisma.reservation.count({ where: reservationWhere }),
      this.prisma.payment.aggregate({
        where: {
          ...paymentBase,
          paymentKind: PaymentKind.CLIENT,
        },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          ...paymentBase,
          paymentKind: PaymentKind.VENDOR,
        },
        _sum: { amount: true },
      }),
      this.prisma.reservation.aggregate({
        where: reservationWhere,
        _sum: { profitTotal: true },
      }),
      this.prisma.reservation.groupBy({
        by: ['status'],
        where: reservationWhere,
        _count: { _all: true },
      }),
    ]);

    const reservationsByState = reservationsByStatus.map((row) => ({
      status: row.status,
      count: row._count._all,
    }));

    const data = {
      totalQuotes,
      totalReservations,
      paymentsReceivedClient: this.decimalToNumber(
        clientPaymentsAgg._sum.amount,
      ),
      paymentsToVendor: this.decimalToNumber(vendorPaymentsAgg._sum.amount),
      reservationsByState,
      totalProfit: this.decimalToNumber(profitAgg._sum.profitTotal),
      filters: {
        agencyId: scope.agencyId ?? null,
        dateFrom: query.dateFrom ?? null,
        dateTo: query.dateTo ?? null,
      },
    };

    return successResponse('Métricas del tablero.', data);
  }

  private decimalToNumber(value: unknown): number {
    if (value == null) return 0;
    return Number(String(value));
  }
}
