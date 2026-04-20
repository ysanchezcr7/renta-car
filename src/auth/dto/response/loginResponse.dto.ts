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
  @ApiProperty({
    example: 12,
    nullable: true,
    description: 'null si el login es cuenta de agencia (sin fila User).',
  })
  userId: number | null;

  @Expose()
  @ApiProperty({ example: 3, nullable: true, required: false })
  agencyId?: number | null;
}
