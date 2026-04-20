import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class OwnerSettingsResponseDto {
  @Expose()
  @ApiProperty()
  autoConfirmAppointments: boolean;

  @Expose()
  @ApiProperty()
  cancellationFeePercent: number;
}
