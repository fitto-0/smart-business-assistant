-- ====================================================================
-- ENABLE STOREFRONT FOR ALL EXISTING PRODUCTS
-- This automatically enables storefront for all existing products
-- Each user will have their own storefront with their actual data
-- ====================================================================

-- Enable storefront for all existing products
UPDATE products 
SET 
    storefront_enabled = true,
    storefront_order = id,
    featured = false
WHERE storefront_enabled IS NULL OR storefront_enabled = false;

-- Verify the update
SELECT 
    user_id,
    COUNT(*) as total_products,
    COUNT(*) FILTER (WHERE storefront_enabled = true) as enabled_products,
    COUNT(*) FILTER (WHERE featured = true) as featured_products
FROM products
GROUP BY user_id
ORDER BY user_id;
