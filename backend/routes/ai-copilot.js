const express = require("express");
const router = express.Router();
const axios = require("axios");
const { body, validationResult } = require("express-validator");
const { query } = require("../db/pool");
const auth = require("../middleware/auth");
const { requirePermission } = require("../middleware/permissions");
const { createAuditLog } = require("../middleware/audit");

/**
 * POST /api/ai-copilot/query
 * Process natural language query and return results
 */
router.post(
  "/query",
  auth,
  requirePermission('analytics', 'view'),
  [
    body("query").isString().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { query: naturalQuery, context } = req.body;
      const organizationId = req.organizationId;
      const userId = req.user.id;

      // Call AI service to generate SQL from natural language
      const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
      
      try {
        const aiResponse = await axios.post(`${aiServiceUrl}/query`, {
          query: naturalQuery,
          context: {
            organizationId,
            userId,
            schema: getDatabaseSchema(),
            ...context,
          },
        });

        const { sql, explanation, confidence } = aiResponse.data;

        // Execute the generated SQL
        const result = await query(sql);

        // Log audit
        await createAuditLog({
          organizationId,
          userId,
          action: 'ai_query',
          entityType: 'ai_copilot',
          newValues: {
            naturalQuery,
            generatedSql: sql,
            confidence,
            resultCount: result.rowCount,
          },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });

        return res.json({
          query: naturalQuery,
          explanation,
          sql,
          confidence,
          results: result.rows,
          resultCount: result.rowCount,
        });
      } catch (aiError) {
        console.error("AI service error:", aiError);
        
        // Fallback: return error but suggest manual query
        return res.status(503).json({
          error: "AI service unavailable",
          message: "The AI service is currently unavailable. Please try again later.",
          query: naturalQuery,
        });
      }
    } catch (err) {
      console.error("Error processing AI query:", err);
      return res.status(500).json({ error: "Error processing query" });
    }
  }
);

/**
 * POST /api/ai-copilot/action
 * Execute action based on natural language
 */
router.post(
  "/action",
  auth,
  requirePermission('analytics', 'view'),
  [
    body("query").isString().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { query: naturalQuery } = req.body;
      const organizationId = req.organizationId;
      const userId = req.user.id;

      // Call AI service to determine action
      const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
      
      try {
        const aiResponse = await axios.post(`${aiServiceUrl}/action`, {
          query: naturalQuery,
          context: {
            organizationId,
            userId,
            availableActions: getAvailableActions(req.user),
          },
        });

        const { action, parameters, explanation } = aiResponse.data;

        // Execute the action
        const actionResult = await executeAction(action, parameters, organizationId, userId);

        // Log audit
        await createAuditLog({
          organizationId,
          userId,
          action: 'ai_action',
          entityType: 'ai_copilot',
          newValues: {
            naturalQuery,
            action,
            parameters,
            result: actionResult,
          },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });

        return res.json({
          query: naturalQuery,
          explanation,
          action,
          parameters,
          result: actionResult,
        });
      } catch (aiError) {
        console.error("AI service error:", aiError);
        return res.status(503).json({
          error: "AI service unavailable",
          message: "The AI service is currently unavailable. Please try again later.",
          query: naturalQuery,
        });
      }
    } catch (err) {
      console.error("Error executing AI action:", err);
      return res.status(500).json({ error: "Error executing action" });
    }
  }
);

/**
 * POST /api/ai-copilot/suggest
 * Get AI suggestions for data analysis
 */
router.post(
  "/suggest",
  auth,
  requirePermission('analytics', 'view'),
  async (req, res) => {
    try {
      const { context } = req.body;
      const organizationId = req.organizationId;

      // Get recent data for context
      const recentSales = await query(
        `SELECT COUNT(*) as count, SUM(total_amount) as total 
         FROM sales 
         WHERE organization_id = $1 AND sale_date >= NOW() - INTERVAL '30 days'`,
        [organizationId]
      );

      const recentProducts = await query(
        `SELECT COUNT(*) as count 
         FROM products 
         WHERE organization_id = $1`,
        [organizationId]
      );

      // Call AI service for suggestions
      const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
      
      try {
        const aiResponse = await axios.post(`${aiServiceUrl}/suggest`, {
          context: {
            organizationId,
            recentData: {
              sales: recentSales.rows[0],
              products: recentProducts.rows[0],
            },
            ...context,
          },
        });

        return res.json({
          suggestions: aiResponse.data.suggestions,
        });
      } catch (aiError) {
        console.error("AI service error:", aiError);
        return res.status(503).json({
          error: "AI service unavailable",
          suggestions: [],
        });
      }
    } catch (err) {
      console.error("Error getting AI suggestions:", err);
      return res.status(500).json({ error: "Error getting suggestions" });
    }
  }
);

/**
 * GET /api/ai-copilot/history
 * Get user's AI query history
 */
router.get(
  "/history",
  auth,
  requirePermission('analytics', 'view'),
  async (req, res) => {
    try {
      const { limit = 20 } = req.query;
      const organizationId = req.organizationId;
      const userId = req.user.id;

      const result = await query(
        `SELECT * FROM audit_logs 
         WHERE organization_id = $1 AND user_id = $2 AND action IN ('ai_query', 'ai_action')
         ORDER BY created_at DESC
         LIMIT $3`,
        [organizationId, userId, limit]
      );

      return res.json({
        history: result.rows.map(log => ({
          id: log.id,
          query: log.new_values?.naturalQuery,
          action: log.action,
          resultCount: log.new_values?.resultCount,
          createdAt: log.created_at,
        })),
      });
    } catch (err) {
      console.error("Error fetching AI history:", err);
      return res.status(500).json({ error: "Error fetching history" });
    }
  }
);

/**
 * Helper function to get database schema for AI
 */
const getDatabaseSchema = () => {
  return {
    tables: {
      products: {
        columns: ['id', 'name', 'description', 'price', 'stock', 'category', 'organization_id', 'branch_id', 'created_at'],
        relationships: ['organization_id -> organizations.id', 'branch_id -> branches.id'],
      },
      sales: {
        columns: ['id', 'quantity', 'total_amount', 'sale_date', 'organization_id', 'branch_id', 'product_id', 'customer_email', 'customer_name', 'created_at'],
        relationships: ['organization_id -> organizations.id', 'branch_id -> branches.id', 'product_id -> products.id'],
      },
      organizations: {
        columns: ['id', 'name', 'slug', 'industry', 'size', 'subscription_plan', 'created_at'],
      },
      branches: {
        columns: ['id', 'name', 'code', 'address', 'city', 'country', 'is_main', 'organization_id'],
        relationships: ['organization_id -> organizations.id'],
      },
    },
  };
};

/**
 * Helper function to get available actions for user
 */
const getAvailableActions = (user) => {
  const actions = [
    { name: 'create_product', description: 'Create a new product' },
    { name: 'update_product', description: 'Update an existing product' },
    { name: 'create_sale', description: 'Record a new sale' },
    { name: 'generate_report', description: 'Generate a report' },
    { name: 'send_notification', description: 'Send a notification' },
  ];

  // Filter based on user role if needed
  return actions;
};

/**
 * Helper function to execute AI-determined action
 */
const executeAction = async (action, parameters, organizationId, userId) => {
  switch (action) {
    case 'create_product':
      return await createProductAction(parameters, organizationId, userId);
    case 'update_product':
      return await updateProductAction(parameters, organizationId, userId);
    case 'create_sale':
      return await createSaleAction(parameters, organizationId, userId);
    case 'generate_report':
      return await generateReportAction(parameters, organizationId, userId);
    default:
      return { success: false, error: 'Unknown action' };
  }
};

/**
 * Action: Create product
 */
const createProductAction = async (parameters, organizationId, userId) => {
  try {
    const { name, price, stock, category } = parameters;
    const result = await query(
      `INSERT INTO products (name, price, stock, category, organization_id, user_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id`,
      [name, price, stock, category, organizationId, userId]
    );
    return { success: true, productId: result.rows[0].id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Action: Update product
 */
const updateProductAction = async (parameters, organizationId, userId) => {
  try {
    const { productId, updates } = parameters;
    const result = await query(
      `UPDATE products 
       SET name = COALESCE($1, name),
           price = COALESCE($2, price),
           stock = COALESCE($3, stock),
           category = COALESCE($4, category),
           updated_at = NOW()
       WHERE id = $5 AND organization_id = $6
       RETURNING id`,
      [updates.name, updates.price, updates.stock, updates.category, productId, organizationId]
    );
    return { success: true, updated: result.rowCount > 0 };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Action: Create sale
 */
const createSaleAction = async (parameters, organizationId, userId) => {
  try {
    const { quantity, totalAmount, productId } = parameters;
    const result = await query(
      `INSERT INTO sales (quantity, total_amount, product_id, organization_id, user_id, sale_date, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NOW())
       RETURNING id`,
      [quantity, totalAmount, productId, organizationId, userId]
    );
    return { success: true, saleId: result.rows[0].id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Action: Generate report
 */
const generateReportAction = async (parameters, organizationId, userId) => {
  try {
    const { type, startDate, endDate } = parameters;
    
    let sql = '';
    if (type === 'sales_summary') {
      sql = `
        SELECT 
          COUNT(*) as total_sales,
          SUM(total_amount) as total_revenue,
          AVG(total_amount) as avg_sale_value
        FROM sales
        WHERE organization_id = $1
          AND sale_date >= $2
          AND sale_date <= $3
      `;
    } else if (type === 'product_performance') {
      sql = `
        SELECT 
          p.name,
          COUNT(s.id) as sales_count,
          SUM(s.total_amount) as total_revenue
        FROM products p
        LEFT JOIN sales s ON p.id = s.product_id
        WHERE p.organization_id = $1
          AND (s.sale_date >= $2 OR s.sale_date IS NULL)
          AND (s.sale_date <= $3 OR s.sale_date IS NULL)
        GROUP BY p.id, p.name
        ORDER BY total_revenue DESC
      `;
    }

    const result = await query(sql, [organizationId, startDate, endDate]);
    return { success: true, report: result.rows, type };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = router;
