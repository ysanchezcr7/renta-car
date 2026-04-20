import { Injectable } from '@nestjs/common';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { CategoriasRepository } from './categorias.repository';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';

@Injectable()
export class CategoriasService {
  constructor(private readonly repo: CategoriasRepository) {}

  create(dto: CreateCategoriaDto) {
    return this.repo.create(dto);
  }

  findAll(query: PaginationQueryDto) {
    return this.repo.findAll(query);
  }

  findOne(id: number) {
    return this.repo.findById(id);
  }

  update(id: number, dto: UpdateCategoriaDto) {
    return this.repo.update(id, dto);
  }

  remove(id: number) {
    return this.repo.update(id, { isActive: false });
  }
}

