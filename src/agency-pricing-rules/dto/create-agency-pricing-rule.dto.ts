import { IsBoolean, IsInt, IsOptional, IsPositive, IsString, MinLength } from 'class-validator';

export class CreateAgencyPricingRuleDto {
  @IsInt()
  @IsPositive()
  agencyId: number;

  @IsString()
  @MinLength(2)
  key: string;

  @IsString()
  @MinLength(1)
  value: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

