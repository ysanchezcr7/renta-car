import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { UserActiveInterface } from '../interfaces/user-active.interface';

export function getAgencyScope(user: UserActiveInterface): { agencyId?: number } {
  if (user.role === Role.SUPER_ADMIN) return {};
  if (user.role !== Role.AGENCY || !user.agencyId) {
    throw new ForbiddenException('Agency scope is required for this action');
  }
  return { agencyId: user.agencyId };
}

/**
 * Listados y métricas: SUPER_ADMIN ve todo o filtra por `queryAgencyId`;
 * AGENCY solo su agencia (ignora o rechaza otro agencyId en query).
 */
export function resolveAgencyFilterForRead(
  user: UserActiveInterface,
  queryAgencyId?: number,
): { agencyId?: number } {
  if (user.role === Role.SUPER_ADMIN) {
    if (queryAgencyId != null) return { agencyId: queryAgencyId };
    return {};
  }
  if (user.role === Role.AGENCY) {
    if (!user.agencyId) {
      throw new ForbiddenException('Agency scope is required for this action');
    }
    if (queryAgencyId != null && queryAgencyId !== user.agencyId) {
      throw new ForbiddenException('No puede consultar otra agencia.');
    }
    return { agencyId: user.agencyId };
  }
  throw new ForbiddenException('Rol no autorizado para esta operación.');
}

