import { PrismaClient } from '@prisma/client';
import { loadMockDataFile } from '../src/mock-data/load-mock-data.js';

const prisma = new PrismaClient();

/**
 * Idempotent by design: every row is upserted by its fixed id (or composite
 * key for box scores), so running `pnpm db:seed` repeatedly never creates
 * duplicates. Reads from `mock-data.json` — the same file the API uses in
 * mock mode — so Postgres and JSON-backed dev stay in sync.
 */
async function main() {
  const data = loadMockDataFile();

  for (const user of data.users) {
    await prisma.user.upsert({
      where: { id: user.id },
      create: user,
      update: user,
    });
  }

  for (const team of data.teams) {
    await prisma.team.upsert({
      where: { id: team.id },
      create: team,
      update: team,
    });
  }

  for (const player of data.players) {
    await prisma.player.upsert({
      where: { id: player.id },
      create: player,
      update: player,
    });
  }

  for (const season of data.seasons) {
    await prisma.season.upsert({
      where: { id: season.id },
      create: {
        ...season,
        startDate: new Date(season.startDate),
        endDate: new Date(season.endDate),
      },
      update: {
        ...season,
        startDate: new Date(season.startDate),
        endDate: new Date(season.endDate),
      },
    });
  }

  for (const game of data.games) {
    await prisma.game.upsert({
      where: { id: game.id },
      create: { ...game, date: new Date(game.date) },
      update: { ...game, date: new Date(game.date) },
    });
  }

  for (const stat of data.playerGameStats) {
    await prisma.playerGameStat.upsert({
      where: {
        playerId_gameId: { playerId: stat.playerId, gameId: stat.gameId },
      },
      create: stat,
      update: stat,
    });
  }

  for (const report of data.injuryReports) {
    await prisma.injuryReport.upsert({
      where: { id: report.id },
      create: {
        ...report,
        reportedAt: new Date(report.reportedAt),
        expectedReturn: report.expectedReturn
          ? new Date(report.expectedReturn)
          : null,
      },
      update: {
        ...report,
        reportedAt: new Date(report.reportedAt),
        expectedReturn: report.expectedReturn
          ? new Date(report.expectedReturn)
          : null,
      },
    });
  }

  for (const report of data.lineupReports) {
    await prisma.lineupReport.upsert({
      where: { id: report.id },
      create: { ...report, reportedAt: new Date(report.reportedAt) },
      update: { ...report, reportedAt: new Date(report.reportedAt) },
    });
  }

  for (const propLine of data.propLines) {
    await prisma.propLine.upsert({
      where: { id: propLine.id },
      create: propLine,
      update: propLine,
    });
  }

  console.log(
    `Seeded ${data.users.length} users, ${data.teams.length} teams, ` +
      `${data.players.length} players, ${data.seasons.length} season(s), ` +
      `${data.games.length} games, ${data.playerGameStats.length} box scores, ` +
      `${data.injuryReports.length} injury reports, ` +
      `${data.lineupReports.length} lineup reports, ` +
      `${data.propLines.length} prop lines.`
  );
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
