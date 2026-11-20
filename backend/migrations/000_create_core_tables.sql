CREATE TABLE IF NOT EXISTS seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_year int NOT NULL,
  competition_code text,
  team_external_id bigint,
  team_name text,
  is_current boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  football_data_id bigint,
  name text NOT NULL,
  surname text NOT NULL,
  role text NOT NULL CHECK (role IN ('POR', 'DIF', 'CEN', 'ATT')),
  nationality text,
  birth_date date,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS players_football_data_id_unique
  ON players (football_data_id);

CREATE TABLE IF NOT EXISTS season_players (
  season_id uuid NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  PRIMARY KEY (season_id, player_id)
);

CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id int,
  season_id uuid NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  date date NOT NULL,
  opponent text NOT NULL,
  is_home boolean NOT NULL DEFAULT true,
  venue text,
  goals_for int CHECK (goals_for >= 0),
  goals_against int CHECK (goals_against >= 0),
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS matches_season_external_id_unique
  ON matches (season_id, external_id);

CREATE TABLE IF NOT EXISTS player_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  season_id uuid NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  appearances int NOT NULL DEFAULT 0,
  goals int NOT NULL DEFAULT 0,
  assists int NOT NULL DEFAULT 0,
  yellow_cards int NOT NULL DEFAULT 0,
  red_cards int NOT NULL DEFAULT 0,
  UNIQUE (player_id, season_id)
);

CREATE TABLE IF NOT EXISTS market_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid REFERENCES players(id) ON DELETE SET NULL,
  season_id uuid NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('in', 'out')),
  transfer_date date NOT NULL,
  fee numeric(12, 2),
  club text,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS match_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id uuid REFERENCES players(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('goal', 'yellow_card', 'red_card', 'substitution_in', 'substitution_out')),
  minute int CHECK (minute BETWEEN 0 AND 120),
  note text,
  created_at timestamptz DEFAULT now()
);
