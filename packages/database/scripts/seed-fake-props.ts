import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { PrismaClient, StatType } from '@prisma/client';

// Match prisma.config.ts: the root .env is the single source of truth for
// DATABASE_URL, so load it explicitly regardless of the invoking directory.
const dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.join(dirname, '..', '..', '..', '.env') });

/**
 * DEV / DEMO seed. Gives every player who has box scores a full set of prop
 * markets so the player-detail charts render. The lines are the SAME across all
 * players (a fixed line per market) — this is fake demo data, not a modeled
 * value, so a star and a bench player get the same line. The per-game series the
 * chart plots is derived at request time from PlayerGameStat, so a fixed line
 * still produces a real-looking over/under chart.
 *
 * Existing prop lines (all fake) are cleared first so re-runs stay idempotent.
 * Guarded to a local database unless `--force` is passed.
 *
 *   pnpm --filter @props-analyzer/database db:seed-fake-props
 */
const args = new Set(process.argv.slice(2));
const forced = args.has('--force');

const databaseUrl = process.env.DATABASE_URL ?? '';
const isLocal =
  databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');

const prisma = new PrismaClient();

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

async function main() {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set — nothing to connect to.');
  }
  if (!isLocal && !forced) {
    throw new Error(
      `Refusing to seed a non-local database (${redactUrl(databaseUrl)}). ` +
        'Pass --force to override.'
    );
  }

  // Only players with box scores can show a chart, so seed those.
  const playersWithStats = await prisma.playerGameStat.groupBy({
    by: ['playerId'],
  });
  const playerIds = playersWithStats.map((row) => row.playerId);

  // All existing prop lines are fake demo data — clear them so re-runs don't
  // leave stale markets behind.
  const cleared = await prisma.propLine.deleteMany();

  const markets = Object.entries(FIXED_LINES) as [StatType, number][];
  const rows = playerIds.flatMap((playerId) =>
    markets.map(([statType, line]) => ({
      playerId,
      statType,
      line,
      overOdds: OVER_ODDS,
      underOdds: UNDER_ODDS,
      projection: line,
    }))
  );

  const { count } = await prisma.propLine.createMany({ data: rows });

  console.log(
    `Cleared ${cleared.count} old prop lines. Seeded ${count} fake prop ` +
      `lines (${markets.length} markets × ${playerIds.length} players with stats).`
  );
}

function redactUrl(url: string): string {
  return url.replace(/\/\/[^@]*@/, '//***@');
}

main()
  .catch((error) => {
    console.error(
      'Seed failed:',
      error instanceof Error ? error.message : error
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
