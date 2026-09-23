/*
  Warnings:

  - You are about to drop the column `district` on the `measuringInstruments` table. All the data in the column will be lost.
  - You are about to drop the column `jurisdiction_district` on the `users` table. All the data in the column will be lost.
  - Added the required column `district_id` to the `businessProfiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `district_id` to the `measuringInstruments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jurisdiction_district_id` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "businessProfiles" ADD COLUMN     "district_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "measuringInstruments" DROP COLUMN "district",
ADD COLUMN     "district_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "jurisdiction_district",
ADD COLUMN     "jurisdiction_district_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "districts" (
    "district_id" TEXT NOT NULL,
    "district_no" TEXT NOT NULL,
    "district_code" TEXT NOT NULL,
    "district_name" TEXT NOT NULL,
    "state_id" TEXT NOT NULL,

    CONSTRAINT "districts_pkey" PRIMARY KEY ("district_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "districts_district_no_key" ON "districts"("district_no");

-- CreateIndex
CREATE UNIQUE INDEX "districts_district_code_key" ON "districts"("district_code");

-- CreateIndex
CREATE INDEX "districts_state_id_idx" ON "districts"("state_id");

-- CreateIndex
CREATE UNIQUE INDEX "districts_state_id_district_name_key" ON "districts"("state_id", "district_name");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_jurisdiction_district_id_fkey" FOREIGN KEY ("jurisdiction_district_id") REFERENCES "districts"("district_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "businessProfiles" ADD CONSTRAINT "businessProfiles_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "districts"("district_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "measuringInstruments" ADD CONSTRAINT "measuringInstruments_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "districts"("district_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "districts" ADD CONSTRAINT "districts_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "states"("state_id") ON DELETE RESTRICT ON UPDATE CASCADE;
