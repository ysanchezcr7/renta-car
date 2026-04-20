import { Module } from '@nestjs/common';
import { MailModule } from 'src/common/mailer/mailer.modules';
import { AgenciesController } from './agencies.controller';
import { AgenciesService } from './agencies.service';
import { AgenciesRepository } from './agencies.repository';

@Module({
  imports: [MailModule],
  controllers: [AgenciesController],
  providers: [AgenciesService, AgenciesRepository],
  exports: [AgenciesService, AgenciesRepository],
})
export class AgenciesModule {}
