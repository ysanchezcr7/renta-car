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
import { Role } from 'src/common/enums/rol.enum';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { UserRepository } from './repository/user-repository/user-repository';
import { sanitizeUser } from 'src/common/utils/utils';
import { UpdateUserResponseDto } from './dto/response/update-user-response.dto';

@Injectable()
export class UserService {
  constructor(private readonly userRepo: UserRepository) {}

  async createProfile(registerDto: RegisterUserDto, referralBusinessId?: number) {
    const { email, password, name, phone, imagen, role, lastName, deviceToken, middleName } = registerDto;
    return await this.userRepo.createProfile(
      email,
      password,
      name,
      phone ?? '',
      imagen ?? '',
      role,
      lastName,
      deviceToken ?? '',
      referralBusinessId,
      middleName,
    );
  }

  async findAll(userActiv: UserActiveInterface) {
    if (userActiv.role !== Role.OWNER) {
      throw new ForbiddenException('No tienes permisos para acceder a esta información');
    }
    const users = await this.userRepo.findAll();
    return users.map(({ password, ...rest }) => rest);
  }

  async findOneByEmail(email: string) {
    return await this.userRepo.findOneByEmail(email);
  }

  async findByEmailWithPassword(email: string) {
    return await this.userRepo.findByEmailWithPassword(email);
  }

  async findOne(id: number) {
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
    if (id !== userAct.id) {
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
    const user = await this.findOne(id);
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

  async getRoles() {
    return Object.values(Role).map((role) => ({
      label: role.charAt(0) + role.slice(1).toLowerCase(),
      value: role,
    }));
  }

  async findUsserbyEmaiAndPhone(email?: string, phone?: string) {
    return await this.userRepo.findFirst(email, phone);
  }
}
