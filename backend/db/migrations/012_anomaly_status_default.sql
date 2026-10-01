-- Fix legacy accented DEFAULT on anomalies.status ('non_résolu').
-- The unaccented CHECK from 011 rejects the old default on every INSERT
-- that omits status, which broke POST /api/analysis/detect-anomalies.
ALTER TABLE anomalies
  ALTER COLUMN status SET DEFAULT 'non_resolu';
UPDATE anomalies SET status = 'non_resolu' WHERE status = 'non_résolu';
UPDATE anomalies SET status = 'resolu' WHERE status = 'résolu';
UPDATE anomalies SET type = 'avis_negatifs' WHERE type = 'avis_négatifs';
