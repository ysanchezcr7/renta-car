// dto/update-device-token.dto.ts
import { IsString, MinLength } from 'class-validator';

export class UpdateDeviceTokenDto {
  @IsString()
  @MinLength(10)
  deviceToken: string;
}
