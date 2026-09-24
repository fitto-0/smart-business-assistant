const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const pool = require("../db/pool");
const ai = require("../lib/aiClient");
const agg = require("../lib/dataAggregator");

// Toutes les routes exigent une organisation
router.use(auth);
router.use(auth.requireOrganization);

// ---------------------------------------------------------
// GET /api/analysis/predictions
// Récupère les ventes réelles depuis PostgreSQL, appelle l'IA,
// retourne { predictions: [{ month, value }] }
// ---------------------------------------------------------
router.get("/predictions", async (req, res) => {
  try {
    const horizon = Math.max(
      1,
      Math.min(parseInt(req.query.horizon, 10) || 6, 12),
    );
    const monthly = await agg.getMonthlySales(req.organizationId, 12);

    if (monthly.length < 6) {
      return res.status(422).json({
        error: `Not enough sales history: at least 6 months are required (have ${monthly.length}).`,
        based_on_points: monthly.length,
      });
    }

    const sales = monthly.map((m) => Number(m.total));
    // Future labels computed from the last history month — the AI must
    // never stamp forecasts with past months.
    const futureLabels = futureMonthLabels(
      monthly[monthly.length - 1].month,
      horizon,
    );

    const aiRes = await ai.predict({
      sales,
      horizon,
      months_labels: futureLabels,
    });

    // On retourne au frontend l'historique réel + les prédictions
    return res.json({
      predictions: aiRes.predictions,
      history: monthly.map((m) => ({
        month: m.month,
        total: Number(m.total),
      })),
      metrics: aiRes.metrics,
      based_on_points: aiRes.based_on_points,
      model: aiRes.model,
    });
  } catch (err) {
    console.error("[analysis/predictions]", err);
    return res
      .status(err.statusCode || 500)
      .json({ error: err.message || "Erreur lors de la prédiction." });
  }
});

// ---------------------------------------------------------
// GET /api/analysis/sentiment
// Retourne les avis + stats agrégées.
// ---------------------------------------------------------
router.get("/sentiment", async (req, res) => {
  try {
    const reviews = await agg.getReviewsWithProduct(req.organizationId);

    // Si certains avis n'ont pas encore de sentiment, on l'analyse à la volée.
    const enriched = [];
    for (const r of reviews) {
      let sentiment = r.sentiment;
      let score = r.score;

      if (!sentiment && r.comment) {
        try {
          const analysis = await ai.sentiment({ text: r.comment });
          sentiment = analysis.sentiment;
          score = analysis.score;
          // On persiste pour ne pas refaire l'analyse
          await pool.query(
            "UPDATE reviews SET sentiment = $1, score = $2 WHERE id = $3",
            [sentiment, score, r.id],
          );
        } catch (e) {
          sentiment = "neutre";
          score = 0.5;
        }
      }

      enriched.push({
        id: r.id,
        customer_name: r.customer_name,
        product_name: r.product_name,
        rating: r.rating,
        comment: r.comment,
        sentiment: sentiment || "neutre",
        score: Number(score || 0.5),
        date: r.created_at,
      });
    }

    // Stats agrégées
    const counts = { positif: 0, négatif: 0, neutre: 0 };
    enriched.forEach((r) => counts[r.sentiment]++);
    const total = enriched.length || 1;

    const stats = Object.entries(counts).map(([sentiment, count]) => ({
      sentiment,
      count,
      percentage: Math.round((count / total) * 100),
    }));

    const averageRating =
      enriched.reduce((s, r) => s + Number(r.rating || 0), 0) /
      (enriched.length || 1);

    return res.json({
      reviews: enriched,
      stats,
      averageRating: Number(averageRating.toFixed(2)),
      totalReviews: enriched.length,
    });
  } catch (err) {
    console.error("[analysis/sentiment]", err);
    return res
      .status(err.statusCode || 500)
      .json({ error: err.message || "Erreur d'analyse de sentiment." });
  }
});

// ---------------------------------------------------------
// POST /api/analysis/reviews
// Ajoute un avis, l'analyse via IA, l'enregistre.
// ---------------------------------------------------------
router.post("/reviews", async (req, res) => {
  try {
    const { product_id, customer_name, comment, rating } = req.body;

    if (!comment || !customer_name) {
      return res
        .status(400)
        .json({ error: "customer_name et comment requis." });
    }

    // Analyse IA
    let sentiment = "neutre";
    let score = 0.5;
    try {
      const analysis = await ai.sentiment({ text: comment });
      sentiment = analysis.sentiment;
      score = analysis.score;
    } catch (e) {
      console.warn("AI sentiment indisponible, fallback neutre");
    }

    const { rows } = await pool.query(
      `
      INSERT INTO reviews (product_id, customer_name, comment, rating, sentiment, score, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING id
      `,
      [
        product_id || null,
        customer_name,
        comment,
        rating || null,
        sentiment,
        score,
      ],
    );

    return res.status(201).json({
      id: rows[0].id,
      sentiment,
      score,
    });
  } catch (err) {
    console.error("[analysis/reviews POST]", err);
    return res.status(500).json({ error: "Erreur lors de l'ajout de l'avis." });
  }
});

// ---------------------------------------------------------
// POST /api/analysis/detect-anomalies
// Déclenche une détection et persiste le résultat.
// ---------------------------------------------------------
router.post("/detect-anomalies", async (req, res) => {
  try {
    const lang = normalizeLang(req.body?.lang);
    const [monthly, products] = await Promise.all([
      agg.getMonthlySales(req.organizationId, 12),
      agg.getProductsWithStock(req.organizationId),
    ]);

    const salesSeries = monthly.map((m) => Number(m.total));

    // Appel IA (uniquement si assez de données)
    let salesAnomalies = [];
    let stockAnomalies = [];

    try {
      const aiRes = await ai.anomalies({
        sales: salesSeries,
        products,
        lang,
      });
      salesAnomalies = aiRes.sales_anomalies || [];
      stockAnomalies = aiRes.stock_anomalies || [];
    } catch (e) {
      console.warn("AI anomalies indisponible :", e.message);
    }

    // Nettoyage des anciennes anomalies non résolues
    await pool.query(
      `DELETE FROM anomalies
       WHERE organization_id = $1 AND status = 'non_résolu'`,
      [req.organizationId],
    );

    // Insertion des nouvelles
    const allAnomalies = [...salesAnomalies, ...stockAnomalies];

    for (const a of allAnomalies) {
      const type = normalizeAnomalyType(a.type);
      await pool.query(
        `
  INSERT INTO anomalies
    (user_id, organization_id, type, product_name, description, severity, status, detected_at)
  VALUES ($1, $2, $3, $4, $5, $6, 'non_résolu', NOW())
  `,
        [
          req.user.id, // ← AJOUT
          req.organizationId,
          type,
          a.product_name || null,
          a.explanation || a.description || "",
          a.severity || "moyenne",
        ],
      );
    }

    return res.json({
      detected: allAnomalies.length,
      sales_anomalies: salesAnomalies.length,
      stock_anomalies: stockAnomalies.length,
    });
  } catch (err) {
    console.error("[analysis/detect-anomalies]", err);
    return res
      .status(err.statusCode || 500)
      .json({ error: err.message || "Erreur de détection." });
  }
});

// ---------------------------------------------------------
// GET /api/analysis/anomalies
// ---------------------------------------------------------
router.get("/anomalies", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `
      SELECT id, type, description, severity, status, detected_at
      FROM anomalies
      WHERE organization_id = $1
      ORDER BY
        CASE severity
          WHEN 'critique' THEN 1
          WHEN 'haute'    THEN 2
          ELSE 3
        END,
        detected_at DESC
      `,
      [req.organizationId],
    );

    return res.json({ anomalies: rows });
  } catch (err) {
    console.error("[analysis/anomalies GET]", err);
    return res.status(500).json({ error: "Erreur lors de la récupération." });
  }
});

// ---------------------------------------------------------
// PUT /api/analysis/anomalies/:id/resolve
// ---------------------------------------------------------
router.put("/anomalies/:id/resolve", async (req, res) => {
  try {
    await pool.query(
      `UPDATE anomalies SET status = 'résolu'
       WHERE id = $1 AND organization_id = $2`,
      [req.params.id, req.organizationId],
    );
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Erreur." });
  }
});

// ---------------------------------------------------------
// PUT /api/analysis/anomalies/:id/in-progress
// ---------------------------------------------------------
router.put("/anomalies/:id/in-progress", async (req, res) => {
  try {
    await pool.query(
      `UPDATE anomalies SET status = 'en_cours'
       WHERE id = $1 AND organization_id = $2`,
      [req.params.id, req.organizationId],
    );
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Erreur." });
  }
});

// ---------------------------------------------------------
// GET /api/analysis/recommendations
// ---------------------------------------------------------
router.get("/recommendations", async (req, res) => {
  try {
    const lang = normalizeLang(req.query.lang);
    const [anomalies, products, salesStats, reviewsStats] = await Promise.all([
      pool
        .query(
          `SELECT type, product_name, description, severity FROM anomalies
         WHERE organization_id = $1 AND status = 'non_résolu'`,
          [req.organizationId],
        )
        .then((r) => r.rows),
      agg.getProductsWithStock(req.organizationId),
      agg.getSalesStats(req.organizationId),
      agg.getReviewsStats(req.organizationId),
    ]);

    // Convertir les anomalies DB vers le format AI (avec le produit concerné)
    const aiAnomalies = anomalies.map((a) => ({
      type: a.type,
      product_name: a.product_name,
      explanation: a.description,
      severity: a.severity,
    }));

    let recommendations = [];
    try {
      const aiRes = await ai.recommendations({
        anomalies: aiAnomalies,
        products,
        sales_stats: salesStats,
        reviews_stats: reviewsStats,
        lang,
      });
      recommendations = aiRes.recommendations || [];
    } catch (e) {
      console.warn("AI recommendations indisponible :", e.message);
    }

    // Hydrater avec l'état "done" persisté (par un id stable)
    const { rows: persisted } = await pool.query(
      `SELECT title, done FROM recommendations WHERE organization_id = $1`,
      [req.organizationId],
    );
    const doneMap = Object.fromEntries(persisted.map((r) => [r.title, r.done]));

    const enriched = recommendations.map((r, idx) => ({
      id: `rec-${idx}`,
      ...r,
      done: Boolean(doneMap[r.title]),
    }));

    return res.json({
      recommendations: enriched,
      meta: {
        products: products.length,
        open_anomalies: anomalies.length,
        reviews: reviewsStats.total || 0,
        lang,
      },
    });
  } catch (err) {
    console.error("[analysis/recommendations]", err);
    return res.status(500).json({ error: "Erreur." });
  }
});

// ---------------------------------------------------------
// PUT /api/analysis/recommendations/:id/toggle
// ---------------------------------------------------------
router.put("/recommendations/:id/toggle", async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body || {};

    if (!title) {
      return res.status(400).json({ error: "title requis." });
    }

    const { rows } = await pool.query(
      `SELECT id, done FROM recommendations
       WHERE organization_id = $1 AND title = $2 LIMIT 1`,
      [req.organizationId, title],
    );

    let newDone;
    if (rows.length) {
      newDone = !rows[0].done;
      await pool.query(`UPDATE recommendations SET done = $1 WHERE id = $2`, [
        newDone,
        rows[0].id,
      ]);
    } else {
      newDone = true;
      await pool.query(
        `INSERT INTO recommendations (organization_id, title, done)
         VALUES ($1, $2, $3)`,
        [req.organizationId, title, newDone],
      );
    }

    return res.json({ id, done: newDone });
  } catch (err) {
    console.error("[recommendations toggle]", err);
    return res.status(500).json({ error: "Erreur." });
  }
});

// ---------------------------------------------------------
// Helpers
// ---------------------------------------------------------
function normalizeLang(raw) {
  const l = String(raw || "en").slice(0, 2).toLowerCase();
  return l === "fr" ? "fr" : "en";
}

/**
 * Calcule les étiquettes des mois futurs à partir du dernier mois
 * d'historique ("YYYY-MM"), pour que les prédictions portent de vrais
 * mois à venir et jamais des mois du passé.
 */
function futureMonthLabels(lastMonth, horizon) {
  const [y, m] = String(lastMonth || "").split("-").map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m)) return undefined;
  const d = new Date(Date.UTC(y, m - 1, 1));
  const labels = [];
  for (let i = 0; i < horizon; i++) {
    d.setUTCMonth(d.getUTCMonth() + 1);
    labels.push(
      `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
    );
  }
  return labels;
}

function normalizeAnomalyType(rawType) {
  const map = {
    baisse_anormale: "baisse_ventes",
    pic_anormal: "pic_ventes",
    rupture_stock: "rupture_stock",
    stock_faible: "stock_faible",
  };
  return map[rawType] || rawType || "inconnu";
}

module.exports = router;
