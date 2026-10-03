CREATE UNIQUE INDEX IF NOT EXISTS matches_season_external_id_unique
  ON matches (season_id, external_id);

DROP INDEX IF EXISTS matches_external_id_unique;
