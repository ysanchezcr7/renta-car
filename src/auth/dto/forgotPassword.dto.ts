import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
	@ApiProperty()
	@IsString()
	@IsOptional()
	readonly phone?: string;

	@ApiProperty()
	@IsString()
	readonly email: string;

	/*@IsOptional()
	@IsString()
	readonly username?: string;*/
}
