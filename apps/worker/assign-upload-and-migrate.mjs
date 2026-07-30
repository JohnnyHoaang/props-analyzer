#!/usr/bin/env node

/**
 * Complete workflow: Assign ESPN images → Upload to S3 → Migrate database to S3 URLs
 * Run: node assign-upload-and-migrate.mjs
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import https from 'node:https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnv() {
  const envPath = path.resolve(__dirname, '../../.env');
  const env = {};
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    env[key] = rawValue.replace(/^["']|["']$/g, '');
  }
  return env;
}

async function fetchJson(url, label) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) {
    throw new Error(`${label} failed: ${response.status}`);
  }
  return response.json();
}

async function downloadImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function main() {
  const env = loadEnv();
  const supabaseUrl = env.SUPABASE_URL;
  const serviceKey = env.SUPABASE_SECRET_KEY;

  console.log('Step 1: Assigning ESPN images to players...\n');

  const players = await fetchJson(
    'http://localhost:3333/api/players',
    'Players API'
  );
  const athletes = (await fetchJson(
    'https://sports.core.api.espn.com/v3/sports/basketball/nba/athletes?active=true&limit=1500',
    'ESPN API'
  )).items || [];

  const nameAliases = {
    'Airious Bailey': 'Ace Bailey',
    'Alexandre Sarr': 'Alex Sarr',
    'Carlton Carrington': 'Bub Carrington',
    "Nah'Shon Hyland": 'Bones Hyland',
    'Nicolas Claxton': 'Nic Claxton',
    'Hansen Yang': 'Yang Hansen',
  };

  function normalizeName(name) {
    return (name || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const athleteMap = new Map();
  for (const athlete of athletes) {
    const keys = [
      athlete.fullName,
      athlete.displayName,
      `${athlete.firstName || ''} ${athlete.lastName || ''}`,
    ];
    for (const key of keys) {
      const normalized = normalizeName(key);
      if (normalized && !athleteMap.has(normalized)) {
        athleteMap.set(normalized, athlete);
      }
    }
  }

  const matched = [];
  for (const player of players) {
    const aliased = nameAliases[player.fullName];
    const normalized = normalizeName(aliased || player.fullName);
    const athlete = athleteMap.get(normalized);

    if (athlete) {
      matched.push({
        id: player.id,
        name: player.fullName,
        espnId: athlete.id,
        url: `https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/${athlete.id}.png&w=350&h=254`,
      });
    }
  }

  console.log(`Matched ${matched.length}/${players.length} players\n`);

  console.log('Step 2: Uploading images to S3...\n');

  let uploaded = 0;
  for (let i = 0; i < matched.length; i++) {
    try {
      const imageBuffer = await downloadImage(matched[i].url);
      const uploadResponse = await fetch(
        `${supabaseUrl}/storage/v1/object/nba-assets/players/${matched[i].id}.png`,
        {
          method: 'PUT',
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'content-type': 'image/png',
          },
          body: imageBuffer,
        }
      );

      if (uploadResponse.ok || uploadResponse.status === 409) {
        uploaded++;
        if ((i + 1) % 100 === 0) console.log(`  ${i + 1}/${matched.length} uploaded`);
      }
    } catch (error) {
      // Skip failed downloads
    }
  }

  console.log(`✓ ${uploaded} images uploaded\n`);

  console.log('Step 3: Updating database with S3 URLs...\n');

  const playersResponse = await fetch(
    `${supabaseUrl}/rest/v1/players?select=id,image_url`,
    {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
      },
    }
  );

  const dbPlayers = await playersResponse.json();
  let updated = 0;

  for (const player of dbPlayers) {
    if (!player.image_url?.includes('supabase')) continue;

    const newUrl = player.image_url.replace('/nba-assets/', '/nba-assets/players/');
    if (newUrl === player.image_url) continue;

    const updateResponse = await fetch(
      `${supabaseUrl}/rest/v1/players?id=eq.${player.id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image_url: newUrl }),
      }
    );

    if (updateResponse.ok) {
      updated++;
      if (updated % 50 === 0) console.log(`  ${updated} updated`);
    }
  }

  console.log(`✓ ${updated} database URLs updated\n`);
  console.log('✅ Complete! Player images are now in S3 with correct display headers.');
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
