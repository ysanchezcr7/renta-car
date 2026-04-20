import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '@prisma/client';

//import { Role } from '../../common/enums/rol.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    //se obtienen el decorador rol que se creo en roles.decorators, <Role> se valida que sea igual a los Role de enums
    //const requiredRoles = this.reflector.getAllAndOverride<Roles>(ROLES_KEY, [context.getHandler(), context.getClass()]);
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    //console.log(requiredRoles);

    if (!requiredRoles) {
      return true;
      //throw new BadRequestException('Unauthorized');
    }

    //se obtiene el rol en el payLoad del token a travez del request
    const { user } = context.switchToHttp().getRequest();
    //console.log(user.role);
    //comparamos el rol permitido con el del toquen para ver si son iguales
    //return user.role === requiredRoles;
    return requiredRoles.includes(user.role);
  }
}
