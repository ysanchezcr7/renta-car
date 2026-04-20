import { TransmissionType } from '@prisma/client';
import { IsEnum, IsInt, IsPositive, IsString, MinLength } from 'class-validator';

export class CreateModeloDto {
  @IsInt()
  @IsPositive()
  categoryId: number;

  @IsString()
  @MinLength(1)
  code: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsEnum(TransmissionType)
  transmission: TransmissionType;
}

