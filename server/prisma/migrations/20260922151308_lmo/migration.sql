-- CreateEnum
CREATE TYPE "LmoDesignation" AS ENUM ('INSPECTOR', 'ASSISTANT_CONTROLLER', 'DEPUTY_CONTROLLER', 'JOINT_CONTROLLER', 'CONTROLLER');

-- AlterTable
ALTER TABLE "measuringInstruments" ADD COLUMN     "error" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "lmoOfficers" (
    "officer_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "employee_code" TEXT NOT NULL,
    "designation" "LmoDesignation" NOT NULL DEFAULT 'INSPECTOR',
    "cadre" TEXT,
    "jurisdiction_zone" TEXT,
    "assigned_wsl_lab" TEXT,
    "is_nodal_officer" BOOLEAN NOT NULL DEFAULT false,
    "verification_stamp_code" TEXT,
    "digital_token_id" TEXT,
    "state_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lmoOfficers_pkey" PRIMARY KEY ("officer_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lmoOfficers_user_id_key" ON "lmoOfficers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "lmoOfficers_employee_code_key" ON "lmoOfficers"("employee_code");

-- CreateIndex
CREATE UNIQUE INDEX "lmoOfficers_verification_stamp_code_key" ON "lmoOfficers"("verification_stamp_code");

-- CreateIndex
CREATE INDEX "lmoOfficers_state_id_idx" ON "lmoOfficers"("state_id");

-- CreateIndex
CREATE INDEX "lmoOfficers_jurisdiction_zone_idx" ON "lmoOfficers"("jurisdiction_zone");

-- AddForeignKey
ALTER TABLE "lmoOfficers" ADD CONSTRAINT "lmoOfficers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lmoOfficers" ADD CONSTRAINT "lmoOfficers_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "states"("state_id") ON DELETE RESTRICT ON UPDATE CASCADE;
