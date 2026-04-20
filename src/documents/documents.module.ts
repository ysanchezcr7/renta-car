import { Module } from '@nestjs/common';

/**
 * Los archivos se registran vía modelo `Document` desde `VouchersService`
 * (y futuros servicios). No hay controlador REST en esta fase.
 */
@Module({})
export class DocumentsModule {}
