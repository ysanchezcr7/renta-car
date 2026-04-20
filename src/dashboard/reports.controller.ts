import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import type { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { DashboardMetricsQueryDto } from './dto/dashboard-metrics-query.dto';
import { DashboardService } from './dashboard.service';

@ApiTags('Reports')
@ApiBearerAuth('JWT-auth')
@Controller('reports')
@Auth(Role.SUPER_ADMIN, Role.AGENCY)
export class ReportsController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Resumen de métricas (alias de GET /dashboard/metrics)',
  })
  summary(
    @ActiveUser() user: UserActiveInterface,
    @Query() query: DashboardMetricsQueryDto,
  ) {
    return this.dashboardService.getMetrics(user, query);
  }
}
