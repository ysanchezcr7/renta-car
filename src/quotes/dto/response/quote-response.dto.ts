import { Expose, Type } from 'class-transformer';
import { CommissionType, QuoteStatus, TransmissionType } from '@prisma/client';

export class QuoteRateTypeSummaryDto {
  @Expose()
  id: number;
  @Expose()
  code: string;
  @Expose()
  name: string;
}

export class QuoteClientSummaryDto {
  @Expose()
  id: number;
  @Expose()
  firstName: string;
  @Expose()
  lastName: string;
}

export class QuoteResponseDto {
  @Expose() id: number;
  @Expose() agencyId: number;
  @Expose() clientId: number | null;
  @Expose() status: QuoteStatus;
  @Expose() pickupLocation: string;
  @Expose() dropoffLocation: string;
  @Expose() pickupAt: Date;
  @Expose() dropoffAt: Date;
  @Expose() driverAge: number | null;

  @Expose() pickupLocationId: number | null;
  @Expose() rentadoraId: number | null;
  @Expose() categoryId: number | null;
  @Expose() carModelId: number | null;
  @Expose() seasonId: number | null;
  @Expose() transmission: TransmissionType | null;
  @Expose() billingDays: number | null;
  @Expose() rentalDayRangeLabel: string | null;

  @Expose() saleRateTypeId: number | null;
  @Expose()
  @Type(() => QuoteRateTypeSummaryDto)
  saleRateType?: QuoteRateTypeSummaryDto;
  @Expose() saleDailyPrice: string | null;
  @Expose() saleInsuranceDaily: string | null;
  @Expose() saleFuelFee: string | null;
  @Expose() saleAirportFee: string | null;
  @Expose() saleTransferFee: string | null;
  @Expose() saleExtraDayFee: string | null;
  @Expose() saleInsuranceTotal: string | null;
  @Expose() saleFeesTotal: string | null;
  @Expose() commissionType: CommissionType | null;
  @Expose() commissionValue: string | null;
  @Expose() commissionAmount: string | null;
  @Expose() saleTotal: string | null;

  @Expose() vendorId: number | null;
  @Expose() vendorDailyPrice: string | null;
  @Expose() vendorInsuranceDaily: string | null;
  @Expose() vendorFuelFee: string | null;
  @Expose() vendorAirportFee: string | null;
  @Expose() vendorTransferFee: string | null;
  @Expose() vendorExtraDayFee: string | null;
  @Expose() vendorInsuranceTotal: string | null;
  @Expose() vendorFeesTotal: string | null;
  @Expose() vendorTotalCost: string | null;

  @Expose() availabilityRequestedAt: Date | null;
  @Expose() availabilityExpiresAt: Date | null;
  @Expose() availabilityVendorId: number | null;
  @Expose() availabilityRentadoraId: number | null;

  @Expose() requiresManualReview: boolean;
  @Expose() reviewReason: string | null;
  @Expose() calculationMetadata: unknown;

  @Expose() createdAt: Date;
  @Expose() updatedAt: Date;
  @Expose()
  @Type(() => QuoteClientSummaryDto)
  client?: QuoteClientSummaryDto;
}
