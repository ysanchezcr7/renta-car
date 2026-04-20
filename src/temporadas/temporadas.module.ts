import { Module } from '@nestjs/common';
import { TemporadasController } from './temporadas.controller';
import { TemporadasService } from './temporadas.service';
import { TemporadasRepository } from './temporadas.repository';

@Module({
  controllers: [TemporadasController],
  providers: [TemporadasService, TemporadasRepository],
  exports: [TemporadasService, TemporadasRepository],
})
export class TemporadasModule {}

