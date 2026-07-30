#!/usr/bin/env node

/**
 * Assigns ESPN headshot image URLs to our players.
 *
 * 1. Fetches our players from the players API (each has a `fullName`).
 * 2. Fetches the ESPN NBA athletes directory (each has an `id` + name).
 * 3. Matches our players to ESPN athletes by normalized name.
 * 4. Builds the ESPN headshot URL from the matched ESPN `id`.
 * 5. Writes `player-images.csv` (our `player_id` -> `image_url`) and logs any
 *    players that couldn't be matched to `unmatched-players.json`.
 *
 * Uses native `fetch` (Node 18+), so it has no runtime dependencies.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Our players API. Defaults to the local API (prefix `/api`, port 3333 — the
// API's `API_PORT`; note :3000 is the Next.js web app, not the API).
// Omitting `limit` makes the API return every player in one response.
const PLAYERS_API_URL =
  process.env.PLAYERS_API_URL || 'http://localhost:3333/api/players';

// ESPN NBA athletes directory. `limit` must cover the full roster; the API
// reports the total in `count`, which we assert against below.
const ESPN_API_URL =
  process.env.ESPN_API_URL ||
  'https://sports.core.api.espn.com/v3/sports/basketball/nba/athletes?active=true&limit=1500';

const REQUEST_TIMEOUT_MS = 20000;

async function fetchJson(url, label) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(
      `${label} request failed: ${response.status} ${response.statusText}`
    );
  }
  return response.json();
}

async function fetchPlayersFromApi() {
  console.log(`Fetching players from: ${PLAYERS_API_URL}`);
  const data = await fetchJson(PLAYERS_API_URL, 'Players API');
  // Tolerate a bare array or a `{ data: [...] }` / `{ players: [...] }` wrapper.
  const players = Array.isArray(data) ? data : data.data ?? data.players ?? [];
  console.log(`  Found ${players.length} players`);
  return players;
}

async function fetchEspnAthletes() {
  console.log('Fetching ESPN athletes...');
  const data = await fetchJson(ESPN_API_URL, 'ESPN API');
  const athletes = data.items ?? [];
  console.log(`  Found ${athletes.length} ESPN athletes (of ${data.count})`);
  if (typeof data.count === 'number' && athletes.length < data.count) {
    console.warn(
      `  WARNING: only ${athletes.length}/${data.count} athletes returned — ` +
        'raise the ESPN `limit` so every player is available for matching.'
    );
  }
  return athletes;
}

/**
 * Manual overrides for players ESPN lists under a different name — nicknames
 * (`Bones Hyland` for `Nah'Shon Hyland`) or a flipped name order (`Yang
 * Hansen`). Keyed by our `fullName`; the value is the ESPN `displayName`. Each
 * was verified against the ESPN directory. Extend as new mismatches surface.
 */
const NAME_ALIASES = {
  'Airious Bailey': 'Ace Bailey',
  'Alexandre Sarr': 'Alex Sarr',
  'Carlton Carrington': 'Bub Carrington',
  "Nah'Shon Hyland": 'Bones Hyland',
  'Nicolas Claxton': 'Nic Claxton',
  'Hansen Yang': 'Yang Hansen',
};

/** Generational suffixes ESPN sometimes appends (`Jimmy Butler III`). */
const NAME_SUFFIXES = new Set(['jr', 'sr', 'ii', 'iii', 'iv', 'v']);

/** Lowercase, strip accents, drop punctuation, and collapse whitespace. */
function normalizeName(name) {
  return String(name ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // drop combining accent marks
    .toLowerCase()
    // Delete punctuation rather than spacing it, so initials collapse the same
    // way on both sides: "A.J." and "AJ" both become "aj".
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Normalized name with any trailing generational suffix removed. */
function stripSuffix(normalized) {
  const parts = normalized.split(' ');
  if (parts.length > 1 && NAME_SUFFIXES.has(parts[parts.length - 1])) {
    parts.pop();
  }
  return parts.join(' ');
}

/** Our player DTO exposes `fullName`; tolerate other shapes just in case. */
function getPlayerName(player) {
  if (player.fullName) return player.fullName;
  if (player.full_name) return player.full_name;
  if (player.name) return player.name;
  if (player.first_name || player.last_name) {
    return `${player.first_name ?? ''} ${player.last_name ?? ''}`.trim();
  }
  return '';
}

/**
 * Builds a normalized-name -> athlete index. Each athlete is registered under
 * every name variant ESPN exposes (fullName, displayName, first+last), plus a
 * suffix-stripped variant so `Craig Porter` resolves to `Craig Porter Jr.`.
 * Earlier registrations win, so exact names take precedence over the looser
 * suffix-stripped keys.
 */
function buildEspnIndex(athletes) {
  const index = new Map();
  const register = (name, athlete) => {
    const key = normalizeName(name);
    if (key && !index.has(key)) index.set(key, athlete);
  };
  // First pass: exact name variants across all athletes.
  for (const athlete of athletes) {
    register(athlete.fullName, athlete);
    register(athlete.displayName, athlete);
    register(`${athlete.firstName ?? ''} ${athlete.lastName ?? ''}`, athlete);
  }
  // Second pass: suffix-stripped variants, added only where they don't
  // shadow an exact name registered above.
  for (const athlete of athletes) {
    register(stripSuffix(normalizeName(athlete.fullName)), athlete);
  }
  return index;
}

/** Resolves a player to an ESPN athlete via alias, exact, then suffix match. */
function matchAthlete(playerName, espnIndex) {
  const aliased = NAME_ALIASES[playerName];
  const normalized = normalizeName(aliased ?? playerName);
  return espnIndex.get(normalized) ?? espnIndex.get(stripSuffix(normalized));
}

function buildImageUrl(espnId) {
  return `https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/${espnId}.png&w=350&h=254`;
}

function escapeCsv(value) {
  const str = String(value ?? '');
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

async function main() {
  console.log('Starting player image assignment...\n');

  const [players, athletes] = await Promise.all([
    fetchPlayersFromApi(),
    fetchEspnAthletes(),
  ]);

  const espnIndex = buildEspnIndex(athletes);

  console.log('\nMatching players...');
  const results = [];
  const unmatched = [];

  for (const player of players) {
    const playerName = getPlayerName(player);
    const match = matchAthlete(playerName, espnIndex);

    if (match) {
      results.push({
        player_id: player.id,
        player_name: playerName,
        espn_id: match.id,
        image_url: buildImageUrl(match.id),
      });
    } else {
      unmatched.push({ id: player.id, name: playerName });
    }
  }

  const csvPath = path.join(__dirname, 'player-images.csv');
  const header = 'player_id,player_name,espn_id,image_url';
  const rows = results.map((r) =>
    [r.player_id, r.player_name, r.espn_id, r.image_url].map(escapeCsv).join(',')
  );
  fs.writeFileSync(csvPath, `${header}\n${rows.join('\n')}\n`);
  console.log(`\nWrote ${results.length} rows -> ${csvPath}`);

  if (unmatched.length > 0) {
    const unmatchedPath = path.join(__dirname, 'unmatched-players.json');
    fs.writeFileSync(unmatchedPath, JSON.stringify(unmatched, null, 2));
    console.log(`Logged ${unmatched.length} unmatched -> ${unmatchedPath}`);
  }

  const total = players.length || 1;
  console.log(
    `\nMatched ${results.length}/${players.length} ` +
      `(${((results.length / total) * 100).toFixed(1)}%)`
  );
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
