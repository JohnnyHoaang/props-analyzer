import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
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
import {
  gameRow,
  playerRow,
  seasonRow,
  statRow,
  teamRow,
  type GameRow,
  type PlayerGameStatRow,
} from '../src/bdl/rows.js';
import {
  createAdminClient,
  type AdminClient,
} from '../src/supabase/admin-client.js';
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

// The root .env is the single source of truth for SUPABASE_* and BDL_API_KEY,
// so load it explicitly.
const dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.join(dirname, '..', '..', '..', '.env') });

/**
 * Loads real NBA teams, active players, seasons, games, and per-game box scores
 * from the balldontlie API into Supabase (via the service-role REST client).
 * Each run is a clean full reset: the existing teams/players/games (and
 * everything that references them) are wiped first, then reloaded, so the target
 * ends up holding only BDL data.
 *
 * Because it wipes, it is guarded: it refuses a non-local Supabase project
 * unless `--force`, and refuses to run at all unless `--yes`. Seasons default to
 * 2024-25 and 2025-26; override with `--season=2025`.
 *
 *   pnpm --filter @props-analyzer/database db:load-bdl --yes           # local
 *   pnpm --filter @props-analyzer/database db:load-bdl --yes --force   # hosted
 */
const args = new Set(process.argv.slice(2));
const confirmed = args.has('--yes');
const forced = args.has('--force');

/**
 * Optional cap on how many players (and thus box-score crawls) to load. Useful
 * for a fast end-to-end smoke test — `--max-players=5` exercises the whole
 * pipeline without the multi-minute full-roster stats crawl. Unset = all.
 */
const maxPlayers = parseMaxPlayers(process.argv.slice(2));

function parseMaxPlayers(argv: string[]): number | null {
  const arg = argv.find((a) => a.startsWith('--max-players='));
  if (!arg) {
    return null;
  }
  const n = Number.parseInt(arg.slice('--max-players='.length), 10);
  return Number.isNaN(n) || n <= 0 ? null : n;
}

const supabaseUrl = process.env.SUPABASE_URL ?? '';
const isLocal =
  supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1');

/** Chunk size for batched upserts — keeps request payloads reasonable. */
const CHUNK_SIZE = 500;

/** Tables cleared before a reload, in FK-dependency order (see migrations). */
const WIPE_ORDER = [
  'player_game_stats',
  'prop_lines',
  'injury_reports',
  'lineup_reports',
  'games',
  'players',
  'teams',
] as const;

let supabase: AdminClient;

async function main() {
  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL is not set — nothing to connect to.');
  }
  if (!process.env.SUPABASE_SECRET_KEY) {
    throw new Error('SUPABASE_SECRET_KEY is not set — cannot authenticate.');
  }
  if (!process.env.BDL_API_KEY) {
    throw new Error('BDL_API_KEY is not set — cannot call the balldontlie API.');
  }
  if (!isLocal && !forced) {
    throw new Error(
      `Refusing to wipe a non-local Supabase project (${redactUrl(supabaseUrl)}). ` +
        'Pass --force to override (this writes real data to your cloud project).'
    );
  }
  if (!confirmed) {
    throw new Error(
      'This will HARD-DELETE all teams and players (and their games, box ' +
        'scores, prop lines, and injury/lineup reports) before loading BDL ' +
        'data. Re-run with --yes to confirm.'
    );
  }

  supabase = createAdminClient();

  console.log(
    `Loading seasons ${SEASONS.join(', ')} into ${redactUrl(supabaseUrl)}` +
      `${isLocal ? ' (local)' : ' (HOSTED)'}.`
  );
  await wipeExistingData();
  const teamIds = await loadTeams();
  const players = await loadPlayers(teamIds);
  const { gameIds } = await loadSeasonsAndGames(teamIds);
  await loadStats(players, gameIds);
}

/**
 * Upserts `rows` in batches of {@link CHUNK_SIZE}, throwing a readable error if
 * any batch fails. `perform` runs one batch so the caller keeps full supabase-js
 * type inference for its specific table.
 */
async function inChunks<T>(
  rows: T[],
  perform: (chunk: T[]) => PromiseLike<{ error: { message: string } | null }>
): Promise<void> {
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const { error } = await perform(rows.slice(i, i + CHUNK_SIZE));
    if (error) {
      throw new Error(error.message);
    }
  }
}

/**
 * Clears teams/players and every row that foreign-keys them, in dependency
 * order. Seasons and profiles are left intact — they don't reference teams or
 * players. Each delete matches all rows (id is a non-null primary key).
 */
async function wipeExistingData(): Promise<void> {
  for (const table of WIPE_ORDER) {
    const { error } = await supabase.from(table).delete().not('id', 'is', null);
    if (error) {
      throw new Error(`Failed to wipe ${table}: ${error.message}`);
    }
  }
  console.log('Wiped existing teams, players, and dependent rows.');
}

async function loadTeams(): Promise<Set<string>> {
  const teams = (await fetchTeams()).filter(isRealNbaTeam).map(mapTeam);
  const rows = teams.map(teamRow);

  await inChunks(rows, (chunk) =>
    supabase.from('teams').upsert(chunk, { onConflict: 'id' })
  );

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

    loadedPlayers.push(player);
  }

  const selected =
    maxPlayers != null ? loadedPlayers.slice(0, maxPlayers) : loadedPlayers;

  await inChunks(selected.map(playerRow), (chunk) =>
    supabase.from('players').upsert(chunk, { onConflict: 'id' })
  );

  console.log(
    `Loaded ${selected.length} active players ` +
      `(${defaulted} had a defaulted height/weight, ` +
      `${skipped.length} skipped for an unloaded team` +
      `${maxPlayers != null ? `, capped at ${maxPlayers}` : ''}).`
  );
  if (skipped.length > 0) {
    console.log(`Skipped: ${skipped.join(', ')}`);
  }

  return selected;
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
  const seasonRows = SEASONS.map((year) => {
    const season = mapSeason(year);
    seasonIdByYear.set(year, season.id);
    return seasonRow(season);
  });

  await inChunks(seasonRows, (chunk) =>
    supabase.from('seasons').upsert(chunk, { onConflict: 'id' })
  );

  const games = await fetchGames(SEASONS);
  const gameIds = new Set<string>();
  const gameRows: GameRow[] = [];
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

    gameRows.push(gameRow(mapped));
    gameIds.add(mapped.id);
  }

  await inChunks(gameRows, (chunk) =>
    supabase.from('games').upsert(chunk, { onConflict: 'id' })
  );

  console.log(
    `Loaded ${gameIds.size} games ` +
      `(${skipped} skipped: non-final or unloaded team).`
  );
  return { gameIds };
}

/**
 * For each loaded player, fetches their box scores across the requested seasons
 * and upserts one player_game_stats row per game. DNP rows (0 minutes) and rows
 * for a game that wasn't loaded are skipped. Pauses `RATE_LIMIT_DELAY_MS`
 * between players to stay under the provider's 600 req/min limit.
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

    const rows: PlayerGameStatRow[] = [];
    for (const stat of stats) {
      const mapped = mapStat(stat);
      if (mapped.minutes <= 0 || !gameIds.has(mapped.gameId)) {
        continue;
      }
      rows.push(statRow(mapped));
    }

    await inChunks(rows, (chunk) =>
      supabase
        .from('player_game_stats')
        .upsert(chunk, { onConflict: 'player_id,game_id' })
    );

    if (rows.length > 0) {
      playersWithData++;
      statsLoaded += rows.length;
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

main().catch((error) => {
  console.error('Load failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
