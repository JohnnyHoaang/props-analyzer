import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import {
  RATE_LIMIT_DELAY_MS,
  fetchActivePlayers,
  fetchPlayerStats,
  sleep,
} from '../src/bdl/client.js';
import { mapPlayer, mapStat } from '../src/bdl/map.js';
import {
  playerRow,
  statRow,
  type PlayerGameStatRow,
} from '../src/bdl/rows.js';
import {
  createAdminClient,
  type AdminClient,
} from '../src/supabase/admin-client.js';
import type { PlayerFixture } from '../src/mock-data/players.js';

/**
 * Additive, non-destructive companion to `load-bdl-data.ts`. That script is a
 * full reset (wipe + reload of the whole active roster); this one only fills in
 * the gaps: active BDL players that aren't in the database yet — e.g. someone
 * who came out of free agency after the last full load. Players already present
 * are skipped entirely (neither their row nor their stats are touched).
 *
 * Missing is computable because players use the raw BDL id as their primary
 * key, so the set to load is `fetchActivePlayers()` minus the ids already in
 * `players`. Teams, seasons, and games are assumed already loaded by the full
 * loader and are read (not written) here.
 *
 * Because it never deletes, it is only lightly guarded: no `--yes` is required,
 * but it refuses a non-local Supabase project unless `--force`, since the run
 * writes real data to the cloud project. Seasons default to 2024-25 and
 * 2025-26; override with `--season=2025`.
 *
 *   pnpm --filter @props-analyzer/database db:add-missing-players           # local
 *   pnpm --filter @props-analyzer/database db:add-missing-players --force   # hosted
 */

// The root .env is the single source of truth for SUPABASE_* and BDL_API_KEY,
// so load it explicitly.
const dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.join(dirname, '..', '..', '..', '.env') });

/**
 * Seasons whose box scores to crawl for each newly-added player (BDL uses the
 * starting year, e.g. 2025 = the 2025-26 season). Override with `--season=2024`
 * or `--season=2024,2025`.
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

/**
 * Optional cap on how many missing players to load, for a fast smoke test.
 * `--max-players=5` exercises the pipeline without the multi-minute stats crawl.
 * Unset = all missing players.
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

const args = new Set(process.argv.slice(2));
const forced = args.has('--force');

const supabaseUrl = process.env.SUPABASE_URL ?? '';
const isLocal =
  supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1');

/** Chunk size for batched upserts — keeps request payloads reasonable. */
const CHUNK_SIZE = 500;

/** Supabase's REST API caps a single select at 1000 rows; page past it. */
const PAGE_SIZE = 1000;

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
      `Refusing to write to a non-local Supabase project (${redactUrl(supabaseUrl)}). ` +
        'Pass --force to override (this writes real data to your cloud project).'
    );
  }

  supabase = createAdminClient();

  console.log(
    `Adding missing players (seasons ${SEASONS.join(', ')}) to ` +
      `${redactUrl(supabaseUrl)}${isLocal ? ' (local)' : ' (HOSTED)'}.`
  );

  const teamIds = await fetchExistingIds('teams');
  const existingPlayerIds = await fetchExistingIds('players');
  const gameIds = await fetchExistingIds('games');
  console.log(
    `Found ${teamIds.size} teams, ${existingPlayerIds.size} players, ` +
      `and ${gameIds.size} games already loaded.`
  );

  const missing = await findMissingPlayers(teamIds, existingPlayerIds);
  if (missing.length === 0) {
    console.log('No missing players — every active player is already loaded.');
    return;
  }

  await insertPlayers(missing);
  await loadStats(missing, gameIds);
}

/**
 * Reads every `id` from `table` into a Set, paging past Supabase's 1000-row
 * REST cap (`games` alone spans well over 1000 rows for two seasons).
 */
async function fetchExistingIds(
  table: 'teams' | 'players' | 'games'
): Promise<Set<string>> {
  const ids = new Set<string>();
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select('id')
      .range(from, from + PAGE_SIZE - 1);
    if (error) {
      throw new Error(`Failed to read ${table} ids: ${error.message}`);
    }
    for (const { id } of data) {
      ids.add(id);
    }
    if (data.length < PAGE_SIZE) {
      return ids;
    }
  }
}

/**
 * Fetches the active BDL roster and keeps only players absent from the database
 * whose team is already loaded. Players already present are skipped; players on
 * an unloaded team are skipped (their FK would fail) and reported.
 */
async function findMissingPlayers(
  teamIds: Set<string>,
  existingPlayerIds: Set<string>
): Promise<PlayerFixture[]> {
  const players = (await fetchActivePlayers()).map(mapPlayer);

  const missing: PlayerFixture[] = [];
  let alreadyLoaded = 0;
  const skippedTeam: string[] = [];

  for (const player of players) {
    if (existingPlayerIds.has(player.id)) {
      alreadyLoaded++;
      continue;
    }
    if (!teamIds.has(player.teamId)) {
      skippedTeam.push(player.fullName);
      continue;
    }
    missing.push(player);
  }

  const selected =
    maxPlayers != null ? missing.slice(0, maxPlayers) : missing;

  console.log(
    `${players.length} active players from BDL: ${alreadyLoaded} already ` +
      `loaded, ${skippedTeam.length} on an unloaded team, ${missing.length} ` +
      `missing${maxPlayers != null ? ` (capped at ${selected.length})` : ''}.`
  );
  if (skippedTeam.length > 0) {
    console.log(`Skipped (unloaded team): ${skippedTeam.join(', ')}`);
  }

  return selected;
}

async function insertPlayers(players: PlayerFixture[]): Promise<void> {
  await inChunks(players.map(playerRow), (chunk) =>
    supabase.from('players').upsert(chunk, { onConflict: 'id' })
  );
  console.log(`Inserted ${players.length} missing players.`);
}

/**
 * For each newly-added player, fetches their box scores across the requested
 * seasons and upserts one player_game_stats row per game. DNP rows (0 minutes)
 * and rows for a game that isn't loaded are skipped. Pauses
 * `RATE_LIMIT_DELAY_MS` between players to stay under the provider's limit.
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

function redactUrl(url: string): string {
  return url.replace(/\/\/[^@]*@/, '//***@');
}

main().catch((error) => {
  console.error(
    'Add missing players failed:',
    error instanceof Error ? error.message : error
  );
  process.exitCode = 1;
});
