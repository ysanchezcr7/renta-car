import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsNumber,
  IsLatitude,
  IsLongitude,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum SortBy {
  rating = 'rating',
  distance = 'distance',
  price_asc = 'price_asc',
  price_desc = 'price_desc',
  popularity = 'popularity',
}

export class HomeFiltersDto {
  @ApiPropertyOptional({
    description: 'Ordenamiento de resultados',
    enum: SortBy,
    example: SortBy.rating,
  })
  @IsOptional()
  @IsEnum(SortBy)
  sortBy?: SortBy;

  @ApiPropertyOptional({
    description: 'Precio mínimo',
    example: 0.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minPrice?: number;

  @ApiPropertyOptional({
    description: 'Precio máximo',
    example: 25.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Calificación mínima',
    example: 4.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  @Type(() => Number)
  minRating?: number;

  @ApiPropertyOptional({
    description: 'Distancia máxima en kilómetros',
    example: 5.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxDistance?: number;

  @ApiPropertyOptional({
    description:
      'Latitud del usuario para calcular distancia y ordenar por distancia',
    example: 25.7617,
  })
  @IsOptional()
  @IsNumber()
  @IsLatitude()
  @Type(() => Number)
  lat?: number;

  @ApiPropertyOptional({
    description:
      'Longitud del usuario para calcular distancia y ordenar por distancia',
    example: -80.1918,
  })
  @IsOptional()
  @IsNumber()
  @IsLongitude()
  @Type(() => Number)
  lng?: number;

  @ApiPropertyOptional({
    description: 'ID de la categoría para filtrar negocios/servicios',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  categoryId?: number;

  @ApiPropertyOptional({
    description: 'Código de referido para ordenar negocios',
  })
  @IsOptional()
  ref?: string;
}
