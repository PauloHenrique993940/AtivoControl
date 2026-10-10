CREATE TABLE "Vest" (
    "id" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "tamanho" TEXT NOT NULL,
    "nivelProtecao" TEXT NOT NULL,
    "numSerie" TEXT NOT NULL,
    "numPatrimonio" TEXT NOT NULL,
    "dataAquisicao" TIMESTAMP(3) NOT NULL,
    "dataFabricacao" TIMESTAMP(3),
    "dataValidade" TIMESTAMP(3),
    "dataManutencao" TIMESTAMP(3),
    "local" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ESTOQUE',
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Vest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Vest_numSerie_key" ON "Vest"("numSerie");
CREATE UNIQUE INDEX "Vest_numPatrimonio_key" ON "Vest"("numPatrimonio");
ALTER TABLE "Movement" ADD COLUMN "vestId" TEXT;
CREATE INDEX "Movement_vestId_data_idx" ON "Movement"("vestId", "data");
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_vestId_fkey" FOREIGN KEY ("vestId") REFERENCES "Vest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
