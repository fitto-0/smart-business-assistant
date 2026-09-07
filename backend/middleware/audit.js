/**
 * Audit logging middleware
 * Tracks all important actions for security and compliance
 */

const { query } = require('../db/pool');

/**
 * Create an audit log entry
 */
const createAuditLog = async (data) => {
  try {
    const {
      organizationId,
      userId,
      action,
      entityType,
      entityId,
      oldValues,
      newValues,
      ipAddress,
      userAgent,
      metadata,
    } = data;

    await query(
      `INSERT INTO audit_logs 
       (organization_id, user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        organizationId || null,
        userId || null,
        action,
        entityType || null,
        entityId || null,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        ipAddress || null,
        userAgent || null,
        metadata ? JSON.stringify(metadata) : null,
      ]
    );
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit log failures shouldn't break the main operation
  }
};

/**
 * Middleware to automatically log CRUD operations
 */
const auditLog = (entityType) => {
  return async (req, res, next) => {
    // Store original res.json to intercept response
    const originalJson = res.json.bind(res);
    
    res.json = function(data) {
      // Only log successful operations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const method = req.method.toLowerCase();
        let action = method;
        
        // Map HTTP methods to audit actions
        if (method === 'post') action = 'create';
        else if (method === 'put' || method === 'patch') action = 'update';
        else if (method === 'delete') action = 'delete';
        else if (method === 'get') action = 'view';
        
        // Extract entity ID from params or response
        const entityId = req.params.id || (data.id || data.product_id || data.organization_id);
        
        // Log asynchronously
        setImmediate(() => {
          createAuditLog({
            organizationId: req.organizationId,
            userId: req.user?.id,
            action: action,
            entityType: entityType,
            entityId: entityId,
            newValues: data,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'],
            metadata: {
              method: req.method,
              path: req.path,
            },
          });
        });
      }
      
      return originalJson(data);
    };
    
    next();
  };
};

/**
 * Middleware to log specific actions manually
 */
const logAction = (action, entityType, options = {}) => {
  return async (req, res, next) => {
    res.on('finish', async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        await createAuditLog({
          organizationId: req.organizationId,
          userId: req.user?.id,
          action: action,
          entityType: entityType,
          entityId: options.entityId || req.params.id,
          oldValues: options.oldValues,
          newValues: options.newValues,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          metadata: options.metadata || {
            method: req.method,
            path: req.path,
          },
        });
      }
    });
    next();
  };
};

/**
 * Get audit logs for an organization
 */
const getAuditLogs = async (organizationId, filters = {}) => {
  try {
    const {
      userId,
      action,
      entityType,
      entityId,
      limit = 50,
      offset = 0,
      startDate,
      endDate,
    } = filters;

    let queryText = `
      SELECT 
        al.*,
        u.name as user_name,
        u.email as user_email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.organization_id = $1
    `;
    
    const queryParams = [organizationId];
    let paramCount = 2;

    if (userId) {
      queryText += ` AND al.user_id = $${paramCount}`;
      queryParams.push(userId);
      paramCount++;
    }

    if (action) {
      queryText += ` AND al.action = $${paramCount}`;
      queryParams.push(action);
      paramCount++;
    }

    if (entityType) {
      queryText += ` AND al.entity_type = $${paramCount}`;
      queryParams.push(entityType);
      paramCount++;
    }

    if (entityId) {
      queryText += ` AND al.entity_id = $${paramCount}`;
      queryParams.push(entityId);
      paramCount++;
    }

    if (startDate) {
      queryText += ` AND al.created_at >= $${paramCount}`;
      queryParams.push(startDate);
      paramCount++;
    }

    if (endDate) {
      queryText += ` AND al.created_at <= $${paramCount}`;
      queryParams.push(endDate);
      paramCount++;
    }

    queryText += ` ORDER BY al.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    queryParams.push(limit, offset);

    const result = await query(queryText, queryParams);

    // Get total count
    const countQuery = queryText.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as total FROM').replace(/ORDER BY.*$/, '');
    const countResult = await query(countQuery, queryParams.slice(0, -2));

    return {
      logs: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit,
      offset,
    };
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }
};

module.exports = {
  createAuditLog,
  auditLog,
  logAction,
  getAuditLogs,
};
