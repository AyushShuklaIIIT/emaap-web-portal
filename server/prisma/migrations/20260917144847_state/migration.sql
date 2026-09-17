/*
  Warnings:

  - Made the column `jurisdiction_district` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `jurisdiction_state` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "users" ALTER COLUMN "jurisdiction_district" SET NOT NULL,
ALTER COLUMN "jurisdiction_state" SET NOT NULL;
