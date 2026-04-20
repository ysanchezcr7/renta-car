import { IsInt, IsPositive, IsString, MinLength } from 'class-validator';

export class CreateCategoriaDto {
  @IsInt()
  @IsPositive()
  rentadoraId: number;

  @IsString()
  @MinLength(1)
  code: string;

  @IsString()
  @MinLength(2)
  name: string;
}

