import { Module } from '@nestjs/common';
import { ModelosController } from './modelos.controller';
import { ModelosService } from './modelos.service';
import { ModelosRepository } from './modelos.repository';

@Module({
  controllers: [ModelosController],
  providers: [ModelosService, ModelosRepository],
  exports: [ModelosService, ModelosRepository],
})
export class ModelosModule {}

