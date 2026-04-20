import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class RegisterUserDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  firstName: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  lastName: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  middleName: string;

  @ApiProperty()
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

  @ApiProperty()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  imagen?: string;

  @ApiProperty({
    description: 'Solo CUSTOMER vía este endpoint; agencias usan POST /auth/register-agency.',
  })
  @IsEnum(Role)
  @IsOptional()
  role: Role = Role.CUSTOMER;

  @ApiProperty()
  @IsOptional()
  @IsString()
  referralCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  deviceToken?: string;
}
