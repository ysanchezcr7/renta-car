import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AgencyApprovalStatus, Prisma, Role } from '@prisma/client';
import type { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { MailService } from 'src/common/mailer/mailer.service';
import { AgenciesRepository } from './agencies.repository';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { UpdateAgencyDto } from './dto/update-agency.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AgenciesService {
  constructor(
    private readonly repo: AgenciesRepository,
    private readonly prisma: PrismaService,
    private readonly mailer: MailService,
  ) {}

  private buildCreateData(
    dto: CreateAgencyDto,
    isAdmin: boolean,
  ): Prisma.AgencyUncheckedCreateInput {
    const trade = dto.tradeName.trim();
    return {
      name: trade,
      legalName: dto.legalName.trim(),
      tradeName: trade,
      logoUrl: dto.logoUrl?.trim() || null,
      responsibleFullName: dto.responsibleFullName.trim(),
      contactEmail: dto.contactEmail.trim().toLowerCase(),
      phone: dto.phone.trim(),
      addressLine1: dto.addressLine1?.trim() || null,
      addressLine2: dto.addressLine2?.trim() || null,
      city: dto.city?.trim() || null,
      stateRegion: dto.stateRegion?.trim() || null,
      stateCode: dto.stateCode?.trim() || null,
      country: dto.country?.trim() || null,
      postalCode: dto.postalCode?.trim() || null,
      billingAddress: dto.billingAddress.trim(),
      sellerOfTravelDocumentUrl:
        dto.sellerOfTravelDocumentUrl?.trim() || null,
      taxIdType: dto.taxIdType.trim(),
      taxId: dto.taxId.trim(),
      isAdmin,
    };
  }

  /**
   * Alta de agencia con contraseña (registro público vía Auth).
   * No crea fila en `User`: el actor es la propia agencia.
   */
  async createAgencyAccount(dto: CreateAgencyDto, passwordHash: string) {
    return this.repo.create({
      ...this.buildCreateData(dto, false),
      password: passwordHash,
      isVerified: false,
      approvalStatus: AgencyApprovalStatus.PENDING_REVIEW,
    });
  }

  async create(dto: CreateAgencyDto, user: UserActiveInterface) {
    if (user.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('No autorizado.');
    }

    return this.repo.create({
      ...this.buildCreateData(dto, dto.isAdmin ?? false),
      approvalStatus: AgencyApprovalStatus.APPROVED,
      isVerified: true,
    });
  }

  findAll(query: PaginationQueryDto) {
    return this.repo.findAll(query);
  }

  async findMine(user: UserActiveInterface) {
    if (user.role !== Role.AGENCY || !user.agencyId) {
      throw new NotFoundException('No tienes una agencia asociada.');
    }
    const agency = await this.repo.findById(user.agencyId);
    if (!agency) {
      throw new NotFoundException('Agencia no encontrada.');
    }
    return agency;
  }

  async findOne(id: number, user: UserActiveInterface) {
    this.assertAgencyScope(id, user);
    const agency = await this.repo.findById(id);
    if (!agency) {
      throw new NotFoundException('Agencia no encontrada.');
    }
    return agency;
  }

  async update(id: number, dto: UpdateAgencyDto, user: UserActiveInterface) {
    this.assertAgencyScope(id, user);
    const prev = await this.repo.findById(id);
    if (!prev) {
      throw new NotFoundException('Agencia no encontrada.');
    }

    let input = this.toUpdateInput(dto);
    if (user.role === Role.AGENCY) {
      input = this.stripPrivilegedAgencyFields(input);
    }

    if (user.role === Role.SUPER_ADMIN && dto.approvalStatus != null) {
      if (dto.approvalStatus === AgencyApprovalStatus.APPROVED) {
        input = { ...input, isVerified: true };
      }
      if (
        dto.approvalStatus === AgencyApprovalStatus.REJECTED &&
        dto.rejectionReason !== undefined
      ) {
        input = {
          ...input,
          rejectionReason: dto.rejectionReason?.trim() || null,
        };
      }
    }

    const updated = await this.repo.update(id, input);

    if (
      user.role === Role.SUPER_ADMIN &&
      dto.approvalStatus != null &&
      prev.approvalStatus !== updated.approvalStatus
    ) {
      const label = updated.tradeName ?? updated.name;
      const email = updated.contactEmail;
      if (email) {
        if (updated.approvalStatus === AgencyApprovalStatus.APPROVED) {
          await this.mailer.sendAgencyApproved(email, label);
        }
        if (updated.approvalStatus === AgencyApprovalStatus.REJECTED) {
          await this.mailer.sendAgencyRejected(
            email,
            label,
            updated.rejectionReason,
          );
        }
      }
    }

    return updated;
  }

  async remove(id: number, user: UserActiveInterface) {
    this.assertAgencyScope(id, user);
    return this.repo.update(id, { isActive: false });
  }

  private assertAgencyScope(agencyId: number, user: UserActiveInterface) {
    if (user.role === Role.SUPER_ADMIN) return;
    if (user.role === Role.AGENCY) {
      if (!user.agencyId || user.agencyId !== agencyId) {
        throw new ForbiddenException('No puedes acceder a esta agencia.');
      }
      return;
    }
    throw new ForbiddenException('No autorizado.');
  }

  /** AGENCY no puede marcar agencia interna ni gestionar flags de sistema. */
  private stripPrivilegedAgencyFields(
    data: Prisma.AgencyUpdateInput,
  ): Prisma.AgencyUpdateInput {
    const copy = { ...data };
    delete copy.isAdmin;
    delete copy.approvalStatus;
    delete copy.rejectionReason;
    delete copy.isVerified;
    return copy;
  }

  private toUpdateInput(dto: UpdateAgencyDto): Prisma.AgencyUpdateInput {
    const data: Prisma.AgencyUpdateInput = {};
    if (dto.logoUrl !== undefined) data.logoUrl = dto.logoUrl?.trim() || null;
    if (dto.legalName !== undefined) data.legalName = dto.legalName?.trim();
    if (dto.tradeName !== undefined) {
      const t = dto.tradeName.trim();
      data.tradeName = t;
      data.name = t;
    }
    if (dto.responsibleFullName !== undefined) {
      data.responsibleFullName = dto.responsibleFullName.trim();
    }
    if (dto.contactEmail !== undefined) {
      data.contactEmail = dto.contactEmail.trim().toLowerCase();
    }
    if (dto.phone !== undefined) data.phone = dto.phone.trim();
    if (dto.addressLine1 !== undefined) {
      data.addressLine1 = dto.addressLine1?.trim() || null;
    }
    if (dto.addressLine2 !== undefined) {
      data.addressLine2 = dto.addressLine2?.trim() || null;
    }
    if (dto.city !== undefined) data.city = dto.city?.trim() || null;
    if (dto.stateRegion !== undefined) {
      data.stateRegion = dto.stateRegion?.trim() || null;
    }
    if (dto.stateCode !== undefined) {
      data.stateCode = dto.stateCode?.trim() || null;
    }
    if (dto.country !== undefined) data.country = dto.country?.trim() || null;
    if (dto.postalCode !== undefined) {
      data.postalCode = dto.postalCode?.trim() || null;
    }
    if (dto.billingAddress !== undefined) {
      data.billingAddress = dto.billingAddress.trim();
    }
    if (dto.sellerOfTravelDocumentUrl !== undefined) {
      data.sellerOfTravelDocumentUrl =
        dto.sellerOfTravelDocumentUrl?.trim() || null;
    }
    if (dto.taxIdType !== undefined) data.taxIdType = dto.taxIdType.trim();
    if (dto.taxId !== undefined) data.taxId = dto.taxId.trim();
    if (dto.isAdmin !== undefined) data.isAdmin = dto.isAdmin;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.approvalStatus !== undefined) {
      data.approvalStatus = dto.approvalStatus;
    }
    if (dto.rejectionReason !== undefined) {
      data.rejectionReason = dto.rejectionReason?.trim() || null;
    }
    return data;
  }
}
