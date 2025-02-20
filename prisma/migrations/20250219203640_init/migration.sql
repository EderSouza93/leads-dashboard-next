-- CreateTable
CREATE TABLE "leads" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bitrixId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "bitrixCreatedAt" DATETIME NOT NULL,
    "localCreatedAt" DATETIME NOT NULL,
    "localDate" TEXT NOT NULL,
    "rawData" JSONB NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "leads_bitrixId_key" ON "leads"("bitrixId");
