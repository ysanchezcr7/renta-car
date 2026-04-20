import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import type { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { QueryEmailLogsDto } from './dto/query-email-logs.dto';
import { EmailLogsService } from './email-logs.service';

@ApiTags('Email Logs')
@ApiBearerAuth('JWT-auth')
@Controller('email-logs')
@Auth(Role.SUPER_ADMIN, Role.AGENCY)
export class EmailLogsController {
  constructor(private readonly emailLogsService: EmailLogsService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar envíos / eventos de correo (paginado)',
    description:
      'SUPER_ADMIN: todo o filtro `agencyId`. AGENCY: solo su agencia.',
  })
  findAll(
    @ActiveUser() user: UserActiveInterface,
    @Query() query: QueryEmailLogsDto,
  ) {
    return this.emailLogsService.findAll(user, query);
  }
}
