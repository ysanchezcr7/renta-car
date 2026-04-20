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
import { CreateRateTypeDto } from './dto/create-rate-type.dto';
import { UpdateRateTypeDto } from './dto/update-rate-type.dto';
import { RateTypesService } from './rate-types.service';

@ApiTags('Rate Types')
@Controller('rate-types')
@Auth(Role.SUPER_ADMIN)
export class RateTypesController {
  constructor(private readonly service: RateTypesService) {}

  @Post()
  create(@Body() dto: CreateRateTypeDto) {
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
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRateTypeDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}

