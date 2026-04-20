import { Injectable } from '@nestjs/common';
import { Season } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class QuoteSeasonService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveSeasonForPickup(pickupAt: Date): Promise<Season | null> {
    const seasons = await this.prisma.season.findMany({ orderBy: { id: 'asc' } });
    const matches = seasons.filter((s) => this.isDateInSeasonUtc(pickupAt, s.startDate, s.endDate));
    if (matches.length === 0) return null;
    return matches[0];
  }

  /** Comparación por fecha UTC (sin hora) para solapamiento con temporadas. */
  private isDateInSeasonUtc(point: Date, start: Date, end: Date): boolean {
    const p = this.toYmd(point);
    const s = this.toYmd(start);
    const e = this.toYmd(end);
    if (s <= e) return p >= s && p <= e;
    return p >= s || p <= e;
  }

  private toYmd(d: Date): number {
    return d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
  }
}
