import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

/** Login solo con email + contraseña (web). */
export class LoginDto {
  @ApiProperty({ description: 'Correo (identificador de cuenta)' })
  @IsEmail()
  email: string;

  @ApiProperty()
  @Transform(({ value }) => value.trim())
  @IsString()
  @MinLength(8, {
    message: 'The new password must be at least 8 characters long.',
  })
  @Matches(/^(?=.*[A-Z])(?=.*\d).+$/, {
    message:
      'The new password must contain at least one capital letter and one number.',
  })
  password: string;
}

export class VerifyLoginOtpDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  code: string;
}
