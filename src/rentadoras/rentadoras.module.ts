import { Module } from '@nestjs/common';
import { RentadorasController } from './rentadoras.controller';
import { RentadorasService } from './rentadoras.service';
import { RentadorasRepository } from './rentadoras.repository';

@Module({
  controllers: [RentadorasController],
  providers: [RentadorasService, RentadorasRepository],
  exports: [RentadorasService, RentadorasRepository],
})
export class RentadorasModule {}

