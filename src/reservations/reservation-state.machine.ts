import { QuoteStatus, ReservationStatus } from '@prisma/client';

/** Transiciones permitidas para POST submit-to-vendor */
export function canSubmitToVendor(reservationStatus: ReservationStatus): boolean {
  return reservationStatus === ReservationStatus.CREATED;
}

export function nextStatusAfterSubmitToVendor(): ReservationStatus {
  return ReservationStatus.SUBMITTED_TO_VENDOR;
}

export function quoteStatusAfterSubmitToVendor(): QuoteStatus {
  return QuoteStatus.REQUEST_SUBMITTED_TO_VENDOR;
}
