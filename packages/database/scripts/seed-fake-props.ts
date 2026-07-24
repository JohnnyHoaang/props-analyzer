import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import {
  createAdminClient,
  type AdminClient,
} from '../src/supabase/admin-client.js';
import type { Database } from '../src/supabase/types.js';

// The root .env is the single source of truth for SUPABASE_*, so load it
// explicitly regardless of the invoking directory.
const dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.join(dirname, '..', '..', '..', '.env') });

type StatType = Database['public']['Enums']['stat_type'];
type PropLineRow = Database['public']['Tables']['prop_lines']['Insert'];

/**
 * DEV / DEMO seed. Gives every player who has box scores a full set of prop
 * markets so the player-detail charts render. The lines are the SAME across all
 * players (a fixed line per market) — this is fake demo data, not a modeled
 * value. The per-game series the chart plots is derived at request time from
 * player_game_stats, so a fixed line still produces a real-looking over/under
 * chart.
 *
 * Existing prop lines (all fake) are cleared first so re-runs stay idempotent.
 * Guarded to a local Supabase project unless `--force` is passed.
 *
 *   pnpm --filter @props-analyzer/database db:seed-fake-props            # local
 *   pnpm --filter @props-analyzer/database db:seed-fake-props --force    # hosted
 */
const args = new Set(process.argv.slice(2));
const forced = args.has('--force');

const supabaseUrl = process.env.SUPABASE_URL ?? '';
const isLocal =
  supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1');

/** Fixed line per market, applied to every player. Odds are a flat -110/-110. */
const FIXED_LINES: Record<StatType, number> = {
  POINTS: 15.5,
  REBOUNDS: 5.5,
  ASSISTS: 3.5,
  THREES_MADE: 1.5,
  STEALS: 0.5,
  BLOCKS: 0.5,
  TURNOVERS: 1.5,
  PTS_REB: 20.5,
  PTS_AST: 18.5,
  REB_AST: 8.5,
  PTS_REB_AST: 25.5,
};

const OVER_ODDS = -110;
const UNDER_ODDS = -110;
const PAGE_SIZE = 1000;
const CHUNK_SIZE = 500;

async function main() {
  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL is not set — nothing to connect to.');
  }
  if (!process.env.SUPABASE_SECRET_KEY) {
    throw new Error('SUPABASE_SECRET_KEY is not set — cannot authenticate.');
  }
  if (!isLocal && !forced) {
    throw new Error(
      `Refusing to seed a non-local Supabase project (${redactUrl(supabaseUrl)}). ` +
        'Pass --force to override.'
    );
  }

  const supabase = createAdminClient();

  const playerIds = await playerIdsWithStats(supabase);

  // All existing prop lines are fake demo data — clear them so re-runs don't
  // leave stale markets behind.
  const { error: clearError } = await supabase
    .from('prop_lines')
    .delete()
    .not('id', 'is', null);
  if (clearError) {
    throw new Error(`Failed to clear prop lines: ${clearError.message}`);
  }

  const markets = Object.entries(FIXED_LINES) as [StatType, number][];
  const rows: PropLineRow[] = playerIds.flatMap((playerId) =>
    markets.map(([statType, line]) => ({
      id: `${playerId}-${statType}`,
      player_id: playerId,
      stat_type: statType,
      line,
      over_odds: OVER_ODDS,
      under_odds: UNDER_ODDS,
      projection: line,
    }))
  );

  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const { error } = await supabase
      .from('prop_lines')
      .upsert(rows.slice(i, i + CHUNK_SIZE), { onConflict: 'id' });
    if (error) {
      throw new Error(`Failed to insert prop lines: ${error.message}`);
    }
  }

  console.log(
    `Seeded ${rows.length} fake prop lines ` +
      `(${markets.length} markets × ${playerIds.length} players with stats) into ` +
      `${redactUrl(supabaseUrl)}${isLocal ? ' (local)' : ' (HOSTED)'}.`
  );
}

/** Distinct player ids that have at least one box score (paginated). */
async function playerIdsWithStats(supabase: AdminClient): Promise<string[]> {
  const ids = new Set<string>();
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('player_game_stats')
      .select('player_id')
      .range(from, from + PAGE_SIZE - 1);
    if (error) {
      throw new Error(`Failed to read player_game_stats: ${error.message}`);
    }
    if (!data || data.length === 0) {
      break;
    }
    for (const row of data) {
      ids.add(row.player_id);
    }
    if (data.length < PAGE_SIZE) {
      break;
    }
  }
  return [...ids];
}

function redactUrl(url: string): string {
  return url.replace(/\/\/[^@]*@/, '//***@');
}

main().catch((error) => {
  console.error('Seed failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
