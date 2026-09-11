/**
 * Role-based permissions system
 * Defines what each role can do within an organization
 */

const PERMISSIONS = {
  // Product management
  products: {
    view: ['owner', 'admin', 'manager', 'employee', 'accountant', 'viewer'],
    create: ['owner', 'admin', 'manager'],
    update: ['owner', 'admin', 'manager'],
    delete: ['owner', 'admin'],
    import: ['owner', 'admin', 'manager'],
    export: ['owner', 'admin', 'manager', 'accountant'],
  },
  // Sales management
  sales: {
    view: ['owner', 'admin', 'manager', 'employee', 'accountant', 'viewer'],
    create: ['owner', 'admin', 'manager', 'employee'],
    update: ['owner', 'admin', 'manager'],
    delete: ['owner', 'admin'],
    import: ['owner', 'admin', 'manager'],
    export: ['owner', 'admin', 'manager', 'accountant'],
  },
  // Analytics and reports
  analytics: {
    view: ['owner', 'admin', 'manager', 'accountant', 'viewer'],
    export: ['owner', 'admin', 'manager', 'accountant'],
    advanced: ['owner', 'admin', 'manager'],
  },
  // Inventory management
  inventory: {
    view: ['owner', 'admin', 'manager', 'employee', 'accountant', 'viewer'],
    update: ['owner', 'admin', 'manager'],
    restock: ['owner', 'admin', 'manager'],
  },
  // Team management
  team: {
    view: ['owner', 'admin', 'manager'],
    invite: ['owner', 'admin'],
    remove: ['owner', 'admin'],
    update_roles: ['owner', 'admin'],
  },
  // Organization settings
  settings: {
    view: ['owner', 'admin'],
    update: ['owner', 'admin'],
    billing: ['owner'],
    delete: ['owner'],
  },
  // Security management
  security: {
    view: ['owner', 'admin'],
    manage: ['owner', 'admin'],
  },
  // Backup management
  backup: {
    view: ['owner', 'admin'],
    create: ['owner', 'admin'],
    restore: ['owner', 'admin'],
    delete: ['owner', 'admin'],
    manage: ['owner', 'admin'],
  },
  // Reports management
  reports: {
    view: ['owner', 'admin', 'manager', 'accountant', 'viewer'],
    create: ['owner', 'admin', 'manager', 'accountant'],
    update: ['owner', 'admin', 'manager'],
    delete: ['owner', 'admin'],
    run: ['owner', 'admin', 'manager', 'accountant', 'viewer'],
  },
  // Admin functions
  admin: {
    view: ['owner', 'admin'],
    manage: ['owner', 'admin'],
  },
  // Branch management
  branches: {
    view: ['owner', 'admin', 'manager', 'viewer'],
    create: ['owner', 'admin'],
    update: ['owner', 'admin'],
    delete: ['owner'],
  },
  // Integrations
  integrations: {
    view: ['owner', 'admin'],
    connect: ['owner', 'admin'],
    disconnect: ['owner', 'admin'],
    configure: ['owner', 'admin'],
  },
};

/**
 * Check if a role has permission for a specific action
 */
const hasPermission = (role, resource, action) => {
  if (!PERMISSIONS[resource]) {
    console.warn(`Unknown resource: ${resource}`);
    return false;
  }
  
  if (!PERMISSIONS[resource][action]) {
    console.warn(`Unknown action: ${action} for resource: ${resource}`);
    return false;
  }
  
  return PERMISSIONS[resource][action].includes(role);
};

/**
 * Middleware to check if user has required permission
 */
const requirePermission = (resource, action) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const organizationId = req.organizationId;
      
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization context required' });
      }
      
      // Get user's role in this organization
      const { query } = require('../db/pool');
      const memberResult = await query(
        `SELECT role, status FROM organization_members 
         WHERE user_id = $1 AND organization_id = $2`,
        [user.id, organizationId]
      );
      
      if (memberResult.rowCount === 0) {
        return res.status(403).json({ error: 'Not a member of this organization' });
      }
      
      const member = memberResult.rows[0];
      
      if (member.status !== 'active') {
        return res.status(403).json({ error: 'Organization membership is not active' });
      }
      
      if (!hasPermission(member.role, resource, action)) {
        return res.status(403).json({ 
          error: `Permission denied: ${resource}.${action} requires one of: ${PERMISSIONS[resource][action].join(', ')}` 
        });
      }
      
      // Add role to request for use in controllers
      req.userRole = member.role;
      req.memberId = memberResult.rows[0].id;
      
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ error: 'Error checking permissions' });
    }
  };
};

/**
 * Middleware to check if user is owner or admin
 */
const requireOwnerOrAdmin = async (req, res, next) => {
  try {
    const user = req.user;
    const organizationId = req.organizationId;
    
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' });
    }
    
    const { query } = require('../db/pool');
    const memberResult = await query(
      `SELECT role FROM organization_members 
       WHERE user_id = $1 AND organization_id = $2`,
      [user.id, organizationId]
    );
    
    if (memberResult.rowCount === 0) {
      return res.status(403).json({ error: 'Not a member of this organization' });
    }
    
    const role = memberResult.rows[0].role;
    
    if (role !== 'owner' && role !== 'admin') {
      return res.status(403).json({ error: 'Owner or admin access required' });
    }
    
    req.userRole = role;
    next();
  } catch (error) {
    console.error('Owner/admin check error:', error);
    return res.status(500).json({ error: 'Error checking permissions' });
  }
};

/**
 * Middleware to check if user is owner
 */
const requireOwner = async (req, res, next) => {
  try {
    const user = req.user;
    const organizationId = req.organizationId;
    
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' });
    }
    
    const { query } = require('../db/pool');
    const memberResult = await query(
      `SELECT role FROM organization_members 
       WHERE user_id = $1 AND organization_id = $2`,
      [user.id, organizationId]
    );
    
    if (memberResult.rowCount === 0) {
      return res.status(403).json({ error: 'Not a member of this organization' });
    }
    
    const role = memberResult.rows[0].role;
    
    if (role !== 'owner') {
      return res.status(403).json({ error: 'Owner access required' });
    }
    
    req.userRole = role;
    next();
  } catch (error) {
    console.error('Owner check error:', error);
    return res.status(500).json({ error: 'Error checking permissions' });
  }
};

module.exports = {
  PERMISSIONS,
  hasPermission,
  requirePermission,
  requireOwnerOrAdmin,
  requireOwner,
};
