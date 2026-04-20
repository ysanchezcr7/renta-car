import { Module } from '@nestjs/common';
import { VendorRatesController } from './vendor-rates.controller';
import { VendorRatesService } from './vendor-rates.service';
import { VendorRatesRepository } from './vendor-rates.repository';

@Module({
  controllers: [VendorRatesController],
  providers: [VendorRatesService, VendorRatesRepository],
  exports: [VendorRatesService, VendorRatesRepository],
})
export class VendorRatesModule {}

