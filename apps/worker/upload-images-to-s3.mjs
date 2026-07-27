#!/usr/bin/env node

/**
 * Downloads player images from ESPN URLs and uploads them to Supabase S3 (nba-assets bucket).
 * Updates the `players.image_url` column with the new S3 URLs.
 *
 * Prerequisites:
 * - The migration `20260725120000_add_player_image_url.sql` must be applied
 * - Supabase storage bucket "nba-assets" must exist
 * - Environment variables: SUPABASE_URL, SUPABASE_SECRET_KEY
 *
 * Re-runnable: Each row is idempotent — existing S3 URLs are replaced.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import https from 'node:https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_PATH = process.env.CSV_PATH || path.join(__dirname, 'player-images.csv');
const CONCURRENCY = 4; // Limit concurrent uploads
const BUCKET = 'nba-assets';

/** Minimal `.env` loader (repo root) */
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
  const imageUrlIdx = header.indexOf('image_url');
  if (idIdx === -1 || imageUrlIdx === -1) {
    throw new Error('CSV must have `player_id` and `image_url` columns');
  }
  return lines.slice(1).map((line) => {
    const fields = parseCsvLine(line);
    return {
      id: fields[idIdx],
      espnImageUrl: fields[imageUrlIdx],
      name: fields[1] // player_name for logging
    };
  });
}

/** Download image from URL and return as Buffer */
async function downloadImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

/** Upload image to Supabase Storage and return public URL */
async function uploadToSupabase(playerId, imageBuffer, supabaseUrl, serviceKey) {
  const filename = `${playerId}.png`;
  const filePath = `${BUCKET}/${filename}`;

  const url = `${supabaseUrl}/storage/v1/object/${filePath}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'image/png',
    },
    body: imageBuffer,
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status} ${await response.text()}`);
  }

  // Return the public URL (replace /storage/v1 with /storage/v1/object/public)
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${filePath}`;
  return publicUrl;
}

/** Update player record with new S3 image URL */
async function updatePlayerImage(playerId, imageUrl, supabaseUrl, serviceKey) {
  const response = await fetch(`${supabaseUrl}/rest/v1/players?id=eq.${encodeURIComponent(playerId)}`, {
    method: 'PATCH',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ image_url: imageUrl }),
    signal: AbortSignal.timeout(20000),
  });

  if (!response.ok) {
    throw new Error(`DB update failed: ${response.status}`);
  }
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
  console.log(`Processing ${rows.length} player images...`);
  console.log(`Uploading to Supabase bucket: ${BUCKET}\n`);

  let uploaded = 0;
  let updated = 0;
  const failures = [];

  await mapLimit(rows, CONCURRENCY, async ({ id, espnImageUrl, name }) => {
    try {
      // Download image from ESPN
      console.log(`Downloading image for ${name} (${id})...`);
      const imageBuffer = await downloadImage(espnImageUrl);

      // Upload to Supabase S3
      console.log(`  Uploading to S3...`);
      const s3Url = await uploadToSupabase(id, imageBuffer, SUPABASE_URL, SERVICE_KEY);
      uploaded++;

      // Update database
      console.log(`  Updating database...`);
      await updatePlayerImage(id, s3Url, SUPABASE_URL, SERVICE_KEY);
      updated++;

      console.log(`  ✓ Complete: ${s3Url}`);
    } catch (error) {
      failures.push({ id, name, error: error.message });
      console.error(`  ✗ Failed: ${error.message}`);
    }
  });

  console.log(`\n=== Summary ===`);
  console.log(`Downloaded: ${uploaded}/${rows.length}`);
  console.log(`Updated DB: ${updated}/${rows.length}`);

  if (failures.length > 0) {
    console.error(`\n${failures.length} failures:`);
    for (const f of failures.slice(0, 10)) {
      console.error(`  ${f.id} (${f.name}): ${f.error}`);
    }
    if (failures.length > 10) {
      console.error(`  ... and ${failures.length - 10} more`);
    }
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
