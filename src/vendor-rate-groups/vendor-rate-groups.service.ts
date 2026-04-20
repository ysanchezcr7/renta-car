import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { VendorRateGroupsRepository } from './vendor-rate-groups.repository';
import { CreateVendorRateGroupDto } from './dto/create-vendor-rate-group.dto';
import { UpdateVendorRateGroupDto } from './dto/update-vendor-rate-group.dto';

@Injectable()
export class VendorRateGroupsService {
  constructor(private readonly repo: VendorRateGroupsRepository) {}

  async create(dto: CreateVendorRateGroupDto) {
    const validFrom = new Date(dto.validFrom);
    const validTo = new Date(dto.validTo);
    if (validFrom > validTo) {
      throw new BadRequestException('validFrom no puede ser mayor que validTo');
    }

    if (dto.overrides?.length) {
      for (const ov of dto.overrides) {
        const from = new Date(ov.overrideFrom);
        const to = new Date(ov.overrideTo);
        if (from > to) {
          throw new BadRequestException(
            'En overrides: overrideFrom no puede ser mayor que overrideTo',
          );
        }
        if (from < validFrom || to > validTo) {
          throw new BadRequestException(
            'Los overrides deben estar dentro de la vigencia del grupo',
          );
        }
      }
    }

    const group = await this.repo.createGroup({
      vendorId: dto.vendorId,
      name: dto.name,
      modality: dto.modality,
      seasonId: dto.seasonId,
      validFrom,
      validTo,
      currency: dto.currency ?? 'USD',
      isActive: dto.isActive ?? true,
      notes: dto.notes,
    });

    if (dto.provinceLocationIds?.length) {
      await this.repo.replaceProvinces(group.id, dto.provinceLocationIds);
    }

    if (dto.overrides?.length) {
      await this.repo.replaceOverrides(
        group.id,
        dto.overrides.map((o) => ({
          replacementGroupId: o.replacementGroupId,
          overrideFrom: new Date(o.overrideFrom),
          overrideTo: new Date(o.overrideTo),
          notes: o.notes,
        })),
      );
    }

    return this.findOne(group.id);
  }

  findAll(query: PaginationQueryDto) {
    return this.repo.findAll(query);
  }

  async findOne(id: number) {
    const group = await this.repo.findById(id);
    if (!group) {
      throw new NotFoundException(`VendorRateGroup ${id} no encontrado`);
    }
    return group;
  }

  async update(id: number, dto: UpdateVendorRateGroupDto) {
    const current = await this.findOne(id);

    const validFrom = dto.validFrom ? new Date(dto.validFrom) : current.validFrom;
    const validTo = dto.validTo ? new Date(dto.validTo) : current.validTo;
    if (validFrom > validTo) {
      throw new BadRequestException('validFrom no puede ser mayor que validTo');
    }

    await this.repo.updateGroup(id, {
      ...(dto.vendorId != null ? { vendor: { connect: { id: dto.vendorId } } } : {}),
      ...(dto.name != null ? { name: dto.name } : {}),
      ...(dto.modality != null ? { modality: dto.modality } : {}),
      ...(dto.seasonId != null
        ? { season: { connect: { id: dto.seasonId } } }
        : {}),
      ...(dto.validFrom != null ? { validFrom: new Date(dto.validFrom) } : {}),
      ...(dto.validTo != null ? { validTo: new Date(dto.validTo) } : {}),
      ...(dto.currency != null ? { currency: dto.currency } : {}),
      ...(dto.isActive != null ? { isActive: dto.isActive } : {}),
      ...(dto.notes != null ? { notes: dto.notes } : {}),
    });

    if (dto.provinceLocationIds) {
      await this.repo.replaceProvinces(id, dto.provinceLocationIds);
    }

    if (dto.overrides) {
      for (const ov of dto.overrides) {
        const from = new Date(ov.overrideFrom);
        const to = new Date(ov.overrideTo);
        if (from < validFrom || to > validTo) {
          throw new BadRequestException(
            'Los overrides deben estar dentro de la vigencia del grupo',
          );
        }
      }
      await this.repo.replaceOverrides(
        id,
        dto.overrides.map((o) => ({
          replacementGroupId: o.replacementGroupId,
          overrideFrom: new Date(o.overrideFrom),
          overrideTo: new Date(o.overrideTo),
          notes: o.notes,
        })),
      );
    }

    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.repo.softDelete(id);
  }
}
