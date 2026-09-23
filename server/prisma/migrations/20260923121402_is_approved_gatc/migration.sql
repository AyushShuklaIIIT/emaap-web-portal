/*
  Warnings:

  - Added the required column `isApprovedForGatc` to the `instrumentCategories` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "instrumentCategories" ADD COLUMN     "isApprovedForGatc" BOOLEAN NOT NULL;
