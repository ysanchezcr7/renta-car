import { Injectable } from '@nestjs/common';
import { EmailEventType, Prisma } from '@prisma/client';
import type { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { resolveAgencyFilterForRead } from 'src/common/utils/agency-scope';
import { getPagination } from 'src/common/utils/pagination';
import { successResponse } from 'src/common/helpers/response-response';
import { QueryEmailLogsDto } from './dto/query-email-logs.dto';
import { EmailLogsRepository } from './email-logs.repository';

export type RecordEmailLogInput = {
  agencyId: number;
  entityType?: string | null;
  entityId?: number | null;
  emailType?: string | null;
  eventType: EmailEventType;
  recipientEmail?: string | null;
  subject?: string | null;
  payload?: Prisma.InputJsonValue;
  status: string;
  sentAt?: Date | null;
  notes?: string | null;
  quoteId?: number | null;
  reservationId?: number | null;
  error?: string | null;
};

@Injectable()
export class EmailLogsService {
  constructor(private readonly repo: EmailLogsRepository) {}

  async record(input: RecordEmailLogInput) {
    return this.repo.create({
      agencyId: input.agencyId,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      emailType: input.emailType ?? null,
      quoteId: input.quoteId ?? null,
      reservationId: input.reservationId ?? null,
      eventType: input.eventType,
      toEmail: input.recipientEmail ?? null,
      subject: input.subject ?? null,
      payload: input.payload ?? undefined,
      status: input.status,
      error: input.error ?? null,
      sentAt: input.sentAt ?? null,
      notes: input.notes ?? null,
    });
  }

  async findAll(user: UserActiveInterface, query: QueryEmailLogsDto) {
    const scope = resolveAgencyFilterForRead(user, query.agencyId);
    const { skip, page, limit } = getPagination(query);

    const where: Prisma.EmailLogWhereInput = {
      ...(scope.agencyId != null ? { agencyId: scope.agencyId } : {}),
      ...(query.entityType != null ? { entityType: query.entityType } : {}),
      ...(query.entityId != null ? { entityId: query.entityId } : {}),
      ...(query.emailType != null ? { emailType: query.emailType } : {}),
      ...(query.status != null ? { status: query.status } : {}),
      ...(query.eventType != null
        ? { eventType: query.eventType as EmailEventType }
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
      emailType: row.emailType ?? row.eventType,
      emailEventType: row.eventType,
      recipientEmail: row.toEmail,
      sentAt: row.sentAt,
      status: row.status,
      notes: row.notes,
      quoteId: row.quoteId,
      reservationId: row.reservationId,
      subject: row.subject,
      error: row.error,
      createdAt: row.createdAt,
    }));

    return successResponse('Registros de correo.', {
      items,
      meta: { total, page, limit },
    });
  }
}
