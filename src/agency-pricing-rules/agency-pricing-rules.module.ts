import { Module } from '@nestjs/common';
import { AgencyPricingRulesController } from './agency-pricing-rules.controller';
import { AgencyPricingRulesService } from './agency-pricing-rules.service';
import { AgencyPricingRulesRepository } from './agency-pricing-rules.repository';

@Module({
  controllers: [AgencyPricingRulesController],
  providers: [AgencyPricingRulesService, AgencyPricingRulesRepository],
  exports: [AgencyPricingRulesService, AgencyPricingRulesRepository],
})
export class AgencyPricingRulesModule {}

