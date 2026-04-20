import { Module } from '@nestjs/common';
import { VendorRateGroupsController } from './vendor-rate-groups.controller';
import { VendorRateGroupsRepository } from './vendor-rate-groups.repository';
import { VendorRateGroupsService } from './vendor-rate-groups.service';

@Module({
  controllers: [VendorRateGroupsController],
  providers: [VendorRateGroupsService, VendorRateGroupsRepository],
  exports: [VendorRateGroupsService, VendorRateGroupsRepository],
})
export class VendorRateGroupsModule {}
