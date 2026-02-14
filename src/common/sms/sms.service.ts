import { Injectable, Logger } from '@nestjs/common';

/**
 * Servicio SMS mínimo para el template. Sustituir por Twilio u otro en producción.
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  async send(to: string, message: string): Promise<void> {
    this.logger.log(`[SMS] To ${to}: ${message}`);
  }
}
