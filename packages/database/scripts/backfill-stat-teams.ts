import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import {
  RATE_LIMIT_DELAY_MS,
  fetchPlayerStats,
  sleep,
} from '../src/bdl/client.js';
import { mapStat } from '../src/bdl/map.js';
import { statRow, type PlayerGameStatRow } from '../src/bdl/rows.js';
import {
  createAdminClient,
  type AdminClient,
} from '../src/supabase/admin-client.js';

/**
 * One-off, non-destructive backfill for `player_game_stats.team_id` (added by
 * the migration alongside this script). Existing rows were loaded before the
 * per-game team was recorded, so home/away, opponent, and margin fall back to
 * the player's *current* team and are wrong for anyone who has since been
 * traded or signed elsewhere.
 *
 * For every player that already has box scores, this re-crawls their BDL stats
 * for the configured seasons and re-upserts the rows (now carrying `team_id`)
 * on the `(player_id, game_id)` conflict — so it only updates existing rows,
 * never wipes. Safe to re-run; idempotent. Seasons default to 2024-25 and
 * 2025-26; override with `--season=2025`.
 *
 *   pnpm --filter @props-analyzer/database db:backfill-stat-teams           # local
 *   pnpm --filter @props-analyzer/database db:backfill-stat-teams --force   # hosted
 */

const dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.join(dirname, '..', '..', '..', '.env') });

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

const args = new Set(process.argv.slice(2));
const forced = args.has('--force');

const supabaseUrl = process.env.SUPABASE_URL ?? '';
const isLocal =
  supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1');

const CHUNK_SIZE = 500;
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
    `Backfilling player_game_stats.team_id (seasons ${SEASONS.join(', ')}) in ` +
      `${redactUrl(supabaseUrl)}${isLocal ? ' (local)' : ' (HOSTED)'}.`
  );

  const gameIds = await fetchExistingIds('games');
  const playerIds = await playerIdsWithStats();
  console.log(
    `Found ${playerIds.length} players with stats across ${gameIds.size} games.`
  );

  let updated = 0;
  for (let i = 0; i < playerIds.length; i++) {
    const playerId = playerIds[i];
    const stats = await fetchPlayerStats(Number(playerId), SEASONS);

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
    updated += rows.length;

    if ((i + 1) % 50 === 0) {
      console.log(
        `  …processed ${i + 1}/${playerIds.length} players ` +
          `(${updated} rows updated so far).`
      );
    }

    await sleep(RATE_LIMIT_DELAY_MS);
  }

  console.log(
    `Backfilled team_id on ${updated} rows across ${playerIds.length} players.`
  );
}

/** Distinct player ids that already have at least one box score (paginated). */
async function playerIdsWithStats(): Promise<string[]> {
  const ids = new Set<string>();
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('player_game_stats')
      .select('player_id')
      .range(from, from + PAGE_SIZE - 1);
    if (error) {
      throw new Error(`Failed to read player_game_stats: ${error.message}`);
    }
    for (const { player_id } of data) {
      ids.add(player_id);
    }
    if (data.length < PAGE_SIZE) {
      return [...ids];
    }
  }
}

/** Reads every `id` from `table` into a Set, paging past the 1000-row cap. */
async function fetchExistingIds(table: 'games'): Promise<Set<string>> {
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
    'Backfill failed:',
    error instanceof Error ? error.message : error
  );
  process.exitCode = 1;
});
