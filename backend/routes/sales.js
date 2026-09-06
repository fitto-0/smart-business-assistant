/**
 * Routes ventes — PostgreSQL + multi-user isolation
 *
 * TOUTES les requêtes sont scopées par req.user.id (issu du JWT vérifié).
 * Aucun user_id provenant du body/query/frontend n'est jamais utilisé.
 */

const router = require("express").Router();
const auth = require("../middleware/auth");
const pool = require("../config/db");

const query = (text, params) => pool.query(text, params);

// =====================================================
// GET /api/sales — liste des ventes (scopée utilisateur)
// =====================================================
router.get("/", auth, async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      productId,
      sortBy = "date",
      order = "DESC",
      limit = 100,
      offset = 0,
    } = req.query;

    const allowedSorts = ["date", "total_amount", "quantity", "created_at"];
    const sort = allowedSorts.includes(sortBy) ? sortBy : "date";
    const ord = order.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const where = ["s.user_id = $1"];
    const params = [req.user.id];
    let idx = 2;

    if (startDate) {
      where.push(`s.date >= $${idx}`);
      params.push(startDate);
      idx++;
    }
    if (endDate) {
      where.push(`s.date <= $${idx}`);
      params.push(endDate);
      idx++;
    }
    if (productId) {
      where.push(`s.product_id = $${idx}`);
      params.push(parseInt(productId));
      idx++;
    }

    const whereClause = `WHERE ${where.join(" AND ")}`;

    const result = await query(
      `
      SELECT
        s.id,
        s.product_id,
        s.date,
        s.quantity,
        s.unit_price,
        s.total_amount,
        s.customer_name,
        s.payment_method,
        s.notes,
        s.created_at,
        p.name AS product_name,
        p.category AS product_category
      FROM sales s
      LEFT JOIN products p ON p.id = s.product_id AND p.user_id = s.user_id
      ${whereClause}
      ORDER BY s.${sort} ${ord}
      LIMIT $${idx}
      OFFSET $${idx + 1}
      `,
      [
        ...params,
        Math.max(1, parseInt(limit) || 100),
        Math.max(0, parseInt(offset) || 0),
      ],
    );

    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM sales s ${whereClause}`,
      params,
    );

    return res.json({
      sales: result.rows,
      total: countResult.rows[0].total,
    });
  } catch (err) {
    console.error("Erreur GET /sales:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

// =====================================================
// GET /api/sales/kpis — KPIs du tableau de bord (scopés)
// =====================================================
router.get("/kpis", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Chiffre d'affaires total + commandes + panier moyen
    const kpiResult = await query(
      `
      SELECT
        COALESCE(SUM(total_amount), 0)::numeric AS total_revenue,
        COUNT(*)::int AS total_orders,
        COALESCE(AVG(total_amount), 0)::numeric AS avg_order_value
      FROM sales
      WHERE user_id = $1
      `,
      [userId],
    );

    // Croissance du CA vs mois précédent (2024 : comparaison sur mois déc.)
    const growthResult = await query(
      `
      SELECT
        COALESCE(SUM(CASE WHEN month_key = 'current' THEN total_amount END), 0)::numeric AS current_revenue,
        COALESCE(SUM(CASE WHEN month_key = 'previous' THEN total_amount END), 0)::numeric AS previous_revenue
      FROM (
        SELECT
          total_amount,
          CASE
            WHEN date >= date_trunc('month', CURRENT_DATE)
             AND date <  date_trunc('month', CURRENT_DATE) + INTERVAL '1 month' THEN 'current'
            WHEN date >= date_trunc('month', CURRENT_DATE) - INTERVAL '1 month'
             AND date <  date_trunc('month', CURRENT_DATE) THEN 'previous'
            ELSE 'other'
          END AS month_key
        FROM sales
        WHERE user_id = $1
      ) t
      WHERE month_key != 'other'
      `,
      [userId],
    );

    const currentRevenue = parseFloat(growthResult.rows[0].current_revenue);
    const previousRevenue = parseFloat(growthResult.rows[0].previous_revenue);
    const revenueGrowth =
      previousRevenue > 0
        ? Math.round(
            ((currentRevenue - previousRevenue) / previousRevenue) * 1000,
          ) / 10
        : 0;

    // Satisfaction client + nombre d'avis (scopés)
    const reviewResult = await query(
      `
      SELECT
        COUNT(*)::int AS total_reviews,
        COALESCE(AVG(rating), 0)::numeric AS avg_rating
      FROM reviews
      WHERE user_id = $1
      `,
      [userId],
    );

    // Croissance de la satisfaction vs mois précédent
    const satisfactionGrowthResult = await query(
      `
      SELECT
        COALESCE(AVG(CASE WHEN month_key = 'current' THEN rating END), 0)::numeric AS current_rating,
        COALESCE(AVG(CASE WHEN month_key = 'previous' THEN rating END), 0)::numeric AS previous_rating
      FROM (
        SELECT
          rating,
          CASE
            WHEN date >= date_trunc('month', CURRENT_DATE)
             AND date <  date_trunc('month', CURRENT_DATE) + INTERVAL '1 month' THEN 'current'
            WHEN date >= date_trunc('month', CURRENT_DATE) - INTERVAL '1 month'
             AND date <  date_trunc('month', CURRENT_DATE) THEN 'previous'
            ELSE 'other'
          END AS month_key
        FROM reviews
        WHERE user_id = $1
      ) t
      WHERE month_key != 'other'
      `,
      [userId],
    );

    const currentRating = parseFloat(
      satisfactionGrowthResult.rows[0].current_rating,
    );
    const previousRating = parseFloat(
      satisfactionGrowthResult.rows[0].previous_rating,
    );
    const satisfactionGrowth =
      previousRating > 0
        ? Math.round(
            ((currentRating - previousRating) / previousRating) * 1000,
          ) / 10
        : 0;

    // Croissance des commandes vs mois précédent
    const ordersGrowthResult = await query(
      `
      SELECT
        COUNT(*) FILTER (WHERE month_key = 'current')::int AS current_orders,
        COUNT(*) FILTER (WHERE month_key = 'previous')::int AS previous_orders
      FROM (
        SELECT
          CASE
            WHEN date >= date_trunc('month', CURRENT_DATE)
             AND date <  date_trunc('month', CURRENT_DATE) + INTERVAL '1 month' THEN 'current'
            WHEN date >= date_trunc('month', CURRENT_DATE) - INTERVAL '1 month'
             AND date <  date_trunc('month', CURRENT_DATE) THEN 'previous'
            ELSE 'other'
          END AS month_key
        FROM sales
        WHERE user_id = $1
      ) t
      `,
      [userId],
    );

    const currentOrders = ordersGrowthResult.rows[0].current_orders;
    const previousOrders = ordersGrowthResult.rows[0].previous_orders;
    const ordersGrowth =
      previousOrders > 0
        ? Math.round(
            ((currentOrders - previousOrders) / previousOrders) * 1000,
          ) / 10
        : 0;

    return res.json({
      totalRevenue: parseFloat(kpiResult.rows[0].total_revenue),
      totalOrders: kpiResult.rows[0].total_orders,
      avgOrderValue: parseFloat(kpiResult.rows[0].avg_order_value),
      revenueGrowth,
      ordersGrowth,
      customerSatisfaction: parseFloat(reviewResult.rows[0].avg_rating).toFixed(
        2,
      ),
      satisfactionGrowth,
      totalReviews: reviewResult.rows[0].total_reviews,
    });
  } catch (err) {
    console.error("Erreur GET /sales/kpis:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

// =====================================================
// GET /api/sales/monthly — ventes vs objectifs mensuels (scopés)
// =====================================================
router.get("/monthly", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(
      `
      SELECT
        TO_CHAR(m, 'YYYY-MM') AS month,
        COALESCE(SUM(s.total_amount), 0)::numeric AS actual,
        COALESCE(MAX(t.target), 0)::numeric AS target,
        COUNT(s.id)::int AS orders
      FROM generate_series(
        date_trunc('year', CURRENT_DATE),
        date_trunc('month', CURRENT_DATE),
        INTERVAL '1 month'
      ) AS m
      LEFT JOIN sales s
        ON DATE_TRUNC('month', s.date) = m
       AND s.user_id = $1
      LEFT JOIN monthly_targets t
        ON t.user_id = $1
       AND t.month = TO_CHAR(m, 'YYYY-MM')
      GROUP BY m
      ORDER BY m ASC
      `,
      [userId],
    );

    return res.json({
      data: result.rows.map((r) => ({
        ...r,
        actual: parseFloat(r.actual),
        target: parseFloat(r.target),
        orders: parseInt(r.orders, 10),
      })),
    });
  } catch (err) {
    console.error("Erreur GET /sales/monthly:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

// =====================================================
// GET /api/sales/categories — répartition CA par catégorie (scopée)
// =====================================================
router.get("/categories", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(
      `
      SELECT
        p.category AS name,
        COALESCE(SUM(s.total_amount), 0)::numeric AS amount,
        COALESCE(c.color, '#64748b') AS color
      FROM sales s
      LEFT JOIN products p ON p.id = s.product_id AND p.user_id = s.user_id
      LEFT JOIN categories c ON c.user_id = s.user_id AND c.name = p.category
      WHERE s.user_id = $1
        AND p.category IS NOT NULL
      GROUP BY p.category, c.color
      ORDER BY amount DESC
      `,
      [userId],
    );

    const total =
      result.rows.reduce((sum, r) => sum + parseFloat(r.amount), 0) || 1;

    return res.json({
      data: result.rows.map((r) => ({
        name: r.name,
        amount: parseFloat(r.amount),
        value: Math.round((parseFloat(r.amount) / total) * 1000) / 10,
        color: r.color,
      })),
    });
  } catch (err) {
    console.error("Erreur GET /sales/categories:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

// =====================================================
// GET /api/sales/weekly — daily revenue for the current week
// =====================================================
router.get("/weekly", auth, async (req, res) => {
  try {
    const result = await query(
      `
      SELECT
        days.day::date AS date,
        COALESCE(SUM(s.total_amount), 0)::numeric AS revenue,
        COUNT(s.id)::int AS orders
      FROM generate_series(
        date_trunc('week', CURRENT_DATE),
        date_trunc('week', CURRENT_DATE) + INTERVAL '6 days',
        INTERVAL '1 day'
      ) AS days(day)
      LEFT JOIN sales s
        ON s.user_id = $1
       AND s.date = days.day::date
      GROUP BY days.day
      ORDER BY days.day
      `,
      [req.user.id],
    );

    return res.json({
      data: result.rows.map((row) => ({
        date: row.date,
        revenue: Number(row.revenue),
        orders: Number(row.orders),
      })),
    });
  } catch (err) {
    console.error("Erreur GET /sales/weekly:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

// =====================================================
// GET /api/sales/recent — ventes récentes (scopées)
// =====================================================
router.get("/recent", auth, async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 7, 1), 100);

    const result = await query(
      `
      SELECT
        s.id,
        s.date,
        s.total_amount,
        s.quantity,
        s.customer_name,
        p.name AS product_name
      FROM sales s
      LEFT JOIN products p ON p.id = s.product_id AND p.user_id = s.user_id
      WHERE s.user_id = $1
      ORDER BY s.date DESC, s.id DESC
      LIMIT $2
      `,
      [req.user.id, limit],
    );

    return res.json({
      data: result.rows.map((r) => ({
        ...r,
        total_amount: parseFloat(r.total_amount),
      })),
    });
  } catch (err) {
    console.error("Erreur GET /sales/recent:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

// =====================================================
// GET /api/sales/top-products — top produits par CA (scopé)
// =====================================================
router.get("/top-products", auth, async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 5, 1), 50);

    const result = await query(
      `
      SELECT
        p.id,
        p.name,
        ROUND(
          CASE
            WHEN trend_data.previous_units > 0 THEN
              ((trend_data.current_units - trend_data.previous_units)::numeric /
                trend_data.previous_units) * 100
            ELSE 0
          END,
          2
        ) AS trend,
        COALESCE(SUM(s.total_amount), 0)::numeric AS revenue,
        COUNT(s.id)::int AS orders
      FROM sales s
      LEFT JOIN products p ON p.id = s.product_id AND p.user_id = s.user_id
      LEFT JOIN LATERAL (
        SELECT
          COALESCE(SUM(quantity) FILTER (
            WHERE date >= CURRENT_DATE - INTERVAL '30 days'
          ), 0)::numeric AS current_units,
          COALESCE(SUM(quantity) FILTER (
            WHERE date >= CURRENT_DATE - INTERVAL '60 days'
              AND date < CURRENT_DATE - INTERVAL '30 days'
          ), 0)::numeric AS previous_units
        FROM sales trend_sales
        WHERE trend_sales.product_id = p.id
          AND trend_sales.user_id = p.user_id
      ) trend_data ON TRUE
      WHERE s.user_id = $1
        AND p.id IS NOT NULL
      GROUP BY p.id, p.name, trend_data.current_units, trend_data.previous_units
      ORDER BY revenue DESC
      LIMIT $2
      `,
      [req.user.id, limit],
    );

    return res.json({
      data: result.rows.map((r) => ({
        ...r,
        revenue: parseFloat(r.revenue),
        trend: parseFloat(r.trend),
      })),
    });
  } catch (err) {
    console.error("Erreur GET /sales/top-products:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

// =====================================================
// POST /api/sales — créer une vente (produit vérifié au user)
// =====================================================
router.post("/", auth, async (req, res) => {
  try {
    const {
      product_id,
      date,
      quantity,
      unit_price,
      customer_name,
      payment_method,
      notes,
    } = req.body;

    if (!product_id || !date || !quantity || unit_price === undefined) {
      return res.status(400).json({
        error: "Champs requis : product_id, date, quantity, unit_price",
      });
    }

    const qty = parseInt(quantity, 10);
    const price = parseFloat(unit_price);

    if (!qty || qty < 1 || !isFinite(price) || price < 0) {
      return res
        .status(400)
        .json({ error: "quantité > 0 et prix valide requis" });
    }

    const validMethods = ["carte", "espèces", "virement", "chèque", "autre"];
    const method = validMethods.includes(payment_method)
      ? payment_method
      : "carte";

    // ⛔ Vérification d'appartenance : le produit doit appartenir à req.user.id
    const product = await query(
      `SELECT id, name FROM products WHERE id = $1 AND user_id = $2`,
      [parseInt(product_id), req.user.id],
    );

    if (product.rowCount === 0) {
      return res.status(404).json({ error: "Produit non trouvé" });
    }

    const result = await query(
      `
      INSERT INTO sales
        (user_id, product_id, date, quantity, unit_price, customer_name, payment_method, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
      `,
      [
        req.user.id,
        parseInt(product_id),
        date,
        qty,
        price,
        customer_name || null,
        method,
        notes || null,
      ],
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Erreur POST /sales:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

// =====================================================
// PUT /api/sales/:id — modifier une vente (scopée)
// =====================================================
router.put("/:id", auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const fieldMap = {
      date: "date",
      quantity: "quantity",
      unit_price: "unit_price",
      customer_name: "customer_name",
      payment_method: "payment_method",
      notes: "notes",
    };

    const updates = [];
    const params = [];
    let idx = 1;

    // Si product_id fourni, vérifier l'appartenance AVANT toute mise à jour
    if (req.body.product_id !== undefined) {
      const product = await query(
        `SELECT id FROM products WHERE id = $1 AND user_id = $2`,
        [parseInt(req.body.product_id), req.user.id],
      );
      if (product.rowCount === 0) {
        return res.status(404).json({ error: "Produit non trouvé" });
      }
      updates.push(`product_id = $${idx}`);
      params.push(parseInt(req.body.product_id));
      idx++;
    }

    for (const [key, column] of Object.entries(fieldMap)) {
      if (req.body[key] !== undefined && key !== "product_id") {
        updates.push(`${column} = $${idx}`);
        params.push(req.body[key]);
        idx++;
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "Aucun champ à mettre à jour" });
    }

    params.push(id, req.user.id);

    const result = await query(
      `
      UPDATE sales
      SET ${updates.join(", ")}
      WHERE id = $${idx}
      AND user_id = $${idx + 1}
      RETURNING *
      `,
      params,
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Vente non trouvée" });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("Erreur PUT /sales/:id:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

// =====================================================
// DELETE /api/sales/:id — supprimer une vente (scopée)
// =====================================================
router.delete("/:id", auth, async (req, res) => {
  try {
    const result = await query(
      `
      DELETE FROM sales
      WHERE id = $1
      AND user_id = $2
      RETURNING id
      `,
      [parseInt(req.params.id), req.user.id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Vente non trouvée" });
    }

    return res.json({ message: "Vente supprimée" });
  } catch (err) {
    console.error("Erreur DELETE /sales/:id:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
