import { Module } from '@nestjs/common';
import { RateTypesController } from './rate-types.controller';
import { RateTypesService } from './rate-types.service';
import { RateTypesRepository } from './rate-types.repository';

@Module({
  controllers: [RateTypesController],
  providers: [RateTypesService, RateTypesRepository],
  exports: [RateTypesService, RateTypesRepository],
})
export class RateTypesModule {}

