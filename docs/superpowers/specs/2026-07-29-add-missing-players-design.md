# Add Missing Players — Design

## Problem

`scripts/load-bdl-data.ts` is a destructive full reset: it wipes `players` (and
everything FK'd to them) and reloads the entire active roster from BDL. After a
load, players can come out of free agency and become active in BDL but be absent
from the database. We need an additive pass that loads only those missing
players, skipping any player that already exists — without re-wiping the DB.

## Approach

A new, non-destructive script `scripts/add-missing-players.ts` and a
`db:add-missing-players` package script. Players use the raw BDL id as their
primary key, so the missing set is `fetchActivePlayers()` ids minus the ids
already in `players`.

## Flow

1. Validate env: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `BDL_API_KEY`.
2. Read **loaded team ids** from the `teams` table → valid-FK set. A newly-active
   player on a team that was never loaded is skipped (same rule as the full
   loader), rather than fabricating a team.
3. Read **existing player ids** from the `players` table → the "skip these" set.
4. Read **existing game ids** from the `games` table → used to keep only box
   scores that link to a loaded game.
5. `fetchActivePlayers()` → `mapPlayer` → keep those **not** in the
   existing-player set **and** whose team is loaded. That is the missing set.
6. Upsert the missing player rows (chunked, `onConflict: 'id'`; harmless if a
   race re-adds one).
7. For each missing player: `fetchPlayerStats` → filter `minutes > 0` and
   `gameId ∈ loaded games` → upsert `player_game_stats`, pausing
   `RATE_LIMIT_DELAY_MS` between players.

## Reuse & mechanics

- Reuses `fetchActivePlayers`, `fetchPlayerStats`, `mapPlayer`, `mapStat`,
  `playerRow`, `statRow`, `createAdminClient`, `RATE_LIMIT_DELAY_MS`/`sleep`, and
  the `--season=` / `--max-players=` arg parsers (same semantics as the full
  loader).
- A chunked upsert helper (same shape as the full loader's `inChunks`).
- A pagination helper that reads all ids from a table via `.range()` in 1000-row
  pages — required for `games` (a season spans well over 1000 games) and
  defensive for `players`.

## Guards

Lighter than the full loader because nothing is deleted:

- No `--yes` required (no destruction to confirm).
- Refuse a non-local Supabase project unless `--force`, because the run writes
  real data to the cloud project.

## Out of scope

No wiping, no team/season/game loading (those already exist from the full
loader), no updating existing players' rows or re-crawling their stats.
