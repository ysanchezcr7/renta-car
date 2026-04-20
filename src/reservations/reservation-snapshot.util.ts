import { Prisma } from '@prisma/client';

/** Beneficio: venta al cliente menos costo vendor (valores desde BD, no del cliente). */
export function computeProfitTotal(
  saleTotal: Prisma.Decimal,
  vendorTotalCost: Prisma.Decimal,
): Prisma.Decimal {
  return saleTotal.minus(vendorTotalCost);
}
