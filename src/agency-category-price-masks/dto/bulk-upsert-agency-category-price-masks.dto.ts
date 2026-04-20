import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { UpsertAgencyCategoryPriceMaskDto } from './upsert-agency-category-price-mask.dto';

export class BulkUpsertAgencyCategoryPriceMasksDto {
  @ApiProperty({ type: [UpsertAgencyCategoryPriceMaskDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpsertAgencyCategoryPriceMaskDto)
  items: UpsertAgencyCategoryPriceMaskDto[];
}
