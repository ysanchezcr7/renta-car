import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import type { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { createResponse } from 'src/common/helpers/response-response';
import { ConfirmQuotePaymentDto } from 'src/payments/dto/confirm-quote-payment.dto';
import { PaymentsService } from 'src/payments/payments.service';
import { RequestVendorAvailabilityDto } from 'src/quote-vendor-selection/dto/request-vendor-availability.dto';
import { SelectVendorRateDto } from 'src/quote-vendor-selection/dto/select-vendor-rate.dto';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { QuoteResponseDto } from './dto/response/quote-response.dto';
import { SearchQuoteOptionsDto } from './dto/search-quote-options.dto';
import { QuotesService } from './quotes.service';
import { QuoteMultiVendorSearchService } from './services/quote-multi-vendor-search.service';

@ApiTags('Cotizaciones')
@ApiBearerAuth('JWT-auth')
@Controller('quotes')
@Auth(Role.SUPER_ADMIN)
export class QuotesController {
  constructor(
    private readonly quotesService: QuotesService,
    private readonly paymentsService: PaymentsService,
    private readonly multiVendorSearch: QuoteMultiVendorSearchService,
  ) {}

  @Post('search')
  @Auth(Role.SUPER_ADMIN, Role.AGENCY)
  @ApiOperation({
    summary: 'Buscar opciones de cotización multi-vendor',
    description:
      'Dado categoría, transmisión, fechas, ubicación y edad del conductor, ' +
      'devuelve N ofertas de distintos vendors ordenadas por precio ascendente. ' +
      'No expone el vendor al cliente final: este endpoint es interno de la agencia.',
  })
  async search(
    @Body() dto: SearchQuoteOptionsDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    const agencyId =
      user.role === Role.SUPER_ADMIN ? undefined : (user.agencyId ?? undefined);
    const result = await this.multiVendorSearch.searchOptions(dto, agencyId);
    return {
      success: true,
      message:
        result.options.length > 0
          ? `Se encontraron ${result.options.length} opción(es).`
          : 'No se encontraron opciones para los filtros indicados.',
      data: result,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Crear cotización con cálculo automático (venta)' })
  async create(@Body() dto: CreateQuoteDto, @ActiveUser() user: UserActiveInterface) {
    const result = await this.quotesService.create(dto, user);
    return {
      ...createResponse(
        QuoteResponseDto,
        result.message,
        this.quotesService.mapQuoteForResponse(result.data),
      ),
      warnings: result.warnings,
    };
  }

  @Post(':id/request-vendor-availability')
  @ApiOperation({
    summary: 'Solicitar disponibilidad con vendor (ventana 2 horas)',
    description:
      'Registra vendor/rentadora consultados y fija availabilityRequestedAt / availabilityExpiresAt.',
  })
  requestVendorAvailability(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RequestVendorAvailabilityDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.quotesService.requestVendorAvailability(id, dto, user);
  }

  @Post(':id/select-vendor-rate')
  @ApiOperation({
    summary: 'Seleccionar tarifa real de costo (vendor)',
    description:
      'Requiere ventana de disponibilidad vigente. Crea QuoteVendorSelection y actualiza el snapshot en Quote.',
  })
  selectVendorRate(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SelectVendorRateDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.quotesService.selectVendorRate(id, dto, user);
  }

  @Post(':id/mark-awaiting-payment')
  @ApiOperation({
    summary: 'Marcar cotización en espera de pago del cliente',
    description: 'Desde AVAILABILITY_APPROVED o AGENCY_ACCEPTED → AWAITING_PAYMENT.',
  })
  markAwaitingPayment(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.paymentsService.markQuoteAwaitingPayment(id, user);
  }

  @Post(':id/confirm-payment')
  @ApiOperation({
    summary: 'Confirmar pago del cliente (manual / Zelle)',
    description:
      'Verifica un pago CLIENT pendiente y pasa el quote a PAYMENT_RECEIVED. Requiere POST /payments previo con paymentKind CLIENT.',
  })
  confirmPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ConfirmQuotePaymentDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.paymentsService.confirmQuotePayment(id, user, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener cotización por id' })
  findOne(@Param('id', ParseIntPipe) id: number, @ActiveUser() user: UserActiveInterface) {
    return this.quotesService.findOne(id, user);
  }
}
