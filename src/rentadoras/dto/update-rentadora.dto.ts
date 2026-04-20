import { PartialType } from '@nestjs/swagger';
import { CreateRentadoraDto } from './create-rentadora.dto';

export class UpdateRentadoraDto extends PartialType(CreateRentadoraDto) {}

