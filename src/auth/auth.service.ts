import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from 'src/users/users.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { ChangePasswordDto } from 'src/users/dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgotPassword.dto';
import { ResetPasswordDto } from './dto/resetPassword.dto';
import { OtpRepository } from './repository/otp.repository';
import { MailService } from 'src/common/mailer/mailer.service';
import { decrypt, encrypt, sanitizeUser } from 'src/common/utils/utils';
import { randomUUID } from 'crypto';
import { UserRepository } from '../users/repository/user-repository/user-repository';
import { ConfigService } from '@nestjs/config';
import { UserResponseDto } from 'src/users/dto/response/user-response.dto';
import { ProfileUserResponseDto } from 'src/users/dto/response/update-user-response.dto';
import { plainToInstance } from 'class-transformer';
import { transformOne } from 'src/common/helpers/response-response';
import { LoginResponseDto } from './dto/response/loginResponse.dto';
import { Roles } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly _verificationUrl: string;
  private readonly _urlBase: string;

  constructor(
    private readonly usersService: UserService,
    private readonly jwtService: JwtService,
    private readonly otpRepository: OtpRepository,
    private readonly mailer: MailService,
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
  ) {
    this._verificationUrl = this.configService.get<string>('EMAIL_VERIFICATION_URL', '/auth/verify-email');
    this._urlBase = this.configService.get<string>('HOST_URL', 'http://localhost:3000');
  }

  async register(dto: RegisterUserDto) {
    const { name, email, password, phone, imagen, role, lastName, middleName, deviceToken } = dto;

    const user = await this.usersService.findOneByEmail(email);
    if (user) {
      if (!user.isVerified) {
        await this.sendVerificationEmail(user.user_id, email);
        throw new ForbiddenException(
          'User already exists but your account is not verified. Please check your email for the verification link.',
        );
      }
      throw new BadRequestException('User already exists with this email.');
    }

    const userCreate = await this.usersService.createProfile(
      {
        name,
        email,
        password: await bcrypt.hash(password, 10),
        phone,
        imagen,
        role: role ?? Roles.CUSTOMER,
        lastName,
        middleName,
        deviceToken,
      },
      undefined,
    );

    if (!userCreate) {
      throw new BadRequestException('User not created');
    }
    await this.sendVerificationEmail(userCreate.user_id, email);

    return {
      mensage: 'User created successfully, please verify your email.',
      name,
      email,
    };
  }

  async login({ email, password, app_type }: LoginDto) {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Email is wrong');
    }
    if (!user.isVerified) {
      await this.sendVerificationEmail(user.user_id, email);
      throw new ForbiddenException(
        'Your account is not verified. Please check your email for the verification link.',
      );
    }
    if ((app_type === 'owner' && user.role !== Roles.OWNER) || (app_type === 'customer' && user.role !== Roles.CUSTOMER)) {
      throw new UnauthorizedException('Access denied for this app type');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Password is wrong');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await this.otpRepository.deletOtp(email);
    await this.otpRepository.OtpCreate(email, code);

    await this.mailer.sendOtp(email, code, 1);

    return {
      message: 'OTP sent via Email. Please verify to continue.',
      requiresOtp: true,
    };
  }

  async verifyOtp(email: string, code: string): Promise<LoginResponseDto> {
    const otpRecord = await this.otpRepository.findFirstOTP(email, code);
    if (!otpRecord) {
      throw new UnauthorizedException('Invalid or expired code');
    }

    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user) {
      throw new UnauthorizedException('email is wrong');
    }
    if (!user.isVerified) {
      await this.sendVerificationEmail(user.user_id, email);
      throw new ForbiddenException(
        'Your account is not verified. Please check your email for the verification link.',
      );
    }

    const payload = {
      email: user.email,
      role: user.role,
      id: user.user_id,
      isVerified: user.isVerified,
      referralBusinessId: user.referralBusinessId ?? null,
    };
    const token = await this.jwtService.signAsync(payload);
    await this.otpRepository.deletOtp(email);

    return {
      token,
      email,
      isVerified: user.isVerified,
      userId: user.user_id,
      referralBusinessId: user.referralBusinessId ?? null,
    };
  }

  async getProfile({ email }: { email: string; role: string }): Promise<ProfileUserResponseDto> {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true });
    return {
      success: true,
      message: 'User profile retrieved successfully',
      data: transformOne(UserResponseDto, user),
      membership: undefined,
    };
  }

  async changePassword(userAct: UserActiveInterface, dto: ChangePasswordDto) {
    return await this.usersService.changePassword(userAct, dto);
  }

  async sendPasswordResetCode(dto: ForgotPasswordDto) {
    const { phone, email } = dto;
    if (!email && !phone) {
      throw new BadRequestException('You must provide an email or phone number.');
    }
    const user = await this.usersService.findUsserbyEmaiAndPhone(email, phone);
    if (!user) {
      throw new NotFoundException('User not found with that email or phone number.');
    }
    if (!user.email) {
      throw new BadRequestException('The user does not have a registered email. Cannot send recovery code.');
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.otpRepository.deletOtp(user.email);
    await this.otpRepository.OtpCreate(user.email, otp);
    return await this.mailer.sendOtp(user.email, otp, 0);
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { code, newPassword, email, phone } = resetPasswordDto;
    const user = await this.usersService.findUsserbyEmaiAndPhone(email, phone);
    if (!user || !user.email) {
      throw new NotFoundException('USER NOT FOUND');
    }
    const OTP = await this.otpRepository.findFirstOTP(user.email, code);
    if (!OTP) {
      throw new BadRequestException('Invalid or expired code');
    }
    const data = await this.usersService.ejecChangPassword(newPassword, user.user_id);
    await this.otpRepository.deletOtp(user.email);
    return {
      message: 'The password has been changed successfully',
      success: true,
      data: sanitizeUser(data),
    };
  }

  async sendVerificationEmail(userId: number, email: string) {
    const token = randomUUID();
    const encryptedToken = encrypt(token);
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.userRepository.crateTokenEmail(userId, token, expiry);
    const link = this.generateVerificationLink(encryptedToken);
    await this.mailer.sendVerificationLink(link, email);
    return { message: 'Verification email sent successfully.', success: true };
  }

  generateVerificationLink(token: string): string {
    return `${this._urlBase}${this._verificationUrl}?token=${encodeURIComponent(token)}`;
  }

  async verifyEmail(encryptedToken: string) {
    try {
      const verifyToken = decrypt(decodeURIComponent(encryptedToken));
      if (!verifyToken) {
        throw new BadRequestException('Token is required');
      }
      const user = await this.userRepository.findFirstByVerificationToken(verifyToken);
      if (!user) {
        throw new BadRequestException('Invalid or expired token');
      }
      if (user.isVerified) {
        throw new BadRequestException('Email is already verified');
      }
      if (new Date() > (user.verificationTokenExpiry ?? new Date(0))) {
        throw new BadRequestException('Verification token expired.');
      }
      await this.userRepository.markAsVerified(user.user_id);
      await this.mailer.confirmVerificationEmailUser(user.email, user.name, true);
      return { message: 'Email verified successfully', success: true };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Invalid or corrupted verification token.');
    }
  }
}
