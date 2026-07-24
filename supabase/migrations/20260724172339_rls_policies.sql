-- Enable RLS everywhere
alter table teams enable row level security;
alter table players enable row level security;
alter table seasons enable row level security;
alter table games enable row level security;
alter table player_game_stats enable row level security;
alter table prop_lines enable row level security;
alter table injury_reports enable row level security;
alter table lineup_reports enable row level security;
alter table profiles enable row level security;

-- Catalog tables: readable by anon + authenticated
create policy "catalog read" on teams for select to anon, authenticated using (true);
create policy "catalog read" on players for select to anon, authenticated using (true);
create policy "catalog read" on seasons for select to anon, authenticated using (true);
create policy "catalog read" on games for select to anon, authenticated using (true);
create policy "catalog read" on player_game_stats for select to anon, authenticated using (true);
create policy "catalog read" on prop_lines for select to anon, authenticated using (true);
create policy "catalog read" on injury_reports for select to anon, authenticated using (true);
create policy "catalog read" on lineup_reports for select to anon, authenticated using (true);

-- Profiles: a user can only see/manage their own row
create policy "own profile select" on profiles for select to authenticated using (id = auth.uid());
create policy "own profile insert" on profiles for insert to authenticated with check (id = auth.uid());
create policy "own profile update" on profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
