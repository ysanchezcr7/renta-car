import { CommissionType } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsPositive } from 'class-validator';

export class CreateAgencyCommissionProfileDto {
  @IsInt()
  @IsPositive()
  agencyId: number;

  @IsEnum(CommissionType)
  type: CommissionType;

  @IsPositive()
  value: number;

  @IsOptional()
  isActive?: boolean;
}

