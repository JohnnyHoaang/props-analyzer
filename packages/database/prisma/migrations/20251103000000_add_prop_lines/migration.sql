-- CreateEnum
CREATE TYPE "StatType" AS ENUM ('POINTS', 'REBOUNDS', 'ASSISTS', 'THREES_MADE', 'STEALS', 'BLOCKS', 'TURNOVERS', 'PTS_REB', 'PTS_AST', 'REB_AST', 'PTS_REB_AST');

-- CreateTable
CREATE TABLE "prop_lines" (
    "id" TEXT NOT NULL,
    "statType" "StatType" NOT NULL,
    "line" DOUBLE PRECISION NOT NULL,
    "overOdds" INTEGER NOT NULL,
    "underOdds" INTEGER NOT NULL,
    "projection" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "playerId" TEXT NOT NULL,

    CONSTRAINT "prop_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "prop_lines_playerId_idx" ON "prop_lines"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "prop_lines_playerId_statType_key" ON "prop_lines"("playerId", "statType");

-- AddForeignKey
ALTER TABLE "prop_lines" ADD CONSTRAINT "prop_lines_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
