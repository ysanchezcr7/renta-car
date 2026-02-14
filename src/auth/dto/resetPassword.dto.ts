// src/auth/dto/reset-password.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MinLength, Matches } from 'class-validator';

export class ResetPasswordDto {
	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	readonly code: string;

	@ApiProperty()
	@IsString()
	@MinLength(8, { message: 'The new password must be at least 8 characters long.' })
	@Matches(/^(?=.*[A-Z])(?=.*\d).+$/, {
		message: 'The new password must contain at least one capital letter and one number.',
	})
	newPassword: string;

	@ApiProperty()
	@IsOptional()
	@IsString()
	readonly phone?: string;

	@ApiProperty()
	@IsString()
	readonly email: string;

	/*@IsOptional()
	@IsString()
	readonly username?: string;*/
}
