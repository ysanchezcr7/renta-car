import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsString, Matches, MinLength } from 'class-validator';

export class LoginDto {
	@ApiProperty()
	@IsEmail()
	email: string;

	@ApiProperty()
	@Transform(({ value }) => value.trim())
	@IsString()
	@MinLength(8, { message: 'The new password must be at least 8 characters long.' })
	@Matches(/^(?=.*[A-Z])(?=.*\d).+$/, {
		message: 'The new password must contain at least one capital letter and one number.',
	})
	password: string;

	@ApiProperty()
	@IsIn(['customer', 'owner'])
	app_type: 'customer' | 'owner'; // Esto lo envía la app al iniciar sesión
}

export class VerifyLoginOtpDto {
	@ApiProperty()
	@IsEmail()
	email: string;

	@ApiProperty()
	@IsString()
	code: string;
}
