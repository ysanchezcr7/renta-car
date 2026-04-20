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
import { CreateVendorRateGroupDto } from './dto/create-vendor-rate-group.dto';
import { UpdateVendorRateGroupDto } from './dto/update-vendor-rate-group.dto';
import { VendorRateGroupsService } from './vendor-rate-groups.service';

@ApiTags('Vendor Rate Groups')
@Controller('vendor-rate-groups')
@Auth(Role.SUPER_ADMIN)
export class VendorRateGroupsController {
  constructor(private readonly service: VendorRateGroupsService) {}

  @Post()
  create(@Body() dto: CreateVendorRateGroupDto) {
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
    @Body() dto: UpdateVendorRateGroupDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
