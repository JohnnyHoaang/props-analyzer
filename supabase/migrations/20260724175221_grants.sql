-- Table privileges for the Supabase API roles. Enabling RLS + writing policies
-- (previous migration) is not enough on its own: PostgREST still needs
-- table-level GRANTs, and raw SQL migrations don't get the default privileges
-- that the Supabase dashboard would apply automatically.

-- service_role is the server-side admin / ingestion path. It bypasses RLS but
-- still needs table privileges.
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- Catalog reads for anon + authenticated (the RLS "catalog read" policies
-- further restrict which rows are visible — here, all of them).
grant select on
  teams,
  players,
  seasons,
  games,
  player_game_stats,
  prop_lines,
  injury_reports,
  lineup_reports
  to anon, authenticated;

-- Profiles: a signed-in user manages their own row (RLS enforces ownership).
grant select, insert, update on profiles to authenticated;
