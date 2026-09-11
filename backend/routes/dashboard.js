const express = require("express");
const router = express.Router();
const { query } = require("../db/pool");
const auth = require("../middleware/auth");
const { requirePermission } = require("../middleware/permissions");
const { createAuditLog } = require("../middleware/audit");

/**
 * GET /api/dashboard/overview
 * Get dashboard overview metrics
 */
router.get("/overview", auth, requirePermission('analytics', 'view'), async (req, res) => {
  try {
    const organizationId = req.organizationId || req.user.id;
    const { period = '30' } = req.query; // days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Revenue metrics
    const revenue = await query(
      `
      SELECT
        COUNT(*) as total_sales,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as average_order_value,
        SUM(quantity) as total_items_sold
      FROM sales
      WHERE organization_id = $1
      AND date >= $2
      `,
      [organizationId, startDate]
    );

    // Product metrics
    const products = await query(
      `
      SELECT
        COUNT(*) as total_products,
        SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) as out_of_stock,
        SUM(CASE WHEN stock <= 10 THEN 1 ELSE 0 END) as low_stock,
        AVG(price) as average_price
      FROM products
      WHERE organization_id = $1
      `,
      [organizationId]
    );

    // Customer metrics
    const customers = await query(
      `
      SELECT
        0 as unique_customers,
        0 as new_customers
      `,
      []
    );

    // Growth metrics (vs previous period)
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - parseInt(period));

    const currentRevenue = await query(
      `SELECT SUM(total_amount) as revenue FROM sales WHERE organization_id = $1 AND date >= $2`,
      [organizationId, startDate]
    );

    const previousRevenue = await query(
      `SELECT SUM(total_amount) as revenue FROM sales WHERE organization_id = $1 AND date >= $2 AND date < $3`,
      [organizationId, previousStartDate, startDate]
    );

    const current = parseFloat(currentRevenue.rows[0]?.revenue || 0);
    const previous = parseFloat(previousRevenue.rows[0]?.revenue || 0);
    const growth = previous > 0 ? ((current - previous) / previous) * 100 : 0;

    return res.json({
      revenue: revenue.rows[0],
      products: products.rows[0],
      customers: customers.rows[0],
      growth: {
        current,
        previous,
        percentage: growth.toFixed(2),
      },
      period: `${period} days`,
    });
  } catch (err) {
    console.error("Error fetching dashboard overview:", err);
    return res.status(500).json({ error: "Error fetching dashboard overview" });
  }
});

/**
 * GET /api/dashboard/sales-trend
 * Get sales trend data
 */
router.get("/sales-trend", auth, requirePermission('analytics', 'view'), async (req, res) => {
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
        COUNT(*) as sales_count,
        SUM(total_amount) as revenue,
        SUM(quantity) as items_sold
      FROM sales
      WHERE organization_id = $1
      AND date >= $2
      GROUP BY ${groupBy}
      ORDER BY date ASC
      `,
      [organizationId, startDate]
    );

    return res.json({
      trend: result.rows,
      period: `${period} days`,
      granularity,
    });
  } catch (err) {
    console.error("Error fetching sales trend:", err);
    return res.status(500).json({ error: "Error fetching sales trend" });
  }
});

/**
 * GET /api/dashboard/top-products
 * Get top performing products
 */
router.get("/top-products", auth, requirePermission('analytics', 'view'), async (req, res) => {
  try {
    const organizationId = req.organizationId || req.user.id;
    const { limit = 10, period = '30' } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const result = await query(
      `
      SELECT
        p.id,
        p.name,
        p.category,
        p.price,
        p.stock,
        COUNT(s.id) as sales_count,
        SUM(s.quantity) as total_quantity,
        SUM(s.total_amount) as total_revenue,
        AVG(s.total_amount) as avg_order_value
      FROM products p
      LEFT JOIN sales s ON p.id = s.product_id
      AND s.organization_id = p.organization_id
      AND s.date >= $2
      WHERE p.organization_id = $1
      GROUP BY p.id, p.name, p.category, p.price, p.stock
      ORDER BY total_revenue DESC NULLS LAST
      LIMIT $3
      `,
      [organizationId, startDate, limit]
    );

    return res.json({
      products: result.rows,
      limit: parseInt(limit),
      period: `${period} days`,
    });
  } catch (err) {
    console.error("Error fetching top products:", err);
    return res.status(500).json({ error: "Error fetching top products" });
  }
});

/**
 * GET /api/dashboard/recent-activity
 * Get recent activity timeline
 */
router.get("/recent-activity", auth, requirePermission('analytics', 'view'), async (req, res) => {
  try {
    const organizationId = req.organizationId || req.user.id;
    const { limit = 20, type } = req.query;

    let activities = [];
    const queryParams = [organizationId, parseInt(limit)];

    // Build query based on type filter
    if (!type || type === 'all' || type === 'sales') {
      const sales = await query(
        `
        SELECT
          id,
          'sale' as type,
          total_amount as amount,
          date as created_at,
          customer_name
        FROM sales
        WHERE organization_id = $1
        ORDER BY date DESC
        LIMIT $2
        `,
        queryParams
      );
      activities.push(...sales.rows.map(r => ({ 
        ...r, 
        title: `Sale: $${r.amount}`, 
        description: r.customer_name || 'Guest',
        icon: 'shopping-cart'
      })));
    }

    if (!type || type === 'all' || type === 'products') {
      const products = await query(
        `
        SELECT
          id,
          'product' as type,
          price as amount,
          updated_at as created_at,
          name as customer_name,
          category as customer_email
        FROM products
        WHERE organization_id = $1
        ORDER BY updated_at DESC
        LIMIT $2
        `,
        queryParams
      );
      activities.push(...products.rows.map(r => ({ 
        ...r, 
        title: `Product: ${r.customer_name}`, 
        description: r.customer_email,
        icon: 'package'
      })));
    }

    if (!type || type === 'all' || type === 'audit') {
      const audit = await query(
        `
        SELECT
          id,
          action as type,
          NULL as amount,
          created_at,
          user_id::text as customer_name,
          entity_type as customer_email
        FROM audit_logs
        WHERE organization_id = $1
        ORDER BY created_at DESC
        LIMIT $2
        `,
        queryParams
      );
      activities.push(...audit.rows.map(r => ({ 
        ...r, 
        title: `${r.type}: ${r.customer_email}`, 
        description: `User ${r.customer_name}`,
        icon: 'activity'
      })));
    }

    if (!type || type === 'all' || type === 'security') {
      const security = await query(
        `
        SELECT
          id,
          event_type as type,
          NULL as amount,
          created_at,
          user_id::text as customer_name,
          details->>'ip_address' as customer_email
        FROM security_events
        WHERE organization_id = $1
        ORDER BY created_at DESC
        LIMIT $2
        `,
        queryParams
      );
      activities.push(...security.rows.map(r => ({ 
        ...r, 
        title: `Security: ${r.type}`, 
        description: r.customer_email || 'IP logged',
        icon: 'shield'
      })));
    }

    // Sort by date
    activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Apply limit after combining
    activities = activities.slice(0, parseInt(limit));

    return res.json({
      activities,
      limit: parseInt(limit),
      type: type || 'all',
    });
  } catch (err) {
    console.error("Error fetching recent activity:", err);
    return res.status(500).json({ error: "Error fetching recent activity" });
  }
});

/**
 * GET /api/dashboard/performance-metrics
 * Get performance metrics for charts
 */
router.get("/performance-metrics", auth, requirePermission('analytics', 'view'), async (req, res) => {
  try {
    const organizationId = req.organizationId || req.user.id;
    const { period = '30' } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Daily revenue
    const dailyRevenue = await query(
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
      [organizationId, startDate]
    );

    // Category breakdown
    const categoryBreakdown = await query(
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

    // Hourly sales distribution
    const hourlySales = await query(
      `
      SELECT
        EXTRACT(HOUR FROM date) as hour,
        COUNT(*) as sales_count,
        SUM(total_amount) as revenue
      FROM sales
      WHERE organization_id = $1
      AND date >= $2
      GROUP BY EXTRACT(HOUR FROM date)
      ORDER BY hour
      `,
      [organizationId, startDate]
    );

    return res.json({
      dailyRevenue: dailyRevenue.rows,
      categoryBreakdown: categoryBreakdown.rows,
      hourlySales: hourlySales.rows,
      period: `${period} days`,
    });
  } catch (err) {
    console.error("Error fetching performance metrics:", err);
    return res.status(500).json({ error: "Error fetching performance metrics" });
  }
});

/**
 * GET /api/dashboard/kpis
 * Get key performance indicators
 */
router.get("/kpis", auth, requirePermission('analytics', 'view'), async (req, res) => {
  try {
    const organizationId = req.organizationId || req.user.id;
    const { period = '30' } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const kpis = await query(
      `
      SELECT
        -- Revenue KPIs
        (SELECT COALESCE(SUM(total_amount), 0) FROM sales WHERE organization_id = $1 AND date >= $2) as total_revenue,
        (SELECT COALESCE(AVG(total_amount), 0) FROM sales WHERE organization_id = $1 AND date >= $2) as avg_order_value,
        
        -- Sales KPIs
        (SELECT COUNT(*) FROM sales WHERE organization_id = $1 AND date >= $2) as total_orders,
        
        -- Product KPIs
        (SELECT COUNT(*) FROM products WHERE organization_id = $1) as total_products,
        (SELECT COUNT(*) FROM products WHERE organization_id = $1 AND stock = 0) as out_of_stock,
        
        -- Growth KPIs
        (SELECT COALESCE(SUM(total_amount), 0) FROM sales WHERE organization_id = $1 AND date >= $2) as current_period_revenue,
        (SELECT COALESCE(SUM(total_amount), 0) FROM sales WHERE organization_id = $1 AND date >= $3 AND date < $2) as previous_period_revenue
      `,
      [organizationId, startDate, new Date(startDate.getTime() - parseInt(period) * 24 * 60 * 60 * 1000)]
    );

    const data = kpis.rows[0];
    const current = parseFloat(data.current_period_revenue || 0);
    const previous = parseFloat(data.previous_period_revenue || 0);
    const revenueGrowth = previous > 0 ? ((current - previous) / previous) * 100 : 0;

    return res.json({
      revenue: {
        total: parseFloat(data.total_revenue || 0),
        avgOrderValue: parseFloat(data.avg_order_value || 0),
        growth: revenueGrowth.toFixed(2),
      },
      sales: {
        totalOrders: parseInt(data.total_orders || 0),
        uniqueCustomers: parseInt(data.unique_customers || 0),
        ordersPerCustomer: parseFloat(data.orders_per_customer || 0).toFixed(2),
      },
      inventory: {
        totalProducts: parseInt(data.total_products || 0),
        outOfStock: parseInt(data.out_of_stock || 0),
        inStock: parseInt(data.total_products || 0) - parseInt(data.out_of_stock || 0),
      },
      period: `${period} days`,
    });
  } catch (err) {
    console.error("Error fetching KPIs:", err);
    return res.status(500).json({ error: "Error fetching KPIs" });
  }
});

module.exports = router;
