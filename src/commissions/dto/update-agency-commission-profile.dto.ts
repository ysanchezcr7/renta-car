import { PartialType } from '@nestjs/swagger';
import { CreateAgencyCommissionProfileDto } from './create-agency-commission-profile.dto';

export class UpdateAgencyCommissionProfileDto extends PartialType(
  CreateAgencyCommissionProfileDto,
) {}

