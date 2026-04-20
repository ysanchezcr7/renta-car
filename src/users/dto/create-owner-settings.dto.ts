import { IsBoolean, IsNumber, Max, Min } from 'class-validator';

export class CreateOrUpdateOwnerSettingsDto {
  @IsBoolean()
  autoConfirmAppointments: boolean;

  @IsNumber()
  @Min(0)
  @Max(100)
  cancellationFeePercent: number;
}
