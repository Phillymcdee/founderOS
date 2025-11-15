-- AlterTable
ALTER TABLE "Idea" ADD COLUMN     "arpuEstimate" INTEGER,
ADD COLUMN     "founderFitSignal" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "icpDescription" TEXT,
ADD COLUMN     "manualWorkHeavy" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "regulatedConcern" BOOLEAN NOT NULL DEFAULT false;
