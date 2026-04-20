import { PartialType } from '@nestjs/swagger';
import { CreateAgeTierDto } from './create-age-tier.dto';

export class UpdateAgeTierDto extends PartialType(CreateAgeTierDto) {}
