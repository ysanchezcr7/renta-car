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
    this.logger.log(
      `[MAIL] OTP ${type === 1 ? 'login' : 'reset'} para ${email}: ${otp}`,
    );
    return { success: true, message: 'OTP sent successfully.' };
  }

  async sendVerificationLink(link: string, email: string) {
    this.logger.log(`[MAIL] Verification link para ${email}: ${link}`);
    return { success: true };
  }

  async confirmVerificationEmailUser(
    email: string,
    name: string,
    isVerified: boolean,
  ) {
    this.logger.log(
      `[MAIL] Email ${isVerified ? 'verificado' : 'no verificado'} para ${email} (${name})`,
    );
    return { success: true };
  }

  /** Tras registro público: la cuenta queda en revisión hasta que SUPER_ADMIN apruebe. */
  async sendAgencyPendingReview(email: string, agencyDisplayName: string) {
    this.logger.log(
      `[MAIL] Cuenta de agencia "${agencyDisplayName}" (${email}) en revisión antifraude. Recibirá otro correo al ser aprobada.`,
    );
    return { success: true };
  }

  async sendAgencyApproved(email: string, agencyDisplayName: string) {
    this.logger.log(
      `[MAIL] Agencia "${agencyDisplayName}" (${email}) aprobada. Ya puede iniciar sesión con su correo y contraseña.`,
    );
    return { success: true };
  }

  async sendAgencyRejected(
    email: string,
    agencyDisplayName: string,
    reason?: string | null,
  ) {
    this.logger.log(
      `[MAIL] Agencia "${agencyDisplayName}" (${email}) rechazada.${reason ? ` Motivo: ${reason}` : ''}`,
    );
    return { success: true };
  }
}
