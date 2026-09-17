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

    -- Extended Colors
    background_color      VARCHAR(7)  DEFAULT '#FFFFFF',
    background_type       VARCHAR(20) DEFAULT 'color', -- 'color', 'gradient', 'image'
    background_gradient   VARCHAR(100), -- e.g., 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    background_image_url  TEXT,
    text_color            VARCHAR(7)  DEFAULT '#1F2937',
    text_secondary_color  VARCHAR(7)  DEFAULT '#6B7280',
    border_color          VARCHAR(7)  DEFAULT '#E5E7EB',

    -- Typography
    font_family           VARCHAR(100) DEFAULT 'Inter, system-ui, sans-serif',
    heading_font_family   VARCHAR(100) DEFAULT 'Inter, system-ui, sans-serif',
    font_size_base        VARCHAR(10) DEFAULT '16px',

    -- Layout
    layout_style          VARCHAR(20) DEFAULT 'modern', -- 'modern', 'classic', 'minimal', 'bold'
    container_width       VARCHAR(20) DEFAULT 'max-w-7xl', -- 'max-w-7xl', 'max-w-screen-xl', 'full'
    border_radius         VARCHAR(10) DEFAULT '0.75rem', -- rounded-xl
    spacing_scale         VARCHAR(10) DEFAULT '1', -- 0.75, 1, 1.25

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
    tiktok_url      TEXT,
    youtube_url     TEXT,
    linkedin_url    TEXT,

    -- SEO
    seo_title       VARCHAR(255),
    seo_description TEXT,
    seo_keywords    TEXT,
    og_image_url    TEXT,

    -- Page Visibility (which pages are enabled)
    show_home_page      BOOLEAN DEFAULT true,
    show_products_page  BOOLEAN DEFAULT true,
    show_categories_page BOOLEAN DEFAULT true,
    show_about_page     BOOLEAN DEFAULT true,
    show_contact_page   BOOLEAN DEFAULT true,
    show_cart_page      BOOLEAN DEFAULT true,
    show_account_page   BOOLEAN DEFAULT false,

    -- Home Page Customization
    hero_title          VARCHAR(255),
    hero_subtitle       TEXT,
    hero_button_text    VARCHAR(100),
    hero_button_link    VARCHAR(255),
    hero_image_url      TEXT,
    hero_layout         VARCHAR(20) DEFAULT 'centered', -- 'centered', 'split', 'fullwidth'
    show_featured_products BOOLEAN DEFAULT true,
    featured_products_title VARCHAR(100) DEFAULT 'Featured Products',
    show_categories_section BOOLEAN DEFAULT true,
    categories_section_title VARCHAR(100) DEFAULT 'Shop by Category',
    show_testimonials   BOOLEAN DEFAULT false,
    show_newsletter     BOOLEAN DEFAULT true,
    newsletter_title    VARCHAR(100) DEFAULT 'Subscribe to our newsletter',
    newsletter_subtitle TEXT,

    -- Product Page Customization
    products_layout     VARCHAR(20) DEFAULT 'grid', -- 'grid', 'list', 'masonry'
    products_per_page   INTEGER DEFAULT 12,
    show_product_filters BOOLEAN DEFAULT true,
    show_product_sort   BOOLEAN DEFAULT true,
    product_card_style  VARCHAR(20) DEFAULT 'standard', -- 'standard', 'minimal', 'detailed'
    show_quick_view     BOOLEAN DEFAULT false,

    -- Product Detail Page
    product_gallery_layout VARCHAR(20) DEFAULT 'thumbnails', -- 'thumbnails', 'slider', 'single'
    show_related_products BOOLEAN DEFAULT true,
    related_products_title VARCHAR(100) DEFAULT 'You may also like',
    show_product_tabs   BOOLEAN DEFAULT true,
    enable_reviews      BOOLEAN DEFAULT true,

    -- Contact Page
    contact_form_enabled BOOLEAN DEFAULT true,
    contact_map_embed   TEXT,
    contact_info_title  VARCHAR(100) DEFAULT 'Get in Touch',
    contact_info_subtitle TEXT,

    -- Footer
    footer_text         TEXT,
    footer_copyright    VARCHAR(255),
    show_footer_social  BOOLEAN DEFAULT true,
    show_footer_newsletter BOOLEAN DEFAULT false,

    -- Advanced
    custom_css          TEXT,
    custom_js           TEXT,
    favicon_url         TEXT,

    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_settings_user ON store_settings(user_id);