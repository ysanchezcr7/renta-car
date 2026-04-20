// Wrapper genérico centralizado para todas las respuestas estándar de la API
import { ApiProperty } from '@nestjs/swagger';

/**
 * Wrapper base para todas las respuestas de la API
 * Usa genéricos para tipar el campo data
 */
export class BaseResponseWrapperDto<T> {
  @ApiProperty({ example: 'Operation completed successfully.' })
  message: string;

  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty()
  data?: T;
}

/**
 * Wrapper para respuestas con lista de datos
 */
export class ListResponseDto<T> extends BaseResponseWrapperDto<T[]> {
  @ApiProperty()
  declare data: T[];
}

/**
 * Wrapper para respuestas con un solo objeto
 */
export class SingleResponseDto<T> extends BaseResponseWrapperDto<T> {
  @ApiProperty()
  declare data: T;
}
