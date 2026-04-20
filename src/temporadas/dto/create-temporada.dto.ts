import { IsDateString, IsString, MinLength } from 'class-validator';

export class CreateTemporadaDto {
  @IsString()
  @MinLength(1)
  code: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}

