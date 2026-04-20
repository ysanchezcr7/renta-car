import { BadRequestException, Injectable } from '@nestjs/common';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import {
  CreateVendorRateDto,
  VendorRateInsuranceDto,
} from './dto/create-vendor-rate.dto';
import { UpdateVendorRateDto } from './dto/update-vendor-rate.dto';
import { VendorRatesRepository } from './vendor-rates.repository';

@Injectable()
export class VendorRatesService {
  constructor(private readonly repo: VendorRatesRepository) {}

  async create(dto: CreateVendorRateDto) {
    this.validateDayRange(dto.minDays, dto.maxDays);

    const { insurances, ...rateData } = dto;

    const created = await this.repo.create({
      ...rateData,
      validFrom: rateData.validFrom ? new Date(rateData.validFrom) : null,
      validTo: rateData.validTo ? new Date(rateData.validTo) : null,
    });

    if (insurances?.length) {
      await this.repo.replaceInsurances(created.id, insurances);
    }

    return this.repo.findByIdWithRelations(created.id);
  }

  findAll(query: PaginationQueryDto) {
    return this.repo.findAll(query);
  }

  findOne(id: number) {
    return this.repo.findByIdWithRelations(id);
  }

  async update(id: number, dto: UpdateVendorRateDto) {
    this.validateDayRange(dto.minDays, dto.maxDays);

    const { insurances, ...rateData } = dto;

    await this.repo.update(id, {
      ...rateData,
      ...(rateData.validFrom
        ? { validFrom: new Date(rateData.validFrom) }
        : {}),
      ...(rateData.validTo ? { validTo: new Date(rateData.validTo) } : {}),
    });

    if (insurances) {
      await this.repo.replaceInsurances(id, insurances);
    }

    return this.repo.findByIdWithRelations(id);
  }

  remove(id: number) {
    return this.repo.update(id, { isActive: false });
  }

  private validateDayRange(minDays?: number | null, maxDays?: number | null) {
    if (
      minDays != null &&
      maxDays != null &&
      minDays > maxDays
    ) {
      throw new BadRequestException('minDays no puede ser mayor que maxDays');
    }
  }
}
