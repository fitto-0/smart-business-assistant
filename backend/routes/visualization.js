const express = require("express");
const router = express.Router();
const { query } = require("../db/pool");
const auth = require("../middleware/auth");
const { requirePermission } = require("../middleware/permissions");

/**
 * GET /api/visualization/revenue-chart
 * Get revenue chart data
 */
router.get("/revenue-chart", auth, requirePermission('analytics', 'view'), async (req, res) => {
  try {
    const organizationId = req.organizationId || req.user.id;
    const { period = '30', granularity = 'day' } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const groupBy = granularity === 'week' 
      ? "DATE_TRUNC('week', date)"
      : granularity === 'month'
      ? "DATE_TRUNC('month', date)"
      : "DATE_TRUNC('day', date)";

    const result = await query(
      `
      SELECT
        ${groupBy} as date,
        SUM(total_amount) as revenue,
        COUNT(*) as orders
      FROM sales
      WHERE organization_id = $1
      AND date >= $2
      GROUP BY ${groupBy}
      ORDER BY date ASC
      `,
      [organizationId, startDate]
    );

    return res.json({
      data: result.rows,
      period: `${period} days`,
      granularity,
    });
  } catch (err) {
    console.error("Error fetching revenue chart:", err);
    return res.status(500).json({ error: "Error fetching revenue chart" });
  }
});

/**
 * GET /api/visualization/category-distribution
 * Get category distribution for pie chart
 */
router.get("/category-distribution", auth, requirePermission('analytics', 'view'), async (req, res) => {
  try {
    const organizationId = req.organizationId || req.user.id;
    const { period = '30' } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const result = await query(
      `
      SELECT
        p.category,
        COUNT(s.id) as sales_count,
        SUM(s.total_amount) as revenue
      FROM products p
      LEFT JOIN sales s ON p.id = s.product_id
      AND s.organization_id = p.organization_id
      AND s.date >= $2
      WHERE p.organization_id = $1
      GROUP BY p.category
      ORDER BY revenue DESC NULLS LAST
      `,
      [organizationId, startDate]
    );

    return res.json({
      data: result.rows,
      period: `${period} days`,
    });
  } catch (err) {
    console.error("Error fetching category distribution:", err);
    return res.status(500).json({ error: "Error fetching category distribution" });
  }
});

/**
 * GET /api/visualization/top-products-bar
 * Get top products for bar chart
 */
router.get("/top-products-bar", auth, requirePermission('analytics', 'view'), async (req, res) => {
  try {
    const organizationId = req.organizationId || req.user.id;
    const { limit = 10, period = '30' } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const result = await query(
      `
      SELECT
        p.name,
        p.category,
        SUM(s.total_amount) as revenue,
        SUM(s.quantity) as quantity
      FROM products p
      LEFT JOIN sales s ON p.id = s.product_id
      AND s.organization_id = p.organization_id
      AND s.date >= $2
      WHERE p.organization_id = $1
      GROUP BY p.id, p.name, p.category
      ORDER BY revenue DESC NULLS LAST
      LIMIT $3
      `,
      [organizationId, startDate, limit]
    );

    return res.json({
      data: result.rows,
      limit: parseInt(limit),
      period: `${period} days`,
    });
  } catch (err) {
    console.error("Error fetching top products bar:", err);
    return res.status(500).json({ error: "Error fetching top products bar" });
  }
});

/**
 * GET /api/visualization/hourly-heatmap
 * Get hourly sales heatmap data
 */
router.get("/hourly-heatmap", auth, requirePermission('analytics', 'view'), async (req, res) => {
  try {
    const organizationId = req.organizationId || req.user.id;
    const { period = '30' } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const result = await query(
      `
      SELECT
        EXTRACT(DOW FROM date) as day_of_week,
        EXTRACT(HOUR FROM date) as hour,
        COUNT(*) as sales_count,
        SUM(total_amount) as revenue
      FROM sales
      WHERE organization_id = $1
      AND date >= $2
      GROUP BY EXTRACT(DOW FROM date), EXTRACT(HOUR FROM date)
      ORDER BY day_of_week, hour
      `,
      [organizationId, startDate]
    );

    // Transform to heatmap format
      const heatmap = Array(7).fill(null).map(() => Array(24).fill(0));
      
      result.rows.forEach(row => {
        const day = parseInt(row.day_of_week);
        const hour = parseInt(row.hour);
        if (day >= 0 && day < 7 && hour >= 0 && hour < 24) {
          heatmap[day][hour] = parseFloat(row.revenue || 0);
        }
      });

    return res.json({
      heatmap,
      period: `${period} days`,
    });
  } catch (err) {
    console.error("Error fetching hourly heatmap:", err);
    return res.status(500).json({ error: "Error fetching hourly heatmap" });
  }
});

/**
 * GET /api/visualization/customer-segmentation
 * Get customer segmentation data
 */
router.get("/customer-segmentation", auth, requirePermission('analytics', 'view'), async (req, res) => {
  try {
    const organizationId = req.organizationId || req.user.id;

    const result = await query(
      `
      SELECT
        CASE
          WHEN total_spent >= 1000 THEN 'High Value'
          WHEN total_spent >= 500 THEN 'Medium Value'
          WHEN total_spent >= 100 THEN 'Low Value'
          ELSE 'New'
        END as segment,
        COUNT(*) as customer_count,
        AVG(total_spent) as avg_spent,
        SUM(total_spent) as total_revenue
      FROM (
        SELECT
          customer_name,
          SUM(total_amount) as total_spent
        FROM sales
        WHERE organization_id = $1
        AND customer_name IS NOT NULL
        GROUP BY customer_name
      ) customer_data
      GROUP BY segment
      ORDER BY
        CASE segment
          WHEN 'High Value' THEN 1
          WHEN 'Medium Value' THEN 2
          WHEN 'Low Value' THEN 3
          ELSE 4
        END
      `,
      [organizationId]
    );

    return res.json({
      data: result.rows,
    });
  } catch (err) {
    console.error("Error fetching customer segmentation:", err);
    return res.status(500).json({ error: "Error fetching customer segmentation" });
  }
});

/**
 * GET /api/visualization/trend-comparison
 * Compare current vs previous period trends
 */
router.get("/trend-comparison", auth, requirePermission('analytics', 'view'), async (req, res) => {
  try {
    const organizationId = req.organizationId || req.user.id;
    const { period = '30' } = req.query;

    const currentStart = new Date();
    currentStart.setDate(currentStart.getDate() - parseInt(period));

    const previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - parseInt(period));

    const current = await query(
      `
      SELECT
        DATE_TRUNC('day', date) as date,
        SUM(total_amount) as revenue
      FROM sales
      WHERE organization_id = $1
      AND date >= $2
      GROUP BY DATE_TRUNC('day', date)
      ORDER BY date ASC
      `,
      [organizationId, currentStart]
    );

    const previous = await query(
      `
      SELECT
        DATE_TRUNC('day', date) as date,
        SUM(total_amount) as revenue
      FROM sales
      WHERE organization_id = $1
      AND date >= $2
      AND date < $3
      GROUP BY DATE_TRUNC('day', date)
      ORDER BY date ASC
      `,
      [organizationId, previousStart, currentStart]
    );

    return res.json({
      current: current.rows,
      previous: previous.rows,
      period: `${period} days`,
    });
  } catch (err) {
    console.error("Error fetching trend comparison:", err);
    return res.status(500).json({ error: "Error fetching trend comparison" });
  }
});

/**
 * GET /api/visualization/geographic-distribution
 * Get geographic distribution (if customer data available)
 */
router.get("/geographic-distribution", auth, requirePermission('analytics', 'view'), async (req, res) => {
  try {
    const organizationId = req.organizationId || req.user.id;

    // This is a placeholder - would need customer location data
    // For now, return empty with structure
    return res.json({
      data: [],
      message: "Geographic data not available - requires customer location information",
    });
  } catch (err) {
    console.error("Error fetching geographic distribution:", err);
    return res.status(500).json({ error: "Error fetching geographic distribution" });
  }
});

/**
 * GET /api/visualization/summary-cards
 * Get summary card data for dashboard
 */
router.get("/summary-cards", auth, requirePermission('analytics', 'view'), async (req, res) => {
  try {
    const organizationId = req.organizationId || req.user.id;
    const { period = '30' } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const cards = await query(
      `
      SELECT
        -- Revenue card
        (SELECT COALESCE(SUM(total_amount), 0) FROM sales WHERE organization_id = $1 AND date >= $2) as revenue,
        
        -- Orders card
        (SELECT COUNT(*) FROM sales WHERE organization_id = $1 AND date >= $2) as orders,
        
        -- Customers card
        (SELECT COUNT(DISTINCT customer_name) FROM sales WHERE organization_id = $1 AND date >= $2 AND customer_name IS NOT NULL) as customers,
        
        -- Products card
        (SELECT COUNT(*) FROM products WHERE organization_id = $1) as products,
        
        -- Growth calculations
        (SELECT COALESCE(SUM(total_amount), 0) FROM sales WHERE organization_id = $1 AND date >= $3 AND date < $2) as previous_revenue
      `,
      [organizationId, startDate, new Date(startDate.getTime() - parseInt(period) * 24 * 60 * 60 * 1000)]
    );

    const data = cards.rows[0];
    const currentRevenue = parseFloat(data.revenue || 0);
    const previousRevenue = parseFloat(data.previous_revenue || 0);
    const revenueGrowth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    return res.json({
      revenue: {
        value: currentRevenue,
        growth: revenueGrowth.toFixed(2),
        period: `${period} days`,
      },
      orders: {
        value: parseInt(data.orders || 0),
        period: `${period} days`,
      },
      customers: {
        value: parseInt(data.customers || 0),
        period: `${period} days`,
      },
      products: {
        value: parseInt(data.products || 0),
      },
    });
  } catch (err) {
    console.error("Error fetching summary cards:", err);
    return res.status(500).json({ error: "Error fetching summary cards" });
  }
});

module.exports = router;
