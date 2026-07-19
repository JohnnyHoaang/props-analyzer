import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

const dirname = path.dirname(fileURLToPath(import.meta.url));

// The root .env is the single source of truth for DATABASE_URL (see
// .env.example); load it explicitly so `prisma` commands work regardless of
// which directory they're invoked from in the monorepo.
loadEnv({ path: path.join(dirname, '..', '..', '.env') });

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    path: path.join('prisma', 'migrations'),
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
