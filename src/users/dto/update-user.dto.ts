import { ApiProperty } from '@nestjs/swagger';
import {
	IsOptional,
	IsString,
	MinLength,
	Matches,
	ValidatorConstraint,
	ValidatorConstraintInterface,
	ValidationArguments,
	IsUrl,
	Validate,
} from 'class-validator';

// Validación personalizada para extensiones de imagen
@ValidatorConstraint({ name: 'IsImageUrl', async: false })
export class IsImageUrlConstraint implements ValidatorConstraintInterface {
	validate(url: string, _args: ValidationArguments) {
		return typeof url === 'string' && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
	}

	defaultMessage(_args: ValidationArguments) {
		return 'Image must be a valid image URL (jpg, jpeg, png, gif, webp, svg)';
	}
}
export class UpdateUserDto {
	/*@IsOptional()
	@IsString()
	email?: string;*/

	@ApiProperty()
	@IsOptional()
	@IsString()
	name?: string;

	@ApiProperty()
	@IsOptional()
	@IsString()
	@MinLength(1)
	lastName?: string;

	@ApiProperty()
	@IsOptional()
	@IsString()
	middleName?: string;

	@ApiProperty()
	@IsOptional()
	@IsString()
	phone?: string;

	@ApiProperty()
	@IsOptional()
	@IsUrl({}, { message: 'Image must be a valid URL' })
	@Validate(IsImageUrlConstraint)
	image?: string;

	@ApiProperty()
	@IsOptional()
	@IsString()
	@MinLength(8, { message: 'The new password must be at least 8 characters long.' })
	@Matches(/^(?=.*[A-Z])(?=.*\d).+$/, {
		message: 'The new password must contain at least one capital letter and one number.',
	})
	password?: string;

	@ApiProperty()
	@IsOptional()
	@IsString()
	deviceToken?: string;
}
// This DTO is used to update user information, including optional fields like email, name, lastName, middleName, phone, image, and password.
