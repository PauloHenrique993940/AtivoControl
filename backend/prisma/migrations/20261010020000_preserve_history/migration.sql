-- DropForeignKey
ALTER TABLE "Movement" DROP CONSTRAINT "Movement_armamentId_fkey";

-- DropForeignKey
ALTER TABLE "Movement" DROP CONSTRAINT "Movement_ammunitionId_fkey";

-- DropForeignKey
ALTER TABLE "Movement" DROP CONSTRAINT "Movement_responsibleId_fkey";

-- AddForeignKey
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_armamentId_fkey" FOREIGN KEY ("armamentId") REFERENCES "Armament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_ammunitionId_fkey" FOREIGN KEY ("ammunitionId") REFERENCES "Ammunition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "Responsible"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
