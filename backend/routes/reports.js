const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const { query } = require("../db/pool");
const auth = require("../middleware/auth");
const { requirePermission } = require("../middleware/permissions");
const { createAuditLog } = require("../middleware/audit");

/**
 * POST /api/reports/create
 * Create a custom report
 */
router.post(
  "/create",
  auth,
  requirePermission('analytics', 'view'),
  [
    body("name").isString().trim(),
    body("description").optional().isString(),
    body("type").isIn(['sales', 'products', 'customers', 'inventory', 'custom']),
    body("filters").optional().isObject(),
    body("columns").isArray(),
    body("groupBy").optional().isString(),
    body("sortBy").optional().isString(),
    body("sortOrder").optional().isIn(['ASC', 'DESC']),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, type, filters, columns, groupBy, sortBy, sortOrder } = req.body;
      const organizationId = req.organizationId;
      const userId = req.user.id;

      const result = await query(
        `INSERT INTO custom_reports (organization_id, user_id, name, description, type, filters, columns, group_by, sort_by, sort_order, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
         RETURNING id`,
        [organizationId, userId, name, description, type, JSON.stringify(filters), columns, groupBy, sortBy, sortOrder || 'ASC']
      );

      // Log audit
      await createAuditLog({
        organizationId,
        userId,
        action: 'report_create',
        entityType: 'report',
        entityId: result.rows[0].id,
        newValues: { name, type },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.status(201).json({
        message: "Report created",
        reportId: result.rows[0].id,
      });
    } catch (err) {
      console.error("Error creating report:", err);
      return res.status(500).json({ error: "Error creating report" });
    }
  }
);

/**
 * GET /api/reports/list
 * List custom reports
 */
router.get(
  "/list",
  auth,
  requirePermission('analytics', 'view'),
  async (req, res) => {
    try {
      const organizationId = req.organizationId;
      const { type } = req.query;

      let queryStr = `SELECT * FROM custom_reports WHERE organization_id = $1`;
      const params = [organizationId];

      if (type) {
        queryStr += ` AND type = $2`;
        params.push(type);
      }

      queryStr += ` ORDER BY created_at DESC`;

      const result = await query(queryStr, params);

      return res.json({
        reports: result.rows,
      });
    } catch (err) {
      console.error("Error listing reports:", err);
      return res.status(500).json({ error: "Error listing reports" });
    }
  }
);

/**
 * GET /api/reports/:id
 * Get report details
 */
router.get(
  "/:id",
  auth,
  requirePermission('analytics', 'view'),
  async (req, res) => {
    try {
      const reportId = req.params.id;
      const organizationId = req.organizationId;

      const result = await query(
        `SELECT * FROM custom_reports WHERE id = $1 AND organization_id = $2`,
        [reportId, organizationId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Report not found" });
      }

      return res.json({
        report: result.rows[0],
      });
    } catch (err) {
      console.error("Error fetching report:", err);
      return res.status(500).json({ error: "Error fetching report" });
    }
  }
);

/**
 * POST /api/reports/:id/run
 * Run a custom report
 */
router.post(
  "/:id/run",
  auth,
  requirePermission('analytics', 'view'),
  async (req, res) => {
    try {
      const reportId = req.params.id;
      const organizationId = req.organizationId;

      // Get report configuration
      const report = await query(
        `SELECT * FROM custom_reports WHERE id = $1 AND organization_id = $2`,
        [reportId, organizationId]
      );

      if (report.rowCount === 0) {
        return res.status(404).json({ error: "Report not found" });
      }

      const config = report.rows[0];
      let sql = '';
      let params = [organizationId];
      let paramIndex = 2;

      // Fix old / UI column names in configuration
      const fixColumnName = (col) => {
        if (col === 'sale_date') return 'date';
        if (col === 'customer_email') return 'customer_name';
        if (col === 'cost') return 'cost_price';
        return col;
      };

      const fixedColumns = config.columns.map(fixColumnName);
      const fixedGroupBy = config.group_by ? fixColumnName(config.group_by) : null;
      const fixedSortBy = config.sort_by ? fixColumnName(config.sort_by) : null;

      // Safe identifier helper — reject anything that is not a simple column name
      const SAFE_COL_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
      const isSafeCol = (c) => SAFE_COL_RE.test(c);
      const validFixedColumns = fixedColumns.filter(isSafeCol);
      const validGroupBy = fixedGroupBy && isSafeCol(fixedGroupBy) ? fixedGroupBy : null;
      if (validFixedColumns.length === 0) {
        return res.status(400).json({ error: 'No valid columns selected for this report.' });
      }

      // Helper: build a GROUP BY query that is actually valid Postgres.
      // Any non-group column without an aggregate would otherwise raise
      // "must appear in GROUP BY clause" → wrap it so the report still runs.
      const buildGrouped = (table, cols, groupBy) => {
        const aggs = cols.filter((c) => c !== groupBy);
        const selectCols = [groupBy, ...aggs.map((c) => `MAX(${c}) AS ${c}`)];
        return `SELECT ${selectCols.join(', ')} FROM ${table} WHERE organization_id = $1 GROUP BY ${groupBy}`;
      };

      // Build SQL based on report type
      switch (config.type) {
        case 'sales':
          if (validGroupBy) {
            sql = buildGrouped('sales', validFixedColumns, validGroupBy);
          } else {
            sql = `SELECT ${validFixedColumns.join(', ')} FROM sales WHERE organization_id = $1`;
          }
          break;
        case 'products':
          if (validGroupBy) {
            sql = buildGrouped('products', validFixedColumns, validGroupBy);
          } else {
            sql = `SELECT ${validFixedColumns.join(', ')} FROM products WHERE organization_id = $1`;
          }
          break;
        case 'customers':
          sql = `SELECT customer_name, COUNT(*)::int as orders, SUM(total_amount) as total_spent, AVG(total_amount) as avg_order_value
                 FROM sales WHERE organization_id = $1 AND customer_name IS NOT NULL GROUP BY customer_name`;
          break;
        case 'inventory':
          if (validGroupBy) {
            sql = buildGrouped('products', validFixedColumns, validGroupBy);
          } else {
            sql = `SELECT ${validFixedColumns.join(', ')} FROM products WHERE organization_id = $1`;
          }
          break;
        default:
          if (validGroupBy) {
            sql = buildGrouped('sales', validFixedColumns, validGroupBy);
          } else {
            sql = `SELECT ${validFixedColumns.join(', ')} FROM sales WHERE organization_id = $1`;
          }
      }

      // Apply filters
      if (config.filters) {
        if (config.filters.startDate) {
          sql += ` AND date >= $${paramIndex}`;
          params.push(config.filters.startDate);
          paramIndex++;
        }
        if (config.filters.endDate) {
          sql += ` AND date <= $${paramIndex}`;
          params.push(config.filters.endDate);
          paramIndex++;
        }
        if (config.filters.category) {
          sql += ` AND category = $${paramIndex}`;
          params.push(config.filters.category);
          paramIndex++;
        }
      }

      // Apply grouping (already handled above, but keep for HAVING clause if needed)
      // Apply sorting — only on safe, selected columns
      const validSortBy = fixedSortBy && isSafeCol(fixedSortBy) ? fixedSortBy : null;
      if (validSortBy && validFixedColumns.includes(validSortBy)) {
        sql += ` ORDER BY ${validSortBy} ${config.sort_order || 'ASC'}`;
      }

      // Execute query
      const data = await query(sql, params);

      // Update last run time
      await query(
        `UPDATE custom_reports SET last_run_at = NOW() WHERE id = $1`,
        [reportId]
      );

      return res.json({
        reportId,
        reportName: config.name,
        data: data.rows,
        rowCount: data.rowCount,
        columns: config.columns,
      });
    } catch (err) {
      console.error("Error running report:", err);
      const msg = err.message || 'Error running report';
      // Surface Postgres detail in non-production to help debug the report builder
      const detail = process.env.NODE_ENV !== 'production' ? msg : undefined;
      return res.status(500).json({ error: 'Error running report', ...(detail ? { detail } : {}) });
    }
  }
);

/**
 * PUT /api/reports/:id
 * Update a custom report
 */
router.put(
  "/:id",
  auth,
  requirePermission('analytics', 'view'),
  [
    body("name").optional().isString().trim(),
    body("description").optional().isString(),
    body("filters").optional().isObject(),
    body("columns").optional().isArray(),
    body("groupBy").optional().isString(),
    body("sortBy").optional().isString(),
    body("sortOrder").optional().isIn(['ASC', 'DESC']),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const reportId = req.params.id;
      const organizationId = req.organizationId;
      const userId = req.user.id;
      const updates = req.body;

      // Build update query dynamically
      const updateFields = [];
      const params = [];
      let paramIndex = 1;

      if (updates.name !== undefined) {
        updateFields.push(`name = $${paramIndex}`);
        params.push(updates.name);
        paramIndex++;
      }
      if (updates.description !== undefined) {
        updateFields.push(`description = $${paramIndex}`);
        params.push(updates.description);
        paramIndex++;
      }
      if (updates.filters !== undefined) {
        updateFields.push(`filters = $${paramIndex}`);
        params.push(JSON.stringify(updates.filters));
        paramIndex++;
      }
      if (updates.columns !== undefined) {
        updateFields.push(`columns = $${paramIndex}`);
        params.push(updates.columns);
        paramIndex++;
      }
      if (updates.groupBy !== undefined) {
        updateFields.push(`group_by = $${paramIndex}`);
        params.push(updates.groupBy);
        paramIndex++;
      }
      if (updates.sortBy !== undefined) {
        updateFields.push(`sort_by = $${paramIndex}`);
        params.push(updates.sortBy);
        paramIndex++;
      }
      if (updates.sortOrder !== undefined) {
        updateFields.push(`sort_order = $${paramIndex}`);
        params.push(updates.sortOrder);
        paramIndex++;
      }

      updateFields.push(`updated_at = NOW()`);
      params.push(reportId, organizationId);
      paramIndex++;
      params.push(organizationId);

      const result = await query(
        `UPDATE custom_reports 
         SET ${updateFields.join(', ')}
         WHERE id = $${paramIndex - 1} AND organization_id = $${paramIndex}
         RETURNING *`,
        params
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Report not found" });
      }

      // Log audit
      await createAuditLog({
        organizationId,
        userId,
        action: 'report_update',
        entityType: 'report',
        entityId: reportId,
        newValues: updates,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.json({
        message: "Report updated",
        report: result.rows[0],
      });
    } catch (err) {
      console.error("Error updating report:", err);
      return res.status(500).json({ error: "Error updating report" });
    }
  }
);

/**
 * DELETE /api/reports/:id
 * Delete a custom report
 */
router.delete(
  "/:id",
  auth,
  requirePermission('analytics', 'view'),
  async (req, res) => {
    try {
      const reportId = req.params.id;
      const organizationId = req.organizationId;
      const userId = req.user.id;

      const result = await query(
        `DELETE FROM custom_reports WHERE id = $1 AND organization_id = $2 RETURNING *`,
        [reportId, organizationId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Report not found" });
      }

      // Log audit
      await createAuditLog({
        organizationId,
        userId,
        action: 'report_delete',
        entityType: 'report',
        entityId: reportId,
        oldValues: result.rows[0],
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.json({
        message: "Report deleted",
      });
    } catch (err) {
      console.error("Error deleting report:", err);
      return res.status(500).json({ error: "Error deleting report" });
    }
  }
);

/**
 * GET /api/reports/columns/:type
 * Get available columns for a report type
 */
router.get(
  "/columns/:type",
  auth,
  requirePermission('analytics', 'view'),
  async (req, res) => {
    try {
      const { type } = req.params;

      const columns = {
        sales: ['id', 'quantity', 'total_amount', 'date', 'customer_name', 'product_id', 'created_at'],
        products: ['id', 'name', 'description', 'price', 'stock', 'category', 'cost_price', 'created_at', 'updated_at'],
        customers: ['customer_name', 'orders', 'total_spent', 'avg_order_value'],
        inventory: ['id', 'name', 'category', 'stock', 'price', 'cost_price', 'created_at', 'updated_at'],
      };

      if (!columns[type]) {
        return res.status(400).json({ error: "Invalid report type" });
      }

      return res.json({
        type,
        columns: columns[type],
      });
    } catch (err) {
      console.error("Error fetching columns:", err);
      return res.status(500).json({ error: "Error fetching columns" });
    }
  }
);

module.exports = router;
