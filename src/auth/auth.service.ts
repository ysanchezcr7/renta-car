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
import { RegisterAgencyDto } from './dto/register-agency.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { AgenciesService } from 'src/agencies/agencies.service';
import { AgencyApprovalStatus, Role } from '@prisma/client';

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
    private readonly prisma: PrismaService,
    private readonly agenciesService: AgenciesService,
  ) {
    this._verificationUrl = this.configService.get<string>(
      'EMAIL_VERIFICATION_URL',
      '/auth/verify-email',
    );
    this._urlBase = this.configService.get<string>(
      'HOST_URL',
      'http://localhost:3000',
    );
  }

  /**
   * Registro solo para **clientes** (`User` rol CUSTOMER).
   * Agencias: `POST /auth/register-agency`.
   */
  async register(dto: RegisterUserDto) {
    const {
      firstName,
      email,
      password,
      phone,
      imagen,
      role,
      lastName,
      middleName,
      deviceToken,
    } = dto;

    const effectiveRole = role ?? Role.CUSTOMER;
    if (effectiveRole !== Role.CUSTOMER) {
      throw new BadRequestException(
        'Este registro es solo para clientes. Las agencias usan POST /auth/register-agency.',
      );
    }

    const normalized = email.trim().toLowerCase();
    const user = await this.usersService.findOneByEmail(normalized);
    if (user) {
      if (!user.isVerified) {
        await this.sendVerificationEmail(user.id, normalized);
        throw new ForbiddenException(
          'User already exists but your account is not verified. Please check your email for the verification link.',
        );
      }
      throw new BadRequestException('User already exists with this email.');
    }

    const agencyEmailTaken = await this.prisma.agency.findUnique({
      where: { contactEmail: normalized },
    });
    if (agencyEmailTaken) {
      throw new BadRequestException(
        'Este correo ya está registrado como agencia. Use el flujo de agencia o otro email.',
      );
    }

    const userCreate = await this.usersService.createProfile(
      {
        firstName,
        email: normalized,
        password: await bcrypt.hash(password, 10),
        phone,
        imagen,
        role: Role.CUSTOMER,
        lastName,
        middleName,
        deviceToken,
      },
      undefined,
    );

    if (!userCreate) {
      throw new BadRequestException('User not created');
    }
    await this.sendVerificationEmail(userCreate.id, normalized);

    return {
      mensage: 'User created successfully, please verify your email.',
      firstName,
      email: normalized,
    };
  }

  async registerAgency(dto: RegisterAgencyDto) {
    const normalized = dto.contactEmail.trim().toLowerCase();
    const existingUser = await this.usersService.findOneByEmail(normalized);
    if (existingUser) {
      throw new BadRequestException(
        'Este correo ya está registrado como usuario. Elija otro contactEmail.',
      );
    }
    const existingAgency = await this.prisma.agency.findUnique({
      where: { contactEmail: normalized },
    });
    if (existingAgency) {
      throw new BadRequestException('Ya existe una agencia con este correo de contacto.');
    }

    const { password, ...agencyFields } = dto;
    const hash = await bcrypt.hash(password, 10);
    const agency = await this.agenciesService.createAgencyAccount(
      { ...agencyFields, contactEmail: normalized, isAdmin: false },
      hash,
    );
    const displayName = dto.tradeName?.trim() || agency.name;
    await this.mailer.sendAgencyPendingReview(normalized, displayName);
    return {
      message:
        'Agencia registrada. Le enviamos un correo: su cuenta está en revisión hasta que un administrador valide los datos (antifraude). Luego podrá iniciar sesión con este email y su contraseña.',
      agencyId: agency.id,
      email: normalized,
      approvalStatus: AgencyApprovalStatus.PENDING_REVIEW,
    };
  }

  async login({ email, password }: LoginDto) {
    const normalized = email.trim().toLowerCase();

    const user = await this.usersService.findOneByEmail(normalized);
    if (user) {
      if (user.role === Role.CUSTOMER) {
        throw new UnauthorizedException('Access denied for this role');
      }
      if (user.role === Role.AGENCY) {
        throw new UnauthorizedException(
          'Las cuentas de agencia inician sesión con el correo de la agencia (POST /auth/register-agency).',
        );
      }
      if (!user.isVerified) {
        await this.sendVerificationEmail(user.id, normalized);
        throw new ForbiddenException(
          'Your account is not verified. Please check your email for the verification link.',
        );
      }
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) throw new UnauthorizedException('Password is wrong');
    } else {
      const agency = await this.prisma.agency.findFirst({
        where: {
          contactEmail: normalized,
          isActive: true,
          password: { not: null },
        },
      });
      if (!agency || !agency.password) {
        throw new UnauthorizedException('Email is wrong');
      }
      if (agency.approvalStatus === AgencyApprovalStatus.REJECTED) {
        throw new ForbiddenException({
          code: 'AGENCY_REJECTED',
          message:
            'La solicitud de esta agencia fue rechazada. Si cree que es un error, contacte al soporte.',
        });
      }
      if (agency.approvalStatus !== AgencyApprovalStatus.APPROVED) {
        throw new ForbiddenException({
          code: 'AGENCY_PENDING_REVIEW',
          message:
            'Su cuenta de agencia está en revisión por un administrador. Recibirá un correo cuando sea aprobada y podrá iniciar sesión.',
        });
      }
      if (!agency.isVerified) {
        throw new ForbiddenException({
          code: 'AGENCY_NOT_VERIFIED',
          message:
            'La cuenta aún no está lista para iniciar sesión. Espere la aprobación del administrador.',
        });
      }
      const ok = await bcrypt.compare(password, agency.password);
      if (!ok) throw new UnauthorizedException('Password is wrong');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await this.otpRepository.deletOtp(normalized);
    await this.otpRepository.OtpCreate(normalized, code);
    await this.mailer.sendOtp(normalized, code, 1);

    return {
      message: 'OTP sent via Email. Please verify to continue.',
      requiresOtp: true,
    };
  }

  async verifyOtp(email: string, code: string): Promise<LoginResponseDto> {
    const normalized = email.trim().toLowerCase();
    const otpRecord = await this.otpRepository.findFirstOTP(normalized, code);
    if (!otpRecord) {
      throw new UnauthorizedException('Invalid or expired code');
    }

    const user = await this.usersService.findByEmailWithPassword(normalized);
    if (user) {
      if (user.role === Role.CUSTOMER) {
        throw new UnauthorizedException('Access denied for this role');
      }
      if (user.role === Role.AGENCY) {
        throw new UnauthorizedException('Cuenta de agencia no soportada en User.');
      }
      if (!user.isVerified) {
        await this.sendVerificationEmail(user.id, normalized);
        throw new ForbiddenException(
          'Your account is not verified. Please check your email for the verification link.',
        );
      }
      const payload = {
        email: user.email,
        role: user.role,
        id: user.id,
        isVerified: user.isVerified,
        agencyId: user.agencyId ?? null,
        authSubject: 'user' as const,
      };
      const token = await this.jwtService.signAsync(payload);
      await this.otpRepository.deletOtp(normalized);
      return {
        token,
        email: user.email,
        isVerified: user.isVerified,
        userId: user.id,
        agencyId: user.agencyId ?? null,
      };
    }

    const agency = await this.prisma.agency.findFirst({
      where: { contactEmail: normalized, isActive: true, password: { not: null } },
    });
    if (!agency) {
      throw new UnauthorizedException('email is wrong');
    }
    if (agency.approvalStatus === AgencyApprovalStatus.REJECTED) {
      throw new ForbiddenException({
        code: 'AGENCY_REJECTED',
        message: 'La solicitud de esta agencia fue rechazada.',
      });
    }
    if (agency.approvalStatus !== AgencyApprovalStatus.APPROVED) {
      throw new ForbiddenException({
        code: 'AGENCY_PENDING_REVIEW',
        message:
          'Su cuenta de agencia está en revisión. Debe ser aprobada por un administrador antes de continuar.',
      });
    }
    if (!agency.isVerified) {
      throw new ForbiddenException({
        code: 'AGENCY_NOT_VERIFIED',
        message:
          'La cuenta aún no está lista para iniciar sesión. Espere la aprobación del administrador.',
      });
    }

    const payload = {
      email: agency.contactEmail ?? normalized,
      role: Role.AGENCY,
      id: null,
      isVerified: agency.isVerified,
      agencyId: agency.id,
      authSubject: 'agency' as const,
    };
    const token = await this.jwtService.signAsync(payload);
    await this.otpRepository.deletOtp(normalized);

    return {
      token,
      email: agency.contactEmail ?? normalized,
      isVerified: agency.isVerified,
      userId: null,
      agencyId: agency.id,
    };
  }

  async getProfile(userAct: UserActiveInterface): Promise<ProfileUserResponseDto> {
    if (userAct.authSubject === 'agency' && userAct.agencyId != null) {
      const agency = await this.prisma.agency.findUnique({
        where: { id: userAct.agencyId },
      });
      if (!agency) {
        throw new NotFoundException('Agencia no encontrada');
      }
      const { password, verificationToken, verificationTokenExpiry, ...safe } =
        agency;
      void password;
      void verificationToken;
      void verificationTokenExpiry;
      return {
        success: true,
        message: 'Perfil de agencia',
        data: safe as unknown as ProfileUserResponseDto['data'],
        membership: undefined,
      };
    }

    const user = await this.usersService.findOneByEmail(userAct.email);
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
    if (userAct.authSubject === 'agency' && userAct.agencyId != null) {
      const agency = await this.prisma.agency.findUnique({
        where: { id: userAct.agencyId },
      });
      if (!agency?.password) {
        throw new NotFoundException('Agencia no encontrada.');
      }
      const ok = await bcrypt.compare(dto.currentPassword, agency.password);
      if (!ok) {
        throw new BadRequestException('The current password is incorrect.');
      }
      const hashed = await bcrypt.hash(dto.newPassword, 10);
      await this.prisma.agency.update({
        where: { id: agency.id },
        data: { password: hashed },
      });
      return { message: 'Password updated successfully.' };
    }
    return await this.usersService.changePassword(userAct, dto);
  }

  async sendPasswordResetCode(dto: ForgotPasswordDto) {
    const { phone, email } = dto;
    if (!email && !phone) {
      throw new BadRequestException(
        'You must provide an email or phone number.',
      );
    }
    const normalized = email?.trim().toLowerCase();
    const user = await this.usersService.findUsserbyEmaiAndPhone(
      normalized,
      phone,
    );
    if (user?.email) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await this.otpRepository.deletOtp(user.email);
      await this.otpRepository.OtpCreate(user.email, otp);
      return await this.mailer.sendOtp(user.email, otp, 0);
    }
    if (normalized) {
      const agency = await this.prisma.agency.findFirst({
        where: {
          contactEmail: normalized,
          isActive: true,
          password: { not: null },
        },
      });
      if (!agency?.contactEmail) {
        throw new NotFoundException(
          'User not found with that email or phone number.',
        );
      }
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await this.otpRepository.deletOtp(agency.contactEmail);
      await this.otpRepository.OtpCreate(agency.contactEmail, otp);
      return await this.mailer.sendOtp(agency.contactEmail, otp, 0);
    }
    throw new NotFoundException(
      'User not found with that email or phone number.',
    );
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { code, newPassword, email, phone } = resetPasswordDto;
    const normalized = email?.trim().toLowerCase();
    const user = await this.usersService.findUsserbyEmaiAndPhone(
      normalized,
      phone,
    );
    if (user?.email) {
      const OTP = await this.otpRepository.findFirstOTP(user.email, code);
      if (!OTP) {
        throw new BadRequestException('Invalid or expired code');
      }
      const data = await this.usersService.ejecChangPassword(
        newPassword,
        user.id,
      );
      await this.otpRepository.deletOtp(user.email);
      return {
        message: 'The password has been changed successfully',
        success: true,
        data: sanitizeUser(data),
      };
    }
    if (normalized) {
      const agency = await this.prisma.agency.findFirst({
        where: {
          contactEmail: normalized,
          isActive: true,
          password: { not: null },
        },
      });
      if (!agency?.contactEmail) {
        throw new NotFoundException('USER NOT FOUND');
      }
      const OTP = await this.otpRepository.findFirstOTP(agency.contactEmail, code);
      if (!OTP) {
        throw new BadRequestException('Invalid or expired code');
      }
      const hashed = await bcrypt.hash(newPassword, 10);
      const data = await this.prisma.agency.update({
        where: { id: agency.id },
        data: { password: hashed },
      });
      await this.otpRepository.deletOtp(agency.contactEmail);
      const { password, verificationToken, verificationTokenExpiry, ...rest } =
        data;
      void password;
      void verificationToken;
      void verificationTokenExpiry;
      return {
        message: 'The password has been changed successfully',
        success: true,
        data: rest,
      };
    }
    throw new NotFoundException('USER NOT FOUND');
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

  async sendVerificationEmailAgency(agencyId: number, email: string) {
    const token = randomUUID();
    const encryptedToken = encrypt(token);
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.prisma.agency.update({
      where: { id: agencyId },
      data: {
        verificationToken: token,
        verificationTokenExpiry: expiry,
      },
    });
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
      const user =
        await this.userRepository.findFirstByVerificationToken(verifyToken);
      if (user) {
        if (user.isVerified) {
          throw new BadRequestException('Email is already verified');
        }
        if (new Date() > (user.verificationTokenExpiry ?? new Date(0))) {
          throw new BadRequestException('Verification token expired.');
        }
        await this.userRepository.markAsVerified(user.id);
        await this.mailer.confirmVerificationEmailUser(
          user.email,
          user.firstName,
          true,
        );
        return { message: 'Email verified successfully', success: true };
      }

      const agency = await this.prisma.agency.findFirst({
        where: {
          verificationToken: verifyToken,
          verificationTokenExpiry: { gt: new Date() },
        },
      });
      if (!agency) {
        throw new BadRequestException('Invalid or expired token');
      }
      if (agency.isVerified) {
        throw new BadRequestException('Email is already verified');
      }
      await this.prisma.agency.update({
        where: { id: agency.id },
        data: {
          isVerified: true,
          verificationToken: null,
          verificationTokenExpiry: null,
        },
      });
      const label = agency.tradeName ?? agency.name;
      await this.mailer.confirmVerificationEmailUser(
        agency.contactEmail ?? '',
        label,
        true,
      );
      return { message: 'Email verified successfully', success: true };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Invalid or corrupted verification token.');
    }
  }
}
