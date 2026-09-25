/**
 * Storefront API - Public endpoints for customer-facing storefront
 * No authentication required for these endpoints
 */

const router = require("express").Router();
const pool = require("../config/db");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");
const { sendEmail } = require("../lib/email");

const query = (text, params) => pool.query(text, params);

// Rate limiting to prevent abuse
const storefrontLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs (increased for dev)
  message: { error: "Too many requests, please try again later" },
});

const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: "Too many orders, please try again later" },
});

const PRODUCT_COLUMNS = `
        p.id,
        p.name,
        p.category,
        p.price,
        p.promotion_price,
        p.stock,
        COALESCE(p.ai_enhanced_description, p.description) as description,
        p.image_url,
        p.seo_keywords,
        p.featured,
        p.sold,
        p.storefront_order,
        p.created_at,
        COALESCE(r.review_count, 0)::int as review_count,
        COALESCE(r.avg_rating, 0)::numeric(2,1) as avg_rating`;

const PRODUCT_RATING_JOIN = `
      LEFT JOIN (
        SELECT product_id, COUNT(*) as review_count, AVG(rating) as avg_rating
        FROM reviews
        GROUP BY product_id
      ) r ON r.product_id = p.id`;

const SORT_ORDERS = {
  newest: "p.created_at DESC",
  oldest: "p.created_at ASC",
  price_asc: "COALESCE(p.promotion_price, p.price) ASC, p.name ASC",
  price_desc: "COALESCE(p.promotion_price, p.price) DESC, p.name ASC",
  popular: "p.sold DESC NULLS LAST, p.created_at DESC",
  name_asc: "p.name ASC",
  name_desc: "p.name DESC",
  relevance: "p.featured DESC, p.sold DESC NULLS LAST, p.created_at DESC",
};

const VALID_PAYMENT_METHODS = ["carte", "espèces", "virement", "chèque", "autre"];

const effectivePrice = (row) =>
  row.promotion_price != null && row.promotion_price < row.price
    ? row.promotion_price
    : row.price;

/**
 * GET /api/storefront/:userId
 * Get public storefront products (paginated, sortable, filterable)
 */
router.get("/:userId", storefrontLimiter, async (req, res) => {
  try {
    const { userId } = req.params;
    const parsedUserId = parseInt(userId);

    if (isNaN(parsedUserId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const {
      category,
      search,
      featured = "false",
      sale = "false",
      sort,
      limit = 50,
      offset = 0,
    } = req.query;

    const where = ["p.user_id = $1", "p.storefront_enabled = true", "p.deleted_at IS NULL"];
    const params = [parsedUserId];
    let idx = 2;

    if (category) {
      where.push(`p.category = $${idx}`);
      params.push(category);
      idx++;
    }

    if (search) {
      where.push(
        `(p.name ILIKE $${idx} OR COALESCE(p.description, '') ILIKE $${idx})`,
      );
      params.push(`%${search}%`);
      idx++;
    }

    if (featured === "true") {
      where.push(`p.featured = true`);
    }

    if (sale === "true") {
      where.push(`p.promotion_price IS NOT NULL AND p.promotion_price < p.price`);
    }

    const whereClause = `WHERE ${where.join(" AND ")}`;
    const orderBy =
      SORT_ORDERS[sort] ||
      "p.storefront_order ASC, p.featured DESC, p.created_at DESC";

    const countResult = await query(
      `SELECT COUNT(*)::int as total FROM products p ${whereClause}`,
      params,
    );
    const total = countResult.rows[0].total;

    const pageParams = [...params, Math.max(1, parseInt(limit) || 50), Math.max(0, parseInt(offset) || 0)];
    const sql = `
      SELECT
        ${PRODUCT_COLUMNS}
      FROM products p
      ${PRODUCT_RATING_JOIN}
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${idx}
      OFFSET $${idx + 1}
    `;

    const result = await query(sql, pageParams);

    // Categories for this storefront (with product counts)
    const categoriesResult = await query(
      `SELECT category, COUNT(*)::int as count, COUNT(*)::int as product_count
       FROM products
       WHERE user_id = $1 AND storefront_enabled = true AND deleted_at IS NULL
         AND category IS NOT NULL
       GROUP BY category
       ORDER BY category`,
      [parsedUserId],
    );

    return res.json({
      products: result.rows,
      categories: categoriesResult.rows,
      total,
    });
  } catch (err) {
    console.error("Error GET /storefront/:userId:", err);
    return res
      .status(500)
      .json({ error: "Error fetching storefront", details: err.message });
  }
});

/**
 * GET /api/storefront/:userId/products/:productId
 * Single product details (with related products + rating summary)
 */
router.get(
  "/:userId/products/:productId",
  storefrontLimiter,
  async (req, res) => {
    try {
      const { userId, productId } = req.params;
      const parsedUserId = parseInt(userId);
      const parsedProductId = parseInt(productId);

      if (isNaN(parsedUserId) || isNaN(parsedProductId)) {
        return res.status(400).json({ error: "Invalid user ID or product ID" });
      }

      const result = await query(
        `SELECT
        ${PRODUCT_COLUMNS}
      FROM products p
      ${PRODUCT_RATING_JOIN}
      WHERE p.id = $1
        AND p.user_id = $2
        AND p.storefront_enabled = true
        AND p.deleted_at IS NULL`,
        [parsedProductId, parsedUserId],
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Product not found" });
      }

      const product = result.rows[0];

      const relatedResult = await query(
        `SELECT
        ${PRODUCT_COLUMNS}
      FROM products p
      ${PRODUCT_RATING_JOIN}
      WHERE p.user_id = $1
        AND p.storefront_enabled = true
        AND p.deleted_at IS NULL
        AND p.id <> $2
        AND p.category IS NOT NULL
        AND p.category = (SELECT category FROM products WHERE id = $2)
      ORDER BY p.sold DESC NULLS LAST, p.created_at DESC
      LIMIT 4`,
        [parsedUserId, parsedProductId],
      );

      return res.json({ ...product, related: relatedResult.rows });
    } catch (err) {
      console.error("Error GET /storefront/:userId/products/:productId:", err);
      return res.status(500).json({ error: "Error fetching product" });
    }
  },
);

/**
 * GET /api/storefront/:userId/categories
 */
router.get("/:userId/categories", storefrontLimiter, async (req, res) => {
  try {
    const { userId } = req.params;
    const parsedUserId = parseInt(userId);

    if (isNaN(parsedUserId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const result = await query(
      `SELECT category, COUNT(*)::int as count, COUNT(*)::int as product_count
       FROM products
       WHERE user_id = $1 AND storefront_enabled = true AND deleted_at IS NULL
         AND category IS NOT NULL
       GROUP BY category
       ORDER BY category`,
      [parsedUserId],
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
 */
router.get("/:userId/search", storefrontLimiter, async (req, res) => {
  try {
    const { userId } = req.params;
    const parsedUserId = parseInt(userId);

    if (isNaN(parsedUserId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const { q, category, limit = 20, offset = 0, sort } = req.query;

    if (!q) {
      return res.status(400).json({ error: "Search query required" });
    }

    const where = [
      "p.user_id = $1",
      "p.storefront_enabled = true",
      "p.deleted_at IS NULL",
      "(p.name ILIKE $2 OR COALESCE(p.description, '') ILIKE $2 OR COALESCE(p.seo_keywords, '{}')::text ILIKE $2)",
    ];
    const params = [parsedUserId, `%${q}%`];
    let idx = 3;

    if (category) {
      where.push(`p.category = $${idx}`);
      params.push(category);
      idx++;
    }

    const whereClause = `WHERE ${where.join(" AND ")}`;
    const orderBy = SORT_ORDERS[sort] || SORT_ORDERS.relevance;

    const countResult = await query(
      `SELECT COUNT(*)::int as total FROM products p ${whereClause}`,
      params,
    );

    const pageParams = [...params, Math.max(1, parseInt(limit) || 20), Math.max(0, parseInt(offset) || 0)];
    const sql = `
      SELECT
        ${PRODUCT_COLUMNS}
      FROM products p
      ${PRODUCT_RATING_JOIN}
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${idx}
      OFFSET $${idx + 1}
    `;

    const result = await query(sql, pageParams);

    return res.json({
      query: q,
      products: result.rows,
      total: countResult.rows[0].total,
    });
  } catch (err) {
    console.error("Error GET /storefront/:userId/search:", err);
    return res.status(500).json({ error: "Error searching products" });
  }
});

/**
 * GET /api/storefront/:userId/featured
 */
router.get("/:userId/featured", storefrontLimiter, async (req, res) => {
  try {
    const { userId } = req.params;
    const parsedUserId = parseInt(userId);

    if (isNaN(parsedUserId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const { limit = 10 } = req.query;

    const result = await query(
      `SELECT
        ${PRODUCT_COLUMNS}
      FROM products p
      ${PRODUCT_RATING_JOIN}
      WHERE p.user_id = $1
        AND p.featured = true
        AND p.storefront_enabled = true
        AND p.deleted_at IS NULL
      ORDER BY p.storefront_order ASC
      LIMIT $2`,
      [parsedUserId, Math.max(1, parseInt(limit) || 10)],
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

/**
 * GET /api/storefront/:userId/reviews?product_id=&limit=
 * Public product reviews + summary
 */
router.get("/:userId/reviews", storefrontLimiter, async (req, res) => {
  try {
    const parsedUserId = parseInt(req.params.userId);
    if (isNaN(parsedUserId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const { product_id, limit = 50, offset = 0 } = req.query;
    const where = ["r.user_id = $1"];
    const params = [parsedUserId];
    let idx = 2;

    if (product_id) {
      where.push(`r.product_id = $${idx}`);
      params.push(parseInt(product_id));
      idx++;
    }

    const whereClause = `WHERE ${where.join(" AND ")}`;

    const summary = await query(
      `SELECT COUNT(*)::int as count, COALESCE(AVG(r.rating),0)::numeric(2,1) as avg
       FROM reviews r ${whereClause}`,
      params,
    );

    const result = await query(
      `SELECT r.id, r.product_id, r.customer_name, r.rating, r.comment, r.date, r.created_at,
              p.name as product_name
       FROM reviews r
       LEFT JOIN products p ON p.id = r.product_id
       ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, Math.max(1, parseInt(limit) || 50), Math.max(0, parseInt(offset) || 0)],
    );

    return res.json({
      reviews: result.rows,
      count: summary.rows[0].count,
      avg_rating: summary.rows[0].avg,
      total: summary.rows[0].count,
    });
  } catch (err) {
    console.error("Error GET /storefront/:userId/reviews:", err);
    return res.status(500).json({ error: "Error fetching reviews" });
  }
});

/**
 * POST /api/storefront/:userId/reviews
 * Public review submission for a product
 */
router.post("/:userId/reviews", checkoutLimiter, async (req, res) => {
  try {
    const parsedUserId = parseInt(req.params.userId);
    if (isNaN(parsedUserId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const { product_id, customer_name, rating, comment } = req.body;
    const parsedProduct = parseInt(product_id);
    const parsedRating = parseInt(rating);

    if (!customer_name || !String(customer_name).trim()) {
      return res.status(400).json({ error: "Name is required" });
    }
    if (isNaN(parsedProduct)) {
      return res.status(400).json({ error: "Valid product_id is required" });
    }
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    const product = await query(
      `SELECT id FROM products
       WHERE id = $1 AND user_id = $2 AND storefront_enabled = true AND deleted_at IS NULL`,
      [parsedProduct, parsedUserId],
    );
    if (product.rowCount === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const org = await query(
      `SELECT organization_id FROM organization_members
       WHERE user_id = $1 ORDER BY CASE WHEN role = 'owner' THEN 0 ELSE 1 END LIMIT 1`,
      [parsedUserId],
    );

    const sentiment = parsedRating >= 4 ? "positif" : parsedRating === 3 ? "neutre" : "négatif";

    const result = await query(
      `INSERT INTO reviews (user_id, product_id, customer_name, rating, comment, sentiment, score, organization_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, product_id, customer_name, rating, comment, date, created_at`,
      [
        parsedUserId,
        parsedProduct,
        String(customer_name).trim().slice(0, 150),
        parsedRating,
        comment ? String(comment).trim().slice(0, 2000) : null,
        sentiment,
        parsedRating / 5,
        org.rowCount > 0 ? org.rows[0].organization_id : null,
      ],
    );

    return res.status(201).json({ success: true, review: result.rows[0] });
  } catch (err) {
    console.error("Error POST /storefront/:userId/reviews:", err);
    return res.status(500).json({ error: "Error saving review" });
  }
});

/**
 * POST /api/storefront/:userId/checkout
 * Public order placement: validates stock, records the order as sales rows
 * (one row per line item) so the merchant's revenue/stock/AI data stays in sync.
 * Body: {
 *   items: [{ product_id, quantity }],
 *   customer: { name, phone, address, city },
 *   payment_method: 'carte' | 'espèces' | 'virement' | 'chèque' | 'autre',
 *   notes?: string
 * }
 */
router.post("/:userId/checkout", checkoutLimiter, async (req, res) => {
  const client = await pool.connect();
  try {
    const parsedUserId = parseInt(req.params.userId);
    if (isNaN(parsedUserId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const { items, customer, payment_method, notes } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    const method = VALID_PAYMENT_METHODS.includes(payment_method)
      ? payment_method
      : null;
    if (!method) {
      return res.status(400).json({
        error: "Invalid payment method",
        valid_methods: VALID_PAYMENT_METHODS,
      });
    }

    const name = String(customer?.name || "").trim();
    const phone = String(customer?.phone || "").trim();
    const address = String(customer?.address || "").trim();
    const city = String(customer?.city || "").trim();

    if (!name || !phone || !address) {
      return res
        .status(400)
        .json({ error: "Customer name, phone and address are required" });
    }

    const cleaned = [];
    const seen = new Map();
    for (const raw of items) {
      const productId = parseInt(raw?.product_id);
      const quantity = parseInt(raw?.quantity);
      if (isNaN(productId) || isNaN(quantity) || quantity < 1) {
        return res.status(400).json({ error: "Invalid item in cart" });
      }
      if (seen.has(productId)) {
        cleaned[seen.get(productId)].quantity += quantity;
      } else {
        seen.set(productId, cleaned.length);
        cleaned.push({ product_id: productId, quantity });
      }
    }

    const orderRef = `ORD-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const orderMeta = [
      `order=${orderRef}`,
      `customer=${name}`,
      `phone=${phone}`,
      `address=${address}${city ? `, ${city}` : ""}`,
    ];

    await client.query("BEGIN");

    const orgResult = await client.query(
      `SELECT organization_id FROM organization_members
       WHERE user_id = $1 ORDER BY CASE WHEN role = 'owner' THEN 0 ELSE 1 END LIMIT 1`,
      [parsedUserId],
    );
    const organizationId =
      orgResult.rowCount > 0 ? orgResult.rows[0].organization_id : null;

    const lineItems = [];
    let total = 0;

    for (const item of cleaned) {
      const result = await client.query(
        `SELECT id, name, price, promotion_price, stock, storefront_enabled, deleted_at
         FROM products
         WHERE id = $1 AND user_id = $2
         FOR UPDATE`,
        [item.product_id, parsedUserId],
      );

      if (result.rowCount === 0 || result.rows[0].deleted_at) {
        await client.query("ROLLBACK");
        return res
          .status(404)
          .json({ error: `Product ${item.product_id} not found` });
      }

      const product = result.rows[0];
      if (!product.storefront_enabled) {
        await client.query("ROLLBACK");
        return res
          .status(400)
          .json({ error: `"${product.name}" is not available for sale` });
      }

      if (parseInt(product.stock, 10) < item.quantity) {
        await client.query("ROLLBACK");
        return res.status(409).json({
          error: `Insufficient stock for "${product.name}" (available: ${product.stock})`,
          product_id: product.id,
          available: parseInt(product.stock, 10),
        });
      }

      const price = parseFloat(effectivePrice(product));
      const lineTotal = price * item.quantity;
      total += lineTotal;

      const notesLine = [...orderMeta, `product=${product.name}`].join(" | ");
      const insertResult = await client.query(
        `INSERT INTO sales
          (user_id, product_id, date, quantity, unit_price, customer_name, payment_method, notes, organization_id)
         VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          parsedUserId,
          product.id,
          item.quantity,
          price.toFixed(2),
          name.slice(0, 150),
          method,
          notesLine,
          organizationId,
        ],
      );

      lineItems.push({
        product_id: product.id,
        name: product.name,
        quantity: item.quantity,
        unit_price: price,
        total: lineTotal,
        sale_id: insertResult.rows[0].id,
      });
    }

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      order_ref: orderRef,
      payment_method: method,
      total,
      items: lineItems,
      placed_at: new Date().toISOString(),
      message:
        method === "espèces"
          ? "Your order has been placed. Payment will be collected on delivery."
          : "Your order has been placed. We will contact you to confirm payment details.",
    });
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch (e) {
      /* ignore */
    }
    console.error("Error POST /storefront/:userId/checkout:", err);
    return res
      .status(500)
      .json({ error: "Error placing order", details: err.message });
  } finally {
    client.release();
  }
});

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));

const merchantContactEmail = async (userId) => {
  const settings = await query(
    "SELECT contact_email, store_name FROM store_settings WHERE user_id = $1",
    [userId],
  );
  if (settings.rowCount > 0 && settings.rows[0].contact_email) {
    return settings.rows[0].contact_email;
  }
  const user = await query("SELECT email FROM users WHERE id = $1", [userId]);
  return user.rowCount > 0 ? user.rows[0].email : null;
};

/**
 * POST /api/storefront/:userId/contact
 * Public contact form — emails the merchant (no table required).
 */
router.post("/:userId/contact", checkoutLimiter, async (req, res) => {
  try {
    const parsedUserId = parseInt(req.params.userId);
    if (isNaN(parsedUserId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const { name, email, phone, subject, message } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "Name is required" });
    }
    if (!isEmail(email)) {
      return res.status(400).json({ error: "A valid email is required" });
    }
    if (!message || !String(message).trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    const to = await merchantContactEmail(parsedUserId);
    if (!to) {
      return res
        .status(500)
        .json({ error: "The store has no contact email configured" });
    }

    const store = await query(
      "SELECT store_name FROM store_settings WHERE user_id = $1",
      [parsedUserId],
    );
    const storeName =
      (store.rowCount > 0 && store.rows[0].store_name) || "Storefront";

    await sendEmail({
      to,
      subject: `[${storeName}] ${escapeHtml(subject || "New message")}`,
      html: `
        <p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
        ${phone ? `<p><strong>Phone:</strong> ${escapeHtml(phone)}</p>` : ""}
        <p><strong>Store:</strong> ${escapeHtml(storeName)} (owner #${parsedUserId})</p>
        <hr />
        <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
      `,
      text: `${name} <${email}>${phone ? ` · ${phone}` : ""}\n\n${message}`,
    });

    return res.json({
      success: true,
      message: "Your message has been sent. We will get back to you shortly.",
    });
  } catch (err) {
    console.error("Error POST /storefront/:userId/contact:", err);
    return res.status(500).json({ error: "Error sending message" });
  }
});

/**
 * POST /api/storefront/:userId/newsletter
 * Public newsletter signup — notifies the merchant (no table required).
 */
router.post("/:userId/newsletter", checkoutLimiter, async (req, res) => {
  try {
    const parsedUserId = parseInt(req.params.userId);
    if (isNaN(parsedUserId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const { email } = req.body || {};
    if (!isEmail(email)) {
      return res.status(400).json({ error: "A valid email is required" });
    }

    const to = await merchantContactEmail(parsedUserId);
    if (!to) {
      return res
        .status(500)
        .json({ error: "The store has no contact email configured" });
    }

    await sendEmail({
      to,
      subject: "New newsletter subscriber",
      html: `<p>A visitor subscribed to your newsletter:</p><p><strong>${escapeHtml(email)}</strong></p>`,
      text: `New newsletter subscriber: ${email}`,
    });

    return res.json({
      success: true,
      message: "You are subscribed to the newsletter.",
    });
  } catch (err) {
    console.error("Error POST /storefront/:userId/newsletter:", err);
    return res.status(500).json({ error: "Subscription failed" });
  }
});

module.exports = router;
