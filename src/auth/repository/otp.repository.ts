import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class OtpRepository {
  constructor(private readonly prisma: PrismaService) {}

  async deletOtp(email: string) {
    return await this.prisma.otp.deleteMany({ where: { email } });
  }

  async OtpCreate(email: string, otp: string) {
    return await this.prisma.otp.create({
      data: {
        email,
        token: otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutos
      },
    });
  }
  async findFirstOTP(email: string, otp: string) {
    return await this.prisma.otp.findFirst({
      where: {
        email,
        token: otp,
        expiresAt: { gt: new Date() },
      },
    });
  }
}
