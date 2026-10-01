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

/* Everything the owner can grant — checkboxes in UI. */
const AVAILABLE_PERMISSIONS = Object.fromEntries(
  Object.entries(PERMISSIONS).map(([r, a]) => [r, Object.keys(a)])
);
const AVAILABLE_WIDGETS = ['revenue','orders','satisfaction','stock_alerts','monthly_sales','categories','top_products','anomalies','recommendations'];
const AVAILABLE_PAGES = ['/dashboard','/sales','/products','/anomalies','/predictions','/recommendations','/reviews','/security','/backup','/reports','/dashboard/storefront','/profile'];
const FULL_DASHBOARD = {
  widgets: [...AVAILABLE_WIDGETS],
  pages: [...AVAILABLE_PAGES],
  kpis: ['totalRevenue','totalOrders','customerSatisfaction','stockAlerts'],
};

const resolveOrganizationId = (req) => {
  const p = req.params && req.params.id ? parseInt(req.params.id) : NaN;
  const b = req.body && req.body.organizationId ? parseInt(req.body.organizationId) : NaN;
  const q = req.query && req.query.organizationId ? parseInt(req.query.organizationId) : NaN;
  if (req.organizationId) return parseInt(req.organizationId);
  if (Number.isInteger(p)) return p;
  if (Number.isInteger(b)) return b;
  if (Number.isInteger(q)) return q;
  return null;
};

const getMemberContext = async (userId, organizationId) => {
  const { query } = require('../db/pool');
  try {
    const r = await query(
      `SELECT om.id, om.role, om.status, om.role_id, om.dashboard_config AS md,
              om.permissions AS legacy_overrides,
              ro.slug AS cslug, ro.name AS cname,
              ro.permissions AS rperms, ro.dashboard_config AS rdash
       FROM organization_members om
       LEFT JOIN organization_roles ro ON ro.id = om.role_id AND ro.organization_id = om.organization_id
       WHERE om.user_id = $1 AND om.organization_id = $2`,
      [userId, organizationId]
    );
    if (r.rowCount === 0) return null;
    const m = r.rows[0];
    const isOwner = m.role === 'owner';
    const permissions = m.rperms || null;
    const roleDashboard = m.rdash || null;
    const memberDashboard = m.md || null;
    const dashboard =
      memberDashboard ||
      roleDashboard ||
      (isOwner ? FULL_DASHBOARD : null);
    return {
      memberId: m.id,
      role: m.role,
      customSlug: m.cslug || null,
      customName: m.cname || null,
      roleId: m.role_id || null,
      status: m.status,
      isOwner,
      permissions,
      dashboard,
      roleDashboard,
      memberDashboard,
      legacyOverrides: m.legacy_overrides || {},
    };
  } catch (_e) {
    // Fallback when organization_roles / new columns do not exist yet (pre-013 DBs).
    try {
      const fb = await query(
        `SELECT id, role, status FROM organization_members WHERE user_id = $1 AND organization_id = $2`,
        [userId, organizationId]
      );
      if (fb.rowCount === 0) return null;
      const m = fb.rows[0];
      const isOwner = m.role === 'owner';
      return {
        memberId: m.id,
        role: m.role,
        customSlug: null,
        customName: null,
        roleId: null,
        status: m.status,
        isOwner,
        permissions: null,
        dashboard: isOwner ? FULL_DASHBOARD : null,
        roleDashboard: null,
        memberDashboard: null,
        legacyOverrides: {},
      };
    } catch (_e2) {
      return null;
    }
  }
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
 * Expand the built-in matrix for one or more legacy role slugs into an explicit
 * `{ resource: { action: boolean } }` map. Single source of truth used both for
 * enforcement here and for the owner-facing role editor (`lib/roles.js`).
 */
const permissionsForLegacyRole = (roleSlug) => {
  const wanted = (Array.isArray(roleSlug) ? roleSlug : [roleSlug]).map((s) =>
    String(s || '').toLowerCase()
  );
  const out = {};
  for (const resource of Object.keys(PERMISSIONS)) {
    out[resource] = {};
    for (const action of Object.keys(PERMISSIONS[resource])) {
      out[resource][action] = PERMISSIONS[resource][action].some((s) =>
        wanted.includes(String(s).toLowerCase())
      );
    }
  }
  return out;
};

const checkCustom = (perms, resource, action) => {
  if (!perms || typeof perms !== 'object') return null;
  const res = perms[resource];
  if (!res || typeof res !== 'object') return null;
  if (Object.keys(res).length === 0) return null;
  return res[action] === true;
};

/**
 * Membership statuses that must never reach organization data.
 * Mirrored in `lib/orgs.js` — keep the two lists in sync.
 */
const MEMBER_STATUSES_BLOCKED = ['removed', 'inactive', 'suspended'];

/** A membership with no status at all is treated as active (legacy rows). */
const isUsableMemberStatus = (status) =>
  !status || !MEMBER_STATUSES_BLOCKED.includes(String(status).toLowerCase());

/** 403 payload helper shared by every membership-aware middleware. */
const rejectBlockedMember = (res, ctx) =>
  res.status(403).json({
    error: ctx && ctx.status
      ? `Your membership in this organization is ${ctx.status}.`
      : 'Not a member of this organization',
  });

const requirePermission = (resource, action) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const organizationId = resolveOrganizationId(req);
      if (!user) return res.status(401).json({ error: 'Authentication required' });
      if (!organizationId) return res.status(400).json({ error: 'Organization context required' });
      const ctx = await getMemberContext(user.id, organizationId);
      if (!ctx) return res.status(403).json({ error: 'Not a member of this organization' });
      if (ctx.status !== 'active') return res.status(403).json({ error: 'Organization membership is not active' });

      /**
       * Publish the *verified* organization on the request so every downstream
       * handler can use `req.organizationId` for its SQL filters without ever
       * re-deriving (or trusting) the client value.
       */
      const grant = () => {
        req.organizationId = organizationId;
        req.organizationContextVerified = true;
        req.userRole = ctx.role;
        req.memberId = ctx.memberId;
        req.memberContext = ctx;
        return next();
      };

      if (ctx.isOwner) return grant();

      if (ctx.permissions) {
        const decision = checkCustom(ctx.permissions, resource, action);
        if (decision === true) return grant();
        if (decision === false) {
          return res.status(403).json({ error: `Permission denied: ${resource}.${action} not granted to your role` });
        }
        // decision === null -> the owner-authored matrix has no opinion
        // (untouched system role). Fall through to the built-in matrix below.
      }
      if (!hasPermission(ctx.role, resource, action)) {
        return res.status(403).json({
          error: `Permission denied: ${resource}.${action} requires one of: ${PERMISSIONS[resource][action].join(', ')}`
        });
      }
      return grant();
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
    const organizationId = resolveOrganizationId(req);
    if (!user) return res.status(401).json({ error: 'Authentication required' });
    if (!organizationId) return res.status(400).json({ error: 'Organization context required' });
    const ctx = await getMemberContext(user.id, organizationId);
    if (!ctx) return res.status(403).json({ error: 'Not a member of this organization' });
    if (!isUsableMemberStatus(ctx.status) && ctx.status !== 'pending') {
      return rejectBlockedMember(res, ctx);
    }
    if (ctx.isOwner || ctx.role === 'admin') {
      req.userRole = ctx.role; req.memberId = ctx.memberId; req.memberContext = ctx;
      return next();
    }
    // A custom role may be trusted with team management ONLY if the owner actually
    // granted the write actions. `team.view` is deliberately NOT enough: seeing the
    // member list is not the same as being allowed to change roles or remove people.
    const matrix = ctx.permissions && Object.keys(ctx.permissions).length
      ? ctx.permissions
      : null;
    const custom = matrix || permissionsForLegacyRole(ctx.role);
    if (custom.team && (custom.team.update_roles === true || custom.team.invite === true || custom.team.remove === true)) {
      req.userRole = ctx.role; req.memberId = ctx.memberId; req.memberContext = ctx;
      return next();
    }
    return res.status(403).json({ error: 'Owner or admin access required' });
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
    const organizationId = resolveOrganizationId(req);
    if (!user) return res.status(401).json({ error: 'Authentication required' });
    
    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' });
    }
    
    const { query } = require('../db/pool');
    const memberResult = await query(
      `SELECT role, status FROM organization_members 
       WHERE user_id = $1 AND organization_id = $2`,
      [user.id, organizationId]
    );
    
    if (memberResult.rowCount === 0) {
      return res.status(403).json({ error: 'Not a member of this organization' });
    }
    
    const { role, status } = memberResult.rows[0];

    if (!isUsableMemberStatus(status)) {
      return rejectBlockedMember(res, { status });
    }
    
    if (role !== 'owner') {
      return res.status(403).json({ error: 'Owner access required' });
    }
    
    req.userRole = role;
    req.organizationContextVerified = true;
    next();
  } catch (error) {
    console.error('Owner check error:', error);
    return res.status(500).json({ error: 'Error checking permissions' });
  }
};

module.exports = {
  PERMISSIONS,
  AVAILABLE_PERMISSIONS,
  AVAILABLE_WIDGETS,
  AVAILABLE_PAGES,
  FULL_DASHBOARD,
  MEMBER_STATUSES_BLOCKED,
  isUsableMemberStatus,
  hasPermission,
  permissionsForLegacyRole,
  checkCustom,
  requirePermission,
  requireOwnerOrAdmin,
  requireOwner,
  getMemberContext,
  resolveOrganizationId,
};
