/*
  Warnings:

  - You are about to drop the column `employee_code` on the `lmoOfficers` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "lmoOfficers_employee_code_key";

-- AlterTable
ALTER TABLE "lmoOfficers" DROP COLUMN "employee_code";
