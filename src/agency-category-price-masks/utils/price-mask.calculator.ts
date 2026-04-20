import { Prisma } from '@prisma/client';

/** Fila mínima para aplicar máscara (coincide con columnas del modelo Prisma). */
export type PriceMaskRow = {
  percentageEnabled: boolean;
  percentageValue: Prisma.Decimal;
  fixedTotalEnabled: boolean;
  fixedTotalValue: Prisma.Decimal;
  fixedPerDayEnabled: boolean;
  fixedPerDayValue: Prisma.Decimal;
};

export function countActiveMaskTypes(row: PriceMaskRow): number {
  let n = 0;
  if (row.percentageEnabled) n += 1;
  if (row.fixedTotalEnabled) n += 1;
  if (row.fixedPerDayEnabled) n += 1;
  return n;
}

export type PriceMaskEffect = {
  profit: Prisma.Decimal;
  dailyAdd: Prisma.Decimal;
  mode: 'PERCENTAGE' | 'FIXED_TOTAL' | 'FIXED_PER_DAY' | 'NONE';
};

/**
 * Máscara sobre el subtotal de renta (días × tarifa diaria base) y el diario base.
 * Solo aplica un tipo a la vez (como en el panel: un checkbox por columna activo).
 */
export function computePriceMaskEffect(
  row: PriceMaskRow | null | undefined,
  rentalSubtotal: Prisma.Decimal,
  baseDaily: Prisma.Decimal,
  billingDays: number,
): PriceMaskEffect {
  const zero = new Prisma.Decimal(0);
  if (!row || billingDays <= 0) {
    return { profit: zero, dailyAdd: zero, mode: 'NONE' };
  }

  const active = countActiveMaskTypes(row);
  if (active !== 1) {
    return { profit: zero, dailyAdd: zero, mode: 'NONE' };
  }

  const daysDec = new Prisma.Decimal(billingDays);

  if (row.percentageEnabled) {
    const profit = rentalSubtotal
      .mul(row.percentageValue)
      .div(new Prisma.Decimal(100));
    return {
      profit,
      dailyAdd: profit.div(daysDec),
      mode: 'PERCENTAGE',
    };
  }

  if (row.fixedTotalEnabled) {
    const profit = row.fixedTotalValue;
    return {
      profit,
      dailyAdd: profit.div(daysDec),
      mode: 'FIXED_TOTAL',
    };
  }

  if (row.fixedPerDayEnabled) {
    const per = row.fixedPerDayValue;
    return {
      profit: per.mul(daysDec),
      dailyAdd: per,
      mode: 'FIXED_PER_DAY',
    };
  }

  return { profit: zero, dailyAdd: zero, mode: 'NONE' };
}
