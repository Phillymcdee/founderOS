-- CreateTable
CREATE TABLE "BusinessIntentConfig" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "targetMrr" INTEGER NOT NULL,
    "acceptableChurnRate" DOUBLE PRECISION NOT NULL,
    "alertChurnRate" DOUBLE PRECISION NOT NULL,
    "alertRunwayMonths" INTEGER,
    "summaryTone" TEXT NOT NULL,
    "summaryMaxActions" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessIntentConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdeaIntentConfig" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "arpuFloor" INTEGER NOT NULL,
    "excludedDomains" TEXT[],
    "founderStrengths" TEXT[],
    "agentFitKeywords" TEXT[],
    "minScoreForExperiment" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdeaIntentConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BusinessIntentConfig_tenantId_key" ON "BusinessIntentConfig"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "IdeaIntentConfig_tenantId_key" ON "IdeaIntentConfig"("tenantId");

-- AddForeignKey
ALTER TABLE "BusinessIntentConfig" ADD CONSTRAINT "BusinessIntentConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdeaIntentConfig" ADD CONSTRAINT "IdeaIntentConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
