import { ApiProperty } from '@nestjs/swagger';
import { Matches, MinLength } from 'class-validator';
import { CreateAgencyDto } from 'src/agencies/dto/create-agency.dto';

/** Registro público de agencia: mismos datos que el CRUD + contraseña de acceso. */
export class RegisterAgencyDto extends CreateAgencyDto {
  @ApiProperty()
  @MinLength(8, {
    message: 'La contraseña debe tener al menos 8 caracteres.',
  })
  @Matches(/^(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Debe incluir al menos una mayúscula y un número.',
  })
  password: string;
}
