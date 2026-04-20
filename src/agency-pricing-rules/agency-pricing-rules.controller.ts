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
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import type { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { AgencyPricingRulesService } from './agency-pricing-rules.service';
import { CreateAgencyPricingRuleDto } from './dto/create-agency-pricing-rule.dto';
import { UpdateAgencyPricingRuleDto } from './dto/update-agency-pricing-rule.dto';

@ApiTags('Agency Pricing Rules')
@Controller('agency-pricing-rules')
@Auth(Role.SUPER_ADMIN)
export class AgencyPricingRulesController {
  constructor(private readonly service: AgencyPricingRulesService) {}

  @Post()
  create(
    @Body() dto: CreateAgencyPricingRuleDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.service.create(dto, user);
  }

  @Get()
  findAll(
    @Query() query: PaginationQueryDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.service.findAll(query, user);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAgencyPricingRuleDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}

