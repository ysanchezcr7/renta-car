import { Module } from '@nestjs/common';
import { PaymentsModule } from 'src/payments/payments.module';
import { QuoteVendorSelectionModule } from 'src/quote-vendor-selection/quote-vendor-selection.module';
import { AgencyPricingRulesModule } from 'src/agency-pricing-rules/agency-pricing-rules.module';
import { BusinessRulesModule } from 'src/business-rules/business-rules.module';
import { CommissionsModule } from 'src/commissions/commissions.module';
import { VendorRatesModule } from 'src/vendor-rates/vendor-rates.module';
import { RatesSearchController } from './rates-search.controller';
import { QuoteCalculationOrchestratorService } from './services/quote-calculation-orchestrator.service';
import { QuoteConfigService } from './services/quote-config.service';
import { QuoteDayRangeService } from './services/quote-day-range.service';
import { QuoteEligibilityService } from './services/quote-eligibility.service';
import { QuoteMultiVendorSearchService } from './services/quote-multi-vendor-search.service';
import { QuoteRateSelectionService } from './services/quote-rate-selection.service';
import { QuoteRentalDaysService } from './services/quote-rental-days.service';
import { QuoteSalePricingService } from './services/quote-sale-pricing.service';
import { QuoteSeasonMinDaysService } from './services/quote-season-min-days.service';
import { QuoteSeasonService } from './services/quote-season.service';
import { QuotesController } from './quotes.controller';
import { QuotesRepository } from './quotes.repository';
import { QuotesService } from './quotes.service';

@Module({
  imports: [
    VendorRatesModule,
    CommissionsModule,
    AgencyPricingRulesModule,
    BusinessRulesModule,
    QuoteVendorSelectionModule,
    PaymentsModule,
  ],
  controllers: [QuotesController, RatesSearchController],
  providers: [
    QuotesService,
    QuotesRepository,
    QuoteCalculationOrchestratorService,
    QuoteRentalDaysService,
    QuoteDayRangeService,
    QuoteSeasonService,
    QuoteSeasonMinDaysService,
    QuoteEligibilityService,
    QuoteRateSelectionService,
    QuoteSalePricingService,
    QuoteConfigService,
    QuoteMultiVendorSearchService,
  ],
  exports: [QuotesService],
})
export class QuotesModule {}
