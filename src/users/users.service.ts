import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { RegisterUserDto } from 'src/auth/dto/register-user.dto';
import { Role } from '@prisma/client';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { UserRepository } from './repository/user-repository/user-repository';
import { sanitizeUser } from 'src/common/utils/utils';
import { UpdateUserResponseDto } from './dto/response/update-user-response.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

@Injectable()
export class UserService {
  constructor(private readonly userRepo: UserRepository) {}

  async createProfile(registerDto: RegisterUserDto, agencyId?: number) {
    const {
      email,
      password,
      firstName,
      phone,
      imagen,
      role,
      lastName,
      deviceToken,
      middleName,
    } = registerDto;
    return await this.userRepo.createProfile(
      email,
      password,
      firstName,
      phone ?? '',
      imagen ?? '',
      role,
      lastName,
      deviceToken ?? '',
      agencyId,
      middleName,
    );
  }

  async findAll(query: PaginationQueryDto, userActiv: UserActiveInterface) {
    const agencyId =
      userActiv.role === Role.SUPER_ADMIN
        ? undefined
        : (userActiv.agencyId ?? undefined);
    const { items, total } = await this.userRepo.findAll(query, agencyId);
    return {
      items: items.map((user) => sanitizeUser(user)),
      total,
    };
  }

  async findOneByEmail(email: string) {
    return await this.userRepo.findOneByEmail(email);
  }

  async findByEmailWithPassword(email: string) {
    return await this.userRepo.findByEmailWithPassword(email);
  }

  async findOne(id: number, userAct: UserActiveInterface) {
    if (userAct.role === Role.AGENCY && userAct.id !== id) {
      throw new ForbiddenException('No tienes permisos para acceder a este usuario');
    }
    if (userAct.role === Role.CUSTOMER) {
      throw new ForbiddenException('No tienes permisos para acceder a esta información');
    }
    const user = await this.userRepo.findOne(id);
    return user ? sanitizeUser(user) : null;
  }

  async updateProfile(
    id: number,
    updateUserDto: UpdateUserDto,
    userAct: UserActiveInterface,
  ): Promise<UpdateUserResponseDto> {
    const user = await this.userRepo.findUserUnique(id);
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }
    if (userAct.role !== Role.SUPER_ADMIN && id !== userAct.id) {
      throw new ForbiddenException('You are not allowed to update this user.');
    }
    const updatedUser = await this.userRepo.update(id, updateUserDto);
    return {
      message: 'Your profile was updated successfully.',
      success: true,
      data: sanitizeUser(updatedUser) as UpdateUserResponseDto['data'],
    };
  }

  async changePassword(userAct: UserActiveInterface, dto: ChangePasswordDto) {
    const { currentPassword, newPassword } = dto;
    const { id } = userAct;
    if (id == null) {
      throw new BadRequestException(
        'Use el flujo de agencia para cambiar la contraseña de la cuenta de agencia.',
      );
    }
    const user = await this.userRepo.findOne(id);
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('The current password is incorrect.');
    }
    await this.ejecChangPassword(newPassword, id);
    return { message: 'Password updated successfully.' };
  }

  async ejecChangPassword(newPassword: string, id: number) {
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepo.ejecChangPassword(hashedNewPassword, id);
  }

  async remove(user: UserActiveInterface) {
    const { id } = user;
    if (id == null) {
      throw new BadRequestException(
        'Las cuentas de agencia no se eliminan desde el módulo de usuarios.',
      );
    }
    const userToDelete = await this.userRepo.findUserUnique(id);
    if (!userToDelete) {
      throw new NotFoundException('User not found');
    }
    const userDelet = await this.userRepo.softDelete(id);
    return {
      message: 'User successfully deleted.',
      success: true,
      data: sanitizeUser(userDelet),
    };
  }

  async getAllStaffUsers() {
    return await this.userRepo.getAllStaffUsers();
  }

  getRoles() {
    return Object.values(Role).map((role) => ({
      label: role.charAt(0) + role.slice(1).toLowerCase(),
      value: role,
    }));
  }

  async findUsserbyEmaiAndPhone(email?: string, phone?: string) {
    return await this.userRepo.findFirst(email, phone);
  }
}
