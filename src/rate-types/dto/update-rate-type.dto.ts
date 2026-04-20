import { PartialType } from '@nestjs/swagger';
import { CreateRateTypeDto } from './create-rate-type.dto';

export class UpdateRateTypeDto extends PartialType(CreateRateTypeDto) {}

