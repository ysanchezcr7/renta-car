import { IsDateString, IsOptional } from 'class-validator';

export class ClientEligibilityQueryDto {
  /** Fecha de referencia (p.ej. pickup); por defecto el servicio puede usar `new Date()` desde el controller */
  @IsOptional()
  @IsDateString()
  pickupAt?: string;
}
