import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class SendVoucherDto {
  @IsOptional()
  @IsEmail()
  toEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  subject?: string;

  /** Nota o cuerpo resumido guardado en EmailLog.payload */
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  message?: string;
}
