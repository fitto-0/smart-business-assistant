/**
 * Routes d'analyse — PostgreSQL + multi-user isolation
 */

const router = require("express").Router();
const auth = require("../middleware/auth");
const axios = require("axios");
const pool = require("../config/db");

const query = (text, params) => pool.query(text, params);
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://ai:8000";

const runAiAnalysis = async (data) => {
  const response = await axios.post(`${AI_SERVICE_URL}/analyze`, data, {
    timeout: 10000,
  });
  return response.data;
};

// =====================================================
// SENTIMENT LOCAL
// =====================================================

const POSITIVE_WORDS = [
  "excellent",
  "parfait",
  "magnifique",
  "incroyable",
  "rapide",
  "satisfait",
  "super",
  "bon",
  "bien",
  "qualité",
  "recommande",
  "efficace",
  "confortable",
  "top",
  "aime",
  "adore",
];

const NEGATIVE_WORDS = [
  "déçu",
  "mauvais",
  "terrible",
  "problème",
  "cassé",
  "défaite",
  "incorrect",
  "insatisfait",
  "nul",
  "horrible",
  "retard",
  "inexistant",
  "défaut",
  "périme",
];

function analyzeSentimentLocal(text) {
  const lower = (text || "").toLowerCase();

  let pos = 0;
  let neg = 0;

  for (const word of POSITIVE_WORDS) {
    if (lower.includes(word)) pos++;
  }

  for (const word of NEGATIVE_WORDS) {
    if (lower.includes(word)) neg++;
  }

  const total = pos + neg;

  if (total === 0) {
    return {
      sentiment: "neutre",
      score: 0.5,
    };
  }

  const score = pos / total;

  let sentiment = "neutre";

  if (score >= 0.65) {
    sentiment = "positif";
  } else if (score <= 0.35) {
    sentiment = "négatif";
  }

  return {
    sentiment,
    score: parseFloat(score.toFixed(3)),
  };
}

// =====================================================
// GET /api/analysis/predictions
// =====================================================
router.get("/predictions", auth, async (req, res) => {
  try {
    const result = await query(
      `
      SELECT
        DATE_TRUNC('month', date)::DATE AS month_start,
        TO_CHAR(
          DATE_TRUNC('month', date),
          'YYYY-MM'
        ) AS month,
        SUM(total_amount) AS total

      FROM sales

      WHERE user_id = $1

      GROUP BY DATE_TRUNC('month', date)

      ORDER BY DATE_TRUNC('month', date)
      `,
      [req.user.id],
    );

    const monthlyValues = result.rows.map((r) => Number(r.total || 0));

    try {
      const aiResult = await axios.post(
        `${AI_SERVICE_URL}/predict?horizon=6`,
        { sales: monthlyValues },
        { timeout: 10000 },
      );

      return res.json({
        predictions: aiResult.data.predictions.map((prediction, index) => ({
          month: labels[(new Date().getMonth() + index + 1) % 12],
          value: prediction.value ?? prediction,
        })),
        model_metrics: aiResult.data.model_metrics,
        source: "ai-service",
      });
    } catch (aiError) {
      console.error(
        "AI prediction unavailable, using local fallback:",
        aiError.message,
      );
    }

    const labels = [
      "Jan",
      "Fév",
      "Mar",
      "Avr",
      "Mai",
      "Juin",
      "Juil",
      "Août",
      "Sep",
      "Oct",
      "Nov",
      "Déc",
    ];

    const n = monthlyValues.length;

    if (n === 0) {
      return res.json({
        predictions: [],
      });
    }

    const xMean = monthlyValues.reduce((sum, _, index) => sum + index, 0) / n;

    const yMean = monthlyValues.reduce((sum, value) => sum + value, 0) / n;

    let numerator = 0;
    let denominator = 0;

    monthlyValues.forEach((value, index) => {
      const xDelta = index - xMean;
      const yDelta = value - yMean;

      numerator += xDelta * yDelta;
      denominator += xDelta * xDelta;
    });

    const slope = denominator !== 0 ? numerator / denominator : 0;

    const intercept = yMean - slope * xMean;

    const predictions = Array.from({ length: 6 }, (_, index) => {
      const forecastIndex = n + index;

      const value = Math.max(0, intercept + slope * forecastIndex);

      return {
        month: labels[(new Date().getMonth() + index + 1) % 12],
        value: Math.round(value),
      };
    });

    return res.json({
      predictions,
    });
  } catch (err) {
    console.error("Erreur GET /predictions:", err);

    return res.status(500).json({
      error: "Erreur serveur",
    });
  }
});

// =====================================================
// GET /api/analysis/sentiment
// =====================================================
router.get("/sentiment", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(
      `
      SELECT
        r.id,
        r.customer_name,
        r.rating,
        r.comment,
        r.sentiment,
        r.score,
        r.date,
        p.name AS product_name

      FROM reviews r

      LEFT JOIN products p
        ON p.id = r.product_id
        AND p.user_id = r.user_id

      WHERE r.user_id = $1

      ORDER BY r.date DESC

      LIMIT 100
      `,
      [userId],
    );

    const stats = (
      await query(
        `
        SELECT
          sentiment,
          COUNT(*)::int AS count,

          ROUND(
            (
              COUNT(*)::decimal
              /
              NULLIF(
                (
                  SELECT COUNT(*)
                  FROM reviews
                  WHERE user_id = $1
                ),
                0
              )
              * 100
            )::numeric,
            1
          ) AS percentage

        FROM reviews

        WHERE user_id = $1
        AND sentiment IS NOT NULL

        GROUP BY sentiment
        `,
        [userId],
      )
    ).rows;

    const colors = {
      positif: "#10b981",
      neutre: "#f59e0b",
      négatif: "#ef4444",
    };

    const avg = (
      await query(
        `
        SELECT
          COALESCE(AVG(rating), 0) AS avg_rating,
          COUNT(*)::int AS total

        FROM reviews

        WHERE user_id = $1
        `,
        [userId],
      )
    ).rows[0];

    return res.json({
      reviews: result.rows,

      stats: stats.map((s) => ({
        ...s,
        count: parseInt(s.count),
        percentage: parseFloat(s.percentage),
        color: colors[s.sentiment],
      })),

      averageRating: parseFloat(avg.avg_rating).toFixed(2),

      totalReviews: parseInt(avg.total),
    });
  } catch (err) {
    console.error("Erreur GET /sentiment:", err);

    return res.status(500).json({
      error: "Erreur serveur",
    });
  }
});

// =====================================================
// POST /api/analysis/sentiment
// =====================================================
router.post("/sentiment", auth, async (req, res) => {
  try {
    const { text, reviews: inputReviews } = req.body;

    if (text) {
      try {
        const aiResult = await runAiAnalysis({ reviews: [{ comment: text }] });
        return res.json(aiResult.sentiment || analyzeSentimentLocal(text));
      } catch (aiError) {
        console.error(
          "AI sentiment unavailable, using local fallback:",
          aiError.message,
        );
        return res.json(analyzeSentimentLocal(text));
      }
    }

    if (inputReviews) {
      try {
        const aiResult = await runAiAnalysis({ reviews: inputReviews });
        return res.json(aiResult.sentiment || aiResult);
      } catch (aiError) {
        console.error(
          "AI sentiment unavailable, using local fallback:",
          aiError.message,
        );
      }

      const results = inputReviews.map((review) => ({
        id: review.id,
        ...analyzeSentimentLocal(review.comment),
      }));

      const stats = {
        positif: 0,
        neutre: 0,
        négatif: 0,
      };

      results.forEach((r) => {
        stats[r.sentiment]++;
      });

      const total = results.length || 1;

      return res.json({
        results,
        summary: Object.fromEntries(
          Object.entries(stats).map(([key, value]) => [
            key,
            {
              count: value,
              percentage: parseFloat(((value / total) * 100).toFixed(1)),
            },
          ]),
        ),
      });
    }

    return res.status(400).json({
      error: "Fournir text ou reviews",
    });
  } catch (err) {
    console.error("Erreur POST /sentiment:", err);

    return res.status(500).json({
      error: "Erreur serveur",
    });
  }
});

// =====================================================
// POST /api/analysis/reviews
// =====================================================
router.post("/reviews", auth, async (req, res) => {
  try {
    const { product_id, customer_name, rating, comment, date } = req.body;

    if (!product_id || !customer_name || !rating || !comment) {
      return res.status(400).json({
        error: "Champs requis : product_id, customer_name, rating, comment",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        error: "Note entre 1 et 5",
      });
    }

    // Vérifier que le produit appartient au user
    const product = await query(
      `
      SELECT id
      FROM products
      WHERE id = $1
      AND user_id = $2
      `,
      [parseInt(product_id), req.user.id],
    );

    if (product.rowCount === 0) {
      return res.status(404).json({
        error: "Produit non trouvé",
      });
    }

    const sentiment = analyzeSentimentLocal(comment);

    const result = await query(
      `
      INSERT INTO reviews
        (
          product_id,
          customer_name,
          rating,
          comment,
          sentiment,
          score,
          date,
          user_id
        )
      VALUES
        ($1, $2, $3, $4, $5, $6,
         COALESCE($7, CURRENT_DATE), $8)

      RETURNING *
      `,
      [
        parseInt(product_id),
        customer_name,
        parseInt(rating),
        comment,
        sentiment.sentiment,
        sentiment.score,
        date || null,
        req.user.id,
      ],
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Erreur POST reviews:", err);

    return res.status(500).json({
      error: "Erreur serveur",
    });
  }
});

// =====================================================
// GET /api/analysis/anomalies
// =====================================================
router.get("/anomalies", auth, async (req, res) => {
  try {
    const conditions = ["user_id = $1"];

    const params = [req.user.id];

    let idx = 2;

    if (req.query.severity) {
      conditions.push(`severity = $${idx}`);
      params.push(req.query.severity);
      idx++;
    }

    if (req.query.status) {
      conditions.push(`status = $${idx}`);
      params.push(req.query.status);
      idx++;
    }

    const whereClause = conditions.join(" AND ");

    const result = await query(
      `
      SELECT *
      FROM anomalies
      WHERE ${whereClause}
      ORDER BY detected_at DESC, id DESC
      `,
      params,
    );

    const stats = (
      await query(
        `
        SELECT
          COUNT(*) FILTER (
            WHERE severity = 'critique'
          )::int AS critical,

          COUNT(*) FILTER (
            WHERE severity = 'haute'
          )::int AS high,

          COUNT(*) FILTER (
            WHERE status = 'non_résolu'
          )::int AS unresolved,

          COUNT(*) FILTER (
            WHERE status = 'résolu'
          )::int AS resolved,

          COUNT(*)::int AS total

        FROM anomalies

        WHERE ${whereClause}
        `,
        params,
      )
    ).rows[0];

    return res.json({
      anomalies: result.rows,
      stats,
    });
  } catch (err) {
    console.error("Erreur GET anomalies:", err);

    return res.status(500).json({
      error: "Erreur serveur",
    });
  }
});

// =====================================================
// PUT /api/analysis/anomalies/:id/resolve
// =====================================================
router.put("/anomalies/:id/resolve", auth, async (req, res) => {
  try {
    const result = await query(
      `
        UPDATE anomalies

        SET
          status = 'résolu',
          resolved_at = CURRENT_DATE

        WHERE id = $1
        AND user_id = $2

        RETURNING *
        `,
      [parseInt(req.params.id), req.user.id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: "Anomalie non trouvée",
      });
    }

    return res.json({
      message: "Anomalie résolue",
      anomaly: result.rows[0],
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Erreur serveur",
    });
  }
});

// =====================================================
// PUT /api/analysis/anomalies/:id/in-progress
// =====================================================
router.put("/anomalies/:id/in-progress", auth, async (req, res) => {
  try {
    const result = await query(
      `
        UPDATE anomalies

        SET status = 'en_cours'

        WHERE id = $1
        AND user_id = $2
        AND status != 'résolu'

        RETURNING *
        `,
      [parseInt(req.params.id), req.user.id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: "Anomalie non trouvée ou déjà résolue",
      });
    }

    return res.json({
      message: "Statut mis à jour",
      anomaly: result.rows[0],
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Erreur serveur",
    });
  }
});

// =====================================================
// POST /api/analysis/detect-anomalies
// =====================================================
router.post("/detect-anomalies", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const newAnomalies = [];

    // Run the current user's complete dataset through the Python AI engine.
    try {
      const [sales, products, reviews] = await Promise.all([
        query(
          `SELECT DATE_TRUNC('month', date)::DATE AS month, SUM(total_amount) AS total
           FROM sales WHERE user_id = $1
           GROUP BY DATE_TRUNC('month', date) ORDER BY month`,
          [userId],
        ),
        query(
          `SELECT id, name, stock, revenue, category FROM products WHERE user_id = $1`,
          [userId],
        ),
        query(
          `SELECT id, comment FROM reviews WHERE user_id = $1 ORDER BY date DESC LIMIT 100`,
          [userId],
        ),
      ]);

      const aiResult = await runAiAnalysis({
        sales: sales.rows.map((row) => Number(row.total || 0)),
        products: products.rows,
        reviews: reviews.rows,
      });

      const aiAnomalies = [
        ...(aiResult.anomalies?.sales || []).map((anomaly) => ({
          type: anomaly.type === "pic_anormal" ? "pic_ventes" : "baisse_ventes",
          severity: "haute",
          product_name: null,
          description: `Anomalie IA : ${anomaly.month} (${anomaly.deviation_pct}%)`,
          product_id: null,
        })),
        ...(aiResult.anomalies?.stock || []).map((anomaly) => ({
          type: anomaly.type === "rupture" ? "rupture_stock" : "stock_faible",
          severity: anomaly.severity === "critique" ? "critique" : "moyenne",
          product_name: anomaly.product,
          description: `Anomalie IA : ${anomaly.product} (${anomaly.stock} unités)`,
          product_id:
            products.rows.find((product) => product.name === anomaly.product)
              ?.id || null,
        })),
      ];

      for (const anomaly of aiAnomalies) {
        const existing = await query(
          `SELECT id FROM anomalies
           WHERE user_id = $1 AND type = $2
           AND COALESCE(product_id, 0) = COALESCE($3, 0)
           AND status != 'résolu' LIMIT 1`,
          [userId, anomaly.type, anomaly.product_id],
        );

        if (existing.rowCount === 0) {
          const inserted = await query(
            `INSERT INTO anomalies
             (type, severity, product_name, description, product_id, user_id)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [
              anomaly.type,
              anomaly.severity,
              anomaly.product_name,
              anomaly.description,
              anomaly.product_id,
              userId,
            ],
          );
          newAnomalies.push(inserted.rows[0]);
        }
      }

      for (const recommendation of aiResult.recommendations || []) {
        const title = recommendation.message || "Recommandation IA";
        const existing = await query(
          `SELECT id FROM recommendations
           WHERE user_id = $1 AND title = $2 AND done = false LIMIT 1`,
          [userId, title],
        );

        if (existing.rowCount === 0) {
          await query(
            `INSERT INTO recommendations
             (priority, category, title, description, action, impact, user_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              recommendation.priority || "moyenne",
              recommendation.type === "stock"
                ? "stock"
                : recommendation.type === "service"
                  ? "service_client"
                  : "analyse",
              title,
              "Recommandation générée par le moteur IA à partir de vos données.",
              recommendation.action || "Analyser la situation",
              "Améliorer la performance opérationnelle",
              userId,
            ],
          );
        }
      }
    } catch (aiError) {
      console.error(
        "AI anomaly analysis unavailable, using local rules:",
        aiError.message,
      );
    }

    // -------------------------
    // Rupture stock
    // -------------------------
    const ruptures = await query(
      `
        SELECT id, name

        FROM products

        WHERE user_id = $1
        AND stock = 0

        AND NOT EXISTS (
          SELECT 1
          FROM anomalies a

          WHERE a.product_id = products.id
          AND a.user_id = products.user_id
          AND a.type = 'rupture_stock'
          AND a.status != 'résolu'
        )
        `,
      [userId],
    );

    for (const product of ruptures.rows) {
      const inserted = await query(
        `
          INSERT INTO anomalies
            (
              type,
              severity,
              product_name,
              description,
              product_id,
              user_id
            )

          VALUES
            (
              'rupture_stock',
              'critique',
              $1,
              'Rupture de stock (0 unités)',
              $2,
              $3
            )

          RETURNING *
          `,
        [product.name, product.id, userId],
      );

      newAnomalies.push(inserted.rows[0]);
    }

    // -------------------------
    // Stock faible
    // -------------------------
    const lowStocks = await query(
      `
        SELECT id, name, stock

        FROM products

        WHERE user_id = $1
        AND stock > 0
        AND stock <= 10

        AND NOT EXISTS (
          SELECT 1
          FROM anomalies a

          WHERE a.product_id = products.id
          AND a.user_id = products.user_id
          AND a.type = 'stock_faible'
          AND a.status != 'résolu'
        )
        `,
      [userId],
    );

    for (const product of lowStocks.rows) {
      const inserted = await query(
        `
          INSERT INTO anomalies
            (
              type,
              severity,
              product_name,
              description,
              product_id,
              user_id
            )

          VALUES
            (
              'stock_faible',
              'moyenne',
              $1,
              $2,
              $3,
              $4
            )

          RETURNING *
          `,
        [
          product.name,
          `Stock faible : ${product.stock} unités restantes`,
          product.id,
          userId,
        ],
      );

      newAnomalies.push(inserted.rows[0]);
    }

    return res.json({
      message: `${newAnomalies.length} anomalie(s) détectée(s)`,
      anomalies: newAnomalies,
      total: newAnomalies.length,
    });
  } catch (err) {
    console.error("Erreur detect anomalies:", err);

    return res.status(500).json({
      error: "Erreur serveur",
    });
  }
});

// =====================================================
// GET /api/analysis/recommendations
// =====================================================
router.get("/recommendations", auth, async (req, res) => {
  try {
    const result = await query(
      `
        SELECT *

        FROM recommendations

        WHERE user_id = $1

        ORDER BY
          CASE priority
            WHEN 'critique' THEN 1
            WHEN 'haute' THEN 2
            WHEN 'moyenne' THEN 3
            ELSE 4
          END,

          created_at DESC
        `,
      [req.user.id],
    );

    return res.json({
      recommendations: result.rows,
      total: result.rows.length,
    });
  } catch (err) {
    console.error("Erreur GET recommendations:", err);

    return res.status(500).json({
      error: "Erreur serveur",
    });
  }
});

// =====================================================
// GET /api/analysis/targets — objectifs mensuels (scopés)
// =====================================================
router.get("/targets", auth, async (req, res) => {
  try {
    const result = await query(
      `
      SELECT id, month, target, actual, year, month_num
      FROM monthly_targets
      WHERE user_id = $1
      ORDER BY year, month_num
      `,
      [req.user.id],
    );

    return res.json({
      targets: result.rows,
    });
  } catch (err) {
    console.error("Erreur GET /targets:", err);

    return res.status(500).json({
      error: "Erreur serveur",
    });
  }
});

// =====================================================
// PUT /api/analysis/targets/:month — modifier un objectif (scopé)
// =====================================================
router.put("/targets/:month", auth, async (req, res) => {
  try {
    const { month } = req.params;
    const { target } = req.body;

    if (!month || target === undefined || isNaN(parseFloat(target))) {
      return res.status(400).json({
        error: "month et target requis",
      });
    }

    const result = await query(
      `
      UPDATE monthly_targets
      SET target = $1
      WHERE month = $2
      AND user_id = $3
      RETURNING id, month, target, actual, year, month_num
      `,
      [parseFloat(target), month, req.user.id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: "Objectif non trouvé",
      });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("Erreur PUT /targets/:month:", err);

    return res.status(500).json({
      error: "Erreur serveur",
    });
  }
});

// =====================================================
// PUT /api/analysis/recommendations/:id/toggle
// =====================================================
router.put("/recommendations/:id/toggle", auth, async (req, res) => {
  try {
    const result = await query(
      `
        UPDATE recommendations

        SET
          done = NOT done,

          done_at =
            CASE
              WHEN done
              THEN NULL
              ELSE NOW()
            END

        WHERE id = $1
        AND user_id = $2

        RETURNING *
        `,
      [parseInt(req.params.id), req.user.id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: "Recommandation non trouvée",
      });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Erreur serveur",
    });
  }
});

module.exports = router;
