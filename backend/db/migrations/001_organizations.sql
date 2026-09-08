-- ====================================================================
-- ORGANIZATIONS AND ROLES MIGRATION
-- Adds multi-organization support with role-based access control
-- ====================================================================

-- ===================== TABLE ORGANIZATIONS =====================
CREATE TABLE IF NOT EXISTS organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    industry VARCHAR(100),
    size VARCHAR(50) CHECK (size IN ('1-10', '11-50', '51-200', '201-500', '500+')),
    logo_url TEXT,
    settings JSONB DEFAULT '{}',
    subscription_plan VARCHAR(50) DEFAULT 'free' CHECK (subscription_plan IN ('free', 'starter', 'professional', 'enterprise')),
    subscription_status VARCHAR(20) DEFAULT 'active' CHECK (subscription_status IN ('active', 'trial', 'past_due', 'cancelled', 'expired')),
    trial_ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_subscription ON organizations(subscription_plan, subscription_status);

-- ===================== TABLE ORGANIZATION_MEMBERS =====================
CREATE TABLE IF NOT EXISTS organization_members (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'employee' CHECK (role IN ('owner', 'admin', 'manager', 'employee', 'accountant', 'viewer')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('pending', 'active', 'inactive', 'removed')),
    invited_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    invited_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON organization_members(role);
CREATE INDEX IF NOT EXISTS idx_org_members_status ON organization_members(status);

-- ===================== TABLE BRANCHES =====================
CREATE TABLE IF NOT EXISTS branches (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(150),
    is_main BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_branches_org ON branches(organization_id);
CREATE INDEX IF NOT EXISTS idx_branches_active ON branches(is_active);

-- ===================== TABLE INVITATIONS =====================
CREATE TABLE IF NOT EXISTS invitations (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(150) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'employee', 'accountant', 'viewer')),
    invited_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    declined_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invitations_org ON invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);

-- ===================== TABLE AUDIT_LOGS =====================
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_org ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

-- ===================== TABLE REFRESH_TOKENS =====================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    is_revoked BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_org ON refresh_tokens(organization_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at);

-- ===================== TABLE PASSWORD_RESET_TOKENS =====================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_expires ON password_reset_tokens(expires_at);

-- ===================== TABLE EMAIL_VERIFICATION_TOKENS =====================
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(150) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_verify_user ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verify_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_verify_expires ON email_verification_tokens(expires_at);

-- ===================== TABLE INTEGRATIONS =====================
CREATE TABLE IF NOT EXISTS integrations (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('shopify', 'woocommerce', 'stripe', 'google_sheets')),
    shop_url VARCHAR(255),
    shop_name VARCHAR(255),
    access_token TEXT,
    refresh_token TEXT,
    api_key VARCHAR(255),
    api_secret VARCHAR(255),
    branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
    settings JSONB DEFAULT '{}',
    last_sync_at TIMESTAMPTZ,
    sync_frequency VARCHAR(20) DEFAULT 'daily' CHECK (sync_frequency IN ('hourly', 'daily', 'weekly', 'manual')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integrations_org ON integrations(organization_id);
CREATE INDEX IF NOT EXISTS idx_integrations_type ON integrations(type);
CREATE INDEX IF NOT EXISTS idx_integrations_status ON integrations(status);

-- ===================== TRIGGERS FOR UPDATED_AT =====================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop triggers if they exist, then recreate
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_organization_members_updated_at ON organization_members;
CREATE TRIGGER update_organization_members_updated_at
    BEFORE UPDATE ON organization_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_branches_updated_at ON branches;
CREATE TRIGGER update_branches_updated_at
    BEFORE UPDATE ON branches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_integrations_updated_at ON integrations;
CREATE TRIGGER update_integrations_updated_at
    BEFORE UPDATE ON integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===================== MIGRATE EXISTING USERS TO ORGANIZATIONS =====================
-- Create a default organization for each existing user
INSERT INTO organizations (name, slug, industry, size, subscription_plan)
SELECT 
    COALESCE(company, 'Personal Business') as name,
    lower(regexp_replace(COALESCE(company, name || '-' || id), '[^a-z0-9-]', '-', 'g')) as slug,
    'Retail' as industry,
    '1-10' as size,
    'free' as subscription_plan
FROM users
WHERE NOT EXISTS (
    SELECT 1 FROM organization_members om 
    WHERE om.user_id = users.id
);

-- Add users as owners of their organizations
INSERT INTO organization_members (organization_id, user_id, role, status, joined_at)
SELECT 
    o.id as organization_id,
    u.id as user_id,
    'owner' as role,
    'active' as status,
    u.created_at as joined_at
FROM users u
JOIN organizations o ON o.slug = lower(regexp_replace(COALESCE(u.company, u.name || '-' || u.id), '[^a-z0-9-]', '-', 'g'))
WHERE NOT EXISTS (
    SELECT 1 FROM organization_members om 
    WHERE om.user_id = u.id
);

-- ===================== ADD ORGANIZATION_ID TO EXISTING TABLES =====================
-- Add organization_id to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_products_org ON products(organization_id);

-- Add organization_id to sales
ALTER TABLE sales ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_sales_org ON sales(organization_id);

-- Add organization_id to reviews
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_reviews_org ON reviews(organization_id);

-- Add organization_id to anomalies
ALTER TABLE anomalies ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_anomalies_org ON anomalies(organization_id);

-- Add organization_id to recommendations
ALTER TABLE recommendations ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_recommendations_org ON recommendations(organization_id);

-- Add organization_id to predictions_cache
ALTER TABLE predictions_cache ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_predictions_org ON predictions_cache(organization_id);

-- Add organization_id to monthly_targets
ALTER TABLE monthly_targets ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_targets_org ON monthly_targets(organization_id);

-- Add organization_id to notifications
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_notifications_org ON notifications(organization_id);

-- ===================== BACKFILL ORGANIZATION_ID FOR EXISTING DATA =====================
-- Update products with organization_id based on user_id
UPDATE products p
SET organization_id = om.organization_id
FROM organization_members om
WHERE p.user_id = om.user_id 
  AND om.role = 'owner'
  AND p.organization_id IS NULL;

-- Update sales with organization_id based on user_id
UPDATE sales s
SET organization_id = om.organization_id
FROM organization_members om
WHERE s.user_id = om.user_id 
  AND om.role = 'owner'
  AND s.organization_id IS NULL;

-- Update reviews with organization_id based on user_id
UPDATE reviews r
SET organization_id = om.organization_id
FROM organization_members om
WHERE r.user_id = om.user_id 
  AND om.role = 'owner'
  AND r.organization_id IS NULL;

-- Update anomalies with organization_id based on user_id
UPDATE anomalies a
SET organization_id = om.organization_id
FROM organization_members om
WHERE a.user_id = om.user_id 
  AND om.role = 'owner'
  AND a.organization_id IS NULL;

-- Update recommendations with organization_id based on user_id
UPDATE recommendations r
SET organization_id = om.organization_id
FROM organization_members om
WHERE r.user_id = om.user_id 
  AND om.role = 'owner'
  AND r.organization_id IS NULL;

-- Update predictions_cache with organization_id based on user_id
UPDATE predictions_cache pc
SET organization_id = om.organization_id
FROM organization_members om
WHERE pc.user_id = om.user_id 
  AND om.role = 'owner'
  AND pc.organization_id IS NULL;

-- Update monthly_targets with organization_id based on user_id
UPDATE monthly_targets mt
SET organization_id = om.organization_id
FROM organization_members om
WHERE mt.user_id = om.user_id 
  AND om.role = 'owner'
  AND mt.organization_id IS NULL;

-- Update notifications with organization_id based on user_id
UPDATE notifications n
SET organization_id = om.organization_id
FROM organization_members om
WHERE n.user_id = om.user_id 
  AND om.role = 'owner'
  AND n.organization_id IS NULL;

-- ===================== ADD BRANCH_ID TO PRODUCTS AND SALES =====================
ALTER TABLE products ADD COLUMN IF NOT EXISTS branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_products_branch ON products(branch_id);

ALTER TABLE sales ADD COLUMN IF NOT EXISTS branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_sales_branch ON sales(branch_id);

-- ===================== ADD SHOPIFY FIELDS TO PRODUCTS AND SALES =====================
ALTER TABLE products ADD COLUMN IF NOT EXISTS shopify_product_id BIGINT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS shopify_variant_id BIGINT;
CREATE INDEX IF NOT EXISTS idx_products_shopify ON products(shopify_product_id);

ALTER TABLE sales ADD COLUMN IF NOT EXISTS shopify_order_id BIGINT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS shopify_order_number INTEGER;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_email VARCHAR(150);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_name VARCHAR(200);
CREATE INDEX IF NOT EXISTS idx_sales_shopify ON sales(shopify_order_id);

-- ===================== ADD WOOCOMMERCE FIELDS TO PRODUCTS AND SALES =====================
ALTER TABLE products ADD COLUMN IF NOT EXISTS woo_product_id BIGINT;
CREATE INDEX IF NOT EXISTS idx_products_woo ON products(woo_product_id);

ALTER TABLE sales ADD COLUMN IF NOT EXISTS woo_order_id BIGINT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS woo_order_number INTEGER;
CREATE INDEX IF NOT EXISTS idx_sales_woo ON sales(woo_order_id);

-- ===================== ADD COST COLUMN TO PRODUCTS FOR PROFIT CALCULATIONS =====================
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost DECIMAL(10,2) DEFAULT 0;

-- ====================================================================
-- END OF ORGANIZATIONS MIGRATION
-- ====================================================================
