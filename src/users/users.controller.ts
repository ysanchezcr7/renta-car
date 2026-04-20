import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
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
import { Role } from '@prisma/client';
import { UpdateUserResponseDto } from './dto/response/update-user-response.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

@ApiTags('Usuarios')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UserService) {}

  @Get()
  @Auth(Role.SUPER_ADMIN)
  findAll(
    @Query() query: PaginationQueryDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.usersService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener información de un usuario',
    description:
      'Obtiene la información detallada de un usuario. Solo accesible para SUPER_ADMIN.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'id', description: 'ID del usuario', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Información del usuario obtenida exitosamente',
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No tiene permisos' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @Auth(Role.SUPER_ADMIN)
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.usersService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar perfil de usuario',
    description: 'Actualiza la información del perfil del usuario autenticado.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'Perfil actualizado exitosamente',
    type: UpdateUserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos para actualizar este usuario',
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @Auth(Role.SUPER_ADMIN)
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
  @ApiBearerAuth('JWT-auth')
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
  @Auth(Role.SUPER_ADMIN)
  remove(@ActiveUser() user: UserActiveInterface) {
    return this.usersService.remove(user);
  }
}
