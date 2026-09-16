/**
 * Storefront API - Public endpoints for customer-facing storefront
 * No authentication required for these endpoints
 */

const router = require("express").Router();
const pool = require("../config/db");
const rateLimit = require("express-rate-limit");

const query = (text, params) => pool.query(text, params);

// Rate limiting to prevent abuse
const storefrontLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs (increased for dev)
  message: { error: "Too many requests, please try again later" },
});

/**
 * GET /api/storefront/:userId
 * Get all public storefront products for a user
 */
router.get("/:userId", storefrontLimiter, async (req, res) => {
  try {
    const { userId } = req.params;
    const { 
      category, 
      search, 
      featured = "false",
      limit = 50,
      offset = 0 
    } = req.query;

    const where = ["user_id = $1", "storefront_enabled = true", "deleted_at IS NULL"];
    const params = [parseInt(userId)];
    let idx = 2;

    if (category) {
      where.push(`category = $${idx}`);
      params.push(category);
      idx++;
    }

    if (search) {
      where.push(`(name ILIKE $${idx} OR COALESCE(description, '') ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    if (featured === "true") {
      where.push(`featured = true`);
    }

    const whereClause = `WHERE ${where.join(" AND ")}`;

    const sql = `
      SELECT
        id,
        name,
        category,
        price,
        stock,
        COALESCE(ai_enhanced_description, description) as description,
        image_url,
        seo_keywords,
        featured,
        storefront_order,
        created_at
      FROM products
      ${whereClause}
      ORDER BY storefront_order ASC, featured DESC, created_at DESC
      LIMIT $${idx}
      OFFSET $${idx + 1}
    `;

    params.push(Math.max(1, parseInt(limit) || 50), Math.max(0, parseInt(offset) || 0));

    const result = await query(sql, params);

    // Get categories for this storefront
    const categoriesResult = await query(
      `SELECT DISTINCT category 
       FROM products 
       WHERE user_id = $1 AND storefront_enabled = true AND deleted_at IS NULL
       ORDER BY category`,
      [parseInt(userId)]
    );

    return res.json({
      products: result.rows,
      categories: categoriesResult.rows.map(r => r.category),
      total: result.rowCount,
    });
  } catch (err) {
    console.error("Error GET /storefront/:userId:", err);
    console.error("Error details:", err.message);
    return res.status(500).json({ error: "Error fetching storefront", details: err.message });
  }
});

/**
 * GET /api/storefront/:userId/products/:productId
 * Get single product details for storefront
 */
router.get("/:userId/products/:productId", storefrontLimiter, async (req, res) => {
  try {
    const { userId, productId } = req.params;

    const result = await query(
      `SELECT
        id,
        name,
        category,
        price,
        stock,
        COALESCE(ai_enhanced_description, description) as description,
        image_url,
        seo_keywords,
        featured,
        storefront_order,
        created_at
      FROM products
      WHERE id = $1 
        AND user_id = $2 
        AND storefront_enabled = true 
        AND deleted_at IS NULL`,
      [parseInt(productId), parseInt(userId)]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("Error GET /storefront/:userId/products/:productId:", err);
    return res.status(500).json({ error: "Error fetching product" });
  }
});

/**
 * GET /api/storefront/:userId/categories
 * Get all categories for a storefront
 */
router.get("/:userId/categories", storefrontLimiter, async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await query(
      `SELECT DISTINCT category, COUNT(*) as product_count
       FROM products
       WHERE user_id = $1 AND storefront_enabled = true AND deleted_at IS NULL
       GROUP BY category
       ORDER BY category`,
      [parseInt(userId)]
    );

    return res.json({
      categories: result.rows,
    });
  } catch (err) {
    console.error("Error GET /storefront/:userId/categories:", err);
    return res.status(500).json({ error: "Error fetching categories" });
  }
});

/**
 * GET /api/storefront/:userId/search
 * Search products in storefront
 */
router.get("/:userId/search", storefrontLimiter, async (req, res) => {
  try {
    const { userId } = req.params;
    const { q, category, limit = 20, offset = 0 } = req.query;

    if (!q) {
      return res.status(400).json({ error: "Search query required" });
    }

    const where = [
      "user_id = $1",
      "storefront_enabled = true",
      "deleted_at IS NULL",
      "(name ILIKE $2 OR COALESCE(description, '') ILIKE $2 OR COALESCE(seo_keywords, '{}')::text ILIKE $2)"
    ];
    const params = [parseInt(userId), `%${q}%`];
    let idx = 3;

    if (category) {
      where.push(`category = $${idx}`);
      params.push(category);
      idx++;
    }

    const whereClause = `WHERE ${where.join(" AND ")}`;

    const sql = `
      SELECT
        id,
        name,
        category,
        price,
        stock,
        COALESCE(ai_enhanced_description, description) as description,
        image_url,
        seo_keywords,
        featured,
        storefront_order
      FROM products
      ${whereClause}
      ORDER BY featured DESC, storefront_order ASC
      LIMIT $${idx}
      OFFSET $${idx + 1}
    `;

    params.push(Math.max(1, parseInt(limit) || 20), Math.max(0, parseInt(offset) || 0));

    const result = await query(sql, params);

    return res.json({
      query: q,
      products: result.rows,
      total: result.rowCount,
    });
  } catch (err) {
    console.error("Error GET /storefront/:userId/search:", err);
    return res.status(500).json({ error: "Error searching products" });
  }
});

/**
 * GET /api/storefront/:userId/featured
 * Get featured products for a storefront
 */
router.get("/:userId/featured", storefrontLimiter, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;

    const result = await query(
      `SELECT
        id,
        name,
        category,
        price,
        stock,
        COALESCE(ai_enhanced_description, description) as description,
        image_url,
        seo_keywords,
        storefront_order
      FROM products
      WHERE user_id = $1 
        AND featured = true 
        AND storefront_enabled = true 
        AND deleted_at IS NULL
      ORDER BY storefront_order ASC
      LIMIT $2`,
      [parseInt(userId), Math.max(1, parseInt(limit) || 10)]
    );

    return res.json({
      products: result.rows,
      total: result.rowCount,
    });
  } catch (err) {
    console.error("Error GET /storefront/:userId/featured:", err);
    return res.status(500).json({ error: "Error fetching featured products" });
  }
});

module.exports = router;
