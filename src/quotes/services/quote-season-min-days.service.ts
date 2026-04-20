import { Injectable } from '@nestjs/common';
import { AgencyPricingRulesRepository } from 'src/agency-pricing-rules/agency-pricing-rules.repository';
import { BusinessRulesRepository } from 'src/business-rules/business-rules.repository';
import {
  AGENCY_PRICING_KEYS,
  DEFAULT_EXTREME_SEASON_CODE_SUBSTRINGS,
  DEFAULT_HIGH_SEASON_CODE_SUBSTRINGS,
  QUOTE_BUSINESS_RULE_KEYS,
} from '../constants/quote-calculation.constants';

@Injectable()
export class QuoteSeasonMinDaysService {
  constructor(
    private readonly businessRules: BusinessRulesRepository,
    private readonly agencyPricingRules: AgencyPricingRulesRepository,
  ) {}

  /**
   * Mínimos: extrema alta = 5, alta = 3, resto = 1.
   * `AgencyPricingRule` `QUOTE_MIN_DAYS_OVERRIDE` (número) sustituye el mínimo efectivo si existe.
   * `agencyId` es opcional para soportar búsquedas globales (SUPER_ADMIN sin agencia).
   */
  async resolveRequiredMinDays(
    seasonCode: string,
    agencyId?: number | null,
  ): Promise<number> {
    if (agencyId != null) {
      const override = await this.agencyPricingRules.findActiveByAgencyAndKey(
        agencyId,
        AGENCY_PRICING_KEYS.MIN_DAYS_OVERRIDE,
      );
      if (override?.value != null && override.value.trim() !== '') {
        const n = Number(override.value);
        if (!Number.isNaN(n) && n > 0) {
          return Math.floor(n);
        }
      }
    }

    const keys = [
      QUOTE_BUSINESS_RULE_KEYS.SEASON_HIGH_CODE_PATTERNS,
      QUOTE_BUSINESS_RULE_KEYS.SEASON_EXTREME_CODE_PATTERNS,
    ];
    const rows = await this.businessRules.findManyActiveByKeys(keys);
    const map = new Map<string, string>(
      rows.map((r) => [r.ruleKey, r.ruleValue] as [string, string]),
    );

    const highPatterns = this.parsePatternList(
      map.get(QUOTE_BUSINESS_RULE_KEYS.SEASON_HIGH_CODE_PATTERNS),
      DEFAULT_HIGH_SEASON_CODE_SUBSTRINGS,
    );
    const extremePatterns = this.parsePatternList(
      map.get(QUOTE_BUSINESS_RULE_KEYS.SEASON_EXTREME_CODE_PATTERNS),
      DEFAULT_EXTREME_SEASON_CODE_SUBSTRINGS,
    );

    const code = seasonCode.toUpperCase();
    if (extremePatterns.some((p) => code.includes(p.toUpperCase()))) return 5;
    if (highPatterns.some((p) => code.includes(p.toUpperCase()))) return 3;
    return 1;
  }

  private parsePatternList(raw: string | undefined, fallback: string[]): string[] {
    if (!raw?.trim()) return fallback;
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed) && parsed.every((x) => typeof x === 'string')) {
        return parsed as string[];
      }
    } catch {
      /* usar fallback */
    }
    return fallback;
  }
}
