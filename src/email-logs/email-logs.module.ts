import { Module } from '@nestjs/common';
import { EmailLogsController } from './email-logs.controller';
import { EmailLogsService } from './email-logs.service';
import { EmailLogsRepository } from './email-logs.repository';

@Module({
  controllers: [EmailLogsController],
  providers: [EmailLogsService, EmailLogsRepository],
  exports: [EmailLogsService, EmailLogsRepository],
})
export class EmailLogsModule {}
