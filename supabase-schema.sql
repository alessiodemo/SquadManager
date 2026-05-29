-- ============================================================
-- Squad Manager — Supabase schema
-- Incolla questo nel SQL Editor di Supabase e clicca "Run"
-- ============================================================

-- Stagioni
create table if not exists seasons (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,          -- es. "2024/25"
  start_year  int  not null,          -- es. 2024
  is_current  boolean not null default false,
  created_at  timestamptz default now()
);

-- Solo una stagione corrente per volta
create unique index if not exists seasons_current_unique
  on seasons (is_current)
  where is_current = true;

-- Giocatori
create table if not exists players (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  surname      text not null,
  role         text not null check (role in ('POR','DIF','CEN','ALA','ATT')),
  nationality  text,
  birth_date   date,
  created_at   timestamptz default now()
);

-- Partite
create table if not exists matches (
  id             uuid primary key default gen_random_uuid(),
  season_id      uuid not null references seasons(id) on delete cascade,
  date           date not null,
  opponent       text not null,
  is_home        boolean not null default true,
  venue          text,
  goals_for      int check (goals_for >= 0),
  goals_against  int check (goals_against >= 0),
  created_at     timestamptz default now()
);

-- Statistiche giocatore per stagione
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

-- Trasferimenti
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

-- Eventi partita (gol, cartellini, sostituzioni)
create table if not exists match_events (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid not null references matches(id) on delete cascade,
  player_id  uuid references players(id) on delete set null,
  type       text not null check (type in ('goal','yellow_card','red_card','substitution_in','substitution_out')),
  minute     int check (minute between 1 and 120),
  note       text,
  created_at timestamptz default now()
);

-- ============================================================
-- Row Level Security (disabilita per uso admin-only,
-- abilita e configura policy per app pubblica/multi-utente)
-- ============================================================
alter table seasons         enable row level security;
alter table players         enable row level security;
alter table matches         enable row level security;
alter table player_stats    enable row level security;
alter table market_transfers enable row level security;
alter table match_events    enable row level security;

-- Policy: accesso pubblico in lettura (cambia se vuoi auth)
create policy "Public read seasons"          on seasons          for select using (true);
create policy "Public read players"          on players          for select using (true);
create policy "Public read matches"          on matches          for select using (true);
create policy "Public read player_stats"     on player_stats     for select using (true);
create policy "Public read transfers"        on market_transfers for select using (true);
create policy "Public read match_events"     on match_events     for select using (true);

-- Policy: scrittura con anon key (per uso locale/admin-only)
-- Sostituisci con autenticazione se l'app è pubblica
create policy "Anon insert seasons"          on seasons          for insert with check (true);
create policy "Anon update seasons"          on seasons          for update using (true);
create policy "Anon delete seasons"          on seasons          for delete using (true);

create policy "Anon insert players"          on players          for insert with check (true);
create policy "Anon update players"          on players          for update using (true);
create policy "Anon delete players"          on players          for delete using (true);

create policy "Anon insert matches"          on matches          for insert with check (true);
create policy "Anon update matches"          on matches          for update using (true);
create policy "Anon delete matches"          on matches          for delete using (true);

create policy "Anon insert player_stats"     on player_stats     for insert with check (true);
create policy "Anon update player_stats"     on player_stats     for update using (true);
create policy "Anon delete player_stats"     on player_stats     for delete using (true);

create policy "Anon insert transfers"        on market_transfers for insert with check (true);
create policy "Anon update transfers"        on market_transfers for update using (true);
create policy "Anon delete transfers"        on market_transfers for delete using (true);

create policy "Anon insert match_events"     on match_events     for insert with check (true);
create policy "Anon update match_events"     on match_events     for update using (true);
create policy "Anon delete match_events"     on match_events     for delete using (true);

-- ============================================================
-- Dati di esempio — rimuovi se non ti servono
-- ============================================================
insert into seasons (name, start_year, is_current) values ('2024/25', 2024, true);
