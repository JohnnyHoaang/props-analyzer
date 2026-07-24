import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Match prisma.config.ts: the root .env is the single source of truth for
// DATABASE_URL, so load it explicitly regardless of the invoking directory.
const dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.join(dirname, '..', '..', '..', '.env') });

/**
 * DEV RESET ONLY. Hard-deletes every player and the rows that depend on them.
 *
 * This deliberately violates the AGENTS.md "never hard-delete production data"
 * rule, so it is guarded twice: it refuses to touch a non-local database
 * unless `--force` is passed, and it refuses to delete anything at all unless
 * `--yes` is passed. There is no soft-delete equivalent here — use
 * `player.active = false` for that (which does respect the AGENTS.md rule).
 *
 *   pnpm --filter @props-analyzer/database db:wipe-players --yes
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

  if (!isLocal && !forced) {
    throw new Error(
      `Refusing to wipe a non-local database (${redactUrl(databaseUrl)}). ` +
        'Pass --force to override (you almost certainly do not want to).'
    );
  }

  if (!confirmed) {
    throw new Error(
      'This will HARD-DELETE all players and their game stats, prop lines, ' +
        'and injury/lineup reports. Re-run with --yes to confirm.'
    );
  }

  // Delete dependents before players to satisfy the foreign keys that
  // reference players.id (see prisma/schema.prisma).
  const stats = await prisma.playerGameStat.deleteMany();
  const props = await prisma.propLine.deleteMany();
  const injuries = await prisma.injuryReport.deleteMany();
  const lineups = await prisma.lineupReport.deleteMany();
  const players = await prisma.player.deleteMany();

  console.log(
    `Wiped ${players.count} players, ${stats.count} game stats, ` +
      `${props.count} prop lines, ${injuries.count} injury reports, ` +
      `${lineups.count} lineup reports.`
  );
}

function redactUrl(url: string): string {
  return url.replace(/\/\/[^@]*@/, '//***@');
}

main()
  .catch((error) => {
    console.error('Wipe failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
