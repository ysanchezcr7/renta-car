import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpsertAgencyCategoryPriceMaskDto {
  @ApiProperty({ description: 'ID de categoría (producto / línea de vehículo)' })
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  categoryId: number;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  percentageEnabled = false;

  @ApiPropertyOptional({
    description: 'Porcentaje sobre el subtotal de renta (ej. 15 = 15%)',
    default: 0,
  })
  @ValidateIf((o) => o.percentageEnabled)
  @IsNumber()
  @Min(0)
  @Max(999.9999)
  percentageValue = 0;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  fixedTotalEnabled = false;

  @ApiPropertyOptional({
    description: 'Importe fijo una sola vez sobre el total de renta',
    default: 0,
  })
  @ValidateIf((o) => o.fixedTotalEnabled)
  @IsNumber()
  @Min(0)
  fixedTotalValue = 0;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  fixedPerDayEnabled = false;

  @ApiPropertyOptional({
    description: 'Importe fijo por día de renta',
    default: 0,
  })
  @ValidateIf((o) => o.fixedPerDayEnabled)
  @IsNumber()
  @Min(0)
  fixedPerDayValue = 0;
}
