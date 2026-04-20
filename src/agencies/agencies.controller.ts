import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import type { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { AgenciesService } from './agencies.service';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { UpdateAgencyDto } from './dto/update-agency.dto';

@ApiTags('Agencias')
@ApiBearerAuth('JWT-auth')
@Controller('agencies')
export class AgenciesController {
  constructor(private readonly service: AgenciesService) {}

  @Post()
  @Auth(Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Crear agencia (alta operativa sin credenciales)',
    description:
      'Las agencias con login se registran con POST /auth/register-agency. Aquí solo SUPER_ADMIN (onboarding / internas).',
  })
  create(
    @Body() dto: CreateAgencyDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.service.create(dto, user);
  }

  @Get()
  @Auth(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Listar todas las agencias (paginado)' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get('me')
  @Auth(Role.AGENCY)
  @ApiOperation({
    summary: 'Perfil de mi agencia',
    description: 'Solo usuarios AGENCY con `agencyId` asignado.',
  })
  findMine(@ActiveUser() user: UserActiveInterface) {
    return this.service.findMine(user);
  }

  @Get(':id')
  @Auth(Role.SUPER_ADMIN, Role.AGENCY)
  @ApiOperation({
    summary: 'Detalle de agencia por id',
    description:
      'SUPER_ADMIN: cualquier id. AGENCY: solo el id de su propia agencia.',
  })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.service.findOne(id, user);
  }

  @Patch(':id')
  @Auth(Role.SUPER_ADMIN, Role.AGENCY)
  @ApiOperation({
    summary: 'Actualizar agencia',
    description:
      'SUPER_ADMIN: cualquier agencia; puede `approvalStatus` (APPROVED | REJECTED) y `rejectionReason` (antifraude). Al aprobar se habilita login y se envía correo. AGENCY: solo la suya; no puede cambiar `isAdmin`, aprobación ni verificación.',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAgencyDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  @Auth(Role.SUPER_ADMIN, Role.AGENCY)
  @ApiOperation({
    summary: 'Baja lógica (isActive = false)',
    description:
      'SUPER_ADMIN: cualquier agencia. AGENCY: solo la suya.',
  })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.service.remove(id, user);
  }
}
