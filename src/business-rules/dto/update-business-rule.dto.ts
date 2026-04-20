import { PartialType } from '@nestjs/swagger';
import { CreateBusinessRuleDto } from './create-business-rule.dto';

export class UpdateBusinessRuleDto extends PartialType(CreateBusinessRuleDto) {}

