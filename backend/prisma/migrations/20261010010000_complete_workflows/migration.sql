-- AlterTable
ALTER TABLE "User" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "preferences" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "tokenVersion" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Armament" ADD COLUMN     "dataManutencao" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Movement" ADD COLUMN     "destino" TEXT,
ADD COLUMN     "quantidade" INTEGER;

-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "data" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationRead" (
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationRead_pkey" PRIMARY KEY ("userId","key")
);

-- CreateIndex
CREATE INDEX "Movement_armamentId_data_idx" ON "Movement"("armamentId", "data");

-- CreateIndex
CREATE INDEX "Movement_ammunitionId_responsibleId_idx" ON "Movement"("ammunitionId", "responsibleId");

-- CreateIndex
CREATE INDEX "Movement_data_idx" ON "Movement"("data");

-- CreateIndex
CREATE INDEX "AuditLog_data_idx" ON "AuditLog"("data");

-- AddForeignKey
ALTER TABLE "NotificationRead" ADD CONSTRAINT "NotificationRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
