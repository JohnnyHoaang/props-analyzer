-- CreateEnum
CREATE TYPE "InjuryStatus" AS ENUM ('OUT', 'DOUBTFUL', 'QUESTIONABLE', 'PROBABLE', 'ACTIVE');

-- CreateEnum
CREATE TYPE "LineupRole" AS ENUM ('STARTER', 'BENCH', 'OUT');

-- CreateEnum
CREATE TYPE "LineupConfirmation" AS ENUM ('EXPECTED', 'CONFIRMED');

-- CreateTable
CREATE TABLE "injury_reports" (
    "id" TEXT NOT NULL,
    "status" "InjuryStatus" NOT NULL,
    "description" TEXT,
    "reportedAt" TIMESTAMP(3) NOT NULL,
    "expectedReturn" TIMESTAMP(3),
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "playerId" TEXT NOT NULL,

    CONSTRAINT "injury_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lineup_reports" (
    "id" TEXT NOT NULL,
    "role" "LineupRole" NOT NULL,
    "confirmation" "LineupConfirmation" NOT NULL,
    "reportedAt" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "playerId" TEXT NOT NULL,

    CONSTRAINT "lineup_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "injury_reports_playerId_idx" ON "injury_reports"("playerId");

-- CreateIndex
CREATE INDEX "injury_reports_reportedAt_idx" ON "injury_reports"("reportedAt");

-- CreateIndex
CREATE INDEX "lineup_reports_playerId_idx" ON "lineup_reports"("playerId");

-- CreateIndex
CREATE INDEX "lineup_reports_reportedAt_idx" ON "lineup_reports"("reportedAt");

-- AddForeignKey
ALTER TABLE "injury_reports" ADD CONSTRAINT "injury_reports_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lineup_reports" ADD CONSTRAINT "lineup_reports_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
