import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import type { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { QueryStatusHistoryDto } from './dto/query-status-history.dto';
import { StatusHistoryService } from './status-history.service';

@ApiTags('Status History')
@ApiBearerAuth('JWT-auth')
@Controller('status-history')
@Auth(Role.SUPER_ADMIN, Role.AGENCY)
export class StatusHistoryController {
  constructor(private readonly statusHistoryService: StatusHistoryService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar historial de cambios de estado (paginado)',
    description:
      'SUPER_ADMIN: todo o filtro `agencyId`. AGENCY: solo su agencia.',
  })
  findAll(
    @ActiveUser() user: UserActiveInterface,
    @Query() query: QueryStatusHistoryDto,
  ) {
    return this.statusHistoryService.findAll(user, query);
  }
}
