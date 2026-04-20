import { Injectable } from '@nestjs/common';

/** Rangos de días usados para alinear tarifas (min/max en VendorRate). */
export type RentalDayRangeLabel = '3_6' | '7_13' | '14_30';

@Injectable()
export class QuoteDayRangeService {
  resolveDayRangeLabel(billingDays: number): RentalDayRangeLabel | null {
    if (billingDays >= 3 && billingDays <= 6) return '3_6';
    if (billingDays >= 7 && billingDays <= 13) return '7_13';
    if (billingDays >= 14 && billingDays <= 30) return '14_30';
    return null;
  }

  isWithinSupportedTariffBuckets(billingDays: number): boolean {
    return this.resolveDayRangeLabel(billingDays) != null;
  }
}
