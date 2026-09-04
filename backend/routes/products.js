/**
 * Routes produits — PostgreSQL + multi-user isolation
 */

const router = require("express").Router();
const auth = require("../middleware/auth");
const pool = require("../config/db");

const query = (text, params) => pool.query(text, params);

// =====================================================
// GET /api/products
// =====================================================
router.get("/", auth, async (req, res) => {
  try {
    const {
      category,
      status,
      search,
      sortBy = "id",
      order = "ASC",
      limit = 100,
      offset = 0,
    } = req.query;

    const allowedSorts = [
      "id",
      "name",
      "price",
      "stock",
      "sold",
      "revenue",
      "trend",
      "created_at",
    ];

    const sort = allowedSorts.includes(sortBy) ? sortBy : "id";

    const ord = order.toUpperCase() === "DESC" ? "DESC" : "ASC";

    const where = [];
    const params = [];
    let idx = 1;

    where.push(`p.user_id = $${idx}`);
    params.push(req.user.id);
    idx++;

    if (category) {
      where.push(`p.category = $${idx}`);
      params.push(category);
      idx++;
    }

    if (status) {
      where.push(`p.status = $${idx}`);
      params.push(status);
      idx++;
    }

    if (search) {
      where.push(
        `(p.name ILIKE $${idx} OR COALESCE(p.description, '') ILIKE $${idx})`,
      );

      params.push(`%${search}%`);
      idx++;
    }

    const whereClause = `WHERE ${where.join(" AND ")}`;

    const sql = `
      SELECT
        p.id,
        p.name,
        p.category,
        p.price,
        p.stock,
        p.sold,
        p.revenue,
        ROUND(
          CASE
            WHEN (
              SELECT COALESCE(SUM(s.quantity), 0)
              FROM sales s
              WHERE s.product_id = p.id
                AND s.user_id = p.user_id
                AND s.date >= CURRENT_DATE - INTERVAL '59 days'
                AND s.date < CURRENT_DATE - INTERVAL '29 days'
            ) > 0 THEN (
              (
                (
                  SELECT COALESCE(SUM(s.quantity), 0)
                  FROM sales s
                  WHERE s.product_id = p.id
                    AND s.user_id = p.user_id
                    AND s.date >= CURRENT_DATE - INTERVAL '29 days'
                ) - (
                  SELECT COALESCE(SUM(s.quantity), 0)
                  FROM sales s
                  WHERE s.product_id = p.id
                    AND s.user_id = p.user_id
                    AND s.date >= CURRENT_DATE - INTERVAL '59 days'
                    AND s.date < CURRENT_DATE - INTERVAL '29 days'
                )
              )::numeric / (
                SELECT COALESCE(SUM(s.quantity), 0)
                FROM sales s
                WHERE s.product_id = p.id
                  AND s.user_id = p.user_id
                  AND s.date >= CURRENT_DATE - INTERVAL '59 days'
                  AND s.date < CURRENT_DATE - INTERVAL '29 days'
              ) * 100
            )
            ELSE 0
          END,
          2
        ) AS trend,
        p.status,
        p.description,
        p.sku,
        p.created_at,

        (
          SELECT COUNT(*)
          FROM reviews r
          WHERE r.product_id = p.id
          AND r.user_id = p.user_id
        ) AS reviews_count,

        (
          SELECT COALESCE(AVG(r.rating), 0)::DECIMAL(2,1)
          FROM reviews r
          WHERE r.product_id = p.id
          AND r.user_id = p.user_id
        ) AS avg_rating

      FROM products p

      ${whereClause}

      ORDER BY ${sort} ${ord}
      LIMIT $${idx}
      OFFSET $${idx + 1}
    `;

    params.push(
      Math.max(1, parseInt(limit) || 100),
      Math.max(0, parseInt(offset) || 0),
    );

    const result = await query(sql, params);

    // total الحقيقي avant pagination
    const countResult = await query(
      `
      SELECT COUNT(*)::int AS total
      FROM products p
      ${whereClause}
      `,
      params.slice(0, idx - 1),
    );

    return res.json({
      products: result.rows,
      total: countResult.rows[0].total,
    });
  } catch (err) {
    console.error("Erreur GET /products:", err);

    return res.status(500).json({
      error: "Erreur serveur",
    });
  }
});

// =====================================================
// GET /api/products/:id
// =====================================================
router.get("/:id", auth, async (req, res) => {
  try {
    const result = await query(
      `
      SELECT
        p.*,

        ROUND(
          CASE
            WHEN (
              SELECT COALESCE(SUM(s.quantity), 0)
              FROM sales s
              WHERE s.product_id = p.id
                AND s.user_id = p.user_id
                AND s.date >= CURRENT_DATE - INTERVAL '59 days'
                AND s.date < CURRENT_DATE - INTERVAL '29 days'
            ) > 0 THEN (
              (
                (
                  SELECT COALESCE(SUM(s.quantity), 0)
                  FROM sales s
                  WHERE s.product_id = p.id
                    AND s.user_id = p.user_id
                    AND s.date >= CURRENT_DATE - INTERVAL '29 days'
                ) - (
                  SELECT COALESCE(SUM(s.quantity), 0)
                  FROM sales s
                  WHERE s.product_id = p.id
                    AND s.user_id = p.user_id
                    AND s.date >= CURRENT_DATE - INTERVAL '59 days'
                    AND s.date < CURRENT_DATE - INTERVAL '29 days'
                )
              )::numeric / (
                SELECT COALESCE(SUM(s.quantity), 0)
                FROM sales s
                WHERE s.product_id = p.id
                  AND s.user_id = p.user_id
                  AND s.date >= CURRENT_DATE - INTERVAL '59 days'
                  AND s.date < CURRENT_DATE - INTERVAL '29 days'
              ) * 100
            )
            ELSE 0
          END,
          2
        ) AS trend,

        (
          SELECT COUNT(*)
          FROM reviews r
          WHERE r.product_id = p.id
          AND r.user_id = p.user_id
        ) AS reviews_count,

        (
          SELECT COALESCE(AVG(r.rating), 0)::DECIMAL(2,1)
          FROM reviews r
          WHERE r.product_id = p.id
          AND r.user_id = p.user_id
        ) AS avg_rating

      FROM products p
      WHERE p.id = $1
      AND p.user_id = $2
      `,
      [parseInt(req.params.id), req.user.id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: "Produit non trouvé",
      });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("Erreur GET /products/:id:", err);

    return res.status(500).json({
      error: "Erreur serveur",
    });
  }
});

// =====================================================
// POST /api/products
// =====================================================
router.post("/", auth, async (req, res) => {
  try {
    const { name, category, price, stock, description, sku } = req.body;

    if (!name || !category || price === undefined || stock === undefined) {
      return res.status(400).json({
        error: "Champs requis : name, category, price, stock",
      });
    }

    const result = await query(
      `
      INSERT INTO products
        (
          name,
          category,
          price,
          stock,
          description,
          sku,
          user_id
        )
      VALUES
        ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
      [
        name.trim(),
        category,
        parseFloat(price),
        parseInt(stock),
        description || null,
        sku || null,
        req.user.id,
      ],
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Erreur POST /products:", err);

    return res.status(500).json({
      error: "Erreur serveur",
    });
  }
});

// =====================================================
// PUT /api/products/:id
// =====================================================
router.put("/:id", auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const fieldMap = {
      name: "name",
      category: "category",
      price: "price",
      stock: "stock",
      description: "description",
      sku: "sku",
      revenue: "revenue",
    };

    const updates = [];
    const params = [];
    let idx = 1;

    for (const [key, column] of Object.entries(fieldMap)) {
      if (req.body[key] !== undefined) {
        updates.push(`${column} = $${idx}`);
        params.push(req.body[key]);
        idx++;
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: "Aucun champ à mettre à jour",
      });
    }

    params.push(id);
    params.push(req.user.id);

    const result = await query(
      `
      UPDATE products
      SET ${updates.join(", ")}
      WHERE id = $${idx}
      AND user_id = $${idx + 1}
      RETURNING *
      `,
      params,
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: "Produit non trouvé",
      });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("Erreur PUT /products/:id:", err);

    return res.status(500).json({
      error: "Erreur serveur",
    });
  }
});

// =====================================================
// DELETE /api/products/:id
// =====================================================
router.delete("/:id", auth, async (req, res) => {
  try {
    const result = await query(
      `
      DELETE FROM products
      WHERE id = $1
      AND user_id = $2
      RETURNING id, name
      `,
      [parseInt(req.params.id), req.user.id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: "Produit non trouvé",
      });
    }

    return res.json({
      message: "Produit supprimé",
      product: result.rows[0],
    });
  } catch (err) {
    console.error("Erreur DELETE /products/:id:", err);

    return res.status(500).json({
      error: "Erreur serveur",
    });
  }
});

// =====================================================
// POST /api/products/:id/restock
// =====================================================
router.post("/:id/restock", auth, async (req, res) => {
  try {
    const quantity = parseInt(req.body.quantity);

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        error: "Quantité requise (>0)",
      });
    }

    const result = await query(
      `
      UPDATE products
      SET
        stock = stock + $1,
        updated_at = NOW()
      WHERE id = $2
      AND user_id = $3
      RETURNING id, name, stock, status
      `,
      [quantity, parseInt(req.params.id), req.user.id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: "Produit non trouvé",
      });
    }

    return res.json({
      message: `+${quantity} unités ajoutées`,
      product: result.rows[0],
    });
  } catch (err) {
    console.error("Erreur restock:", err);

    return res.status(500).json({
      error: "Erreur serveur",
    });
  }
});

module.exports = router;
