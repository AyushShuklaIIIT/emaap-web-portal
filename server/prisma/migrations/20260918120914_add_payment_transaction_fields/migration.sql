/*
  Warnings:

  - A unique constraint covering the columns `[transaction_id]` on the table `paymentReceipts` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('UPI', 'NET_BANKING', 'NEFT_RTGS');

-- AlterTable
ALTER TABLE "paymentReceipts" ADD COLUMN     "due_date" TIMESTAMP(3),
ADD COLUMN     "payment_method" "PaymentMethod",
ADD COLUMN     "transaction_date" TIMESTAMP(3),
ADD COLUMN     "transaction_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "paymentReceipts_transaction_id_key" ON "paymentReceipts"("transaction_id");
