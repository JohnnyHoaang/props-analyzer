-- Adds an optional ESPN headshot URL to players. Nullable: not every player
-- resolves to an ESPN athlete (season-ending injuries and some rookies are
-- absent from ESPN's active directory). Populated by the worker importer
-- (apps/worker/import-player-images.mjs), not by this migration.
alter table players add column if not exists image_url text;

comment on column players.image_url is
  'ESPN headshot URL (a.espncdn.com). Null when no ESPN match exists.';
