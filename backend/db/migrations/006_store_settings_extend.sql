-- ====================================================================
-- Migration 005 : Étendre store_settings avec toutes les colonnes
-- utilisées par le storefront builder (couleurs, SEO, pages, etc.)
-- ====================================================================

ALTER TABLE store_settings
  -- Extended Colors
  ADD COLUMN IF NOT EXISTS background_color VARCHAR(20),
  ADD COLUMN IF NOT EXISTS background_type VARCHAR(20) DEFAULT 'color',
  ADD COLUMN IF NOT EXISTS background_gradient TEXT,
  ADD COLUMN IF NOT EXISTS background_image_url TEXT,
  ADD COLUMN IF NOT EXISTS text_color VARCHAR(20),
  ADD COLUMN IF NOT EXISTS text_secondary_color VARCHAR(20),
  ADD COLUMN IF NOT EXISTS border_color VARCHAR(20),

  -- Typography
  ADD COLUMN IF NOT EXISTS font_family VARCHAR(100),
  ADD COLUMN IF NOT EXISTS heading_font_family VARCHAR(100),
  ADD COLUMN IF NOT EXISTS font_size_base VARCHAR(20),

  -- Layout
  ADD COLUMN IF NOT EXISTS layout_style VARCHAR(30),
  ADD COLUMN IF NOT EXISTS container_width VARCHAR(30),
  ADD COLUMN IF NOT EXISTS border_radius VARCHAR(20),
  ADD COLUMN IF NOT EXISTS spacing_scale VARCHAR(10),

  -- Social / Links extras
  ADD COLUMN IF NOT EXISTS tiktok_url TEXT,
  ADD COLUMN IF NOT EXISTS youtube_url TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,

  -- SEO
  ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255),
  ADD COLUMN IF NOT EXISTS seo_description TEXT,
  ADD COLUMN IF NOT EXISTS seo_keywords TEXT,
  ADD COLUMN IF NOT EXISTS og_image_url TEXT,

  -- Page Visibility
  ADD COLUMN IF NOT EXISTS show_home_page BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_products_page BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_categories_page BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_about_page BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_contact_page BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_cart_page BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_account_page BOOLEAN DEFAULT false,

  -- Home Page
  ADD COLUMN IF NOT EXISTS hero_title VARCHAR(255),
  ADD COLUMN IF NOT EXISTS hero_subtitle VARCHAR(255),
  ADD COLUMN IF NOT EXISTS hero_button_text VARCHAR(100),
  ADD COLUMN IF NOT EXISTS hero_button_link VARCHAR(255),
  ADD COLUMN IF NOT EXISTS hero_image_url TEXT,
  ADD COLUMN IF NOT EXISTS hero_layout VARCHAR(30),
  ADD COLUMN IF NOT EXISTS show_featured_products BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS featured_products_title VARCHAR(255),
  ADD COLUMN IF NOT EXISTS show_categories_section BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS categories_section_title VARCHAR(255),
  ADD COLUMN IF NOT EXISTS show_testimonials BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_newsletter BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS newsletter_title VARCHAR(255),
  ADD COLUMN IF NOT EXISTS newsletter_subtitle VARCHAR(255),

  -- Product Page
  ADD COLUMN IF NOT EXISTS products_layout VARCHAR(30),
  ADD COLUMN IF NOT EXISTS products_per_page INTEGER DEFAULT 12,
  ADD COLUMN IF NOT EXISTS show_product_filters BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_product_sort BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS product_card_style VARCHAR(30),
  ADD COLUMN IF NOT EXISTS show_quick_view BOOLEAN DEFAULT false,

  -- Product Detail
  ADD COLUMN IF NOT EXISTS product_gallery_layout VARCHAR(30),
  ADD COLUMN IF NOT EXISTS show_related_products BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS related_products_title VARCHAR(255),
  ADD COLUMN IF NOT EXISTS show_product_tabs BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS enable_reviews BOOLEAN DEFAULT true,

  -- Contact Page
  ADD COLUMN IF NOT EXISTS contact_form_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS contact_map_embed TEXT,
  ADD COLUMN IF NOT EXISTS contact_info_title VARCHAR(255),
  ADD COLUMN IF NOT EXISTS contact_info_subtitle VARCHAR(255),

  -- Footer
  ADD COLUMN IF NOT EXISTS footer_text TEXT,
  ADD COLUMN IF NOT EXISTS footer_copyright VARCHAR(255),
  ADD COLUMN IF NOT EXISTS show_footer_social BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_footer_newsletter BOOLEAN DEFAULT false,

  -- Advanced
  ADD COLUMN IF NOT EXISTS custom_css TEXT,
  ADD COLUMN IF NOT EXISTS custom_js TEXT,
  ADD COLUMN IF NOT EXISTS favicon_url TEXT;

-- S'assurer que content_overrides a une valeur par défaut pour éviter les violations NOT NULL
ALTER TABLE store_settings
  ALTER COLUMN content_overrides SET DEFAULT '{}'::jsonb;

-- Corriger les lignes existantes qui auraient NULL
UPDATE store_settings SET content_overrides = '{}'::jsonb WHERE content_overrides IS NULL;