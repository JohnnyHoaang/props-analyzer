import { PrismaClient } from '@prisma/client';
import {
  gameFixtures,
  playerFixtures,
  playerGameStatFixtures,
  seasonFixtures,
  teamFixtures,
  userFixtures,
} from '../src/mock-data/index.js';

const prisma = new PrismaClient();

/**
 * Idempotent by design: every fixture is upserted by its fixed fixture id,
 * so running `pnpm db:seed` repeatedly never creates duplicates.
 */
async function main() {
  for (const user of userFixtures) {
    await prisma.user.upsert({
      where: { id: user.id },
      create: user,
      update: user,
    });
  }

  for (const team of teamFixtures) {
    await prisma.team.upsert({
      where: { id: team.id },
      create: team,
      update: team,
    });
  }

  for (const player of playerFixtures) {
    await prisma.player.upsert({
      where: { id: player.id },
      create: player,
      update: player,
    });
  }

  for (const season of seasonFixtures) {
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

  for (const game of gameFixtures) {
    await prisma.game.upsert({
      where: { id: game.id },
      create: { ...game, date: new Date(game.date) },
      update: { ...game, date: new Date(game.date) },
    });
  }

  for (const stat of playerGameStatFixtures) {
    await prisma.playerGameStat.upsert({
      where: { playerId_gameId: { playerId: stat.playerId, gameId: stat.gameId } },
      create: stat,
      update: stat,
    });
  }

  console.log(
    `Seeded ${userFixtures.length} users, ${teamFixtures.length} teams, ` +
      `${playerFixtures.length} players, ${seasonFixtures.length} season(s), ` +
      `${gameFixtures.length} games, ${playerGameStatFixtures.length} box scores.`
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
