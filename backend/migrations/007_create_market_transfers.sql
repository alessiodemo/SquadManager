CREATE TABLE IF NOT EXISTS market_transfers (
  id            uuid primary key default gen_random_uuid(),
  player_id     uuid references players(id) on delete set null,
  season_id     uuid not null references seasons(id) on delete cascade,
  type          text not null check (type in ('in', 'out')),
  transfer_date date not null,
  fee           numeric(12, 2),
  club          text,
  notes         text,
  created_at    timestamptz default now()
);
