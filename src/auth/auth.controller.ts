import { RegisterUserDto } from './dto/register-user.dto';
import { RegisterAgencyDto } from './dto/register-agency.dto';
import { Body, Controller, Get, Patch, Post, Query, Res } from '@nestjs/common';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import type { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { AuthService } from './auth.service';
import { Auth } from './decorators/auth.decorator';
import { LoginDto, VerifyLoginOtpDto } from './dto/login.dto';
import { ChangePasswordDto } from 'src/users/dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgotPassword.dto';
import { ResetPasswordDto } from './dto/resetPassword.dto';
import { Role } from '@prisma/client';
import { LoginResponseDto } from './dto/response/loginResponse.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
  ApiOkResponse,
} from '@nestjs/swagger';
import { ProfileUserResponseDto } from 'src/users/dto/response/update-user-response.dto';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Registro de clientes (User)',
    description:
      'Solo rol CUSTOMER. Las agencias usan POST /auth/register-agency.',
  })
  @ApiBody({ type: RegisterUserDto })
  @ApiResponse({
    status: 201,
    description: 'Usuario creado. Se envió email de verificación.',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o usuario ya existe',
  })
  @ApiResponse({
    status: 403,
    description: 'Usuario existe pero no está verificado',
  })
  async register(@Body() registerDto: RegisterUserDto) {
    return this.authService.register(registerDto);
  }

  @Post('register-agency')
  @ApiOperation({
    summary: 'Registro de agencia (email + contraseña + datos de negocio)',
    description:
      'Identificador de cuenta: **contactEmail**. La solicitud queda en PENDING_REVIEW; se envía correo de “en revisión”. Tras aprobación del SUPER_ADMIN (`PATCH /agencies/:id` con `approvalStatus: APPROVED`) podrá iniciar sesión.',
  })
  @ApiBody({ type: RegisterAgencyDto })
  async registerAgency(@Body() dto: RegisterAgencyDto) {
    return this.authService.registerAgency(dto);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Inicio de sesión (solo email + contraseña)',
    description:
      'Web: sin app_type. Tras validar credenciales se envía OTP al mismo email.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'OTP enviado por email' })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas o email no verificado',
  })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('login-verify-otp')
  @ApiOperation({ summary: 'Verificar código OTP y obtener JWT' })
  @ApiBody({ type: VerifyLoginOtpDto })
  @ApiOkResponse({ description: 'Token JWT generado.', type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Código OTP inválido o expirado' })
  async verifyOtp(@Body() dto: VerifyLoginOtpDto): Promise<LoginResponseDto> {
    return this.authService.verifyOtp(dto.email, dto.code);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({
    description: 'Perfil obtenido',
    type: ProfileUserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @Auth(Role.SUPER_ADMIN, Role.AGENCY)
  profile(
    @ActiveUser() user: UserActiveInterface,
  ): Promise<ProfileUserResponseDto> {
    return this.authService.getProfile(user);
  }

  @Patch('chang-password')
  @ApiOperation({ summary: 'Cambiar contraseña (usuario autenticado)' })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: 200, description: 'Contraseña actualizada' })
  @ApiResponse({
    status: 401,
    description: 'No autenticado o contraseña actual incorrecta',
  })
  @Auth(Role.SUPER_ADMIN, Role.AGENCY)
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.authService.changePassword(user, dto);
  }

  @Post('request-password-reset')
  @ApiOperation({
    summary: 'Solicitar restablecimiento de contraseña (envía OTP por email)',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({ status: 200, description: 'OTP enviado por email' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.sendPasswordResetCode(forgotPasswordDto);
  }

  @Patch('reset-password')
  @ApiOperation({ summary: 'Restablecer contraseña con OTP' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Contraseña restablecida' })
  @ApiResponse({ status: 400, description: 'OTP inválido o expirado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Get('verify-email')
  @ApiOperation({ summary: 'Verificar email con token del correo' })
  @ApiQuery({
    name: 'token',
    required: true,
    description: 'Token de verificación',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Email verificado' })
  @ApiResponse({ status: 400, description: 'Token inválido o expirado' })
  async verifyEmail(@Query('token') encryptedToken: string, @Res() res: any) {
    try {
      await this.authService.verifyEmail(encryptedToken);
      const successUrl =
        process.env.VERIFY_EMAIL_SUCCESS_URL ??
        'http://localhost:3000/verify-email/success';
      return res.redirect(302, successUrl);
    } catch {
      const errorUrl =
        process.env.VERIFY_EMAIL_ERROR_URL ??
        'http://localhost:3000/verify-email/error';
      return res.redirect(302, errorUrl);
    }
  }
}
