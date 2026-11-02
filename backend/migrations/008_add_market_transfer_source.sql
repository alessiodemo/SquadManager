ALTER TABLE market_transfers
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS source_key text;

CREATE UNIQUE INDEX IF NOT EXISTS market_transfers_source_key_unique
  ON market_transfers (season_id, source_key)
  WHERE source_key IS NOT NULL;
