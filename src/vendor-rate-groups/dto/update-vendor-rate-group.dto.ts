import { PartialType } from '@nestjs/swagger';
import { CreateVendorRateGroupDto } from './create-vendor-rate-group.dto';

export class UpdateVendorRateGroupDto extends PartialType(
  CreateVendorRateGroupDto,
) {}
