CREATE TYPE "RoleType" AS ENUM (
    'STAKEHOLDER',
    'INSPECTOR',
    'ADMIN',
    'LEGAL_OFFICER',
    'GATC_OPERATOR'
);

CREATE TYPE "StakeholderCategory" AS ENUM (
    'MANUFACTURER',
    'DEALER',
    'REPAIRER',
    'IMPORTER',
    'PACKER',
    'TRADER'
);

CREATE TYPE "ApplicationStatus" AS ENUM (
    'OTP_PENDING',
    'SUBMITTED',
    'UNDER_REVIEW',
    'APPROVED',
    'REJECTED'
);

ALTER TABLE "users"
    ADD COLUMN "mobile" TEXT,
    ADD COLUMN "passwordHash" TEXT,
    ADD COLUMN "registrationRole" "RoleType",
    ADD COLUMN "category" "StakeholderCategory",
    ADD COLUMN "fullName" TEXT,
    ADD COLUMN "employeeId" TEXT,
    ADD COLUMN "businessName" TEXT,
    ADD COLUMN "tradeLicenseNo" TEXT,
    ADD COLUMN "gstin" TEXT,
    ADD COLUMN "pan" TEXT,
    ADD COLUMN "aadhaarMasked" TEXT,
    ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "mobileVerified" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX "users_mobile_key" ON "users"("mobile");

CREATE TABLE "RegistrationApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "RoleType" NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'OTP_PENDING',
    "rejectionReason" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistrationApplication_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RegistrationApplication_userId_idx"
    ON "RegistrationApplication"("userId");
CREATE INDEX "RegistrationApplication_status_idx"
    ON "RegistrationApplication"("status");

CREATE TABLE "OtpVerificationSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mobileOtp" TEXT,
    "emailOtp" TEXT,
    "mobileVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "resendCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpVerificationSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OtpVerificationSession_userId_expiresAt_idx"
    ON "OtpVerificationSession"("userId", "expiresAt");

CREATE TABLE "UserDocument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserDocument_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "UserDocument_userId_idx" ON "UserDocument"("userId");

ALTER TABLE "RegistrationApplication"
    ADD CONSTRAINT "RegistrationApplication_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("user_id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "RegistrationApplication"
    ADD CONSTRAINT "RegistrationApplication_reviewedBy_fkey"
    FOREIGN KEY ("reviewedBy") REFERENCES "users"("user_id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OtpVerificationSession"
    ADD CONSTRAINT "OtpVerificationSession_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("user_id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserDocument"
    ADD CONSTRAINT "UserDocument_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("user_id")
    ON DELETE CASCADE ON UPDATE CASCADE;
