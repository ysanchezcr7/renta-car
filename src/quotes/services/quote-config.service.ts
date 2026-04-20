import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BusinessRulesRepository } from 'src/business-rules/business-rules.repository';
import { QUOTE_BUSINESS_RULE_KEYS } from '../constants/quote-calculation.constants';

export type QuoteFeeConfig = {
  riskInsuranceDaily: Prisma.Decimal;
  fuelFee: Prisma.Decimal;
  airportFee: Prisma.Decimal;
  transferFee: Prisma.Decimal;
};

@Injectable()
export class QuoteConfigService {
  constructor(private readonly businessRules: BusinessRulesRepository) {}

  async loadFeeConfig(): Promise<QuoteFeeConfig> {
    const keys = [
      QUOTE_BUSINESS_RULE_KEYS.RISK_INSURANCE_DAILY,
      QUOTE_BUSINESS_RULE_KEYS.FUEL_FEE,
      QUOTE_BUSINESS_RULE_KEYS.AIRPORT_FEE,
      QUOTE_BUSINESS_RULE_KEYS.TRANSFER_FEE,
    ];
    const rows = await this.businessRules.findManyActiveByKeys(keys);
    const map = new Map<string, string>(
      rows.map((r) => [r.ruleKey, r.ruleValue] as [string, string]),
    );

    return {
      riskInsuranceDaily: this.decimalFrom(
        map.get(QUOTE_BUSINESS_RULE_KEYS.RISK_INSURANCE_DAILY),
        '15.00',
      ),
      fuelFee: this.decimalFrom(map.get(QUOTE_BUSINESS_RULE_KEYS.FUEL_FEE), '0'),
      airportFee: this.decimalFrom(map.get(QUOTE_BUSINESS_RULE_KEYS.AIRPORT_FEE), '25.00'),
      transferFee: this.decimalFrom(map.get(QUOTE_BUSINESS_RULE_KEYS.TRANSFER_FEE), '0'),
    };
  }

  private decimalFrom(raw: string | undefined, fallback: string): Prisma.Decimal {
    const v = raw?.trim() ? raw.trim() : fallback;
    try {
      return new Prisma.Decimal(v);
    } catch {
      return new Prisma.Decimal(fallback);
    }
  }
}
