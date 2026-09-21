/*
  Warnings:

  - Made the column `mobile` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `passwordHash` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `registrationRole` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `fullName` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
ALTER TYPE "InstrumentStatus" ADD VALUE 'PENDING';

-- DropForeignKey
ALTER TABLE "OtpVerificationSession" DROP CONSTRAINT "OtpVerificationSession_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserDocument" DROP CONSTRAINT "UserDocument_userId_fkey";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "fingerprint_registered" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "mobile" SET NOT NULL,
ALTER COLUMN "passwordHash" SET NOT NULL,
ALTER COLUMN "registrationRole" SET NOT NULL,
ALTER COLUMN "fullName" SET NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "generatedCertificates" (
    "certificateId" TEXT NOT NULL,
    "instrumentCategory" TEXT,
    "instrumentSerialNumber" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "long" DOUBLE PRECISION NOT NULL,
    "sealImageUrls" TEXT[],
    "hash" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verificationSignature" TEXT,
    "status" TEXT NOT NULL DEFAULT 'APPROVED_CHECKLIST',
    "tokenHash" TEXT,

    CONSTRAINT "generatedCertificates_pkey" PRIMARY KEY ("certificateId")
);

-- AddForeignKey
ALTER TABLE "OtpVerificationSession" ADD CONSTRAINT "OtpVerificationSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDocument" ADD CONSTRAINT "UserDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
