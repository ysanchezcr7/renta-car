import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { getAgencyScope } from 'src/common/utils/agency-scope';
import { QuotesService } from 'src/quotes/quotes.service';
import { ClientsRepository } from './clients.repository';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(
    private readonly repo: ClientsRepository,
    private readonly quotesService: QuotesService,
  ) {}

  create(dto: CreateClientDto, user: UserActiveInterface) {
    const scope = getAgencyScope(user);
    return this.repo.create({
      ...dto,
      agencyId: scope.agencyId ?? user.agencyId!,
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      licenseIssuedAt: dto.licenseIssuedAt ? new Date(dto.licenseIssuedAt) : undefined,
    });
  }

  eligibility(clientId: number, user: UserActiveInterface, pickupAt?: string) {
    return this.quotesService.clientEligibility(clientId, user, pickupAt);
  }

  findAll(query: PaginationQueryDto, user: UserActiveInterface) {
    const agencyId = user.role === Role.SUPER_ADMIN ? undefined : user.agencyId ?? undefined;
    return this.repo.findAll(query, agencyId);
  }

  findOne(id: number, user: UserActiveInterface) {
    const agencyId = user.role === Role.SUPER_ADMIN ? undefined : user.agencyId ?? undefined;
    return this.repo.findById(id, agencyId);
  }

  update(id: number, dto: UpdateClientDto) {
    return this.repo.update(id, {
      ...dto,
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : dto.dateOfBirth,
      licenseIssuedAt: dto.licenseIssuedAt ? new Date(dto.licenseIssuedAt) : dto.licenseIssuedAt,
    });
  }

  remove(id: number) {
    return this.repo.remove(id);
  }
}
