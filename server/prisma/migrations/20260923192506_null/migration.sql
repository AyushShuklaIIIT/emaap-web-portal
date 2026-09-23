-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_jurisdiction_district_id_fkey";

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "jurisdiction_district_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_jurisdiction_district_id_fkey" FOREIGN KEY ("jurisdiction_district_id") REFERENCES "districts"("district_id") ON DELETE SET NULL ON UPDATE CASCADE;
