import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Formulario “Aplicar como agencia” (Daiquiri Tour).
 * Archivos: enviar como URL tras subida (logo, Seller of travel PDF).
 */
export class CreateAgencyDto {
  @ApiPropertyOptional({
    description: 'URL del logo tras subir el archivo',
    example: 'https://cdn.example.com/agencies/1/logo.png',
  })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  logoUrl?: string;

  @ApiProperty({ example: 'Agencia XYZ LLC' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  legalName: string;

  @ApiProperty({ example: 'XYZ Rent a Car' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  tradeName: string;

  @ApiProperty({ example: 'María Pérez García' })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  responsibleFullName: string;

  @ApiProperty({ example: 'contacto@agencia.com' })
  @IsEmail()
  @MaxLength(255)
  contactEmail: string;

  @ApiProperty({ example: '+1 305 555 0100' })
  @IsString()
  @MinLength(5)
  @MaxLength(40)
  phone: string;

  @ApiPropertyOptional({ example: '123 Calle Principal' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressLine1?: string;

  @ApiPropertyOptional({ example: 'Suite 4B' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressLine2?: string;

  @ApiPropertyOptional({ example: 'Miami' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @ApiPropertyOptional({ example: 'Florida' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  stateRegion?: string;

  @ApiPropertyOptional({ example: 'FL' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  stateCode?: string;

  @ApiPropertyOptional({ example: 'US' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  country?: string;

  @ApiPropertyOptional({ example: '33101' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  postalCode?: string;

  @ApiProperty({
    description: 'Dirección de facturación',
    example: '123 Calle Principal, Miami FL 33101',
  })
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  billingAddress: string;

  @ApiPropertyOptional({
    description: 'URL del PDF “Seller of travel”',
    example: 'https://cdn.example.com/agencies/1/sot.pdf',
  })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  sellerOfTravelDocumentUrl?: string;

  @ApiProperty({
    description: 'Tipo de identificador fiscal (según desplegable del formulario)',
    example: 'EIN',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  taxIdType: string;

  @ApiProperty({ example: '12-3456789' })
  @IsString()
  @MinLength(4)
  @MaxLength(64)
  taxId: string;

  @ApiPropertyOptional({
    description: 'Agencia interna / casa matriz del sistema',
    default: false,
  })
  @IsOptional()
  isAdmin?: boolean;
}
