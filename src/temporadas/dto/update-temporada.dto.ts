import { PartialType } from '@nestjs/swagger';
import { CreateTemporadaDto } from './create-temporada.dto';

export class UpdateTemporadaDto extends PartialType(CreateTemporadaDto) {}

