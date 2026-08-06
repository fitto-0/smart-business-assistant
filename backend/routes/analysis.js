/**
 * Routes d'analyse (sentiment, anomalies, recommandations) — PostgreSQL
 * Import adapté à VOTRE config/db.js (Pool)
 */
const router = require('express').Router();
const auth = require('../middleware/auth');
const pool = require('../config/db');
const query = (text, params) => pool.query(text, params);

// Analyseur de sentiment local (lexique français) — fallback si IA absente
const POSITIVE_WORDS = ['excellent', 'parfait', 'magnifique', 'incroyable', 'rapide', 'satisfait',
  'super', 'bon', 'bien', 'qualité', 'recommande', 'efficace', 'confortable', 'top', 'aime', 'adore'];
const NEGATIVE_WORDS = ['déçu', 'mauvais', 'terrible', 'problème', 'cassé', 'défaite', 'incorrect',
  'insatisfait', 'nul', 'horrible', 'retard', 'inexistant', 'défaut', 'périme'];

function analyzeSentimentLocal(text) {
  const lower = (text || '').toLowerCase();
  let pos = 0, neg = 0;
  for (const w of POSITIVE_WORDS) if (lower.includes(w)) pos++;
  for (const w of NEGATIVE_WORDS) if (lower.includes(w)) neg++;
  const total = pos + neg;
  if (total === 0) return { sentiment: 'neutre', score: 0.5 };
  const score = pos / total;
  let sentiment = 'neutre';
  if (score >= 0.65) sentiment = 'positif';
  else if (score <= 0.35) sentiment = 'négatif';
  return { sentiment, score: parseFloat(score.toFixed(3)) };
}

// GET /api/analysis/sentiment
router.get('/sentiment', auth, async (req, res) => {
  try {
    const result = await query(`
      SELECT r.id, r.customer_name, r.rating, r.comment, r.sentiment, r.score, r.date,
             p.name AS product_name
      FROM reviews r LEFT JOIN products p ON p.id = r.product_id
      ORDER BY r.date DESC LIMIT 100
    `);

    const stats = (await query(`
      SELECT sentiment, COUNT(*)::int AS count,
             ROUND((COUNT(*)::decimal / NULLIF((SELECT COUNT(*) FROM reviews), 0) * 100)::numeric, 1) AS percentage
      FROM reviews WHERE sentiment IS NOT NULL GROUP BY sentiment
    `)).rows;

    const colors = { positif: '#10b981', neutre: '#f59e0b', négatif: '#ef4444' };
    const avg = (await query(`SELECT COALESCE(AVG(rating), 0) AS avg_rating, COUNT(*)::int AS total FROM reviews`)).rows[0];

    res.json({
      reviews: result.rows,
      stats: stats.map(s => ({ ...s, count: parseInt(s.count), percentage: parseFloat(s.percentage), color: colors[s.sentiment] })),
      averageRating: parseFloat(avg.avg_rating).toFixed(2),
      totalReviews: parseInt(avg.total),
    });
  } catch (err) {
    console.error('Erreur GET /sentiment:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/analysis/sentiment (analyse d'un texte)
router.post('/sentiment', auth, async (req, res) => {
  try {
    const { text, reviews: inputReviews } = req.body;
    if (text) return res.json(analyzeSentimentLocal(text));
    if (inputReviews) {
      const results = inputReviews.map(r => ({ id: r.id, ...analyzeSentimentLocal(r.comment) }));
      const stats = { positif: 0, neutre: 0, négatif: 0 };
      results.forEach(r => stats[r.sentiment]++);
      const total = results.length || 1;
      res.json({ results, summary: Object.fromEntries(Object.entries(stats).map(([k, v]) =>
        [k, { count: v, percentage: parseFloat((v / total * 100).toFixed(1)) }])) });
    } else {
      res.status(400).json({ error: 'Fournir text ou reviews' });
    }
  } catch (err) {
    console.error('Erreur POST /sentiment:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/analysis/reviews (sauvegarder un avis avec NLP auto)
router.post('/reviews', auth, async (req, res) => {
  try {
    const { product_id, customer_name, rating, comment, date } = req.body;
    if (!product_id || !customer_name || !rating || !comment)
      return res.status(400).json({ error: 'Champs requis : product_id, customer_name, rating, comment' });
    if (rating < 1 || rating > 5) return res.status(400).json({ error: 'Note entre 1 et 5' });

    const sa = analyzeSentimentLocal(comment);
    const result = await query(
      `INSERT INTO reviews (product_id, customer_name, rating, comment, sentiment, score, date)
       VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, CURRENT_DATE)) RETURNING *`,
      [product_id, customer_name, parseInt(rating), comment, sa.sentiment, sa.score, date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erreur POST reviews:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/analysis/anomalies
router.get('/anomalies', auth, async (req, res) => {
  try {
    const { severity, status } = req.query;
    let where = [], params = [], idx = 1;
    if (severity) { where.push(`severity = $${idx++}`); params.push(severity); }
    if (status) { where.push(`status = $${idx++}`); params.push(status); }
    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const result = await query(`SELECT * FROM anomalies ${whereClause} ORDER BY detected_at DESC, id DESC`, params);
    const stats = (await query(`
      SELECT COUNT(*) FILTER (WHERE severity = 'critique')::int AS critical,
             COUNT(*) FILTER (WHERE severity = 'haute')::int AS high,
             COUNT(*) FILTER (WHERE status = 'non_résolu')::int AS unresolved,
             COUNT(*) FILTER (WHERE status = 'résolu')::int AS resolved,
             COUNT(*)::int AS total
      FROM anomalies ${whereClause}`, params)).rows[0];

    res.json({ anomalies: result.rows, stats });
  } catch (err) {
    console.error('Erreur GET anomalies:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/analysis/anomalies/:id/resolve
router.put('/anomalies/:id/resolve', auth, async (req, res) => {
  try {
    const result = await query(
      `UPDATE anomalies SET status = 'résolu', resolved_at = CURRENT_DATE WHERE id = $1 RETURNING *`,
      [parseInt(req.params.id)]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Anomalie non trouvée' });
    res.json({ message: 'Anomalie résolue', anomaly: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erreur serveur' }); }
});

// PUT /api/analysis/anomalies/:id/in-progress
router.put('/anomalies/:id/in-progress', auth, async (req, res) => {
  try {
    const result = await query(
      `UPDATE anomalies SET status = 'en_cours' WHERE id = $1 AND status != 'résolu' RETURNING *`,
      [parseInt(req.params.id)]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Anomalie non trouvée ou déjà résolue' });
    res.json({ message: 'Statut mis à jour', anomaly: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erreur serveur' }); }
});

// POST /api/analysis/detect-anomalies (détection automatique)
router.post('/detect-anomalies', auth, async (req, res) => {
  try {
    const newAnomalies = [];

    // Ruptures de stock
    const ruptures = await query(`
      SELECT id, name FROM products WHERE stock = 0
      AND NOT EXISTS (SELECT 1 FROM anomalies
        WHERE anomalies.type = 'rupture_stock' AND anomalies.product_name = products.name AND anomalies.status != 'résolu')
    `);
    for (const p of ruptures.rows) {
      const ins = await query(
        `INSERT INTO anomalies (type, severity, product_name, description, product_id)
         VALUES ('rupture_stock', 'critique', $1, 'Rupture de stock (0 unités)', $2) RETURNING *`,
        [p.name, p.id]
      );
      newAnomalies.push(ins.rows[0]);
    }

    // Stock faible
    const lowStocks = await query(`
      SELECT id, name, stock FROM products WHERE stock > 0 AND stock <= 10
      AND NOT EXISTS (SELECT 1 FROM anomalies
      WHERE anomalies.type = 'stock_faible' AND anomalies.product_name = products.name AND anomalies.status != 'résolu')
    `);
    for (const p of lowStocks.rows) {
      const ins = await query(
        `INSERT INTO anomalies (type, severity, product_name, description, product_id)
         VALUES ('stock_faible', 'moyenne', $1, $2, $3) RETURNING *`,
        [p.name, `Stock faible : ${p.stock} unités restantes`, p.id]
      );
      newAnomalies.push(ins.rows[0]);
    }

    res.json({ message: `${newAnomalies.length} anomalie(s) détectée(s)`, anomalies: newAnomalies, total: newAnomalies.length });
  } catch (err) {
    console.error('Erreur detect anomalies:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/analysis/recommendations
router.get('/recommendations', auth, async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM recommendations
      ORDER BY CASE priority WHEN 'critique' THEN 1 WHEN 'haute' THEN 2 WHEN 'moyenne' THEN 3 ELSE 4 END, created_at DESC
    `);
    res.json({ recommendations: result.rows, total: result.rows.length });
  } catch (err) {
    console.error('Erreur GET recommendations:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/analysis/recommendations/:id/toggle
router.put('/recommendations/:id/toggle', auth, async (req, res) => {
  try {
    const result = await query(
      `UPDATE recommendations SET done = NOT done, done_at = CASE WHEN done THEN NULL ELSE NOW() END
       WHERE id = $1 RETURNING *`,
      [parseInt(req.params.id)]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Recommandation non trouvée' });
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erreur serveur' }); }
});

module.exports = router;