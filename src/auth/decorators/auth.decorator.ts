import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../guard/auth.guard';
import { RolesGuard } from '../guard/roles.guard';
//import { Roles } from './roles.decorator';

import { RolesDecorator } from '../decorators/roles.decorator';
import { Role } from '@prisma/client';

//decorator donde aplicamos varios decoradores juntos
/*export function Auth(role: Role) {
	return applyDecorators(Roles(role), UseGuards(AuthGuard, RolesGuard));
}*/
export function Auth(...roles: Role[]) {
  return applyDecorators(
    RolesDecorator(...roles),
    UseGuards(AuthGuard, RolesGuard),
  );
}
