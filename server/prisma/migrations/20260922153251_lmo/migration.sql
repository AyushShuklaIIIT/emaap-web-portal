/*
  Warnings:

  - The values [INSPECTOR] on the enum `RoleType` will be removed. If these variants are still used in the database, this will fail.
  - The primary key for the `lmoOfficers` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `officer_id` on the `lmoOfficers` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[employee_id]` on the table `lmoOfficers` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `employee_id` to the `lmoOfficers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "RoleType_new" AS ENUM ('STAKEHOLDER', 'LMO', 'ADMIN', 'LEGAL_OFFICER', 'GATC_OPERATOR');
ALTER TABLE "users" ALTER COLUMN "registrationRole" TYPE "RoleType_new" USING ("registrationRole"::text::"RoleType_new");
ALTER TABLE "RegistrationApplication" ALTER COLUMN "role" TYPE "RoleType_new" USING ("role"::text::"RoleType_new");
ALTER TYPE "RoleType" RENAME TO "RoleType_old";
ALTER TYPE "RoleType_new" RENAME TO "RoleType";
DROP TYPE "public"."RoleType_old";
COMMIT;

-- AlterTable
ALTER TABLE "lmoOfficers" DROP CONSTRAINT "lmoOfficers_pkey",
DROP COLUMN "officer_id",
ADD COLUMN     "employee_id" TEXT NOT NULL,
ADD CONSTRAINT "lmoOfficers_pkey" PRIMARY KEY ("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "lmoOfficers_employee_id_key" ON "lmoOfficers"("employee_id");
