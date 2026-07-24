import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import {
  RATE_LIMIT_DELAY_MS,
  fetchActivePlayers,
  fetchGames,
  fetchPlayerStats,
  fetchTeams,
  sleep,
} from '../src/bdl/client.js';
import {
  DEFAULT_HEIGHT,
  DEFAULT_WEIGHT,
  isFinalGame,
  isRealNbaTeam,
  mapGame,
  mapPlayer,
  mapSeason,
  mapStat,
  mapTeam,
} from '../src/bdl/map.js';
import type { PlayerFixture } from '../src/mock-data/players.js';

/**
 * Seasons to import (BDL uses the starting year, e.g. 2025 = the 2025-26
 * season). Override with `--season=2024` or `--season=2024,2025`.
 */
const SEASONS = parseSeasons(process.argv.slice(2)) ?? [2024, 2025];

function parseSeasons(argv: string[]): number[] | null {
  const arg = argv.find((a) => a.startsWith('--season='));
  if (!arg) {
    return null;
  }
  const years = arg
    .slice('--season='.length)
    .split(',')
    .map((y) => Number.parseInt(y.trim(), 10))
    .filter((y) => !Number.isNaN(y));
  return years.length > 0 ? years : null;
}

// Match prisma.config.ts / wipe-players.ts: the root .env is the single source
// of truth for DATABASE_URL (and BDL_API_KEY), so load it explicitly.
const dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.join(dirname, '..', '..', '..', '.env') });

/**
 * Loads real NBA teams, active players, seasons, games, and per-game box scores
 * from the balldontlie API into Postgres. Each run is a clean full reset: the
 * existing teams/players/games (and everything that references them) are wiped
 * first, then reloaded, so the DB ends up holding only BDL data.
 *
 * Because it wipes, it is guarded like scripts/wipe-players.ts: it refuses a
 * non-local database unless `--force`, and refuses to run at all unless `--yes`.
 * Seasons default to 2024-25 and 2025-26; override with `--season=2025`.
 *
 *   pnpm --filter @props-analyzer/database db:load-bdl --yes
 */
const args = new Set(process.argv.slice(2));
const confirmed = args.has('--yes');
const forced = args.has('--force');

const databaseUrl = process.env.DATABASE_URL ?? '';
const isLocal =
  databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');

const prisma = new PrismaClient();

async function main() {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set — nothing to connect to.');
  }
  if (!process.env.BDL_API_KEY) {
    throw new Error('BDL_API_KEY is not set — cannot call the balldontlie API.');
  }
  if (!isLocal && !forced) {
    throw new Error(
      `Refusing to wipe a non-local database (${redactUrl(databaseUrl)}). ` +
        'Pass --force to override (you almost certainly do not want to).'
    );
  }
  if (!confirmed) {
    throw new Error(
      'This will HARD-DELETE all teams and players (and their games, box ' +
        'scores, prop lines, and injury/lineup reports) before loading BDL ' +
        'data. Re-run with --yes to confirm.'
    );
  }

  console.log(`Loading seasons: ${SEASONS.join(', ')}.`);
  await wipeExistingData();
  const teamIds = await loadTeams();
  const players = await loadPlayers(teamIds);
  const { gameIds } = await loadSeasonsAndGames(teamIds);
  await loadStats(players, gameIds);
}

/**
 * Clears teams/players and every row that foreign-keys them, in dependency
 * order (see prisma/schema.prisma). Users and seasons are left intact — they
 * don't reference teams or players.
 */
async function wipeExistingData(): Promise<void> {
  await prisma.playerGameStat.deleteMany();
  await prisma.propLine.deleteMany();
  await prisma.injuryReport.deleteMany();
  await prisma.lineupReport.deleteMany();
  await prisma.game.deleteMany();
  await prisma.player.deleteMany();
  await prisma.team.deleteMany();
  console.log('Wiped existing teams, players, and dependent rows.');
}

async function loadTeams(): Promise<Set<string>> {
  const teams = (await fetchTeams()).filter(isRealNbaTeam).map(mapTeam);

  for (const team of teams) {
    await prisma.team.upsert({
      where: { id: team.id },
      create: team,
      update: team,
    });
  }

  console.log(`Loaded ${teams.length} teams.`);
  return new Set(teams.map((team) => team.id));
}

async function loadPlayers(teamIds: Set<string>): Promise<PlayerFixture[]> {
  const players = (await fetchActivePlayers()).map(mapPlayer);

  const loadedPlayers: PlayerFixture[] = [];
  let defaulted = 0;
  const skipped: string[] = [];

  for (const player of players) {
    if (!teamIds.has(player.teamId)) {
      // Active player on a team that was filtered out (e.g. no division) — its
      // FK would fail, so skip rather than fabricate a team.
      skipped.push(player.fullName);
      continue;
    }

    // height/weight of 0 are unambiguous sentinels for missing BDL data (no
    // real player has them). Position isn't counted here: 'SF' is also the
    // legitimate mapping for BDL 'F', so it can't distinguish a default.
    if (player.height === DEFAULT_HEIGHT || player.weight === DEFAULT_WEIGHT) {
      defaulted++;
    }

    await prisma.player.upsert({
      where: { id: player.id },
      create: player,
      update: player,
    });
    loadedPlayers.push(player);
  }

  console.log(
    `Loaded ${loadedPlayers.length} active players ` +
      `(${defaulted} had a defaulted height/weight, ` +
      `${skipped.length} skipped for an unloaded team).`
  );
  if (skipped.length > 0) {
    console.log(`Skipped: ${skipped.join(', ')}`);
  }

  return loadedPlayers;
}

/**
 * Upserts a Season row per requested year, then loads every completed game for
 * those seasons whose home and away teams were both loaded. Returns the set of
 * loaded game ids so stats referencing an unloaded game can be skipped.
 */
async function loadSeasonsAndGames(
  teamIds: Set<string>
): Promise<{ gameIds: Set<string> }> {
  const seasonIdByYear = new Map<number, string>();
  for (const year of SEASONS) {
    const season = mapSeason(year);
    await prisma.season.upsert({
      where: { label: season.label },
      create: season,
      update: season,
    });
    seasonIdByYear.set(year, season.id);
  }

  const games = await fetchGames(SEASONS);
  const gameIds = new Set<string>();
  let skipped = 0;

  for (const game of games) {
    const seasonId = seasonIdByYear.get(game.season);
    if (!seasonId || !isFinalGame(game.status)) {
      skipped++;
      continue;
    }

    const mapped = mapGame(game, seasonId);
    if (!teamIds.has(mapped.homeTeamId) || !teamIds.has(mapped.awayTeamId)) {
      skipped++;
      continue;
    }

    await prisma.game.upsert({
      where: { id: mapped.id },
      create: mapped,
      update: mapped,
    });
    gameIds.add(mapped.id);
  }

  console.log(
    `Loaded ${gameIds.size} games ` +
      `(${skipped} skipped: non-final or unloaded team).`
  );
  return { gameIds };
}

/**
 * For each loaded player, fetches their box scores across the requested seasons
 * and upserts one PlayerGameStat per game. DNP rows (0 minutes) and rows for a
 * game that wasn't loaded are skipped. Pauses `RATE_LIMIT_DELAY_MS` between
 * players to stay under the provider's 600 req/min limit.
 */
async function loadStats(
  players: PlayerFixture[],
  gameIds: Set<string>
): Promise<void> {
  let statsLoaded = 0;
  let playersWithData = 0;

  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    // Player ids are the raw BDL numeric id as a string, so this round-trips.
    const stats = await fetchPlayerStats(Number(player.id), SEASONS);

    let playerStatCount = 0;
    for (const stat of stats) {
      const mapped = mapStat(stat);
      if (mapped.minutes <= 0 || !gameIds.has(mapped.gameId)) {
        continue;
      }

      await prisma.playerGameStat.upsert({
        where: {
          playerId_gameId: {
            playerId: mapped.playerId,
            gameId: mapped.gameId,
          },
        },
        create: mapped,
        update: mapped,
      });
      playerStatCount++;
      statsLoaded++;
    }

    if (playerStatCount > 0) {
      playersWithData++;
    }

    if ((i + 1) % 50 === 0) {
      console.log(
        `  …processed ${i + 1}/${players.length} players ` +
          `(${statsLoaded} stats so far).`
      );
    }

    await sleep(RATE_LIMIT_DELAY_MS);
  }

  console.log(
    `Loaded ${statsLoaded} player game stats across ${playersWithData} ` +
      `players (of ${players.length}).`
  );
}

function redactUrl(url: string): string {
  return url.replace(/\/\/[^@]*@/, '//***@');
}

main()
  .catch((error) => {
    console.error('Load failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
