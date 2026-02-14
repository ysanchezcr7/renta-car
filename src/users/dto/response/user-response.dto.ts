import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Roles } from '@prisma/client';

@Exclude()
export class UserResponseDto {
	@Expose()
	@ApiProperty()
	user_id: number;

	@Expose()
	@ApiProperty()
	email: string;

	@Expose()
	@ApiProperty()
	name: string;

	@Expose()
	@ApiProperty()
	lastName: string;

	@Expose()
	@ApiProperty()
	middleName: string;

	@Expose()
	@ApiProperty()
	phone: string;

	@Expose()
	@ApiProperty()
	image: string;

	@Expose()
	@ApiProperty()
	role: Roles;

	@Expose()
	@ApiProperty()
	emailVerifiedAt?: Date;

	@Expose()
	@ApiProperty()
	isVerified: boolean;
}
