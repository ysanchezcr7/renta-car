import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export class QueryEmailLogsDto extends PaginationQueryDto {
  /** Solo SUPER_ADMIN: filtrar por agencia. */
  @IsOptional()
  @Transform(({ value }) =>
    value === '' || value === undefined ? undefined : Number(value),
  )
  @IsInt()
  agencyId?: number;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === undefined ? undefined : Number(value)))
  @IsInt()
  entityId?: number;

  @IsOptional()
  @IsString()
  emailType?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  eventType?: string;
}
