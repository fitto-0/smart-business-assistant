-- ====================================================================
-- UPDATE STOREFRONT FIELDS FOR EXISTING SEED DATA
-- This script updates existing products with storefront configuration
-- ====================================================================

-- Update products for User 1 (Demo User) - Enable storefront and set some as featured
UPDATE products 
SET 
    storefront_enabled = true,
    storefront_order = id,
    featured = CASE 
        WHEN id IN (1, 3, 6) THEN true  -- iPhone 14 Pro, MacBook Air M2, Robe Été Femme as featured
        ELSE false 
    END,
    ai_enhanced_description = CASE
        WHEN id = 1 THEN 'Experience the ultimate smartphone with Apple''s A16 Bionic chip. Features a stunning 6.1-inch Super Retina XDR display, advanced camera system with 48MP main sensor, and all-day battery life. Perfect for photography enthusiasts and professionals.'
        WHEN id = 2 THEN 'Discover Samsung''s most advanced Galaxy S series smartphone. Equipped with a groundbreaking 200MP camera, Snapdragon 8 Gen 2 processor, and Dynamic AMOLED 2X display. Capture every detail with unprecedented clarity.'
        WHEN id = 3 THEN 'Ultra-thin and incredibly powerful, the MacBook Air with M2 chip delivers blazing-fast performance in a portable design. Features a stunning Liquid Retina display, up to 18 hours of battery life, and advanced neural engine for AI tasks.'
        WHEN id = 4 THEN 'Immersive audio experience with Active Noise Cancellation. These premium earbuds feature H2 chip for intelligent noise cancellation, spatial audio with dynamic head tracking, and up to 6 hours of listening time.'
        ELSE description
    END,
    seo_keywords = CASE
        WHEN id = 1 THEN ARRAY['smartphone', 'Apple', 'iPhone', '5G', 'camera', 'premium phone']
        WHEN id = 2 THEN ARRAY['smartphone', 'Samsung', 'Galaxy', 'Android', 'camera phone', '5G']
        WHEN id = 3 THEN ARRAY['laptop', 'Apple', 'MacBook', 'M2 chip', 'ultrabook', 'portable computer']
        WHEN id = 4 THEN ARRAY['earbuds', 'wireless headphones', 'Apple', 'AirPods', 'noise cancelling', 'Bluetooth']
        WHEN id = 5 THEN ARRAY['jeans', 'men clothing', 'slim fit', 'denim', 'casual wear']
        WHEN id = 6 THEN ARRAY['dress', 'women clothing', 'summer dress', 'fashion', 'lightweight']
        WHEN id = 7 THEN ARRAY['running shoes', 'sneakers', 'sports', 'athletic footwear', 'gym shoes']
        WHEN id = 8 THEN ARRAY['coffee', 'premium coffee', 'arabica', 'ground coffee', 'beverage']
        WHEN id = 9 THEN ARRAY['olive oil', 'cooking oil', 'organic', 'Mediterranean', 'healthy']
        WHEN id = 10 THEN ARRAY['sofa', 'furniture', 'couch', 'living room', 'modern design']
        WHEN id = 11 THEN ARRAY['desk lamp', 'LED lamp', 'office lighting', 'adjustable lamp', 'USB port']
        WHEN id = 12 THEN ARRAY['yoga mat', 'fitness', 'exercise mat', 'eco-friendly', 'sports equipment']
    END
WHERE user_id = 1;

-- Update products for User 2 (Karim Khali)
UPDATE products 
SET 
    storefront_enabled = true,
    storefront_order = id - 12,  -- Start from 1
    featured = CASE 
        WHEN id = 14 THEN true  -- Parfum Orient as featured
        ELSE false 
    END,
    ai_enhanced_description = CASE
        WHEN id = 13 THEN 'Premium cotton shirt crafted from organic materials. Features classic fit, breathable fabric perfect for everyday wear, and durable stitching. Available in multiple colors and sizes.'
        WHEN id = 14 THEN 'Exquisite oriental fragrance with woody notes and long-lasting scent. Perfect for special occasions and daily wear. Features top notes of oud, amber, and musk.'
        WHEN id = 15 THEN 'Luxurious handbag crafted from genuine leather. Features elegant design, multiple compartments, and durable construction. Perfect complement to any outfit.'
        ELSE description
    END,
    seo_keywords = CASE
        WHEN id = 13 THEN ARRAY['shirt', 'men clothing', 'cotton shirt', 'casual wear', 'organic clothing']
        WHEN id = 14 THEN ARRAY['perfume', 'fragrance', 'oriental perfume', 'oud', 'luxury scent']
        WHEN id = 15 THEN ARRAY['handbag', 'leather bag', 'women accessories', 'luxury bag', 'purse']
    END
WHERE user_id = 2;

-- Update products for User 3 (Sophie Martin)
UPDATE products 
SET 
    storefront_enabled = true,
    storefront_order = id - 15,  -- Start from 1
    featured = CASE 
        WHEN id = 16 THEN true  -- Thé Vert Bio as featured
        ELSE false 
    END,
    ai_enhanced_description = CASE
        WHEN id = 16 THEN 'Premium organic green tea sourced from the finest gardens. Rich in antioxidants, smooth flavor, and natural aroma. Perfect for health-conscious tea lovers.'
        WHEN id = 17 THEN 'Hand-poured artisanal candle infused with natural lavender essential oil. Creates a calming atmosphere with long-lasting burn time. Made from soy wax for clean burning.'
        WHEN id = 18 THEN 'Elegant leather-bound notebook perfect for journaling, sketching, or note-taking. Features premium paper, durable cover, and classic design. Ideal gift for writers and artists.'
        ELSE description
    END,
    seo_keywords = CASE
        WHEN id = 16 THEN ARRAY['green tea', 'organic tea', 'herbal tea', 'healthy beverage', 'antioxidants']
        WHEN id = 17 THEN ARRAY['scented candle', 'lavender candle', 'aromatherapy', 'handmade candle', 'soy wax']
        WHEN id = 18 THEN ARRAY['notebook', 'journal', 'leather notebook', 'stationery', 'gift']
    END
WHERE user_id = 3;

-- Verify the updates
SELECT 
    user_id,
    COUNT(*) as total_products,
    COUNT(*) FILTER (WHERE storefront_enabled = true) as enabled_products,
    COUNT(*) FILTER (WHERE featured = true) as featured_products
FROM products
GROUP BY user_id
ORDER BY user_id;
