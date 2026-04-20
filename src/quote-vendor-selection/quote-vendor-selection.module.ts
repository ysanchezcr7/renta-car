import { Module } from '@nestjs/common';
import { QuoteVendorSelectionService } from './quote-vendor-selection.service';

@Module({
  providers: [QuoteVendorSelectionService],
  exports: [QuoteVendorSelectionService],
})
export class QuoteVendorSelectionModule {}
