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
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { CommissionsService } from './commissions.service';
import { CreateAgencyCommissionProfileDto } from './dto/create-agency-commission-profile.dto';
import { UpdateAgencyCommissionProfileDto } from './dto/update-agency-commission-profile.dto';

@ApiTags('Comisiones')
@Controller('agency-commission-profiles')
@Auth(Role.SUPER_ADMIN)
export class CommissionsController {
  constructor(private readonly service: CommissionsService) {}

  @Post()
  create(@Body() dto: CreateAgencyCommissionProfileDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAgencyCommissionProfileDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
