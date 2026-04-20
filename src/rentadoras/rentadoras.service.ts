import { Injectable } from '@nestjs/common';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { CreateRentadoraDto } from './dto/create-rentadora.dto';
import { UpdateRentadoraDto } from './dto/update-rentadora.dto';
import { RentadorasRepository } from './rentadoras.repository';

@Injectable()
export class RentadorasService {
  constructor(private readonly repo: RentadorasRepository) {}

  create(dto: CreateRentadoraDto) {
    return this.repo.create(dto);
  }

  findAll(query: PaginationQueryDto) {
    return this.repo.findAll(query);
  }

  findOne(id: number) {
    return this.repo.findById(id);
  }

  update(id: number, dto: UpdateRentadoraDto) {
    return this.repo.update(id, dto);
  }

  remove(id: number) {
    return this.repo.update(id, { isActive: false });
  }
}

