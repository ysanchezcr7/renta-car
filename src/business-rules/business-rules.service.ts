import { Injectable } from '@nestjs/common';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { BusinessRulesRepository } from './business-rules.repository';
import { CreateBusinessRuleDto } from './dto/create-business-rule.dto';
import { UpdateBusinessRuleDto } from './dto/update-business-rule.dto';

@Injectable()
export class BusinessRulesService {
  constructor(private readonly repo: BusinessRulesRepository) {}

  create(dto: CreateBusinessRuleDto) {
    return this.repo.create({
      ...dto,
      isActive: dto.isActive ?? true,
    });
  }

  findAll(query: PaginationQueryDto) {
    return this.repo.findAll(query);
  }

  findOne(id: number) {
    return this.repo.findById(id);
  }

  update(id: number, dto: UpdateBusinessRuleDto) {
    return this.repo.update(id, dto);
  }

  remove(id: number) {
    return this.repo.update(id, { isActive: false });
  }
}

