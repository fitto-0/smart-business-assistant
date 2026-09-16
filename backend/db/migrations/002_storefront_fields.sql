-- ====================================================================
-- STOREFRONT FEATURE MIGRATION
-- Add storefront-specific fields to products table
-- ====================================================================

-- Add storefront configuration columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS storefront_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS storefront_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_enhanced_description TEXT,
ADD COLUMN IF NOT EXISTS ai_suggested_category VARCHAR(50),
ADD COLUMN IF NOT EXISTS seo_keywords TEXT[],
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;

-- Add index for storefront queries
CREATE INDEX IF NOT EXISTS idx_products_storefront_enabled ON products(storefront_enabled);
CREATE INDEX IF NOT EXISTS idx_products_storefront_order ON products(storefront_order);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);

-- Add comment for documentation
COMMENT ON COLUMN products.storefront_enabled IS 'Whether the product is visible in the public storefront';
COMMENT ON COLUMN products.storefront_order IS 'Display order in storefront (lower = first)';
COMMENT ON COLUMN products.ai_enhanced_description IS 'Product description enhanced by AI';
COMMENT ON COLUMN products.ai_suggested_category IS 'Category suggested by AI for auto-categorization';
COMMENT ON COLUMN products.seo_keywords IS 'SEO keywords for better search visibility';
COMMENT ON COLUMN products.featured IS 'Whether the product is featured/promoted in storefront';
