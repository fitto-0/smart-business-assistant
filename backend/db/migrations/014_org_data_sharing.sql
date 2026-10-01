-- 014: ORGANIZATION-SCOPED DATA (shared org pool instead of per-user silos)
--
-- Every business table already got an `organization_id` column in 001, but the
-- API still filtered on `user_id`, so two members of the same organization could
-- not see each other's data and no permission could be enforced on real records.
--
-- This migration makes `organization_id` the authoritative scope:
--   1. adds the column where it is still missing (categories, store settings…)
--   2. self-heals legacy accounts with no organization at all
--   3. backfills organization_id for every existing row
--   4. adds the composite indexes the new scoped queries need
--   5. re-points the legacy per-user unique constraints at the organization
--
-- `user_id` is preserved everywhere: it now means "created by", which is exactly
-- the audit column the owner UI needs.

-- ===================== 1. MISSING ORGANIZATION_ID COLUMNS =====================
-- Every table is handled by the loop below, which skips tables that do not exist
-- yet (`categories`, for example, is created later on by `db/migrate.js`).
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'products', 'sales', 'reviews', 'anomalies', 'recommendations',
    'predictions_cache', 'monthly_targets', 'notifications',
    'categories', 'store_settings', 'storefront_settings'
  ] LOOP
    IF to_regclass('public.' || t) IS NULL THEN
      CONTINUE;
    END IF;
    EXECUTE format(
      'ALTER TABLE %I ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE',
      t
    );
  END LOOP;
END $$;

-- ===================== 2. SELF-HEAL ACCOUNTS WITHOUT AN ORGANIZATION =====================
-- Mirrors what POST /api/organizations does, so the backfill below can always find
-- an organization for a row that only carries a user_id.
INSERT INTO
    organizations (
        name,
        slug,
        industry,
        size,
        subscription_plan
    )
SELECT COALESCE(
        NULLIF(u.company, ''), 'Personal Business'
    ) AS name, LOWER(
        REGEXP_REPLACE(
            COALESCE(
                NULLIF(u.company, ''), u.name || '-' || u.id
            ) || '-org' || u.id, '[^a-zA-Z0-9-]', '-', 'g'
        )
    ) AS slug, 'Retail', '1-10', 'free'
FROM users u
WHERE
    NOT EXISTS (
        SELECT 1
        FROM organization_members om
        WHERE
            om.user_id = u.id
            AND COALESCE(om.status, 'active') <> 'removed'
    ) ON CONFLICT (slug) DO NOTHING;

INSERT INTO
    organization_members (
        organization_id,
        user_id,
        role,
        status,
        joined_at
    )
SELECT o.id, u.id, 'owner', 'active', COALESCE(u.created_at, NOW())
FROM users u
    JOIN organizations o ON o.slug = LOWER(
        REGEXP_REPLACE(
            COALESCE(
                NULLIF(u.company, ''), u.name || '-' || u.id
            ) || '-org' || u.id, '[^a-zA-Z0-9-]', '-', 'g'
        )
    )
WHERE
    NOT EXISTS (
        SELECT 1
        FROM organization_members om
        WHERE
            om.user_id = u.id
            AND COALESCE(om.status, 'active') <> 'removed'
    ) ON CONFLICT (organization_id, user_id) DO NOTHING;

-- ===================== 3. BACKFILL ORGANIZATION_ID =====================
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'products', 'sales', 'reviews', 'anomalies', 'recommendations',
    'predictions_cache', 'monthly_targets', 'notifications',
    'categories', 'store_settings', 'storefront_settings'
  ] LOOP
    IF to_regclass('public.' || t) IS NULL THEN
      CONTINUE;
    END IF;

    -- Prefer the organization where the author is the OWNER, then any other
    -- usable membership. Deterministic: lowest organization id wins.
    EXECUTE format($fmt$
      WITH ranked AS (
        SELECT om.user_id,
               om.organization_id,
               ROW_NUMBER() OVER (
                 PARTITION BY om.user_id
                 ORDER BY (om.role = 'owner') DESC, om.organization_id ASC
               ) AS rn
        FROM organization_members om
        WHERE COALESCE(om.status, 'active') NOT IN ('removed', 'inactive', 'suspended')
      )
      UPDATE %I x
         SET organization_id = ranked.organization_id
        FROM ranked
       WHERE x.user_id = ranked.user_id
         AND ranked.rn = 1
         AND x.organization_id IS NULL
    $fmt$, t);
  END LOOP;
END $$;

-- ===================== 4. SCOPE-AWARE INDEXES =====================
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'products', 'sales', 'reviews', 'anomalies', 'recommendations',
    'predictions_cache', 'monthly_targets', 'notifications',
    'categories', 'store_settings', 'storefront_settings'
  ] LOOP
    IF to_regclass('public.' || t) IS NULL THEN
      CONTINUE;
    END IF;
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_org_scope ON %I(organization_id)', t, t);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_org_user ON %I(organization_id, user_id)', t, t);
  END LOOP;
END $$;

-- Sales and products are read constantly with a date / status filter.
CREATE INDEX IF NOT EXISTS idx_sales_org_date ON sales (organization_id, date);

CREATE INDEX IF NOT EXISTS idx_products_org_category ON products (organization_id, category);

-- ===================== 5. CATEGORY NAMES BECOME SHARED PER ORGANIZATION =====================
-- Categories used to be unique per user. Because they are now shared by the whole
-- organization, two members must not be able to create the same name twice.
-- The legacy per-user unique constraint is dropped (the old index is superseded).
-- Guarded: `categories` is created later on by `db/migrate.js`, so on a database that
-- does not have that table yet this section must be a no-op instead of an error.
DO $$
BEGIN
  IF to_regclass('public.categories') IS NULL THEN
    RETURN;
  END IF;

ALTER TABLE categories
DROP CONSTRAINT IF EXISTS categories_user_id_name_key;

EXECUTE $exec$
CREATE UNIQUE INDEX IF NOT EXISTS uniq_categories_org_name ON categories (organization_id, LOWER(name))
WHERE
    organization_id IS NOT NULL
$exec$;
END $$;

-- ===================== 6. INVITATIONS CARRY THE ROLE =====================
ALTER TABLE invitations
ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES organization_roles (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_invitations_org ON invitations (organization_id);