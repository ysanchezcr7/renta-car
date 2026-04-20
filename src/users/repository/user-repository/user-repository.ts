import { Injectable } from '@nestjs/common';
import { ForgotPasswordDto } from 'src/auth/dto/forgotPassword.dto';
import { RegisterUserDto } from 'src/auth/dto/register-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';
import { Role } from '@prisma/client';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { getPagination } from 'src/common/utils/pagination';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createProfile(
    email: string,
    password: string,
    firstName: string,
    phone: string,
    image: string,
    role: Role,
    lastName: string,
    deviceToken: string,
    agencyId?: number,
    middleName?: string,
  ) {
    return await this.prisma.user.create({
      data: {
        email,
        password,
        firstName,
        phone: phone || null,
        image: image || null,
        role,
        lastName,
        deviceToken: deviceToken || null,
        agencyId: agencyId || null,
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
        id: true,
        firstName: true,
        email: true,
        password: true,
        role: true,
        isVerified: true,
        agencyId: true,
        phone: true,
      },
    });
  }

  async findAll(query: PaginationQueryDto, agencyId?: number) {
    const { skip, limit } = getPagination(query);
    const where = {
      deletedAt: null,
      ...(agencyId ? { agencyId } : {}),
      ...(query.search
        ? {
            OR: [
              { email: { contains: query.search, mode: 'insensitive' as const } },
              { firstName: { contains: query.search, mode: 'insensitive' as const } },
              { lastName: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({ where, skip, take: limit, orderBy: { id: 'desc' } }),
      this.prisma.user.count({ where }),
    ]);
    return { items, total };
  }

  async findOne(user_id: number) {
    return await this.prisma.user.findUnique({
      where: { id: user_id },
    });
  }

  async update(user_id: number, updateUserDto: UpdateUserDto) {
    return await this.prisma.user.update({
      where: { id: user_id },
      data: { ...updateUserDto },
    });
  }

  async ejecChangPassword(newPassword: string, user_id: number) {
    return await this.prisma.user.update({
      where: { id: user_id },
      data: { password: newPassword },
    });
  }

  async softDelete(userId: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isVerified: false,
        deletedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        isVerified: true,
        deletedAt: true,
      },
    });
  }

  async findFirst(email?: string, phone?: string) {
    const where: { email?: string; phone?: string; isVerified: boolean } = {
      isVerified: true,
    };
    if (email) where.email = email;
    if (phone) where.phone = phone;
    return await this.prisma.user.findFirst({ where });
  }

  async findUserUnique(user_id: number) {
    return await this.prisma.user.findUnique({
      where: { id: user_id },
    });
  }

  async getAllStaffUsers() {
    return await this.prisma.user.findMany({
      where: { role: Role.AGENCY },
    });
  }

  async crateTokenEmail(userId: number, token: string, expiry: Date) {
    await this.prisma.user.update({
      where: { id: userId },
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
      where: { id: userId },
      data: {
        isVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      },
    });
  }

  async getDeviceToken(userId: number) {
    return await this.prisma.user.findUnique({
      where: { id: userId },
      select: { deviceToken: true },
    });
  }
}
