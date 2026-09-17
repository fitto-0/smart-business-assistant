-- Migration 003: Store settings table per user
-- Stores custom branding, contact info, and domain settings for each user's storefront

CREATE TABLE IF NOT EXISTS store_settings (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,

    -- Branding
    store_name      VARCHAR(150),
    logo_url        TEXT,
    primary_color   VARCHAR(7)  DEFAULT '#3B82F6',
    secondary_color VARCHAR(7)  DEFAULT '#1E40AF',
    accent_color    VARCHAR(7)  DEFAULT '#F59E0B',

    -- Store Info
    description     TEXT,
    tagline         VARCHAR(255),
    contact_email   VARCHAR(150),
    contact_phone   VARCHAR(50),
    address         TEXT,
    city            VARCHAR(100),
    country         VARCHAR(100),

    -- Domain
    custom_domain   VARCHAR(255),
    domain_verified BOOLEAN DEFAULT false,

    -- Social / Links
    facebook_url    TEXT,
    instagram_url   TEXT,
    twitter_url     TEXT,
    whatsapp_number VARCHAR(50),

    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_settings_user ON store_settings(user_id);
