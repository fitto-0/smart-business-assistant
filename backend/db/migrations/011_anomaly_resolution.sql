-- Guided anomaly resolution: per-anomaly checklist progress + unaccented statuses.
-- Some databases carry accented statuses ('non_résolu' / 'résolu') from the
-- original schema; the app standardises on unaccented keys
-- ('non_resolu' / 'en_cours' / 'resolu') so backend <-> frontend stay in sync.

-- 1) Progress columns
ALTER TABLE anomalies
  ADD COLUMN IF NOT EXISTS resolution_steps JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS current_step INTEGER DEFAULT 0;

-- 2) Drop legacy accented CHECK constraints BEFORE touching data.
--    (Postgres validates the existing constraint row-by-row on UPDATE, so the
--    old constraints must go first — otherwise normalising the rows fails.)
--    Names vary by DB: auto-named anomalies_status_check / anomalies_type_check
--    on fresh installs, *_unaccented on DBs touched by an older 011.
ALTER TABLE anomalies DROP CONSTRAINT IF EXISTS anomalies_status_check;
ALTER TABLE anomalies DROP CONSTRAINT IF EXISTS anomalies_status_check_unaccented;
ALTER TABLE anomalies DROP CONSTRAINT IF EXISTS anomalies_type_check;
ALTER TABLE anomalies DROP CONSTRAINT IF EXISTS anomalies_type_check_unaccented;

-- 3) Normalise legacy accented statuses AND types
UPDATE anomalies SET status = 'non_resolu' WHERE status = 'non_résolu';
UPDATE anomalies SET status = 'resolu' WHERE status = 'résolu';
UPDATE anomalies SET type = 'avis_negatifs' WHERE type = 'avis_négatifs';

-- 4) Re-add the CHECKs aligned with the unaccented keys, then backfill
--    any NULL / unexpected values defensively.
ALTER TABLE anomalies ADD CONSTRAINT anomalies_type_check_unaccented
  CHECK (type IN ('baisse_ventes', 'rupture_stock', 'stock_faible', 'avis_negatifs', 'pic_ventes')) NOT VALID;
ALTER TABLE anomalies ADD CONSTRAINT anomalies_status_check_unaccented
  CHECK (status IN ('non_resolu', 'en_cours', 'resolu')) NOT VALID;
UPDATE anomalies SET status = 'non_resolu'
  WHERE status IS NULL OR status NOT IN ('non_resolu', 'en_cours', 'resolu');
UPDATE anomalies SET type = 'baisse_ventes'
  WHERE type IS NULL OR type NOT IN ('baisse_ventes', 'rupture_stock', 'stock_faible', 'avis_negatifs', 'pic_ventes');
ALTER TABLE anomalies VALIDATE CONSTRAINT anomalies_type_check_unaccented;
ALTER TABLE anomalies VALIDATE CONSTRAINT anomalies_status_check_unaccented;

CREATE INDEX IF NOT EXISTS idx_anomalies_org_status2
  ON anomalies(organization_id, status);
