import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * Guard opcional para rutas que requieren OWNER.
 * En el template no hay modelo OwnerMembership; extiende el schema y este guard cuando lo necesites.
 */
@Injectable()
export class OwnerMembershipGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user || user.role !== 'OWNER') {
      throw new ForbiddenException(
        'Access denied. Only owners can perform this action.',
      );
    }
    return true;
  }
}
