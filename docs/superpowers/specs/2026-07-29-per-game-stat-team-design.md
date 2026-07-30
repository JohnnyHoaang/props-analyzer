# Per-Game Stat Team — Home/Away Fix Design

## Problem

A player's game log and prop charts classify each game as home/away (and derive
opponent + margin) by comparing the game's home team to the player's **current**
`team_id`:

```ts
const isHome = stat.game.homeTeamId === player.teamId; // players.service.ts:93
const isHome = game.homeTeamId === playerTeamId;       // players.mapper.ts:80
```

For a player who changed teams (trade or free agency), every game played with a
*former* team is misclassified. Confirmed with player 237 (LeBron James): stored
`team_id = 23` (PHI, his new team), but all 145 loaded box scores were played for
`14` (LAL). Result: app shows 2 home / 143 away; the truth is 72 / 73.
All 145 games are loaded correctly — this is a labeling bug, not a fetch bug.

## Root cause

`player_game_stats` does not record which team the player suited up for in each
game, so the API falls back to the player's single current team. BDL provides the
per-game team (`stat.team.id`); the loader discards it.

## Fix

Persist the per-game team on each stat row and classify from it, falling back to
the player's current team only when it is absent (un-backfilled rows).

### Change set

1. **Migration** (`supabase/migrations/<ts>_add_team_id_to_player_game_stats.sql`):
   add `team_id text references teams(id)` to `player_game_stats`, **nullable**
   so existing rows remain valid until backfilled; add a supporting index.
2. **Generated types** (`src/supabase/types.ts`): add `team_id: string | null`
   to the table's Row/Insert/Update (matches what `db:gen-types` would emit).
3. **BDL mapping:**
   - `PlayerGameStatFixture`: add `teamId: string`.
   - `mapStat`: set `teamId: teamId(stat.team.id)`.
   - `statRow`: emit `team_id: stat.teamId`.
   - Both loaders populate it automatically (they route through mapStat→statRow).
4. **Entity + repositories:**
   - `PlayerGameStat` entity: add `teamId: string | null`.
   - `toPlayerGameStatEntity`: map `row.team_id`.
   - Mock generator sets `teamId` to the player's team (mock players never move).
5. **API classification (the fix):**
   - `players.mapper.ts` / `players.service.ts`: derive the per-game team as
     `stat.teamId ?? <player's current team>` and compute `isHome`, opponent,
     scores/margin from it. The fallback preserves today's behavior for null rows.
6. **Backfill** (`scripts/backfill-stat-teams.ts`): for every player that has
   stats, re-crawl BDL and upsert the full stat rows (now carrying `team_id`) on
   the `(player_id, game_id)` conflict. Non-destructive; reuses the loader's stats
   pipeline. Same guards as the other scripts (`--force` for a hosted project).

## Testing

Unit tests (pure mappers) drive the fix TDD-style: a traded-player fixture where
`stat.teamId` differs from the player's current team must classify by the stat's
team. Add cases to `players.mapper` (and the service where feasible), plus a
`map.spec.ts` case asserting `mapStat` carries `team_id`.

## Rollout order

Migration → code (mapper/rows/entity/API) → regenerate/patch types → deploy →
backfill. The nullable column + fallback means the app is correct for
already-loaded rows only after backfill, and never worse than today in between.

## Out of scope

No DTO shape changes (isHome/opponent are already computed server-side). No
historical multi-team splits in the UI beyond correct per-game classification.
