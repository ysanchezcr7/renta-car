import { PartialType } from '@nestjs/swagger';
import { CreateVendorRateDto } from './create-vendor-rate.dto';

export class UpdateVendorRateDto extends PartialType(CreateVendorRateDto) {}

