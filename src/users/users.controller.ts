import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import type { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { Roles } from '@prisma/client';
import { UpdateUserResponseDto } from './dto/response/update-user-response.dto';

@ApiTags('Usuarios')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UserService) {}

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener información de un usuario',
    description: 'Obtiene la información detallada de un usuario. Solo accesible para OWNER.',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID del usuario', type: Number })
  @ApiResponse({ status: 200, description: 'Información del usuario obtenida exitosamente' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No tiene permisos' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @Auth(Roles.OWNER)
  findOne(@Param('id', ParseIntPipe) id: number, @ActiveUser() user: UserActiveInterface) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar perfil de usuario',
    description: 'Actualiza la información del perfil del usuario autenticado.',
  })
  @ApiBearerAuth()
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'Perfil actualizado exitosamente', type: UpdateUserResponseDto })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No tiene permisos para actualizar este usuario' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @Auth(Roles.CUSTOMER, Roles.OWNER)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.usersService.updateProfile(id, updateUserDto, user);
  }

  @Delete('delete-me')
  @ApiOperation({
    summary: 'Eliminar cuenta propia',
    description: 'Elimina la cuenta del usuario autenticado (soft delete).',
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Cuenta eliminada exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'User successfully deleted.' },
        success: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @Auth(Roles.CUSTOMER, Roles.OWNER)
  remove(@ActiveUser() user: UserActiveInterface) {
    return this.usersService.remove(user);
  }
}
