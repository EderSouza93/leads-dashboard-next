-- CreateTable
CREATE TABLE "Lead" (
    "id" SERIAL NOT NULL,
    "bitrixId" TEXT NOT NULL,
    "title" TEXT,
    "sourceId" TEXT,
    "assignedById" TEXT,
    "stageId" TEXT,
    "bitrixCreatedAt" TIMESTAMP(3) NOT NULL,
    "localCreatedAt" TIMESTAMP(3) NOT NULL,
    "localDate" TEXT NOT NULL,
    "rawData" TEXT NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lead_bitrixId_key" ON "Lead"("bitrixId");
