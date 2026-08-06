/**
 * Routes ventes — connectées à PostgreSQL
 * Import adapté à VOTRE config/db.js (Pool)
 */
const router = require('express').Router();
const auth = require('../middleware/auth');
const pool = require('../config/db');
const query = (text, params) => pool.query(text, params);

const MONTHS = { '01': 'Jan', '02': 'Fév', '03': 'Mar', '04': 'Avr', '05': 'Mai', '06': 'Juin',
                 '07': 'Juil', '08': 'Août', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Déc' };

// GET /api/sales/kpis
router.get('/kpis', auth, async (req, res) => {
  try {
    const k = (await query('SELECT * FROM v_global_kpis')).rows[0];

    const trendRes = await query(`
      WITH current_period AS (
        SELECT COALESCE(SUM(total_amount), 0) AS total
        FROM sales WHERE date >= CURRENT_DATE - INTERVAL '30 days'
      ),
      previous_period AS (
        SELECT COALESCE(SUM(total_amount), 0) AS total
        FROM sales
        WHERE date >= CURRENT_DATE - INTERVAL '60 days'
          AND date < CURRENT_DATE - INTERVAL '30 days'
      )
      SELECT current_period.total AS current_total, previous_period.total AS previous_total,
             CASE WHEN previous_period.total > 0
                  THEN ROUND(((current_period.total - previous_period.total) / previous_period.total * 100)::numeric, 1)
                  ELSE 0 END AS growth
      FROM current_period, previous_period
    `);

    res.json({
      totalRevenue: parseFloat(k.total_revenue || 0),
      revenueGrowth: parseFloat(trendRes.rows[0]?.growth || 0),
      totalOrders: parseInt(k.total_orders || 0),
      avgOrderValue: parseFloat(k.avg_order_value || 0),
      customerSatisfaction: parseFloat(k.avg_rating || 0),
      totalReviews: parseInt(k.total_reviews || 0),
    });
  } catch (err) {
    console.error('Erreur GET /sales/kpis:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/sales/monthly
router.get('/monthly', auth, async (req, res) => {
  try {
    const result = await query(`
      SELECT TO_CHAR(DATE_TRUNC('month', s.date), 'YYYY-MM') AS month,
             COUNT(s.id)::int AS orders,
             SUM(s.total_amount) AS actual
      FROM sales s
      GROUP BY DATE_TRUNC('month', s.date)
      ORDER BY DATE_TRUNC('month', s.date)
      LIMIT 24
    `);

    const targets = (await query(`
      SELECT month, target FROM monthly_targets ORDER BY month
    `)).rows;

    const targetMap = {};
    for (const t of targets) targetMap[t.month] = parseFloat(t.target);

    const data = result.rows.map(r => {
      const mKey = r.month.slice(0, 7);
      return {
        month: MONTHS[r.month.slice(5, 7)] || r.month,
        actual: parseFloat(r.actual),
        target: targetMap[mKey] || 0,
        orders: r.orders,
      };
    });

    res.json({ data, total: data.reduce((s, d) => s + d.actual, 0) });
  } catch (err) {
    console.error('Erreur GET /sales/monthly:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/sales/categories
router.get('/categories', auth, async (req, res) => {
  try {
    const result = await query(`
      SELECT category AS name, SUM(revenue) AS amount,
             ROUND((SUM(revenue) / NULLIF((SELECT SUM(revenue) FROM products), 0) * 100)::numeric, 1) AS share_pct
      FROM products GROUP BY category ORDER BY amount DESC
    `);

    const colors = { 'Électronique': '#6366f1', 'Vêtements': '#06b6d4', 'Alimentation': '#10b981',
                     'Maison': '#f59e0b', 'Sport': '#ec4899', 'Autre': '#64748b' };

    res.json({ data: result.rows.map(r => ({
      name: r.name,
      value: parseFloat(r.share_pct),
      amount: parseFloat(r.amount),
      color: colors[r.name] || '#64748b',
    })) });
  } catch (err) {
    console.error('Erreur GET /sales/categories:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/sales/top-products
router.get('/top-products', auth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const result = await query(
      `SELECT id, name, category, price, stock, sold, revenue, trend
       FROM products WHERE revenue > 0 ORDER BY revenue DESC LIMIT $1`,
      [parseInt(limit)]
    );
    res.json({ data: result.rows });
  } catch (err) {
    console.error('Erreur GET /sales/top-products:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/sales/recent
router.get('/recent', auth, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const result = await query(
      `SELECT s.id, s.date, s.quantity, s.unit_price, s.total_amount,
              s.customer_name, s.payment_method, p.name AS product_name, p.category
       FROM sales s LEFT JOIN products p ON p.id = s.product_id
       ORDER BY s.date DESC, s.id DESC LIMIT $1`,
      [parseInt(limit)]
    );
    res.json({ data: result.rows });
  } catch (err) {
    console.error('Erreur GET /sales/recent:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/sales (déclenche le trigger de mise à jour du stock)
router.post('/', auth, async (req, res) => {
  try {
    const { product_id, date, quantity, unit_price, customer_name, payment_method, notes } = req.body;
    if (!product_id || !date || !quantity || !unit_price)
      return res.status(400).json({ error: 'Champs requis : product_id, date, quantity, unit_price' });

    const result = await query(
      `INSERT INTO sales (product_id, date, quantity, unit_price, customer_name, payment_method, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [product_id, date, parseInt(quantity), parseFloat(unit_price),
       customer_name || null, payment_method || 'carte', notes || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erreur POST /sales:', err);
    if (err.code === '23503') return res.status(400).json({ error: 'Produit inexistant' });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;