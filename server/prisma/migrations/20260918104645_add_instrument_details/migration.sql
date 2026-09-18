/*
  Warnings:

  - You are about to drop the column `geo_location` on the `measuringInstruments` table. All the data in the column will be lost.
  - Added the required column `accuracy_class` to the `measuringInstruments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `address` to the `measuringInstruments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lat` to the `measuringInstruments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `long` to the `measuringInstruments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `metric` to the `measuringInstruments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `model_no` to the `measuringInstruments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pincode` to the `measuringInstruments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `state` to the `measuringInstruments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "measuringInstruments" DROP COLUMN "geo_location",
ADD COLUMN     "accuracy_class" "AccuracyClass" NOT NULL,
ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "lat" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "long" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "metric" TEXT NOT NULL,
ADD COLUMN     "model_no" TEXT NOT NULL,
ADD COLUMN     "pincode" INTEGER NOT NULL,
ADD COLUMN     "state" TEXT NOT NULL,
ALTER COLUMN "model_approval_no" DROP NOT NULL;
