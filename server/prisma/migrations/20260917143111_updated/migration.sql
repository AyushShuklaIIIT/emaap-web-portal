/*
  Warnings:

  - Added the required column `lat` to the `gatcCentres` table without a default value. This is not possible if the table is not empty.
  - Added the required column `long` to the `gatcCentres` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "businessProfiles_state_id_key";

-- AlterTable
ALTER TABLE "gatcCentres" ADD COLUMN     "lat" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "long" DOUBLE PRECISION NOT NULL;
