-- backend/db/migrations/2026_XX_add_ai_columns.sql

ALTER TABLE anomalies
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'non_résolu';

ALTER TABLE recommendations
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS done BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_anomalies_org_status
  ON anomalies(organization_id, status);

CREATE INDEX IF NOT EXISTS idx_recommendations_org
  ON recommendations(organization_id);