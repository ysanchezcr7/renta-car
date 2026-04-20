import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

export class CreateAgeTierDto {
  @IsString()
  @Length(2, 50)
  code: string;

  @IsString()
  @Length(1, 100)
  name: string;

  @IsInt()
  @Min(0)
  @Max(120)
  ageMin: number;

  @IsInt()
  @Min(0)
  @Max(120)
  ageMax: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
