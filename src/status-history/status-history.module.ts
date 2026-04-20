import { Module } from '@nestjs/common';
import { StatusHistoryController } from './status-history.controller';
import { StatusHistoryService } from './status-history.service';
import { StatusHistoryRepository } from './status-history.repository';

@Module({
  controllers: [StatusHistoryController],
  providers: [StatusHistoryService, StatusHistoryRepository],
  exports: [StatusHistoryService, StatusHistoryRepository],
})
export class StatusHistoryModule {}
