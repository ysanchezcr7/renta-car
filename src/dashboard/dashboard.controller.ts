import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import type { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { DashboardMetricsQueryDto } from './dto/dashboard-metrics-query.dto';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT-auth')
@Controller('dashboard')
@Auth(Role.SUPER_ADMIN, Role.AGENCY)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('metrics')
  @ApiOperation({
    summary: 'Métricas básicas (cotizaciones, reservas, pagos, utilidad)',
    description:
      'SUPER_ADMIN: datos globales u opcionalmente `agencyId`. AGENCY: solo su agencia.',
  })
  metrics(
    @ActiveUser() user: UserActiveInterface,
    @Query() query: DashboardMetricsQueryDto,
  ) {
    return this.dashboardService.getMetrics(user, query);
  }
}
