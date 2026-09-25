-- Every sale insert (storefront checkout, dashboard "record sale",
-- Shopify/WooCommerce imports, AI copilot) must move the product's
-- stock / sold / revenue so the dashboard always reflects what was bought.
-- Idempotent: safe to run on every start.

CREATE OR REPLACE FUNCTION public.update_product_stats()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE products
    SET sold = COALESCE(sold, 0) + NEW.quantity,
        revenue = COALESCE(revenue, 0) + NEW.total_amount,
        stock = GREATEST(COALESCE(stock, 0) - NEW.quantity, 0)
    WHERE id = NEW.product_id
      AND user_id = NEW.user_id;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_product_stats ON public.sales;

CREATE TRIGGER trigger_update_product_stats
AFTER INSERT ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.update_product_stats();
