import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class MembershipStatusResponseDto {
  @Expose()
  @ApiProperty()
  isActive: boolean;

  @Expose()
  @ApiProperty()
  startDate: string;

  @Expose()
  @ApiProperty()
  endDate: string;

  @Expose()
  @ApiProperty()
  paidAmount: number;
}
