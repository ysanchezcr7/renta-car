import { Injectable } from '@nestjs/common';

export type RentalDaysBreakdown = {
  totalHours: number;
  flooredFullDays: number;
  remainderHours: number;
  /** Días facturables tras regla de fracción + exceso >3h */
  billingDays: number;
  /** Si el remanente > 3h implica un día extra explícito de cargo */
  extraDayFromHourRule: boolean;
};

@Injectable()
export class QuoteRentalDaysService {
  private readonly msPerHour = 60 * 60 * 1000;

  /**
   * Días de renta: bloques de 24h desde pickup.
   * - Cualquier fracción sobre días completos cuenta al menos 1 día adicional.
   * - Si el remanente en horas es > 3, se suma un día adicional de penalización/excedente.
   */
  computeBillingDays(pickupAt: Date, dropoffAt: Date): RentalDaysBreakdown {
    const ms = dropoffAt.getTime() - pickupAt.getTime();
    if (ms <= 0) {
      return {
        totalHours: 0,
        flooredFullDays: 0,
        remainderHours: 0,
        billingDays: 0,
        extraDayFromHourRule: false,
      };
    }
    const totalHours = ms / this.msPerHour;
    const flooredFullDays = Math.floor(totalHours / 24);
    const remainderHours = totalHours - flooredFullDays * 24;

    let billingDays = flooredFullDays;
    if (remainderHours > 0) {
      billingDays += 1;
    }
    let extraDayFromHourRule = false;
    if (remainderHours > 3) {
      billingDays += 1;
      extraDayFromHourRule = true;
    }

    return {
      totalHours,
      flooredFullDays,
      remainderHours,
      billingDays,
      extraDayFromHourRule,
    };
  }
}
