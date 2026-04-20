import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { resolveAgencyFilterForRead } from 'src/common/utils/agency-scope';
import { getPagination } from 'src/common/utils/pagination';
import { successResponse } from 'src/common/helpers/response-response';
import { QueryStatusHistoryDto } from './dto/query-status-history.dto';
import { StatusHistoryRepository } from './status-history.repository';

export type RecordStatusHistoryInput = {
  agencyId: number;
  entityType?: string | null;
  entityId?: number | null;
  statusCode: string;
  fromStatus?: string | null;
  quoteId?: number | null;
  reservationId?: number | null;
  changedByUserId?: number | null;
  changedAt?: Date;
  notes?: string | null;
  reason?: string | null;
  metadata?: Prisma.InputJsonValue;
  adminApproved?: boolean;
  adminApprovedByUserId?: number | null;
  adminApprovedAt?: Date | null;
};

@Injectable()
export class StatusHistoryService {
  constructor(private readonly repo: StatusHistoryRepository) {}

  async record(input: RecordStatusHistoryInput) {
    const changedAt = input.changedAt ?? new Date();
    return this.repo.create({
      agencyId: input.agencyId,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      statusCode: input.statusCode,
      quoteId: input.quoteId ?? null,
      reservationId: input.reservationId ?? null,
      fromStatus: input.fromStatus ?? null,
      toStatus: input.statusCode,
      reason: input.reason ?? null,
      metadata: input.metadata ?? undefined,
      notes: input.notes ?? null,
      createdByUserId: input.changedByUserId ?? null,
      createdAt: changedAt,
      changedAt,
      adminApproved: input.adminApproved ?? false,
      adminApprovedByUserId: input.adminApprovedByUserId ?? null,
      adminApprovedAt: input.adminApprovedAt ?? null,
    });
  }

  async findAll(user: UserActiveInterface, query: QueryStatusHistoryDto) {
    const scope = resolveAgencyFilterForRead(user, query.agencyId);
    const { skip, page, limit } = getPagination(query);

    const where: Prisma.StatusHistoryWhereInput = {
      ...(scope.agencyId != null ? { agencyId: scope.agencyId } : {}),
      ...(query.entityType != null ? { entityType: query.entityType } : {}),
      ...(query.entityId != null ? { entityId: query.entityId } : {}),
      ...(query.quoteId != null ? { quoteId: query.quoteId } : {}),
      ...(query.reservationId != null ? { reservationId: query.reservationId } : {}),
      ...(query.statusCode != null
        ? {
            OR: [
              { statusCode: query.statusCode },
              { toStatus: query.statusCode },
            ],
          }
        : {}),
    };

    const [rows, total] = await this.repo.findManyPaginated({
      where,
      skip,
      take: limit,
    });

    const items = rows.map((row) => ({
      id: row.id,
      agencyId: row.agencyId,
      entityType: row.entityType,
      entityId: row.entityId,
      statusCode: row.statusCode ?? row.toStatus,
      changedBy: row.createdByUserId,
      changedByUser: row.createdBy,
      changedAt: row.changedAt,
      adminApproved: row.adminApproved,
      adminApprovedBy: row.adminApprovedByUserId,
      adminApprovedByUser: row.adminApprovedBy,
      adminApprovedAt: row.adminApprovedAt,
      notes: row.notes,
      quoteId: row.quoteId,
      reservationId: row.reservationId,
      fromStatus: row.fromStatus,
      toStatus: row.toStatus,
      reason: row.reason,
      metadata: row.metadata,
      createdAt: row.createdAt,
    }));

    return successResponse('Historial de estados.', {
      items,
      meta: { total, page, limit },
    });
  }
}
