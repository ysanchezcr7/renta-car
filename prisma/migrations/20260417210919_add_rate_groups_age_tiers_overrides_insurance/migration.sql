-- CreateEnum
CREATE TYPE "RentalModality" AS ENUM ('AVAILABILITY', 'RISK', 'OFFICIAL');

-- AlterTable
ALTER TABLE "VendorRate" ADD COLUMN     "extraDayPrice" DECIMAL(12,2),
ADD COLUMN     "fuelFee" DECIMAL(12,2),
ADD COLUMN     "rateGroupId" INTEGER,
ADD COLUMN     "securityDeposit" DECIMAL(12,2);

-- CreateTable
CREATE TABLE "AgeTier" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ageMin" INTEGER NOT NULL,
    "ageMax" INTEGER NOT NULL,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgeTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorRateGroup" (
    "id" SERIAL NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "modality" "RentalModality" NOT NULL,
    "seasonId" INTEGER,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorRateGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorRateGroupProvince" (
    "id" SERIAL NOT NULL,
    "rateGroupId" INTEGER NOT NULL,
    "locationId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorRateGroupProvince_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorRateOverride" (
    "id" SERIAL NOT NULL,
    "rateGroupId" INTEGER NOT NULL,
    "replacementGroupId" INTEGER NOT NULL,
    "overrideFrom" TIMESTAMP(3) NOT NULL,
    "overrideTo" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorRateOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorRateInsurance" (
    "id" SERIAL NOT NULL,
    "vendorRateId" INTEGER NOT NULL,
    "ageTierId" INTEGER NOT NULL,
    "dailyPrice" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorRateInsurance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AgeTier_code_key" ON "AgeTier"("code");

-- CreateIndex
CREATE INDEX "AgeTier_ageMin_ageMax_idx" ON "AgeTier"("ageMin", "ageMax");

-- CreateIndex
CREATE INDEX "VendorRateGroup_vendorId_idx" ON "VendorRateGroup"("vendorId");

-- CreateIndex
CREATE INDEX "VendorRateGroup_modality_idx" ON "VendorRateGroup"("modality");

-- CreateIndex
CREATE INDEX "VendorRateGroup_seasonId_idx" ON "VendorRateGroup"("seasonId");

-- CreateIndex
CREATE INDEX "VendorRateGroup_validFrom_validTo_idx" ON "VendorRateGroup"("validFrom", "validTo");

-- CreateIndex
CREATE INDEX "VendorRateGroupProvince_locationId_idx" ON "VendorRateGroupProvince"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorRateGroupProvince_rateGroupId_locationId_key" ON "VendorRateGroupProvince"("rateGroupId", "locationId");

-- CreateIndex
CREATE INDEX "VendorRateOverride_rateGroupId_overrideFrom_overrideTo_idx" ON "VendorRateOverride"("rateGroupId", "overrideFrom", "overrideTo");

-- CreateIndex
CREATE INDEX "VendorRateOverride_replacementGroupId_idx" ON "VendorRateOverride"("replacementGroupId");

-- CreateIndex
CREATE INDEX "VendorRateInsurance_vendorRateId_idx" ON "VendorRateInsurance"("vendorRateId");

-- CreateIndex
CREATE INDEX "VendorRateInsurance_ageTierId_idx" ON "VendorRateInsurance"("ageTierId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorRateInsurance_vendorRateId_ageTierId_key" ON "VendorRateInsurance"("vendorRateId", "ageTierId");

-- CreateIndex
CREATE INDEX "VendorRate_rateGroupId_idx" ON "VendorRate"("rateGroupId");

-- AddForeignKey
ALTER TABLE "VendorRate" ADD CONSTRAINT "VendorRate_rateGroupId_fkey" FOREIGN KEY ("rateGroupId") REFERENCES "VendorRateGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorRateGroup" ADD CONSTRAINT "VendorRateGroup_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorRateGroup" ADD CONSTRAINT "VendorRateGroup_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorRateGroupProvince" ADD CONSTRAINT "VendorRateGroupProvince_rateGroupId_fkey" FOREIGN KEY ("rateGroupId") REFERENCES "VendorRateGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorRateGroupProvince" ADD CONSTRAINT "VendorRateGroupProvince_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorRateOverride" ADD CONSTRAINT "VendorRateOverride_rateGroupId_fkey" FOREIGN KEY ("rateGroupId") REFERENCES "VendorRateGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorRateOverride" ADD CONSTRAINT "VendorRateOverride_replacementGroupId_fkey" FOREIGN KEY ("replacementGroupId") REFERENCES "VendorRateGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorRateInsurance" ADD CONSTRAINT "VendorRateInsurance_vendorRateId_fkey" FOREIGN KEY ("vendorRateId") REFERENCES "VendorRate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorRateInsurance" ADD CONSTRAINT "VendorRateInsurance_ageTierId_fkey" FOREIGN KEY ("ageTierId") REFERENCES "AgeTier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
