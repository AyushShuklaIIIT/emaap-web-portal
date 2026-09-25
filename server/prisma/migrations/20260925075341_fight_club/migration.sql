-- AlterTable
ALTER TABLE "paymentReceipts" ALTER COLUMN "carriage_charges" DROP NOT NULL,
ALTER COLUMN "adjusting_charges" DROP NOT NULL;
