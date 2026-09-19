const pool = require("../db/pool");

/**
 * Retourne les ventes mensuelles agrégées pour une organisation.
 * Format : [{ month: '2026-01', total: 42000 }, ...]
 */
async function getMonthlySales(organizationId, monthsBack = 12) {
  const { rows } = await pool.query(
    `
    SELECT
      TO_CHAR(DATE_TRUNC('month', date), 'YYYY-MM') AS month,
      COALESCE(SUM(total_amount), 0)::float          AS total
    FROM sales
    WHERE organization_id = $1
      AND date >= NOW() - ($2 || ' months')::interval
    GROUP BY DATE_TRUNC('month', date)
    ORDER BY DATE_TRUNC('month', date) ASC
    `,
    [organizationId, monthsBack],
  );
  return rows;
}

/**
 * Retourne la liste des produits (avec stock et catégorie).
 */
async function getProductsWithStock(organizationId) {
  const { rows } = await pool.query(
    `
    SELECT id, name, stock, price, category
    FROM products
    WHERE organization_id = $1
    `,
    [organizationId],
  );
  return rows;
}

/**
 * Retourne les avis clients avec le nom du produit.
 */
async function getReviewsWithProduct(organizationId) {
  const { rows } = await pool.query(
    `
    SELECT
      r.id,
      r.customer_name,
      r.comment,
      r.rating,
      r.sentiment,
      r.score,
      r.created_at,
      p.name AS product_name
    FROM reviews r
    LEFT JOIN products p ON p.id = r.product_id
    WHERE p.organization_id = $1
    ORDER BY r.created_at DESC
    `,
    [organizationId],
  );
  return rows;
}

/**
 * Statistiques globales (CA, nombre de ventes, top produits).
 * Structure plate : sales contient directement product_id et quantity.
 */
async function getSalesStats(organizationId) {
  // Totaux : CA + nombre de ventes
  const { rows: totals } = await pool.query(
    `
    SELECT
      COALESCE(SUM(total_amount), 0)::float AS total_revenue,
      COUNT(*)::int                          AS total_sales
    FROM sales
    WHERE organization_id = $1
    `,
    [organizationId],
  );

  // Top produits (via la table sales directement)
  const { rows: top } = await pool.query(
    `
    SELECT
      p.name,
      COALESCE(SUM(s.quantity), 0)::int AS qty
    FROM sales s
    JOIN products p ON p.id = s.product_id
    WHERE s.organization_id = $1
    GROUP BY p.name
    ORDER BY qty DESC
    LIMIT 5
    `,
    [organizationId],
  );

  return {
    total_revenue: totals[0]?.total_revenue || 0,
    total_sales: totals[0]?.total_sales || 0,
    top_products: top,
  };
}

/**
 * Statistiques sur les avis (pourcentage positif/négatif/neutre).
 */
async function getReviewsStats(organizationId) {
  const { rows } = await pool.query(
    `
    SELECT
      r.sentiment,
      COUNT(*)::int AS count
    FROM reviews r
    LEFT JOIN products p ON p.id = r.product_id
    WHERE p.organization_id = $1
    GROUP BY r.sentiment
    `,
    [organizationId],
  );

  const total = rows.reduce((s, r) => s + r.count, 0);
  const stats = {};
  rows.forEach((r) => {
    stats[r.sentiment] = {
      count: r.count,
      percentage: total ? Math.round((r.count / total) * 100) : 0,
    };
  });

  return {
    total,
    stats,
    negative_percentage: stats["négatif"]?.percentage || 0,
  };
}

module.exports = {
  getMonthlySales,
  getProductsWithStock,
  getReviewsWithProduct,
  getSalesStats,
  getReviewsStats,
};
