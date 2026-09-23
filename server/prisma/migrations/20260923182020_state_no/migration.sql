/*
  Warnings:

  - A unique constraint covering the columns `[state_no]` on the table `states` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `state_no` to the `states` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "states" ADD COLUMN     "state_no" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "states_state_no_key" ON "states"("state_no");
