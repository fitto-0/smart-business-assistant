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

function fixColumnName(col) {
  if (col === 'sale_date') return 'date';
  if (col === 'customer_email') return 'customer_name';
  if (col === 'cost') return 'cost_price';
  return col;
}
const SAFE_COL_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const isSafeCol = (c) => SAFE_COL_RE.test(c);
const q = (id) => `"${id.replace(/"/g, '""')}"`;

/**
 * Helper — build the report SQL + params from a stored config.
 * Shared by run and export so both always reflect real DB data.
 */
async function buildReportQuery(organizationId, config) {
  const fixedColumns = (config.columns || []).map(fixColumnName);
  const fixedGroupBy = config.group_by ? fixColumnName(config.group_by) : null;
  const fixedSortBy = config.sort_by ? fixColumnName(config.sort_by) : null;

  const validFixedColumns = fixedColumns.filter(isSafeCol);
  const validGroupBy = fixedGroupBy && isSafeCol(fixedGroupBy) ? fixedGroupBy : null;
  if (validFixedColumns.length === 0) throw Object.assign(new Error('No valid columns selected.'), { statusCode: 400 });

  const buildGrouped = (table, cols, groupBy) => {
    const aggs = cols.filter((c) => c !== groupBy);
    const selectCols = [q(groupBy), ...aggs.map((c) => `MAX(${q(c)}) AS ${q(c)}`)];
    return `SELECT ${selectCols.join(', ')} FROM ${table} WHERE organization_id = $1 GROUP BY ${q(groupBy)}`;
  };

  let sql = '';
  let params = [organizationId];
  let paramIndex = 2;

  switch (config.type) {
    case 'sales':
      sql = validGroupBy ? buildGrouped('sales', validFixedColumns, validGroupBy) : `SELECT ${validFixedColumns.map(q).join(', ')} FROM sales WHERE organization_id = $1`;
      break;
    case 'products':
      sql = validGroupBy ? buildGrouped('products', validFixedColumns, validGroupBy) : `SELECT ${validFixedColumns.map(q).join(', ')} FROM products WHERE organization_id = $1`;
      break;
    case 'customers':
      sql = `SELECT ${q('customer_name')}, COUNT(*)::int as orders, SUM(total_amount) as total_spent, AVG(total_amount) as avg_order_value FROM sales WHERE organization_id = $1 AND customer_name IS NOT NULL GROUP BY ${q('customer_name')}`;
      break;
    case 'inventory':
      sql = validGroupBy ? buildGrouped('products', validFixedColumns, validGroupBy) : `SELECT ${validFixedColumns.map(q).join(', ')} FROM products WHERE organization_id = $1`;
      break;
    default:
      sql = validGroupBy ? buildGrouped('sales', validFixedColumns, validGroupBy) : `SELECT ${validFixedColumns.map(q).join(', ')} FROM sales WHERE organization_id = $1`;
  }

  if (config.filters) {
    if (config.filters.startDate) { sql += ` AND ${q('date')} >= $${paramIndex}`; params.push(config.filters.startDate); paramIndex++; }
    if (config.filters.endDate) { sql += ` AND ${q('date')} <= $${paramIndex}`; params.push(config.filters.endDate); paramIndex++; }
    if (config.filters.category) { sql += ` AND ${q('category')} = $${paramIndex}`; params.push(config.filters.category); paramIndex++; }
  }

  const validSortBy = fixedSortBy && isSafeCol(fixedSortBy) ? fixedSortBy : null;
  if (validSortBy && validFixedColumns.includes(validSortBy)) {
    sql += ` ORDER BY ${q(validSortBy)} ${config.sort_order || 'ASC'}`;
  }

  return { sql, params, columns: validFixedColumns };
}

/**
 * GET /api/reports/:id/export/pdf
 * Export a report as PDF (real DB data, streamed)
 */
router.get(
  '/:id/export/pdf',
  auth,
  requirePermission('analytics', 'view'),
  async (req, res) => {
    try {
      const reportId = req.params.id;
      const organizationId = req.organizationId;

      const report = await query(`SELECT * FROM custom_reports WHERE id = $1 AND organization_id = $2`, [reportId, organizationId]);
      if (report.rowCount === 0) return res.status(404).json({ error: 'Report not found' });

      const config = report.rows[0];
      const { sql, params, columns } = await buildReportQuery(organizationId, config);
      const data = await query(sql, params);

      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument({ size: 'A4', margin: 32, layout: 'landscape' });

      const filename = `${String(config.name || 'report').replace(/[^a-z0-9_-]/gi, '_')}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      doc.pipe(res);

      // ---- Helpers for a clean PDF ----
      const fmtDate = (v) => {
        if (v == null || v === '') return '-';
        const d = new Date(v);
        if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10); // 2026-09-16
        return String(v);
      };
      const fmtCell = (col, val) => {
        if (val == null || val === '') return '-';
        const lc = String(col).toLowerCase();
        if (lc.includes('updated_at') || lc.includes('created_at') || lc === 'date') return fmtDate(val);
        if (lc === 'description') {
          const s = String(val).replace(/\s+/g, ' ').trim();
          return s.length > 60 ? s.slice(0, 60) + '…' : s;
        }
        if (lc === 'cost_price' && Number(val) === 0) return '-';
        if (typeof val === 'number') return Number.isInteger(val) ? String(val) : Number(val).toFixed(2);
        const s = String(val);
        return s.length > 40 ? s.slice(0, 40) + '…' : s;
      };
      const isNumericCol = (c) => ['id','stock','price','cost_price','quantity','total_amount','orders','total_spent','avg_order_value'].includes(c);
      // Smart column widths: description a bit wider, Dates narrower, ID very narrow
      const weightOf = (c) => {
        if (c === 'id') return 0.6;
        if (c === 'description') return 1.6;
        if (c === 'name') return 1.2;
        if (c === 'customer_name') return 1.1;
        if (c === 'category') return 0.9;
        if (['updated_at','created_at','date'].includes(c)) return 1.0;
        return 0.85;
      };
      const totalWeight = columns.reduce((s,c)=> s + weightOf(c), 0);

      // ---- Header ----
      doc.font('Helvetica-Bold').fontSize(15).fillColor('#0A0807').text(config.name || 'Report', { align: 'left' });
      doc.moveDown(0.25);
      doc.font('Helvetica').fontSize(7.5).fillColor('#847B74').text(
        `${(config.type || '').toUpperCase()}  ·  ${(config.description || 'No description').slice(0,120)}  ·  ${data.rowCount} rows  ·  ${new Date().toLocaleDateString('en-CA')} ${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`,
        { align: 'left' }
      );
      // Brand accent rule
      doc.moveDown(0.5);
      const ruleY = doc.y;
      doc.moveTo(doc.page.margins.left, ruleY).lineTo(doc.page.width - doc.page.margins.right, ruleY).strokeColor('#E2703A').lineWidth(1.2).stroke();
      doc.moveDown(0.6);

      if (data.rows.length === 0) {
        doc.moveDown(1).fontSize(10).fillColor('#847B74').font('Helvetica').text('No data for this report.', { align: 'center' });
        doc.end();
        return;
      }

      // ---- Table config ----
      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const colWidths = columns.map(c => (weightOf(c) / totalWeight) * pageWidth);
      const rowPadding = 4;
      const fontSize = 7;
      const headerH = 20;

      // Precompute X positions
      const colX = [];
      let acc = doc.page.margins.left;
      for (const w of colWidths) { colX.push(acc); acc += w; }

      const drawHeader = (y) => {
        doc.save();
        doc.roundedRect(doc.page.margins.left, y, pageWidth, headerH, 2).fill('#0A0807');
        doc.restore();
        doc.fillColor('#EDE7DC').font('Helvetica-Bold').fontSize(6.5);
        columns.forEach((col, i) => {
          const align = isNumericCol(col) ? 'right' : 'left';
          // use lineBreak:false to stop pdfkit auto-pagination
          doc.text(col.toUpperCase(), colX[i] + rowPadding, y + 7, { width: colWidths[i] - rowPadding*2, align, ellipsis: true, lineBreak: false });
        });
        // keep doc.y in sync so pdfkit doesn't think we are at top
        doc.y = y + headerH;
        doc.x = doc.page.margins.left;
      };

      const rowHeightFor = (row) => {
        let maxH = 16;
        doc.font('Helvetica').fontSize(fontSize);
        columns.forEach((col, i) => {
          const txt = fmtCell(col, row[col]);
          const h = doc.heightOfString(txt, { width: colWidths[i] - rowPadding*2 });
          maxH = Math.max(maxH, h + rowPadding*2);
        });
        return Math.min(maxH, 28);
      };

      let y = doc.y + 6;
      drawHeader(y);
      y += headerH + 2;
      doc.y = y; doc.x = doc.page.margins.left;

      // Manual pagination — draw footer inside content area so it never creates a blank page
      let pageNum = 1;
      const drawFooter = (p, totalHint) => {
        // inside bottom margin (563 is the content bottom), keep 12pt above edge
        const footerY = doc.page.height - doc.page.margins.bottom + 10;
        const savedY = doc.y; const savedX = doc.x;
        doc.font('Helvetica').fontSize(6.5).fillColor('#847B74')
          .text(`Smart Business Assistant  ·  ${config.name}`, doc.page.margins.left, footerY, { width: pageWidth/2, align: 'left', lineBreak: false });
        doc.text(`Page ${p}${totalHint ? ' / ' + totalHint : ''}`, doc.page.margins.left + pageWidth/2, footerY, { width: pageWidth/2, align: 'right', lineBreak: false });
        doc.y = savedY; doc.x = savedX;
      };

      for (let idx = 0; idx < data.rows.length; idx++) {
        const row = data.rows[idx];
        const rh = rowHeightFor(row);
        if (y + rh > doc.page.height - doc.page.margins.bottom - 20) {
          doc.addPage({ size: 'A4', layout: 'landscape', margin: 32 });
          pageNum++;
          y = doc.page.margins.top;
          drawHeader(y);
          y += headerH + 2;
          doc.y = y; doc.x = doc.page.margins.left;
        }
        // zebra
        doc.save();
        if (idx % 2 === 1) {
          doc.rect(doc.page.margins.left, y, pageWidth, rh).fillOpacity(0.07).fill('#E2703A').fillOpacity(1);
        }
        doc.restore();
        // row rule
        doc.save();
        doc.moveTo(doc.page.margins.left, y).lineTo(doc.page.margins.left + pageWidth, y).strokeColor('#F2ECE4').opacity(0.35).lineWidth(0.5).stroke().opacity(1);
        doc.restore();

        doc.font('Helvetica').fontSize(fontSize);
        columns.forEach((col, i) => {
          const txt = fmtCell(col, row[col]);
          const align = isNumericCol(col) ? 'right' : 'left';
          if (isNumericCol(col)) doc.fillColor('#0A0807');
          else doc.fillColor('#2B2B2B');
          doc.text(txt, colX[i] + rowPadding, y + rowPadding, { width: colWidths[i] - rowPadding*2, align, lineBreak: false });
        });
        y += rh;
        doc.y = y; doc.x = doc.page.margins.left;
      }
      // bottom rule — no footer that would spill into margin and spawn a blank page
      doc.save();
      doc.moveTo(doc.page.margins.left, y).lineTo(doc.page.margins.left + pageWidth, y).strokeColor('#E2703A').opacity(0.25).lineWidth(0.8).stroke().opacity(1);
      doc.restore();
      // single-line footer centered below table (only on last page, never creates a new page)
      {
        const footerY = y + 10;
        if (footerY < doc.page.height - 16) {
          const savedY = doc.y; const savedX = doc.x;
          doc.font('Helvetica').fontSize(6.5).fillColor('#847B74')
            .text(`Smart Business Assistant  ·  ${config.name}  ·  Page ${pageNum} / ${pageNum}`, doc.page.margins.left, footerY, { width: pageWidth, align: 'center', lineBreak: false });
          doc.y = savedY; doc.x = savedX;
        }
      }

      doc.end();
      await query(`UPDATE custom_reports SET last_run_at = NOW() WHERE id = $1`, [reportId]);
    } catch (err) {
      console.error('Error exporting PDF:', err);
      const status = err.statusCode || 500;
      // If headers already sent (pdf stream started) we can only abort
      if (res.headersSent) {
        try { res.end(); } catch (_) {}
        return;
      }
      return res.status(status).json({ error: err.message || 'Error exporting PDF', detail: err.detail || String(err) });
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
