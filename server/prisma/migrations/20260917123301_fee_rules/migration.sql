/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('BUSINESS', 'LMO', 'GATC_PRINCIPAL', 'ADMIN');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('MANUFACTURER', 'DEALER', 'USER');

-- CreateEnum
CREATE TYPE "GatcStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'REVOKED');

-- CreateEnum
CREATE TYPE "AccuracyClass" AS ENUM ('CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII');

-- CreateEnum
CREATE TYPE "InstrumentStatus" AS ENUM ('VERIFIED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AppType" AS ENUM ('INITIAL', 'RE_VERIFICATION');

-- CreateEnum
CREATE TYPE "WorkflowStatus" AS ENUM ('SUBMITTED', 'ALLOCATED', 'CERTIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "InspectionMode" AS ENUM ('FIELD_OFFLINE', 'LAB');

-- CreateEnum
CREATE TYPE "TestVerdict" AS ENUM ('PASS', 'FAIL');

-- CreateEnum
CREATE TYPE "SealType" AS ENUM ('LEAD_WIRE', 'HOLOGRAM_STICKER');

-- CreateEnum
CREATE TYPE "FeeBasis" AS ENUM ('PER_PIECE', 'PER_METRE', 'PER_LITRE', 'FIXED');

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "users" (
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "jurisdiction_district" TEXT,
    "jurisdiction_state" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "businessProfiles" (
    "business_id" TEXT NOT NULL,
    "registration_number" TEXT NOT NULL,
    "trade_name" TEXT NOT NULL,
    "entity_type" "EntityType" NOT NULL,
    "geo_address" TEXT NOT NULL,
    "state_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "businessProfiles_pkey" PRIMARY KEY ("business_id")
);

-- CreateTable
CREATE TABLE "gatcCentres" (
    "gatc_id" TEXT NOT NULL,
    "centre_code" TEXT NOT NULL,
    "approval_cert_no" TEXT NOT NULL,
    "ind_mark_code" TEXT NOT NULL,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_to" TIMESTAMP(3) NOT NULL,
    "status" "GatcStatus" NOT NULL,
    "approved_categories" TEXT[],
    "principal_officer_id" TEXT NOT NULL,

    CONSTRAINT "gatcCentres_pkey" PRIMARY KEY ("gatc_id")
);

-- CreateTable
CREATE TABLE "instrumentCategories" (
    "category_id" TEXT NOT NULL,
    "category_code" TEXT NOT NULL,
    "category_name" TEXT NOT NULL,
    "accuracy_class" "AccuracyClass" NOT NULL,
    "oiml_standard_ref" TEXT NOT NULL,
    "verification_cycle_months" INTEGER NOT NULL,

    CONSTRAINT "instrumentCategories_pkey" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "measuringInstruments" (
    "instrument_id" TEXT NOT NULL,
    "serial_number" TEXT NOT NULL,
    "model_approval_no" TEXT NOT NULL,
    "manufacturer_name" TEXT NOT NULL,
    "capacity_value" DECIMAL(12,3),
    "capacity_unit" TEXT,
    "geo_location" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "status" "InstrumentStatus" NOT NULL,

    CONSTRAINT "measuringInstruments_pkey" PRIMARY KEY ("instrument_id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "app_id" TEXT NOT NULL,
    "application_no" TEXT NOT NULL,
    "app_type" "AppType" NOT NULL,
    "submission_timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workflow_status" "WorkflowStatus" NOT NULL,
    "instrument_id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "assigned_officer_id" TEXT,
    "assigned_gatc_id" TEXT,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("app_id")
);

-- CreateTable
CREATE TABLE "paymentReceipts" (
    "receipt_id" TEXT NOT NULL,
    "receipt_no" TEXT NOT NULL,
    "statutory_fee" DOUBLE PRECISION NOT NULL,
    "carriage_charges" DOUBLE PRECISION NOT NULL,
    "adjusting_charges" DOUBLE PRECISION NOT NULL,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "govt_share" DOUBLE PRECISION NOT NULL,
    "gatc_share" DOUBLE PRECISION NOT NULL,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "app_id" TEXT NOT NULL,

    CONSTRAINT "paymentReceipts_pkey" PRIMARY KEY ("receipt_id")
);

-- CreateTable
CREATE TABLE "inspectionRecords" (
    "inspection_id" TEXT NOT NULL,
    "inspection_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "time_taken_minutes" INTEGER NOT NULL,
    "inspection_mode" "InspectionMode" NOT NULL,
    "test_verdict" "TestVerdict" NOT NULL,
    "geo_latitude" DOUBLE PRECISION NOT NULL,
    "geo_longitude" DOUBLE PRECISION NOT NULL,
    "offline_sync_timestamp" TIMESTAMP(3),
    "inspector_id" TEXT NOT NULL,
    "app_id" TEXT NOT NULL,

    CONSTRAINT "inspectionRecords_pkey" PRIMARY KEY ("inspection_id")
);

-- CreateTable
CREATE TABLE "sealEvidences" (
    "seal_id" TEXT NOT NULL,
    "seal_number" TEXT NOT NULL,
    "seal_type" "SealType" NOT NULL,
    "s3_photo_url" TEXT NOT NULL,
    "geo_lat" DOUBLE PRECISION NOT NULL,
    "geo_long" DOUBLE PRECISION NOT NULL,
    "captured_at" TIMESTAMP(3) NOT NULL,
    "photo_sha256" TEXT NOT NULL,
    "inspection_id" TEXT NOT NULL,

    CONSTRAINT "sealEvidences_pkey" PRIMARY KEY ("seal_id")
);

-- CreateTable
CREATE TABLE "digitalCertificates" (
    "cert_id" TEXT NOT NULL,
    "certificate_no" TEXT NOT NULL,
    "stamping_quarter_code" TEXT NOT NULL,
    "issue_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiry_date" TIMESTAMP(3) NOT NULL,
    "sha256_hash" TEXT NOT NULL,
    "dynamic_qr_url" TEXT NOT NULL,
    "rejection_reason" TEXT,
    "inspection_id" TEXT NOT NULL,
    "instrument_id" TEXT NOT NULL,

    CONSTRAINT "digitalCertificates_pkey" PRIMARY KEY ("cert_id")
);

-- CreateTable
CREATE TABLE "technical_specs" (
    "_id" TEXT NOT NULL,
    "spec_data" JSONB NOT NULL,
    "instrument_id" TEXT NOT NULL,

    CONSTRAINT "technical_specs_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "states" (
    "state_id" TEXT NOT NULL,
    "state_code" TEXT NOT NULL,
    "state_name" TEXT NOT NULL,

    CONSTRAINT "states_pkey" PRIMARY KEY ("state_id")
);

-- CreateTable
CREATE TABLE "feeRules" (
    "fee_rule_id" TEXT NOT NULL,
    "state_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "min_value" DECIMAL(12,3),
    "max_value" DECIMAL(12,3),
    "unit" TEXT NOT NULL,
    "fee_amount" DECIMAL(10,2) NOT NULL,
    "fee_basis" "FeeBasis" NOT NULL,
    "condition" TEXT,
    "additional_fee" DECIMAL(10,2),
    "additional_unit" DECIMAL(12,3),
    "maximum_fee" DECIMAL(10,2),

    CONSTRAINT "feeRules_pkey" PRIMARY KEY ("fee_rule_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "businessProfiles_registration_number_key" ON "businessProfiles"("registration_number");

-- CreateIndex
CREATE UNIQUE INDEX "businessProfiles_state_id_key" ON "businessProfiles"("state_id");

-- CreateIndex
CREATE UNIQUE INDEX "businessProfiles_user_id_key" ON "businessProfiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "gatcCentres_centre_code_key" ON "gatcCentres"("centre_code");

-- CreateIndex
CREATE UNIQUE INDEX "gatcCentres_principal_officer_id_key" ON "gatcCentres"("principal_officer_id");

-- CreateIndex
CREATE UNIQUE INDEX "instrumentCategories_category_code_key" ON "instrumentCategories"("category_code");

-- CreateIndex
CREATE UNIQUE INDEX "verifications_application_no_key" ON "verifications"("application_no");

-- CreateIndex
CREATE UNIQUE INDEX "paymentReceipts_receipt_no_key" ON "paymentReceipts"("receipt_no");

-- CreateIndex
CREATE UNIQUE INDEX "paymentReceipts_app_id_key" ON "paymentReceipts"("app_id");

-- CreateIndex
CREATE UNIQUE INDEX "digitalCertificates_certificate_no_key" ON "digitalCertificates"("certificate_no");

-- CreateIndex
CREATE UNIQUE INDEX "digitalCertificates_inspection_id_key" ON "digitalCertificates"("inspection_id");

-- CreateIndex
CREATE UNIQUE INDEX "technical_specs_instrument_id_key" ON "technical_specs"("instrument_id");

-- CreateIndex
CREATE UNIQUE INDEX "states_state_code_key" ON "states"("state_code");

-- CreateIndex
CREATE UNIQUE INDEX "states_state_name_key" ON "states"("state_name");

-- AddForeignKey
ALTER TABLE "businessProfiles" ADD CONSTRAINT "businessProfiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "businessProfiles" ADD CONSTRAINT "businessProfiles_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "states"("state_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gatcCentres" ADD CONSTRAINT "gatcCentres_principal_officer_id_fkey" FOREIGN KEY ("principal_officer_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "measuringInstruments" ADD CONSTRAINT "measuringInstruments_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businessProfiles"("business_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "measuringInstruments" ADD CONSTRAINT "measuringInstruments_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "instrumentCategories"("category_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_instrument_id_fkey" FOREIGN KEY ("instrument_id") REFERENCES "measuringInstruments"("instrument_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businessProfiles"("business_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_assigned_officer_id_fkey" FOREIGN KEY ("assigned_officer_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_assigned_gatc_id_fkey" FOREIGN KEY ("assigned_gatc_id") REFERENCES "gatcCentres"("gatc_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paymentReceipts" ADD CONSTRAINT "paymentReceipts_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "verifications"("app_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspectionRecords" ADD CONSTRAINT "inspectionRecords_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "verifications"("app_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspectionRecords" ADD CONSTRAINT "inspectionRecords_inspector_id_fkey" FOREIGN KEY ("inspector_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sealEvidences" ADD CONSTRAINT "sealEvidences_inspection_id_fkey" FOREIGN KEY ("inspection_id") REFERENCES "inspectionRecords"("inspection_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digitalCertificates" ADD CONSTRAINT "digitalCertificates_inspection_id_fkey" FOREIGN KEY ("inspection_id") REFERENCES "inspectionRecords"("inspection_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digitalCertificates" ADD CONSTRAINT "digitalCertificates_instrument_id_fkey" FOREIGN KEY ("instrument_id") REFERENCES "measuringInstruments"("instrument_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technical_specs" ADD CONSTRAINT "technical_specs_instrument_id_fkey" FOREIGN KEY ("instrument_id") REFERENCES "measuringInstruments"("instrument_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feeRules" ADD CONSTRAINT "feeRules_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "states"("state_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feeRules" ADD CONSTRAINT "feeRules_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "instrumentCategories"("category_id") ON DELETE RESTRICT ON UPDATE CASCADE;
