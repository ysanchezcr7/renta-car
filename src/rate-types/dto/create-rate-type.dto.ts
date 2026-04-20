import { RateLayer, RateTypeKind } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateRateTypeDto {
  @IsString()
  @MinLength(1)
  code: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsEnum(RateTypeKind)
  kind: RateTypeKind;

  @IsEnum(RateLayer)
  layer: RateLayer;

  @IsOptional()
  @IsString()
  description?: string;
}

