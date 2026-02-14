import { SetMetadata } from '@nestjs/common';
import { Role } from 'src/common/enums/rol.enum';
import { Roles } from '@prisma/client'; // Asegúrate que sea tu enum real
//export const ROLES_KEY = 'roles';
//creo el decorador role de tipo metadato y obtiene por parametro el rol a validar segun+
//los roles validos en el enums
//export const Roles = (role: Role) => SetMetadata(ROLES_KEY, role);

export const ROLES_KEY = 'roles';
export const RolesDecorator = (...roles: Roles[]) => SetMetadata(ROLES_KEY, roles);
