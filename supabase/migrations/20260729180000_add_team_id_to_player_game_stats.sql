-- Record which team the player suited up for in each game. Nullable because
-- existing rows predate the column; a backfill (scripts/backfill-stat-teams.ts)
-- populates them, and consumers fall back to the player's current team while
-- a row's team_id is still null. Fixes home/away, opponent, and margin for
-- traded / free-agent players whose current team differs from a past game's.
alter table player_game_stats
  add column team_id text references teams(id);

create index player_game_stats_team_id_idx on player_game_stats(team_id);
