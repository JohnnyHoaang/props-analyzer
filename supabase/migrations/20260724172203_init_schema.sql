-- Enums (values must match packages/database/src/bdl/map.ts output)
create type conference as enum ('EASTERN', 'WESTERN');
create type player_position as enum ('PG', 'SG', 'SF', 'PF', 'C');
create type game_status as enum ('SCHEDULED', 'FINAL', 'POSTPONED');
create type game_type as enum ('REGULAR_SEASON', 'PLAYOFFS');
create type injury_status as enum ('OUT', 'DOUBTFUL', 'QUESTIONABLE', 'PROBABLE', 'ACTIVE');
create type lineup_role as enum ('STARTER', 'BENCH', 'OUT');
create type lineup_confirmation as enum ('EXPECTED', 'CONFIRMED');
create type stat_type as enum (
  'POINTS', 'REBOUNDS', 'ASSISTS', 'THREES_MADE', 'STEALS', 'BLOCKS',
  'TURNOVERS', 'PTS_REB', 'PTS_AST', 'REB_AST', 'PTS_REB_AST'
);

-- updated_at maintenance (replaces Prisma @updatedAt)
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table teams (
  id text primary key,
  name text not null,
  abbreviation text not null unique,
  conference conference not null,
  division text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table players (
  id text primary key,
  full_name text not null,
  position player_position not null,
  height integer not null,
  weight integer not null,
  active boolean not null default true,
  team_id text not null references teams(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index players_team_id_idx on players(team_id);

create table seasons (
  id text primary key,
  label text not null unique,
  start_date timestamptz not null,
  end_date timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table games (
  id text primary key,
  date timestamptz not null,
  status game_status not null default 'FINAL',
  game_type game_type not null default 'REGULAR_SEASON',
  home_score integer,
  away_score integer,
  overtime_periods integer not null default 0,
  season_id text not null references seasons(id),
  home_team_id text not null references teams(id),
  away_team_id text not null references teams(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index games_season_id_idx on games(season_id);
create index games_home_team_id_idx on games(home_team_id);
create index games_away_team_id_idx on games(away_team_id);
create index games_date_idx on games(date);

create table player_game_stats (
  id text primary key,
  minutes integer not null,
  points integer not null,
  rebounds integer not null,
  assists integer not null,
  three_pm integer not null,
  three_pa integer not null,
  fgm integer not null,
  fga integer not null,
  ftm integer not null,
  fta integer not null,
  steals integer not null,
  blocks integer not null,
  turnovers integer not null,
  fouls integer not null,
  plus_minus integer not null,
  starter boolean not null default false,
  player_id text not null references players(id),
  game_id text not null references games(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (player_id, game_id)
);
create index player_game_stats_game_id_idx on player_game_stats(game_id);

create table prop_lines (
  id text primary key,
  stat_type stat_type not null,
  line double precision not null,
  over_odds integer not null,
  under_odds integer not null,
  projection double precision not null,
  player_id text not null references players(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (player_id, stat_type)
);
create index prop_lines_player_id_idx on prop_lines(player_id);

create table injury_reports (
  id text primary key,
  status injury_status not null,
  description text,
  reported_at timestamptz not null,
  expected_return timestamptz,
  confirmed boolean not null default false,
  source text not null,
  player_id text not null references players(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index injury_reports_player_id_idx on injury_reports(player_id);
create index injury_reports_reported_at_idx on injury_reports(reported_at);

create table lineup_reports (
  id text primary key,
  role lineup_role not null,
  confirmation lineup_confirmation not null,
  reported_at timestamptz not null,
  source text not null,
  player_id text not null references players(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index lineup_reports_player_id_idx on lineup_reports(player_id);
create index lineup_reports_reported_at_idx on lineup_reports(reported_at);

-- Replaces the Prisma `users` table; keyed to Supabase Auth.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at triggers on every table
create trigger set_updated_at before update on teams for each row execute function set_updated_at();
create trigger set_updated_at before update on players for each row execute function set_updated_at();
create trigger set_updated_at before update on seasons for each row execute function set_updated_at();
create trigger set_updated_at before update on games for each row execute function set_updated_at();
create trigger set_updated_at before update on player_game_stats for each row execute function set_updated_at();
create trigger set_updated_at before update on prop_lines for each row execute function set_updated_at();
create trigger set_updated_at before update on injury_reports for each row execute function set_updated_at();
create trigger set_updated_at before update on lineup_reports for each row execute function set_updated_at();
create trigger set_updated_at before update on profiles for each row execute function set_updated_at();
