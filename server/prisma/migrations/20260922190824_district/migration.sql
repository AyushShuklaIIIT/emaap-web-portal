/*
  Warnings:

  - Added the required column `district` to the `measuringInstruments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "measuringInstruments" ADD COLUMN     "district" TEXT NOT NULL;
