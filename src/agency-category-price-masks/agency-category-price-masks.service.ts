import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { BulkUpsertAgencyCategoryPriceMasksDto } from './dto/bulk-upsert-agency-category-price-masks.dto';
import { UpsertAgencyCategoryPriceMaskDto } from './dto/upsert-agency-category-price-mask.dto';
import { AgencyCategoryPriceMasksRepository } from './agency-category-price-masks.repository';

@Injectable()
export class AgencyCategoryPriceMasksService {
  constructor(
    private readonly repo: AgencyCategoryPriceMasksRepository,
    private readonly prisma: PrismaService,
  ) {}

  async listByAgency(agencyId: number) {
    await this.ensureAgencyExists(agencyId);
    return this.repo.findManyByAgency(agencyId);
  }

  async upsert(agencyId: number, dto: UpsertAgencyCategoryPriceMaskDto) {
    await this.ensureAgencyExists(agencyId);
    await this.ensureCategoryExists(dto.categoryId);
    this.assertSingleMaskMode(dto);
    return this.repo.upsert(agencyId, this.toRowData(dto));
  }

  async bulkUpsert(agencyId: number, dto: BulkUpsertAgencyCategoryPriceMasksDto) {
    await this.ensureAgencyExists(agencyId);
    for (const item of dto.items) {
      this.assertSingleMaskMode(item);
      await this.ensureCategoryExists(item.categoryId);
    }
    return this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.agencyCategoryPriceMask.upsert({
          where: {
            agencyId_categoryId: {
              agencyId,
              categoryId: item.categoryId,
            },
          },
          create: {
            agencyId,
            categoryId: item.categoryId,
            ...this.toDecimalFields(item),
          },
          update: this.toDecimalFields(item),
          include: { category: true },
        }),
      ),
    );
  }

  async remove(agencyId: number, categoryId: number) {
    await this.ensureAgencyExists(agencyId);
    try {
      return await this.repo.deleteByAgencyAndCategory(agencyId, categoryId);
    } catch {
      throw new NotFoundException('No hay máscara para esa categoría.');
    }
  }

  private toRowData(dto: UpsertAgencyCategoryPriceMaskDto) {
    return {
      categoryId: dto.categoryId,
      ...this.toDecimalFields(dto),
    };
  }

  private toDecimalFields(dto: UpsertAgencyCategoryPriceMaskDto) {
    return {
      percentageEnabled: dto.percentageEnabled,
      percentageValue: new Prisma.Decimal(dto.percentageValue ?? 0),
      fixedTotalEnabled: dto.fixedTotalEnabled,
      fixedTotalValue: new Prisma.Decimal(dto.fixedTotalValue ?? 0),
      fixedPerDayEnabled: dto.fixedPerDayEnabled,
      fixedPerDayValue: new Prisma.Decimal(dto.fixedPerDayValue ?? 0),
    };
  }

  private assertSingleMaskMode(dto: UpsertAgencyCategoryPriceMaskDto) {
    const n = [
      dto.percentageEnabled,
      dto.fixedTotalEnabled,
      dto.fixedPerDayEnabled,
    ].filter(Boolean).length;
    if (n > 1) {
      throw new BadRequestException(
        'Solo puede estar activa una máscara a la vez (porcentual, fija o fija por día).',
      );
    }
  }

  private async ensureAgencyExists(agencyId: number) {
    const a = await this.prisma.agency.findUnique({ where: { id: agencyId } });
    if (!a) throw new NotFoundException('Agencia no encontrada.');
  }

  private async ensureCategoryExists(categoryId: number) {
    const c = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!c) throw new NotFoundException('Categoría no encontrada.');
  }
}
