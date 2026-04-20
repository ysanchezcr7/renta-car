import { Module } from '@nestjs/common';
import { EmailLogsModule } from 'src/email-logs/email-logs.module';
import { VouchersService } from './vouchers.service';

@Module({
  imports: [EmailLogsModule],
  providers: [VouchersService],
  exports: [VouchersService],
})
export class VouchersModule {}
