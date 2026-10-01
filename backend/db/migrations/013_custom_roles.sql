-- 013: OWNER-CONTROLLED CUSTOM ROLES + DASHBOARD VISIBILITY
CREATE TABLE IF NOT EXISTS organization_roles (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(80) NOT NULL,
  slug VARCHAR(80) NOT NULL,
  description TEXT DEFAULT '',
  permissions JSONB NOT NULL DEFAULT '{}',
  dashboard_config JSONB NOT NULL DEFAULT '{}',
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_org_roles_org ON organization_roles(organization_id);
ALTER TABLE organization_members ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES organization_roles(id) ON DELETE SET NULL;
ALTER TABLE organization_members ADD COLUMN IF NOT EXISTS dashboard_config JSONB DEFAULT NULL;
ALTER TABLE organization_members DROP CONSTRAINT IF EXISTS organization_members_role_check;
ALTER TABLE invitations DROP CONSTRAINT IF EXISTS invitations_role_check;
