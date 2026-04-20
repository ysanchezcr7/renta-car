import { PartialType } from '@nestjs/swagger';
import { CreateAgencyPricingRuleDto } from './create-agency-pricing-rule.dto';

export class UpdateAgencyPricingRuleDto extends PartialType(
  CreateAgencyPricingRuleDto,
) {}

