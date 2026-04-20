import { Injectable } from '@nestjs/common';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { CommissionsRepository } from './commissions.repository';
import { CreateAgencyCommissionProfileDto } from './dto/create-agency-commission-profile.dto';
import { UpdateAgencyCommissionProfileDto } from './dto/update-agency-commission-profile.dto';

@Injectable()
export class CommissionsService {
  constructor(private readonly repo: CommissionsRepository) {}

  create(dto: CreateAgencyCommissionProfileDto) {
    return this.repo.create(dto);
  }

  findAll(query: PaginationQueryDto) {
    return this.repo.findAll(query);
  }

  findOne(id: number) {
    return this.repo.findById(id);
  }

  update(id: number, dto: UpdateAgencyCommissionProfileDto) {
    return this.repo.update(id, dto);
  }

  remove(id: number) {
    return this.repo.update(id, { isActive: false });
  }
}
