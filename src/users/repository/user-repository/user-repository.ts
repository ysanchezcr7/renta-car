import { Injectable } from '@nestjs/common';
import { ForgotPasswordDto } from 'src/auth/dto/forgotPassword.dto';
import { RegisterUserDto } from 'src/auth/dto/register-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';
import { Roles } from '@prisma/client';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createProfile(
    email: string,
    password: string,
    name: string,
    phone: string,
    image: string,
    role: Roles,
    lastName: string,
    deviceToken: string,
    referralBusinessId?: number,
    middleName?: string,
  ) {
    return await this.prisma.user.create({
      data: {
        email,
        password,
        name,
        phone: phone || null,
        image: image || null,
        role,
        lastName,
        deviceToken: deviceToken || null,
        referralBusinessId: referralBusinessId || null,
        middleName: middleName || null,
      },
    });
  }

  async findOneByEmail(email: string) {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByEmailWithPassword(email: string) {
    return await this.prisma.user.findUnique({
      where: { email },
      select: {
        user_id: true,
        name: true,
        email: true,
        password: true,
        role: true,
        isVerified: true,
        referralBusinessId: true,
        phone: true,
      },
    });
  }

  async findAll() {
    return await this.prisma.user.findMany({
      where: { deletedAt: null },
    });
  }

  async findOne(user_id: number) {
    return await this.prisma.user.findUnique({
      where: { user_id, isVerified: true },
    });
  }

  async update(user_id: number, updateUserDto: UpdateUserDto) {
    return await this.prisma.user.update({
      where: { user_id },
      data: { ...updateUserDto },
    });
  }

  async ejecChangPassword(newPassword: string, user_id: number) {
    return await this.prisma.user.update({
      where: { user_id },
      data: { password: newPassword },
    });
  }

  async softDelete(userId: number) {
    return this.prisma.user.update({
      where: { user_id: userId },
      data: {
        isVerified: false,
        deletedAt: new Date(),
      },
      select: {
        user_id: true,
        email: true,
        isVerified: true,
        deletedAt: true,
      },
    });
  }

  async findFirst(email?: string, phone?: string) {
    const where: { email?: string; phone?: string; isVerified: boolean } = { isVerified: true };
    if (email) where.email = email;
    if (phone) where.phone = phone;
    return await this.prisma.user.findFirst({ where });
  }

  async findUserUnique(user_id: number) {
    return await this.prisma.user.findUnique({
      where: { user_id, isVerified: true },
    });
  }

  async getAllStaffUsers() {
    return await this.prisma.user.findMany({
      where: { role: Roles.CUSTOMER },
    });
  }

  async crateTokenEmail(userId: number, token: string, expiry: Date) {
    await this.prisma.user.update({
      where: { user_id: userId },
      data: {
        verificationToken: token,
        verificationTokenExpiry: expiry,
      },
    });
  }

  async findFirstByVerificationToken(token: string) {
    return await this.prisma.user.findFirst({
      where: {
        verificationToken: token,
        verificationTokenExpiry: { gt: new Date() },
      },
    });
  }

  async markAsVerified(userId: number) {
    return await this.prisma.user.update({
      where: { user_id: userId },
      data: {
        isVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      },
    });
  }

  async getDeviceToken(userId: number) {
    return await this.prisma.user.findUnique({
      where: { user_id: userId },
      select: { deviceToken: true },
    });
  }
}
