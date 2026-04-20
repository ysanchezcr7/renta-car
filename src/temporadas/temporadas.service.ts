import { Injectable } from '@nestjs/common';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { CreateTemporadaDto } from './dto/create-temporada.dto';
import { UpdateTemporadaDto } from './dto/update-temporada.dto';
import { TemporadasRepository } from './temporadas.repository';

@Injectable()
export class TemporadasService {
  constructor(private readonly repo: TemporadasRepository) {}

  create(dto: CreateTemporadaDto) {
    return this.repo.create({
      ...dto,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
    });
  }

  findAll(query: PaginationQueryDto) {
    return this.repo.findAll(query);
  }

  findOne(id: number) {
    return this.repo.findById(id);
  }

  update(id: number, dto: UpdateTemporadaDto) {
    return this.repo.update(id, {
      ...dto,
      ...(dto.startDate ? { startDate: new Date(dto.startDate) } : {}),
      ...(dto.endDate ? { endDate: new Date(dto.endDate) } : {}),
    });
  }

  remove(id: number) {
    return this.repo.remove(id);
  }
}

