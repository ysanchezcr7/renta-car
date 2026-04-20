import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Pricing')
@Controller('pricing')
export class PricingController {}
