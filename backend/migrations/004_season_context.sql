ALTER TABLE seasons
    ADD COLUMN IF NOT EXISTS competition_code text,
    ADD COLUMN if NOT EXISTS team_external_id bigint,
    ADD COLUMN IF NOT EXISTS team_name text;

    CREATE UNIQUE INDEX IF NOT EXISTS
    seasons_context_unique 
    ON seasons (competition_code,start_year, team_external_id);

    DROP INDEX IF EXISTS seasons_current_unique;

    CREATE UNIQUE INDEX IF NOT EXISTS seasons_current_context_unique
    ON seasons (competition_code, team_external_id)
    WHERE is_current = true
    AND competition_code IS NOT NULL
    AND team_external_id IS NOT NULL;