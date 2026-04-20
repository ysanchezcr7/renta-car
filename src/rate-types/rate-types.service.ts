import { Injectable } from '@nestjs/common';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { CreateRateTypeDto } from './dto/create-rate-type.dto';
import { UpdateRateTypeDto } from './dto/update-rate-type.dto';
import { RateTypesRepository } from './rate-types.repository';

@Injectable()
export class RateTypesService {
  constructor(private readonly repo: RateTypesRepository) {}

  create(dto: CreateRateTypeDto) {
    return this.repo.create(dto);
  }

  findAll(query: PaginationQueryDto) {
    return this.repo.findAll(query);
  }

  findOne(id: number) {
    return this.repo.findById(id);
  }

  update(id: number, dto: UpdateRateTypeDto) {
    return this.repo.update(id, dto);
  }

  remove(id: number) {
    return this.repo.update(id, { isActive: false });
  }
}

