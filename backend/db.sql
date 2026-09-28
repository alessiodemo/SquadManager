create table if not exists seasons (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  start_year  int  not null,
  is_current  boolean not null default false,
  created_at  timestamptz default now()
);

create unique index if not exists seasons_current_unique
  on seasons (is_current)
  where is_current = true;

create table if not exists players (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  surname      text not null,
  role         text not null check (role in ('POR','DIF','CEN','ATT')),
  nationality  text,
  birth_date   date,
  created_at   timestamptz default now()
);

create table if not exists matches (
  id             uuid primary key default gen_random_uuid(),
  external_id    int,
  season_id      uuid not null references seasons(id) on delete cascade,
  date           date not null,
  opponent       text not null,
  is_home        boolean not null default true,
  venue          text,
  goals_for      int check (goals_for >= 0),
  goals_against  int check (goals_against >= 0),
  created_at     timestamptz default now()
);

alter table matches add column if not exists external_id int;
create unique index if not exists matches_external_id_unique
  on matches (external_id);

create table if not exists player_stats (
  id            uuid primary key default gen_random_uuid(),
  player_id     uuid not null references players(id) on delete cascade,
  season_id     uuid not null references seasons(id) on delete cascade,
  appearances   int not null default 0,
  goals         int not null default 0,
  assists       int not null default 0,
  yellow_cards  int not null default 0,
  red_cards     int not null default 0,
  unique (player_id, season_id)
);

create table if not exists market_transfers (
  id              uuid primary key default gen_random_uuid(),
  player_id       uuid references players(id) on delete set null,
  season_id       uuid not null references seasons(id) on delete cascade,
  type            text not null check (type in ('in','out')),
  transfer_date   date not null,
  fee             numeric(12,2),
  club            text,
  notes           text,
  created_at      timestamptz default now()
);

create table if not exists match_events (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid not null references matches(id) on delete cascade,
  player_id  uuid references players(id) on delete set null,
  type       text not null check (type in ('goal','yellow_card','red_card','substitution_in','substitution_out')),
  minute     int check (minute between 0 and 120),
  note       text,
  created_at timestamptz default now()
);

create table if not exists season_table (
  season_id uuid not null references seasons(id) on delete cascade,
  competition_code text not null,
  type text not null check (type in ('TOTAL','HOME','AWAY')),
  team_external_id integer not null,
  position int not null,
  match_played int not null,
  win int,
  draw int,
  lose int,
  goal_scored int,
  goal_conceded int,
  goal_difference int,
  points int,
  UNIQUE (season_id, competition_code, type, team_external_id)
);

insert into seasons (name, start_year, is_current) values ('2024/25', 2024, true);
