/**
 * Routes d'analyse — PostgreSQL + multi-user isolation
 */

const router = require("express").Router();
const auth = require("../middleware/auth");
const pool = require("../config/db");
const multer = require("multer");
const csvParser = require("csv-parser");
const { Readable } = require("stream");
const axios = require("axios");

const query = (text, params) => pool.query(text, params);

// Configure multer for file upload
const upload = multer({ storage: multer.memoryStorage() });
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

// =====================================================
// GET /api/analysis/profit-margin
// Profit and margin analysis
// =====================================================
router.get("/profit-margin", auth, async (req, res) => {
  try {
    const { startDate, endDate, productId } = req.query;
    const organizationId = req.organizationId || req.user.id;

    let whereClause = "WHERE s.organization_id = $1";
    const params = [organizationId];
    let paramIndex = 2;

    if (startDate) {
      whereClause += ` AND s.sale_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereClause += ` AND s.sale_date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    if (productId) {
      whereClause += ` AND s.product_id = $${paramIndex}`;
      params.push(productId);
      paramIndex++;
    }

    // Overall profit and margin
    const overall = await query(
      `
      SELECT
        COUNT(DISTINCT s.id) as total_sales,
        SUM(s.quantity) as total_quantity,
        SUM(s.total_amount) as total_revenue,
        SUM(p.cost * s.quantity) as total_cost,
        SUM(s.total_amount - p.cost * s.quantity) as total_profit,
        ROUND(
          (SUM(s.total_amount - p.cost * s.quantity) / NULLIF(SUM(s.total_amount), 0)) * 100,
          2
        ) as profit_margin_percentage
      FROM sales s
      LEFT JOIN products p ON s.product_id = p.id
      ${whereClause}
      `,
      params
    );

    // Profit by product
    const byProduct = await query(
      `
      SELECT
        p.id,
        p.name,
        p.category,
        COUNT(s.id) as sales_count,
        SUM(s.quantity) as total_quantity,
        SUM(s.total_amount) as revenue,
        SUM(p.cost * s.quantity) as cost,
        SUM(s.total_amount - p.cost * s.quantity) as profit,
        ROUND(
          (SUM(s.total_amount - p.cost * s.quantity) / NULLIF(SUM(s.total_amount), 0)) * 100,
          2
        ) as margin_percentage
      FROM sales s
      LEFT JOIN products p ON s.product_id = p.id
      ${whereClause}
      GROUP BY p.id, p.name, p.category
      ORDER BY profit DESC
      `,
      params
    );

    // Profit by month
    const byMonth = await query(
      `
      SELECT
        DATE_TRUNC('month', s.sale_date) as month,
        COUNT(DISTINCT s.id) as sales_count,
        SUM(s.total_amount) as revenue,
        SUM(p.cost * s.quantity) as cost,
        SUM(s.total_amount - p.cost * s.quantity) as profit,
        ROUND(
          (SUM(s.total_amount - p.cost * s.quantity) / NULLIF(SUM(s.total_amount), 0)) * 100,
          2
        ) as margin_percentage
      FROM sales s
      LEFT JOIN products p ON s.product_id = p.id
      ${whereClause}
      GROUP BY DATE_TRUNC('month', s.sale_date)
      ORDER BY month DESC
      LIMIT 12
      `,
      params
    );

    return res.json({
      overall: overall.rows[0],
      byProduct: byProduct.rows,
      byMonth: byMonth.rows,
    });
  } catch (err) {
    console.error("Error GET /profit-margin:", err);
    return res.status(500).json({ error: "Error fetching profit margin data" });
  }
});

// =====================================================
// GET /api/analysis/customer-ltv
// Customer lifetime value analysis
// =====================================================
router.get("/customer-ltv", auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const organizationId = req.organizationId || req.user.id;

    let whereClause = "WHERE organization_id = $1";
    const params = [organizationId];
    let paramIndex = 2;

    if (startDate) {
      whereClause += ` AND sale_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereClause += ` AND sale_date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    // Customer LTV metrics
    const metrics = await query(
      `
      SELECT
        COUNT(DISTINCT customer_email) as total_customers,
        SUM(total_amount) as total_revenue,
        SUM(total_amount) / COUNT(DISTINCT customer_email) as average_ltv,
        AVG(total_amount) as average_order_value,
        COUNT(id) / COUNT(DISTINCT customer_email) as average_orders_per_customer
      FROM sales
      ${whereClause}
      AND customer_email IS NOT NULL
      `,
      params
    );

    // LTV by customer
    const byCustomer = await query(
      `
      SELECT
        customer_email,
        customer_name,
        COUNT(id) as order_count,
        SUM(total_amount) as total_spent,
        AVG(total_amount) as average_order_value,
        MIN(sale_date) as first_purchase,
        MAX(sale_date) as last_purchase,
        EXTRACT(DAY FROM (MAX(sale_date) - MIN(sale_date))) as days_active
      FROM sales
      ${whereClause}
      AND customer_email IS NOT NULL
      GROUP BY customer_email, customer_name
      ORDER BY total_spent DESC
      LIMIT 50
      `,
      params
    );

    // Customer segments
    const segments = await query(
      `
      SELECT
        CASE
          WHEN total_spent >= 1000 THEN 'High Value'
          WHEN total_spent >= 500 THEN 'Medium Value'
          ELSE 'Low Value'
        END as segment,
        COUNT(*) as customer_count,
        SUM(total_spent) as total_revenue,
        AVG(total_spent) as average_ltv
      FROM (
        SELECT
          customer_email,
          SUM(total_amount) as total_spent
        FROM sales
        ${whereClause}
        AND customer_email IS NOT NULL
        GROUP BY customer_email
      ) customer_data
      GROUP BY segment
      ORDER BY
        CASE segment
          WHEN 'High Value' THEN 1
          WHEN 'Medium Value' THEN 2
          ELSE 3
        END
      `,
      params
    );

    return res.json({
      metrics: metrics.rows[0],
      byCustomer: byCustomer.rows,
      segments: segments.rows,
    });
  } catch (err) {
    console.error("Error GET /customer-ltv:", err);
    return res.status(500).json({ error: "Error fetching customer LTV data" });
  }
});

// =====================================================
// GET /api/analysis/cohort
// Cohort analysis
// =====================================================
router.get("/cohort", auth, async (req, res) => {
  try {
    const organizationId = req.organizationId || req.user.id;

    // Get first purchase date for each customer
    const firstPurchases = await query(
      `
      SELECT
        customer_email,
        DATE_TRUNC('month', MIN(sale_date)) as cohort_month
      FROM sales
      WHERE organization_id = $1
      AND customer_email IS NOT NULL
      GROUP BY customer_email
      `,
      [organizationId]
    );

    // Build cohort retention matrix
    const cohortData = [];
    const cohorts = {};

    for (const customer of firstPurchases.rows) {
      const cohortKey = customer.cohort_month.toISOString().slice(0, 7);
      if (!cohorts[cohortKey]) {
        cohorts[cohortKey] = {
          month: cohortKey,
          customers: [],
        };
      }
      cohorts[cohortKey].customers.push(customer.customer_email);
    }

    // Calculate retention for each cohort
    for (const cohortKey in cohorts) {
      const cohort = cohorts[cohortKey];
      const cohortCustomers = cohort.customers;
      const cohortSize = cohortCustomers.length;

      const retention = await query(
        `
        SELECT
          EXTRACT(MONTH FROM AGE(DATE_TRUNC('month', s.sale_date), DATE_TRUNC('month', $1::date))) as month_offset,
          COUNT(DISTINCT s.customer_email) as active_customers
        FROM sales s
        WHERE s.customer_email = ANY($2)
        AND s.organization_id = $3
        GROUP BY month_offset
        ORDER BY month_offset
        `,
        [cohortKey + '-01', cohortCustomers, organizationId]
      );

      const retentionData = {
        cohort: cohortKey,
        size: cohortSize,
        retention: {},
      };

      for (const row of retention.rows) {
        retentionData.retention[row.month_offset] = {
          active: parseInt(row.active_customers),
          percentage: ((row.active_customers / cohortSize) * 100).toFixed(1),
        };
      }

      cohortData.push(retentionData);
    }

    cohortData.sort((a, b) => b.cohort.localeCompare(a.cohort));

    return res.json({
      cohorts: cohortData,
    });
  } catch (err) {
    console.error("Error GET /cohort:", err);
    return res.status(500).json({ error: "Error fetching cohort analysis data" });
  }
});

// =====================================================
// GET /api/analysis/inventory-forecast
// Inventory forecasting
// =====================================================
router.get("/inventory-forecast", auth, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const organizationId = req.organizationId || req.user.id;

    // Get products with sales history
    const products = await query(
      `
      SELECT
        p.id,
        p.name,
        p.stock,
        p.category,
        COALESCE(SUM(s.quantity), 0) as total_sold,
        COALESCE(AVG(s.quantity), 0) as avg_daily_sales,
        COALESCE(
          SUM(s.quantity) / NULLIF(
            EXTRACT(DAY FROM (MAX(s.sale_date) - MIN(s.sale_date))) + 1,
            0
          ),
          0
        ) as daily_sales_rate
      FROM products p
      LEFT JOIN sales s ON p.id = s.product_id
      AND s.organization_id = p.organization_id
      AND s.sale_date >= NOW() - INTERVAL '90 days'
      WHERE p.organization_id = $1
      GROUP BY p.id, p.name, p.stock, p.category
      HAVING COALESCE(SUM(s.quantity), 0) > 0
      `,
      [organizationId]
    );

    const forecastData = products.rows.map(product => {
      const dailySalesRate = parseFloat(product.daily_sales_rate) || 0;
      const forecastDays = parseInt(days);
      const projectedSales = dailySalesRate * forecastDays;
      const daysUntilStockout = dailySalesRate > 0 
        ? Math.floor(product.stock / dailySalesRate) 
        : null;
      
      let stockStatus = 'healthy';
      if (product.stock === 0) {
        stockStatus = 'out_of_stock';
      } else if (daysUntilStockout !== null && daysUntilStockout <= 7) {
        stockStatus = 'critical';
      } else if (daysUntilStockout !== null && daysUntilStockout <= 14) {
        stockStatus = 'low';
      } else if (daysUntilStockout !== null && daysUntilStockout <= 30) {
        stockStatus = 'warning';
      }

      return {
        id: product.id,
        name: product.name,
        category: product.category,
        currentStock: parseInt(product.stock),
        totalSold: parseInt(product.total_sold),
        avgDailySales: parseFloat(product.avg_daily_sales).toFixed(2),
        dailySalesRate: dailySalesRate.toFixed(2),
        projectedSales: Math.round(projectedSales),
        daysUntilStockout,
        stockStatus,
        recommendedOrder: daysUntilStockout !== null && daysUntilStockout < forecastDays
          ? Math.ceil(projectedSales - product.stock)
          : 0,
      };
    });

    // Sort by stock status priority
    const statusPriority = {
      'out_of_stock': 0,
      'critical': 1,
      'low': 2,
      'warning': 3,
      'healthy': 4,
    };

    forecastData.sort((a, b) => {
      return statusPriority[a.stockStatus] - statusPriority[b.stockStatus];
    });

    // Summary stats
    const summary = {
      totalProducts: forecastData.length,
      outOfStock: forecastData.filter(p => p.stockStatus === 'out_of_stock').length,
      critical: forecastData.filter(p => p.stockStatus === 'critical').length,
      low: forecastData.filter(p => p.stockStatus === 'low').length,
      warning: forecastData.filter(p => p.stockStatus === 'warning').length,
      healthy: forecastData.filter(p => p.stockStatus === 'healthy').length,
    };

    return res.json({
      forecast: forecastData,
      summary,
      forecastDays: parseInt(days),
    });
  } catch (err) {
    console.error("Error GET /inventory-forecast:", err);
    return res.status(500).json({ error: "Error fetching inventory forecast data" });
  }
});

// =====================================================
// POST /api/analysis/reviews/import
// Import reviews from CSV file
// =====================================================
router.post("/reviews/import", auth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "No file provided",
      });
    }

    const userId = req.user.id;
    const reviews = [];
    const errors = [];

    // Parse CSV from buffer
    const readable = Readable.from(req.file.buffer.toString("utf-8"));

    for await (const row of readable.pipe(csvParser())) {
      try {
        // Map CSV columns to review fields
        const review = {
          product_id: parseInt(row.product_id || row.productId || row.product),
          customer_name: row.customer_name || row.customerName || row.name,
          rating: parseInt(row.rating || row.stars),
          comment: row.comment || row.review || row.text,
          date: row.date || new Date().toISOString().split("T")[0],
        };

        // Validate required fields
        if (!review.product_id || !review.customer_name || !review.rating || !review.comment) {
          errors.push({
            row,
            error: "Missing required fields (product_id, customer_name, rating, comment)",
          });
          continue;
        }

        // Validate rating range
        if (review.rating < 1 || review.rating > 5) {
          errors.push({
            row,
            error: "Rating must be between 1 and 5",
          });
          continue;
        }

        // Verify product belongs to user
        const product = await query(
          `SELECT id FROM products WHERE id = $1 AND user_id = $2`,
          [review.product_id, userId]
        );

        if (product.rowCount === 0) {
          errors.push({
            row,
            error: `Product ${review.product_id} not found or does not belong to user`,
          });
          continue;
        }

        // Analyze sentiment
        const sentiment = analyzeSentimentLocal(review.comment);

        reviews.push({
          ...review,
          sentiment: sentiment.sentiment,
          score: sentiment.score,
          user_id: userId,
        });
      } catch (error) {
        errors.push({
          row,
          error: error.message,
        });
      }
    }

    if (reviews.length === 0) {
      return res.status(400).json({
        error: "No valid reviews found in CSV",
        errors,
      });
    }

    // Insert reviews in batch
    const insertedReviews = [];
    for (const review of reviews) {
      try {
        const result = await query(
          `INSERT INTO reviews (user_id, product_id, customer_name, rating, comment, sentiment, score, date)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING *`,
          [
            review.user_id,
            review.product_id,
            review.customer_name,
            review.rating,
            review.comment,
            review.sentiment,
            review.score,
            review.date,
          ]
        );
        insertedReviews.push(result.rows[0]);
      } catch (error) {
        errors.push({
          review,
          error: error.message,
        });
      }
    }

    return res.json({
      message: `Successfully imported ${insertedReviews.length} reviews`,
      imported: insertedReviews.length,
      failed: errors.length,
      errors: errors.slice(0, 10), // Return first 10 errors
      reviews: insertedReviews,
    });
  } catch (err) {
    console.error("Erreur import reviews:", err);
    return res.status(500).json({
      error: "Erreur serveur lors de l'import",
    });
  }
});

module.exports = router;
