import { Module } from '@nestjs/common';
import { AgencyCategoryPriceMasksController } from './agency-category-price-masks.controller';
import { AgencyCategoryPriceMasksRepository } from './agency-category-price-masks.repository';
import { AgencyCategoryPriceMasksService } from './agency-category-price-masks.service';

@Module({
  controllers: [AgencyCategoryPriceMasksController],
  providers: [
    AgencyCategoryPriceMasksService,
    AgencyCategoryPriceMasksRepository,
  ],
  exports: [AgencyCategoryPriceMasksRepository],
})
export class AgencyCategoryPriceMasksModule {}
