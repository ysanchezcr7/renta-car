import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { AgeTiersRepository } from './age-tiers.repository';
import { CreateAgeTierDto } from './dto/create-age-tier.dto';
import { UpdateAgeTierDto } from './dto/update-age-tier.dto';

@Injectable()
export class AgeTiersService {
  constructor(private readonly repo: AgeTiersRepository) {}

  async create(dto: CreateAgeTierDto) {
    if (dto.ageMin > dto.ageMax) {
      throw new BadRequestException('ageMin no puede ser mayor que ageMax');
    }
    const existing = await this.repo.findByCode(dto.code);
    if (existing) {
      throw new ConflictException(
        `Ya existe un tier con el code "${dto.code}"`,
      );
    }
    return this.repo.create(dto);
  }

  findAll(query: PaginationQueryDto) {
    return this.repo.findAll(query);
  }

  findActive() {
    return this.repo.findActive();
  }

  async findOne(id: number) {
    const tier = await this.repo.findById(id);
    if (!tier) throw new NotFoundException(`AgeTier ${id} no encontrado`);
    return tier;
  }

  async update(id: number, dto: UpdateAgeTierDto) {
    await this.findOne(id);
    if (dto.ageMin != null && dto.ageMax != null && dto.ageMin > dto.ageMax) {
      throw new BadRequestException('ageMin no puede ser mayor que ageMax');
    }
    if (dto.code) {
      const existing = await this.repo.findByCode(dto.code);
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Ya existe un tier con el code "${dto.code}"`,
        );
      }
    }
    return this.repo.update(id, dto);
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.repo.softDelete(id);
  }
}
