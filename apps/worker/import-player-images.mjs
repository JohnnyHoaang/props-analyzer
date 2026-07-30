#!/usr/bin/env node

/**
 * Imports the `player-images.csv` mapping into the `players.image_url` column
 * via the Supabase data API (PostgREST) using the service-role key.
 *
 * Prerequisite: the `image_url` column must exist — apply the migration
 * `supabase/migrations/20260725120000_add_player_image_url.sql` first
 * (`supabase db push`).
 *
 * Re-runnable: each row is an idempotent PATCH by player id. Uses native
 * `fetch` (Node 18+) and reads SUPABASE_URL / SUPABASE_SECRET_KEY from the
 * environment or the repo-root `.env`.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_PATH = process.env.CSV_PATH || path.join(__dirname, 'player-images.csv');
const CONCURRENCY = 8;

/** Minimal `.env` loader (repo root), so this runs without extra deps. */
function loadRepoEnv() {
  const envPath = path.resolve(__dirname, '../../.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, '');
  }
}

/** Parses a CSV line, honoring double-quoted fields with escaped quotes. */
function parseCsvLine(line) {
  const fields = [];
  let value = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        value += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        value += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      fields.push(value);
      value = '';
    } else {
      value += ch;
    }
  }
  fields.push(value);
  return fields;
}

function readCsv(csvPath) {
  const lines = fs.readFileSync(csvPath, 'utf8').trim().split('\n');
  const header = parseCsvLine(lines[0]);
  const idIdx = header.indexOf('player_id');
  const urlIdx = header.indexOf('image_url');
  if (idIdx === -1 || urlIdx === -1) {
    throw new Error('CSV must have `player_id` and `image_url` columns');
  }
  return lines.slice(1).map((line) => {
    const fields = parseCsvLine(line);
    return { id: fields[idIdx], imageUrl: fields[urlIdx] };
  });
}

/** Runs `worker` over `items` with bounded concurrency. */
async function mapLimit(items, limit, worker) {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      await worker(items[index]);
    }
  });
  await Promise.all(runners);
}

async function main() {
  loadRepoEnv();
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SECRET_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY must be set (see .env)');
  }

  const rows = readCsv(CSV_PATH);
  console.log(`Importing ${rows.length} image URLs into players.image_url...`);

  let updated = 0;
  const failures = [];

  await mapLimit(rows, CONCURRENCY, async ({ id, imageUrl }) => {
    const url = `${SUPABASE_URL}/rest/v1/players?id=eq.${encodeURIComponent(id)}`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ image_url: imageUrl }),
      signal: AbortSignal.timeout(20000),
    });
    if (response.ok) {
      updated++;
    } else {
      failures.push({ id, status: response.status, body: await response.text() });
    }
  });

  console.log(`\nUpdated ${updated}/${rows.length} players`);
  if (failures.length > 0) {
    console.error(`${failures.length} failures:`);
    for (const f of failures.slice(0, 10)) {
      console.error(`  ${f.id}: ${f.status} ${f.body}`);
    }
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
