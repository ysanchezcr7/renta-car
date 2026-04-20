import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { AgencyPricingRulesRepository } from './agency-pricing-rules.repository';
import { CreateAgencyPricingRuleDto } from './dto/create-agency-pricing-rule.dto';
import { UpdateAgencyPricingRuleDto } from './dto/update-agency-pricing-rule.dto';

@Injectable()
export class AgencyPricingRulesService {
  constructor(private readonly repo: AgencyPricingRulesRepository) {}

  create(dto: CreateAgencyPricingRuleDto, user: UserActiveInterface) {
    const agencyId =
      user.role === Role.SUPER_ADMIN ? dto.agencyId : (user.agencyId ?? dto.agencyId);
    return this.repo.create({
      ...dto,
      agencyId,
      isActive: dto.isActive ?? true,
    });
  }

  findAll(query: PaginationQueryDto, user: UserActiveInterface) {
    const agencyId = user.role === Role.SUPER_ADMIN ? undefined : user.agencyId ?? undefined;
    return this.repo.findAll(query, agencyId);
  }

  findOne(id: number) {
    return this.repo.findById(id);
  }

  update(id: number, dto: UpdateAgencyPricingRuleDto) {
    return this.repo.update(id, dto);
  }

  remove(id: number) {
    return this.repo.update(id, { isActive: false });
  }
}

