ALTER TABLE products
  ADD COLUMN IF NOT EXISTS promotion_price NUMERIC(10, 2);

ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_promotion_price_check;

ALTER TABLE products
  ADD CONSTRAINT products_promotion_price_check
  CHECK (promotion_price IS NULL OR (promotion_price >= 0 AND promotion_price < price));