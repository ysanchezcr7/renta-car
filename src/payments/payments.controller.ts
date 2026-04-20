import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import type { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('Pagos')
@ApiBearerAuth('JWT-auth')
@Controller('payments')
@Auth(Role.SUPER_ADMIN)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({
    summary: 'Registrar pago (cliente o vendor)',
    description:
      'CLIENT: requiere quoteId. VENDOR: requiere reservationId. Verificación manual (Zelle); opcional verifyNow para marcar recibido sin pasarela.',
  })
  create(@Body() dto: CreatePaymentDto, @ActiveUser() user: UserActiveInterface) {
    return this.paymentsService.create(dto, user);
  }
}
