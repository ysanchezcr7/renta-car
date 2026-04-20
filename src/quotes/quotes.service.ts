import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { createResponse } from 'src/common/helpers/response-response';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { RatesSearchQueryDto } from './dto/rates-search-query.dto';
import { ClientEligibilityResponseDto } from './dto/response/eligibility-response.dto';
import { QuoteResponseDto } from './dto/response/quote-response.dto';
import { RequestVendorAvailabilityDto } from 'src/quote-vendor-selection/dto/request-vendor-availability.dto';
import { SelectVendorRateDto } from 'src/quote-vendor-selection/dto/select-vendor-rate.dto';
import { QuoteVendorSelectionService } from 'src/quote-vendor-selection/quote-vendor-selection.service';
import { QuoteCalculationOrchestratorService } from './services/quote-calculation-orchestrator.service';
import { QuotesRepository } from './quotes.repository';

@Injectable()
export class QuotesService {
  constructor(
    private readonly repo: QuotesRepository,
    private readonly orchestrator: QuoteCalculationOrchestratorService,
    private readonly vendorSelection: QuoteVendorSelectionService,
  ) {}

  async create(dto: CreateQuoteDto, user: UserActiveInterface) {
    const { data, warnings } = await this.orchestrator.buildQuoteFromDto(dto, user);
    const quote = await this.repo.create(data);
    const message = quote.requiresManualReview
      ? 'Cotización creada; requiere revisión manual de tarifa.'
      : 'Cotización creada.';
    return {
      message,
      data: quote,
      warnings,
    };
  }

  async findOne(id: number, user: UserActiveInterface) {
    const agencyId = user.role === Role.SUPER_ADMIN ? undefined : user.agencyId ?? undefined;
    const quote = await this.repo.findById(id, agencyId);
    if (!quote) throw new NotFoundException('Cotización no encontrada.');
    return createResponse(QuoteResponseDto, 'Cotización obtenida.', this.mapQuoteForResponse(quote));
  }

  searchRates(dto: RatesSearchQueryDto) {
    return this.orchestrator.previewRatesSearch(dto);
  }

  requestVendorAvailability(
    quoteId: number,
    dto: RequestVendorAvailabilityDto,
    user: UserActiveInterface,
  ) {
    return this.vendorSelection.requestVendorAvailability(quoteId, dto, user);
  }

  selectVendorRate(quoteId: number, dto: SelectVendorRateDto, user: UserActiveInterface) {
    return this.vendorSelection.selectVendorRate(quoteId, dto, user);
  }

  async clientEligibility(
    clientId: number,
    user: UserActiveInterface,
    pickupAt?: string,
  ) {
    const ref = pickupAt ? new Date(pickupAt) : new Date();
    const agencyId = user.role === Role.SUPER_ADMIN ? undefined : user.agencyId ?? undefined;
    const result = await this.orchestrator.computeClientEligibility(clientId, agencyId, ref);
    return createResponse(ClientEligibilityResponseDto, 'Elegibilidad evaluada.', result);
  }

  mapQuoteForResponse(quote: {
    saleDailyPrice: unknown;
    saleInsuranceDaily: unknown;
    saleFuelFee: unknown;
    saleAirportFee: unknown;
    saleTransferFee: unknown;
    saleExtraDayFee: unknown;
    saleInsuranceTotal: unknown;
    saleFeesTotal: unknown;
    commissionValue: unknown;
    commissionAmount: unknown;
    saleTotal: unknown;
    vendorDailyPrice?: unknown;
    vendorInsuranceDaily?: unknown;
    vendorFuelFee?: unknown;
    vendorAirportFee?: unknown;
    vendorTransferFee?: unknown;
    vendorExtraDayFee?: unknown;
    vendorInsuranceTotal?: unknown;
    vendorFeesTotal?: unknown;
    vendorTotalCost?: unknown;
    [key: string]: unknown;
  }) {
    const dec = (v: unknown) => (v != null ? String(v) : null);
    return {
      ...quote,
      saleDailyPrice: dec(quote.saleDailyPrice),
      saleInsuranceDaily: dec(quote.saleInsuranceDaily),
      saleFuelFee: dec(quote.saleFuelFee),
      saleAirportFee: dec(quote.saleAirportFee),
      saleTransferFee: dec(quote.saleTransferFee),
      saleExtraDayFee: dec(quote.saleExtraDayFee),
      saleInsuranceTotal: dec(quote.saleInsuranceTotal),
      saleFeesTotal: dec(quote.saleFeesTotal),
      commissionValue: dec(quote.commissionValue),
      commissionAmount: dec(quote.commissionAmount),
      saleTotal: dec(quote.saleTotal),
      vendorDailyPrice: dec(quote.vendorDailyPrice),
      vendorInsuranceDaily: dec(quote.vendorInsuranceDaily),
      vendorFuelFee: dec(quote.vendorFuelFee),
      vendorAirportFee: dec(quote.vendorAirportFee),
      vendorTransferFee: dec(quote.vendorTransferFee),
      vendorExtraDayFee: dec(quote.vendorExtraDayFee),
      vendorInsuranceTotal: dec(quote.vendorInsuranceTotal),
      vendorFeesTotal: dec(quote.vendorFeesTotal),
      vendorTotalCost: dec(quote.vendorTotalCost),
    };
  }
}
