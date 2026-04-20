import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Referencias a archivos (clave S3, path interno, etc.) — el upload real es externo a esta API.
 * Plazo típico vendor: 24–48 h (regla de negocio documentada; no bloquea el endpoint).
 */
export class ProcessVoucherDto {
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  vendorVoucherFile?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  internalVoucherFile?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  cloudUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
