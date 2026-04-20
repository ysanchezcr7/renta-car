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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import type { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { Role } from '@prisma/client';
import { ClientEligibilityQueryDto } from 'src/quotes/dto/client-eligibility-query.dto';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@ApiTags('Clientes')
@Controller('clients')
@Auth(Role.SUPER_ADMIN)
export class ClientsController {
  constructor(private readonly service: ClientsService) {}

  @Post()
  create(@Body() dto: CreateClientDto, @ActiveUser() user: UserActiveInterface) {
    return this.service.create(dto, user);
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto, @ActiveUser() user: UserActiveInterface) {
    return this.service.findAll(query, user);
  }

  @Get(':id/eligibility')
  @ApiOperation({
    summary: 'Elegibilidad del cliente',
    description: 'Edad y vigencia de licencia respecto a una fecha de pickup (opcional, por defecto hoy).',
  })
  eligibility(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: ClientEligibilityQueryDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.service.eligibility(id, user, query.pickupAt);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @ActiveUser() user: UserActiveInterface) {
    return this.service.findOne(id, user);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateClientDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
