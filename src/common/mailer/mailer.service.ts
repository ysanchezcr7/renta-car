import { Injectable, Logger } from '@nestjs/common';

/**
 * Servicio de correo mínimo para el template.
 * Implementa solo los métodos usados por Auth (OTP, verificación de email).
 * Sustituye por @nestjs-modules/mailer o nodemailer en producción.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  async sendOtp(email: string, otp: string, type?: number) {
    this.logger.log(`[MAIL] OTP ${type === 1 ? 'login' : 'reset'} para ${email}: ${otp}`);
    return { success: true, message: 'OTP sent successfully.' };
  }

  async sendVerificationLink(link: string, email: string) {
    this.logger.log(`[MAIL] Verification link para ${email}: ${link}`);
    return { success: true };
  }

  async confirmVerificationEmailUser(email: string, name: string, isVerified: boolean) {
    this.logger.log(`[MAIL] Email ${isVerified ? 'verificado' : 'no verificado'} para ${email} (${name})`);
    return { success: true };
  }
}
