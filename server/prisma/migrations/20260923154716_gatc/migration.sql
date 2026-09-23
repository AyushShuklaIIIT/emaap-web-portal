-- AlterTable
ALTER TABLE "users" ADD COLUMN     "gatc_id" TEXT;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_gatc_id_fkey" FOREIGN KEY ("gatc_id") REFERENCES "gatcCentres"("gatc_id") ON DELETE SET NULL ON UPDATE CASCADE;
