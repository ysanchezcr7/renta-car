import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { RatesSearchQueryDto } from './dto/rates-search-query.dto';
import { QuotesService } from './quotes.service';

@ApiTags('Tarifas')
@ApiBearerAuth('JWT-auth')
@Controller('rates')
@Auth(Role.SUPER_ADMIN)
export class RatesSearchController {
  constructor(private readonly quotesService: QuotesService) {}

  @Get('search')
  @ApiOperation({
    summary: 'Buscar tarifa de venta candidata',
    description:
      'Devuelve días facturables, temporada, rango de días y si hay tarifa única, conflicto o revisión manual.',
  })
  search(@Query() query: RatesSearchQueryDto) {
    return this.quotesService.searchRates(query);
  }
}
