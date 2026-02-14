import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class LoginResponseDto {
	@Expose()
	@ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
	token: string;

	@Expose()
	@ApiProperty({ example: 'user@example.com' })
	email: string;

	@Expose()
	@ApiProperty({ example: true })
	isVerified: boolean;

	@Expose()
	@ApiProperty({ example: 12 })
	userId: number;

	@Expose()
	@ApiProperty({ example: 5, nullable: true })
	referralBusinessId: number | null;
}
