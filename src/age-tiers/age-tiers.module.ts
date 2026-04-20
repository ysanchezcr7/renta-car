import { Module } from '@nestjs/common';
import { AgeTiersController } from './age-tiers.controller';
import { AgeTiersRepository } from './age-tiers.repository';
import { AgeTiersService } from './age-tiers.service';

@Module({
  controllers: [AgeTiersController],
  providers: [AgeTiersService, AgeTiersRepository],
  exports: [AgeTiersService, AgeTiersRepository],
})
export class AgeTiersModule {}
