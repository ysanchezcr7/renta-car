-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'AGENCY', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "AgencyApprovalStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('QUOTE_REQUESTED', 'MANUAL_REVIEW', 'QUOTE_SENT', 'PENDING_VENDOR_AVAILABILITY', 'AVAILABILITY_APPROVED', 'AGENCY_ACCEPTED', 'AWAITING_PAYMENT', 'PAYMENT_RECEIVED', 'REQUEST_SUBMITTED_TO_VENDOR', 'PROCESSING_VOUCHER', 'VOUCHER_RECEIVED', 'VOUCHER_SENT', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'RECEIVED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentKind" AS ENUM ('CLIENT', 'VENDOR');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('CREATED', 'SUBMITTED_TO_VENDOR', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReservationPaymentSnapshotStatus" AS ENUM ('CLIENT_CONFIRMED');

-- CreateEnum
CREATE TYPE "VoucherSnapshotStatus" AS ENUM ('NOT_ISSUED', 'PENDING', 'RECEIVED', 'SENT');

-- CreateEnum
CREATE TYPE "RateTypeKind" AS ENUM ('FIXED_SEASON', 'RTOP', 'DISP_CC', 'PROMO', 'SPECIAL_DATE_RANGE');

-- CreateEnum
CREATE TYPE "RateLayer" AS ENUM ('SALE', 'VENDOR_COST');

-- CreateEnum
CREATE TYPE "TransmissionType" AS ENUM ('MANUAL', 'AUTOMATIC');

-- CreateEnum
CREATE TYPE "DriverLicenseKind" AS ENUM ('REX', 'OTHER');

-- CreateEnum
CREATE TYPE "EmailEventType" AS ENUM ('QUOTE_SENT', 'AVAILABILITY_APPROVED', 'AVAILABILITY_EXPIRED', 'PAYMENT_PENDING', 'PAYMENT_RECEIVED', 'VOUCHER_READY', 'VOUCHER_VENDOR_REGISTERED', 'VOUCHER_INTERNAL_READY', 'VOUCHER_SENT_TO_AGENCY');

-- CreateEnum
CREATE TYPE "VoucherRecordStatus" AS ENUM ('PENDING', 'VENDOR_UPLOADED', 'INTERNAL_READY', 'SENT');

-- CreateEnum
CREATE TYPE "DocumentKind" AS ENUM ('VENDOR_VOUCHER', 'INTERNAL_VOUCHER', 'OTHER');

-- CreateTable
CREATE TABLE "Agency" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "tradeName" TEXT,
    "logoUrl" TEXT,
    "responsibleFullName" TEXT,
    "contactEmail" TEXT,
    "phone" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "stateRegion" TEXT,
    "stateCode" TEXT,
    "country" TEXT,
    "postalCode" TEXT,
    "billingAddress" TEXT,
    "sellerOfTravelDocumentUrl" TEXT,
    "taxIdType" TEXT,
    "taxId" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "approvalStatus" "AgencyApprovalStatus" NOT NULL DEFAULT 'APPROVED',
    "rejectionReason" TEXT,
    "password" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "verificationTokenExpiry" TIMESTAMP(3),
    "deviceToken" TEXT,

    CONSTRAINT "Agency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "agencyId" INTEGER,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "middleName" TEXT,
    "phone" TEXT,
    "image" TEXT,
    "role" "Role" NOT NULL DEFAULT 'AGENCY',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "verificationTokenExpiry" TIMESTAMP(3),
    "deviceToken" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Otp" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Otp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" SERIAL NOT NULL,
    "agencyId" INTEGER NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "licenseKind" "DriverLicenseKind",
    "licenseIssuedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rentadora" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rentadora_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorRentadora" (
    "id" SERIAL NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "rentadoraId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorRentadora_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "rentadoraId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarModel" (
    "id" SERIAL NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "transmission" "TransmissionType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateType" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "RateTypeKind" NOT NULL,
    "layer" "RateLayer" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorRate" (
    "id" SERIAL NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "rentadoraId" INTEGER NOT NULL,
    "categoryId" INTEGER,
    "carModelId" INTEGER,
    "transmission" "TransmissionType",
    "seasonId" INTEGER,
    "rateTypeId" INTEGER NOT NULL,
    "minDays" INTEGER,
    "maxDays" INTEGER,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "dailyPrice" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "locationId" INTEGER,

    CONSTRAINT "VendorRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgencyCommissionProfile" (
    "id" SERIAL NOT NULL,
    "agencyId" INTEGER NOT NULL,
    "type" "CommissionType" NOT NULL,
    "value" DECIMAL(12,4) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencyCommissionProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlobalCommissionProfile" (
    "id" SERIAL NOT NULL,
    "type" "CommissionType" NOT NULL,
    "value" DECIMAL(12,4) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalCommissionProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgencyPricingRule" (
    "id" SERIAL NOT NULL,
    "agencyId" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencyPricingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgencyCategoryPriceMask" (
    "id" SERIAL NOT NULL,
    "agencyId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "percentageEnabled" BOOLEAN NOT NULL DEFAULT false,
    "percentageValue" DECIMAL(8,4) NOT NULL DEFAULT 0,
    "fixedTotalEnabled" BOOLEAN NOT NULL DEFAULT false,
    "fixedTotalValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "fixedPerDayEnabled" BOOLEAN NOT NULL DEFAULT false,
    "fixedPerDayValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencyCategoryPriceMask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "province" TEXT,
    "isAirport" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessRule" (
    "id" SERIAL NOT NULL,
    "ruleKey" TEXT NOT NULL,
    "ruleValue" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" SERIAL NOT NULL,
    "agencyId" INTEGER NOT NULL,
    "clientId" INTEGER,
    "createdByUserId" INTEGER,
    "status" "QuoteStatus" NOT NULL DEFAULT 'QUOTE_REQUESTED',
    "pickupLocation" TEXT NOT NULL,
    "dropoffLocation" TEXT NOT NULL,
    "pickupAt" TIMESTAMP(3) NOT NULL,
    "dropoffAt" TIMESTAMP(3) NOT NULL,
    "driverAge" INTEGER,
    "pickupLocationId" INTEGER,
    "rentadoraId" INTEGER,
    "categoryId" INTEGER,
    "carModelId" INTEGER,
    "seasonId" INTEGER,
    "transmission" "TransmissionType",
    "billingDays" INTEGER,
    "rentalDayRangeLabel" TEXT,
    "availabilityRequestedAt" TIMESTAMP(3),
    "availabilityExpiresAt" TIMESTAMP(3),
    "saleRateTypeId" INTEGER,
    "saleDailyPrice" DECIMAL(12,2),
    "saleTotal" DECIMAL(12,2),
    "saleInsuranceDaily" DECIMAL(12,2),
    "saleFuelFee" DECIMAL(12,2),
    "saleAirportFee" DECIMAL(12,2),
    "saleTransferFee" DECIMAL(12,2),
    "saleExtraDayFee" DECIMAL(12,2),
    "commissionType" "CommissionType",
    "commissionValue" DECIMAL(12,4),
    "commissionAmount" DECIMAL(12,2),
    "saleInsuranceTotal" DECIMAL(12,2),
    "saleFeesTotal" DECIMAL(12,2),
    "requiresManualReview" BOOLEAN NOT NULL DEFAULT false,
    "reviewReason" TEXT,
    "calculationMetadata" JSONB,
    "vendorId" INTEGER,
    "vendorPaymentRateTypeId" INTEGER,
    "vendorDailyPrice" DECIMAL(12,2),
    "vendorTotalCost" DECIMAL(12,2),
    "vendorInsuranceTotal" DECIMAL(12,2),
    "vendorFeesTotal" DECIMAL(12,2),
    "vendorInsuranceDaily" DECIMAL(12,2),
    "vendorFuelFee" DECIMAL(12,2),
    "vendorAirportFee" DECIMAL(12,2),
    "vendorTransferFee" DECIMAL(12,2),
    "vendorExtraDayFee" DECIMAL(12,2),
    "availabilityVendorId" INTEGER,
    "availabilityRentadoraId" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteVendorSelection" (
    "id" SERIAL NOT NULL,
    "quoteId" INTEGER NOT NULL,
    "selectedByUserId" INTEGER,
    "vendorId" INTEGER NOT NULL,
    "rentadoraId" INTEGER,
    "vendorRateId" INTEGER,
    "vendorPaymentRateTypeId" INTEGER,
    "vendorDailyPrice" DECIMAL(12,2) NOT NULL,
    "vendorInsuranceDaily" DECIMAL(12,2),
    "vendorFuelFee" DECIMAL(12,2),
    "vendorAirportFee" DECIMAL(12,2),
    "vendorTransferFee" DECIMAL(12,2),
    "vendorExtraDayFee" DECIMAL(12,2),
    "vendorTotalCost" DECIMAL(12,2) NOT NULL,
    "vendorInsuranceTotal" DECIMAL(12,2),
    "vendorFeesTotal" DECIMAL(12,2),
    "approvedOption" BOOLEAN NOT NULL DEFAULT true,
    "selectedManually" BOOLEAN NOT NULL DEFAULT true,
    "selectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteVendorSelection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "agencyId" INTEGER NOT NULL,
    "paymentKind" "PaymentKind" NOT NULL,
    "quoteId" INTEGER,
    "reservationId" INTEGER,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "paymentReference" TEXT,
    "verifiedByUserId" INTEGER,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" SERIAL NOT NULL,
    "agencyId" INTEGER NOT NULL,
    "quoteId" INTEGER NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'CREATED',
    "rentadoraId" INTEGER,
    "categoryId" INTEGER,
    "carModelId" INTEGER,
    "transmission" "TransmissionType",
    "saleRateTypeId" INTEGER,
    "vendorPaymentRateTypeId" INTEGER,
    "saleDailyPrice" DECIMAL(12,2),
    "saleTotal" DECIMAL(12,2) NOT NULL,
    "vendorTotalCost" DECIMAL(12,2) NOT NULL,
    "profitTotal" DECIMAL(12,2) NOT NULL,
    "commissionType" "CommissionType",
    "commissionValue" DECIMAL(12,4),
    "commissionAmount" DECIMAL(12,2),
    "paymentSnapshotStatus" "ReservationPaymentSnapshotStatus" NOT NULL DEFAULT 'CLIENT_CONFIRMED',
    "voucherStatus" "VoucherSnapshotStatus" NOT NULL DEFAULT 'NOT_ISSUED',
    "vendorId" INTEGER,
    "vendorDailyPrice" DECIMAL(12,2),
    "voucherCode" TEXT,
    "voucherUrl" TEXT,
    "voucherReceivedAt" TIMESTAMP(3),
    "voucherSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Voucher" (
    "id" SERIAL NOT NULL,
    "reservationId" INTEGER NOT NULL,
    "vendorVoucherFile" TEXT,
    "internalVoucherFile" TEXT,
    "cloudUrl" TEXT,
    "sentAt" TIMESTAMP(3),
    "status" "VoucherRecordStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Voucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" SERIAL NOT NULL,
    "agencyId" INTEGER NOT NULL,
    "reservationId" INTEGER,
    "voucherId" INTEGER,
    "kind" "DocumentKind" NOT NULL,
    "fileKey" TEXT,
    "cloudUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusHistory" (
    "id" SERIAL NOT NULL,
    "agencyId" INTEGER NOT NULL,
    "quoteId" INTEGER,
    "reservationId" INTEGER,
    "entityType" TEXT,
    "entityId" INTEGER,
    "statusCode" TEXT,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "notes" TEXT,
    "createdByUserId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adminApproved" BOOLEAN NOT NULL DEFAULT false,
    "adminApprovedByUserId" INTEGER,
    "adminApprovedAt" TIMESTAMP(3),

    CONSTRAINT "StatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" SERIAL NOT NULL,
    "agencyId" INTEGER NOT NULL,
    "quoteId" INTEGER,
    "reservationId" INTEGER,
    "eventType" "EmailEventType" NOT NULL,
    "toEmail" TEXT,
    "subject" TEXT,
    "payload" JSONB,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entityType" TEXT,
    "entityId" INTEGER,
    "emailType" TEXT,
    "notes" TEXT,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Agency_isAdmin_idx" ON "Agency"("isAdmin");

-- CreateIndex
CREATE INDEX "Agency_tradeName_idx" ON "Agency"("tradeName");

-- CreateIndex
CREATE INDEX "Agency_contactEmail_idx" ON "Agency"("contactEmail");

-- CreateIndex
CREATE UNIQUE INDEX "Agency_contactEmail_key" ON "Agency"("contactEmail");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_agencyId_idx" ON "User"("agencyId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "Otp_email_idx" ON "Otp"("email");

-- CreateIndex
CREATE INDEX "Client_agencyId_idx" ON "Client"("agencyId");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_code_key" ON "Vendor"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Rentadora_code_key" ON "Rentadora"("code");

-- CreateIndex
CREATE INDEX "VendorRentadora_vendorId_idx" ON "VendorRentadora"("vendorId");

-- CreateIndex
CREATE INDEX "VendorRentadora_rentadoraId_idx" ON "VendorRentadora"("rentadoraId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorRentadora_vendorId_rentadoraId_key" ON "VendorRentadora"("vendorId", "rentadoraId");

-- CreateIndex
CREATE INDEX "Category_rentadoraId_idx" ON "Category"("rentadoraId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_rentadoraId_code_key" ON "Category"("rentadoraId", "code");

-- CreateIndex
CREATE INDEX "CarModel_categoryId_idx" ON "CarModel"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "CarModel_categoryId_code_key" ON "CarModel"("categoryId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Season_code_key" ON "Season"("code");

-- CreateIndex
CREATE UNIQUE INDEX "RateType_code_key" ON "RateType"("code");

-- CreateIndex
CREATE INDEX "RateType_kind_layer_idx" ON "RateType"("kind", "layer");

-- CreateIndex
CREATE INDEX "VendorRate_vendorId_rentadoraId_idx" ON "VendorRate"("vendorId", "rentadoraId");

-- CreateIndex
CREATE INDEX "VendorRate_rateTypeId_idx" ON "VendorRate"("rateTypeId");

-- CreateIndex
CREATE INDEX "VendorRate_seasonId_idx" ON "VendorRate"("seasonId");

-- CreateIndex
CREATE INDEX "VendorRate_validFrom_validTo_idx" ON "VendorRate"("validFrom", "validTo");

-- CreateIndex
CREATE INDEX "VendorRate_minDays_maxDays_idx" ON "VendorRate"("minDays", "maxDays");

-- CreateIndex
CREATE INDEX "VendorRate_locationId_idx" ON "VendorRate"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "AgencyCommissionProfile_agencyId_key" ON "AgencyCommissionProfile"("agencyId");

-- CreateIndex
CREATE INDEX "AgencyPricingRule_agencyId_idx" ON "AgencyPricingRule"("agencyId");

-- CreateIndex
CREATE INDEX "AgencyPricingRule_key_idx" ON "AgencyPricingRule"("key");

-- CreateIndex
CREATE INDEX "AgencyCategoryPriceMask_agencyId_idx" ON "AgencyCategoryPriceMask"("agencyId");

-- CreateIndex
CREATE INDEX "AgencyCategoryPriceMask_categoryId_idx" ON "AgencyCategoryPriceMask"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "AgencyCategoryPriceMask_agencyId_categoryId_key" ON "AgencyCategoryPriceMask"("agencyId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessRule_ruleKey_key" ON "BusinessRule"("ruleKey");

-- CreateIndex
CREATE INDEX "Quote_agencyId_idx" ON "Quote"("agencyId");

-- CreateIndex
CREATE INDEX "Quote_status_idx" ON "Quote"("status");

-- CreateIndex
CREATE INDEX "Quote_clientId_idx" ON "Quote"("clientId");

-- CreateIndex
CREATE INDEX "Quote_vendorId_idx" ON "Quote"("vendorId");

-- CreateIndex
CREATE INDEX "Quote_availabilityExpiresAt_idx" ON "Quote"("availabilityExpiresAt");

-- CreateIndex
CREATE INDEX "Quote_rentadoraId_idx" ON "Quote"("rentadoraId");

-- CreateIndex
CREATE INDEX "Quote_categoryId_idx" ON "Quote"("categoryId");

-- CreateIndex
CREATE INDEX "Quote_carModelId_idx" ON "Quote"("carModelId");

-- CreateIndex
CREATE INDEX "Quote_pickupLocationId_idx" ON "Quote"("pickupLocationId");

-- CreateIndex
CREATE INDEX "Quote_availabilityVendorId_idx" ON "Quote"("availabilityVendorId");

-- CreateIndex
CREATE INDEX "Quote_availabilityRentadoraId_idx" ON "Quote"("availabilityRentadoraId");

-- CreateIndex
CREATE INDEX "QuoteVendorSelection_quoteId_idx" ON "QuoteVendorSelection"("quoteId");

-- CreateIndex
CREATE INDEX "QuoteVendorSelection_vendorId_idx" ON "QuoteVendorSelection"("vendorId");

-- CreateIndex
CREATE INDEX "QuoteVendorSelection_rentadoraId_idx" ON "QuoteVendorSelection"("rentadoraId");

-- CreateIndex
CREATE INDEX "QuoteVendorSelection_vendorRateId_idx" ON "QuoteVendorSelection"("vendorRateId");

-- CreateIndex
CREATE INDEX "Payment_agencyId_idx" ON "Payment"("agencyId");

-- CreateIndex
CREATE INDEX "Payment_quoteId_idx" ON "Payment"("quoteId");

-- CreateIndex
CREATE INDEX "Payment_reservationId_idx" ON "Payment"("reservationId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_paymentKind_idx" ON "Payment"("paymentKind");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_quoteId_key" ON "Reservation"("quoteId");

-- CreateIndex
CREATE INDEX "Reservation_agencyId_idx" ON "Reservation"("agencyId");

-- CreateIndex
CREATE INDEX "Reservation_status_idx" ON "Reservation"("status");

-- CreateIndex
CREATE INDEX "Reservation_rentadoraId_idx" ON "Reservation"("rentadoraId");

-- CreateIndex
CREATE INDEX "Reservation_paymentSnapshotStatus_idx" ON "Reservation"("paymentSnapshotStatus");

-- CreateIndex
CREATE INDEX "Reservation_voucherStatus_idx" ON "Reservation"("voucherStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Voucher_reservationId_key" ON "Voucher"("reservationId");

-- CreateIndex
CREATE INDEX "Voucher_status_idx" ON "Voucher"("status");

-- CreateIndex
CREATE INDEX "Document_agencyId_idx" ON "Document"("agencyId");

-- CreateIndex
CREATE INDEX "Document_reservationId_idx" ON "Document"("reservationId");

-- CreateIndex
CREATE INDEX "Document_voucherId_idx" ON "Document"("voucherId");

-- CreateIndex
CREATE INDEX "Document_kind_idx" ON "Document"("kind");

-- CreateIndex
CREATE INDEX "StatusHistory_agencyId_idx" ON "StatusHistory"("agencyId");

-- CreateIndex
CREATE INDEX "StatusHistory_quoteId_idx" ON "StatusHistory"("quoteId");

-- CreateIndex
CREATE INDEX "StatusHistory_reservationId_idx" ON "StatusHistory"("reservationId");

-- CreateIndex
CREATE INDEX "StatusHistory_toStatus_idx" ON "StatusHistory"("toStatus");

-- CreateIndex
CREATE INDEX "StatusHistory_entityType_entityId_idx" ON "StatusHistory"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "EmailLog_agencyId_idx" ON "EmailLog"("agencyId");

-- CreateIndex
CREATE INDEX "EmailLog_eventType_idx" ON "EmailLog"("eventType");

-- CreateIndex
CREATE INDEX "EmailLog_quoteId_idx" ON "EmailLog"("quoteId");

-- CreateIndex
CREATE INDEX "EmailLog_reservationId_idx" ON "EmailLog"("reservationId");

-- CreateIndex
CREATE INDEX "EmailLog_entityType_entityId_idx" ON "EmailLog"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorRentadora" ADD CONSTRAINT "VendorRentadora_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorRentadora" ADD CONSTRAINT "VendorRentadora_rentadoraId_fkey" FOREIGN KEY ("rentadoraId") REFERENCES "Rentadora"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_rentadoraId_fkey" FOREIGN KEY ("rentadoraId") REFERENCES "Rentadora"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarModel" ADD CONSTRAINT "CarModel_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorRate" ADD CONSTRAINT "VendorRate_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorRate" ADD CONSTRAINT "VendorRate_rentadoraId_fkey" FOREIGN KEY ("rentadoraId") REFERENCES "Rentadora"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorRate" ADD CONSTRAINT "VendorRate_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorRate" ADD CONSTRAINT "VendorRate_carModelId_fkey" FOREIGN KEY ("carModelId") REFERENCES "CarModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorRate" ADD CONSTRAINT "VendorRate_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorRate" ADD CONSTRAINT "VendorRate_rateTypeId_fkey" FOREIGN KEY ("rateTypeId") REFERENCES "RateType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorRate" ADD CONSTRAINT "VendorRate_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyCommissionProfile" ADD CONSTRAINT "AgencyCommissionProfile_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyPricingRule" ADD CONSTRAINT "AgencyPricingRule_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyCategoryPriceMask" ADD CONSTRAINT "AgencyCategoryPriceMask_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyCategoryPriceMask" ADD CONSTRAINT "AgencyCategoryPriceMask_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_pickupLocationId_fkey" FOREIGN KEY ("pickupLocationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_rentadoraId_fkey" FOREIGN KEY ("rentadoraId") REFERENCES "Rentadora"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_carModelId_fkey" FOREIGN KEY ("carModelId") REFERENCES "CarModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_saleRateTypeId_fkey" FOREIGN KEY ("saleRateTypeId") REFERENCES "RateType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_vendorPaymentRateTypeId_fkey" FOREIGN KEY ("vendorPaymentRateTypeId") REFERENCES "RateType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_availabilityVendorId_fkey" FOREIGN KEY ("availabilityVendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_availabilityRentadoraId_fkey" FOREIGN KEY ("availabilityRentadoraId") REFERENCES "Rentadora"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteVendorSelection" ADD CONSTRAINT "QuoteVendorSelection_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteVendorSelection" ADD CONSTRAINT "QuoteVendorSelection_selectedByUserId_fkey" FOREIGN KEY ("selectedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteVendorSelection" ADD CONSTRAINT "QuoteVendorSelection_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteVendorSelection" ADD CONSTRAINT "QuoteVendorSelection_rentadoraId_fkey" FOREIGN KEY ("rentadoraId") REFERENCES "Rentadora"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteVendorSelection" ADD CONSTRAINT "QuoteVendorSelection_vendorRateId_fkey" FOREIGN KEY ("vendorRateId") REFERENCES "VendorRate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteVendorSelection" ADD CONSTRAINT "QuoteVendorSelection_vendorPaymentRateTypeId_fkey" FOREIGN KEY ("vendorPaymentRateTypeId") REFERENCES "RateType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_verifiedByUserId_fkey" FOREIGN KEY ("verifiedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_rentadoraId_fkey" FOREIGN KEY ("rentadoraId") REFERENCES "Rentadora"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_carModelId_fkey" FOREIGN KEY ("carModelId") REFERENCES "CarModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_saleRateTypeId_fkey" FOREIGN KEY ("saleRateTypeId") REFERENCES "RateType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_vendorPaymentRateTypeId_fkey" FOREIGN KEY ("vendorPaymentRateTypeId") REFERENCES "RateType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "Voucher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusHistory" ADD CONSTRAINT "StatusHistory_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusHistory" ADD CONSTRAINT "StatusHistory_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusHistory" ADD CONSTRAINT "StatusHistory_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusHistory" ADD CONSTRAINT "StatusHistory_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusHistory" ADD CONSTRAINT "StatusHistory_adminApprovedByUserId_fkey" FOREIGN KEY ("adminApprovedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
