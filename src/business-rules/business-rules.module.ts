import { Module } from '@nestjs/common';
import { BusinessRulesController } from './business-rules.controller';
import { BusinessRulesService } from './business-rules.service';
import { BusinessRulesRepository } from './business-rules.repository';

@Module({
  controllers: [BusinessRulesController],
  providers: [BusinessRulesService, BusinessRulesRepository],
  exports: [BusinessRulesService, BusinessRulesRepository],
})
export class BusinessRulesModule {}

