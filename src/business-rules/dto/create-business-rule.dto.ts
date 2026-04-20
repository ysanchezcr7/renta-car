import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateBusinessRuleDto {
  @IsString()
  @MinLength(2)
  ruleKey: string;

  @IsString()
  @MinLength(1)
  ruleValue: string;

  @IsString()
  @MinLength(2)
  type: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}

