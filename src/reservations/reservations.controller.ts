import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import type { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { ProcessVoucherDto } from 'src/vouchers/dto/process-voucher.dto';
import { SendVoucherDto } from 'src/vouchers/dto/send-voucher.dto';
import { VouchersService } from 'src/vouchers/vouchers.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationsService } from './reservations.service';

@ApiTags('Reservas')
@ApiBearerAuth('JWT-auth')
@Controller('reservations')
@Auth(Role.SUPER_ADMIN)
export class ReservationsController {
  constructor(
    private readonly reservationsService: ReservationsService,
    private readonly vouchersService: VouchersService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Crear reserva formal desde cotización',
    description:
      'Usa solo quoteId; montos y snapshots se copian y validan desde el servidor (no confiar en el cliente).',
  })
  create(@Body() dto: CreateReservationDto, @ActiveUser() user: UserActiveInterface) {
    return this.reservationsService.create(dto, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener reserva por id' })
  findOne(@Param('id', ParseIntPipe) id: number, @ActiveUser() user: UserActiveInterface) {
    return this.reservationsService.findOne(id, user);
  }

  @Post(':id/submit-to-vendor')
  @ApiOperation({
    summary: 'Enviar reserva al vendor',
    description: 'CREATED → SUBMITTED_TO_VENDOR; quote → REQUEST_SUBMITTED_TO_VENDOR; voucher PENDING.',
  })
  submitToVendor(@Param('id', ParseIntPipe) id: number, @ActiveUser() user: UserActiveInterface) {
    return this.reservationsService.submitToVendor(id, user);
  }

  @Post(':id/process-voucher')
  @ApiOperation({
    summary: 'Registrar voucher del vendor y/o interno',
    description:
      'Actualiza tabla `Voucher`, sincroniza `voucherStatus` en reserva/quote, audita `Document` y escribe EmailLog. Plazo típico vendor: 24–48 h.',
  })
  processVoucher(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ProcessVoucherDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.vouchersService.processVoucher(id, dto, user);
  }

  @Post(':id/send-voucher')
  @ApiOperation({
    summary: 'Enviar voucher a la agencia (manual / registro de envío)',
    description:
      'Marca voucher SENT, reserva y quote; registra EmailLog VOUCHER_SENT_TO_AGENCY (sin SMTP en esta fase).',
  })
  sendVoucher(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SendVoucherDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.vouchersService.sendVoucherToAgency(id, dto, user);
  }
}
