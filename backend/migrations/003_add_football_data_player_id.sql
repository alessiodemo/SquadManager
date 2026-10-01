ALTER TABLE players
  ADD COLUMN IF NOT EXISTS football_data_id bigint;

CREATE UNIQUE INDEX IF NOT EXISTS players_football_data_id_unique
  ON players (football_data_id);