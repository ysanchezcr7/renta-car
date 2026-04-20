import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { BulkUpsertAgencyCategoryPriceMasksDto } from './dto/bulk-upsert-agency-category-price-masks.dto';
import { UpsertAgencyCategoryPriceMaskDto } from './dto/upsert-agency-category-price-mask.dto';
import { AgencyCategoryPriceMasksService } from './agency-category-price-masks.service';

@ApiTags('Máscaras de precio por categoría')
@ApiBearerAuth('JWT-auth')
@Controller('agencies/:agencyId/category-price-masks')
@Auth(Role.SUPER_ADMIN)
export class AgencyCategoryPriceMasksController {
  constructor(private readonly service: AgencyCategoryPriceMasksService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar máscaras configuradas para la agencia',
  })
  list(@Param('agencyId', ParseIntPipe) agencyId: number) {
    return this.service.listByAgency(agencyId);
  }

  @Post()
  @ApiOperation({
    summary: 'Crear o actualizar máscara de una categoría',
    description:
      'Activa como máximo un tipo: porcentual, fija sobre total de renta, o fija por día.',
  })
  upsert(
    @Param('agencyId', ParseIntPipe) agencyId: number,
    @Body() dto: UpsertAgencyCategoryPriceMaskDto,
  ) {
    return this.service.upsert(agencyId, dto);
  }

  @Put('bulk')
  @ApiOperation({
    summary: 'Actualización masiva (varias categorías)',
    description: 'Equivalente a varios upserts en una transacción.',
  })
  bulkUpsert(
    @Param('agencyId', ParseIntPipe) agencyId: number,
    @Body() dto: BulkUpsertAgencyCategoryPriceMasksDto,
  ) {
    return this.service.bulkUpsert(agencyId, dto);
  }

  @Delete(':categoryId')
  @ApiOperation({ summary: 'Eliminar máscara de una categoría' })
  remove(
    @Param('agencyId', ParseIntPipe) agencyId: number,
    @Param('categoryId', ParseIntPipe) categoryId: number,
  ) {
    return this.service.remove(agencyId, categoryId);
  }
}
