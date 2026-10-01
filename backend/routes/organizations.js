const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const crypto = require("crypto");
const { query } = require("../db/pool");
const auth = require("../middleware/auth");
const { requirePermission, requireOwnerOrAdmin, requireOwner } = require("../middleware/permissions");
const { requireParamOrgMatch } = require("../middleware/orgContext");
const {
  resolveAccess,
  ensureOrganizationRoles,
  normalizeDashboardOverride,
} = require("../lib/roles");

// Helper to generate unique slug
const generateSlug = (name) => {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
  
  let slug = base;
  let counter = 1;
  
  return slug; // Will check uniqueness in DB
};

/**
 * GET /api/organizations
 * Get all organizations for the current user
 */
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await query(
      `SELECT 
        o.id,
        o.name,
        o.slug,
        o.industry,
        o.size,
        o.logo_url,
        o.subscription_plan,
        o.subscription_status,
        o.created_at,
        om.role as user_role,
        om.status as membership_status,
        (SELECT COUNT(*) FROM organization_members WHERE organization_id = o.id) as member_count
       FROM organizations o
       JOIN organization_members om ON o.id = om.organization_id
       WHERE om.user_id = $1
       ORDER BY o.created_at DESC`,
      [userId]
    );
    
    return res.json({
      organizations: result.rows,
    });
  } catch (err) {
    console.error("Error fetching organizations:", err);
    return res.status(500).json({ error: "Error fetching organizations" });
  }
});

/**
 * GET /api/organizations/:id
 * Get organization details
 */
router.get("/:id", auth, requireParamOrgMatch, async (req, res) => {
  try {
    const organizationId = parseInt(req.params.id);
    const userId = req.user.id;
    
    // Check if user is member
    const memberCheck = await query(
      `SELECT role FROM organization_members 
       WHERE user_id = $1 AND organization_id = $2`,
      [userId, organizationId]
    );
    
    if (memberCheck.rowCount === 0) {
      return res.status(403).json({ error: "Not a member of this organization" });
    }
    
    const result = await query(
      `SELECT 
        o.*,
        om.role as user_role,
        om.status as membership_status
       FROM organizations o
       JOIN organization_members om ON o.id = om.organization_id
       WHERE o.id = $1 AND om.user_id = $2`,
      [organizationId, userId]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Organization not found" });
    }
    
    return res.json({
      organization: result.rows[0],
    });
  } catch (err) {
    console.error("Error fetching organization:", err);
    return res.status(500).json({ error: "Error fetching organization" });
  }
});

/**
 * POST /api/organizations
 * Create a new organization
 */
router.post(
  "/",
  auth,
  [
    body("name").trim().isLength({ min: 2, max: 200 }).withMessage("Name must be 2-200 characters"),
    body("industry").optional().isLength({ max: 100 }),
    body("size").optional().isIn(['1-10', '11-50', '51-200', '201-500', '500+']),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { name, industry, size } = req.body;
      const userId = req.user.id;
      
      // Generate unique slug
      let slug = generateSlug(name);
      let slugExists = true;
      let counter = 1;
      
      while (slugExists) {
        const existing = await query(
          "SELECT id FROM organizations WHERE slug = $1",
          [slug]
        );
        
        if (existing.rowCount === 0) {
          slugExists = false;
        } else {
          slug = `${generateSlug(name)}-${counter}`;
          counter++;
        }
      }
      
      // Create organization
      const orgResult = await query(
        `INSERT INTO organizations (name, slug, industry, size, subscription_plan)
         VALUES ($1, $2, $3, $4, 'free')
         RETURNING *`,
        [name, slug, industry || null, size || null]
      );
      
      const organization = orgResult.rows[0];
      
      // Add user as owner
      await query(
        `INSERT INTO organization_members (organization_id, user_id, role, status, joined_at)
         VALUES ($1, $2, 'owner', 'active', NOW())`,
        [organization.id, userId]
      );

      // Seed the six system roles so the owner can immediately restrict/allow
      // permissions and dashboard visibility for every future member.
      await ensureOrganizationRoles(organization.id);
      
      // Log audit
      await query(
        `INSERT INTO audit_logs (organization_id, user_id, action, entity_type, entity_id, new_values)
         VALUES ($1, $2, 'create', 'organization', $3, $4)`,
        [organization.id, userId, organization.id, JSON.stringify({ name, slug })]
      );
      
      return res.status(201).json({
        message: "Organization created successfully",
        organization: {
          ...organization,
          user_role: 'owner',
          membership_status: 'active',
        },
      });
    } catch (err) {
      console.error("Error creating organization:", err);
      return res.status(500).json({ error: "Error creating organization" });
    }
  }
);

/**
 * PUT /api/organizations/:id
 * Update organization details
 */
router.put(
  "/:id",
  auth,
  requireParamOrgMatch,
  requireOwnerOrAdmin,
  [
    body("name").optional().trim().isLength({ min: 2, max: 200 }),
    body("industry").optional().isLength({ max: 100 }),
    body("size").optional().isIn(['1-10', '11-50', '51-200', '201-500', '500+']),
    body("logo_url").optional().isURL(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const organizationId = parseInt(req.params.id);
      const userId = req.user.id;
      const { name, industry, size, logo_url } = req.body;
      
      // Get current values for audit
      const current = await query(
        "SELECT * FROM organizations WHERE id = $1",
        [organizationId]
      );
      
      if (current.rowCount === 0) {
        return res.status(404).json({ error: "Organization not found" });
      }
      
      const updates = [];
      const values = [];
      let paramCount = 1;
      
      if (name !== undefined) {
        updates.push(`name = $${paramCount}`);
        values.push(name);
        paramCount++;
      }
      if (industry !== undefined) {
        updates.push(`industry = $${paramCount}`);
        values.push(industry);
        paramCount++;
      }
      if (size !== undefined) {
        updates.push(`size = $${paramCount}`);
        values.push(size);
        paramCount++;
      }
      if (logo_url !== undefined) {
        updates.push(`logo_url = $${paramCount}`);
        values.push(logo_url);
        paramCount++;
      }
      
      if (updates.length === 0) {
        return res.status(400).json({ error: "No fields to update" });
      }
      
      values.push(organizationId);
      
      const result = await query(
        `UPDATE organizations 
         SET ${updates.join(', ')}, updated_at = NOW()
         WHERE id = $${paramCount}
         RETURNING *`,
        values
      );
      
      // Log audit
      await query(
        `INSERT INTO audit_logs (organization_id, user_id, action, entity_type, entity_id, old_values, new_values)
         VALUES ($1, $2, 'update', 'organization', $3, $4, $5)`,
        [organizationId, userId, organizationId, JSON.stringify(current.rows[0]), JSON.stringify(result.rows[0])]
      );
      
      return res.json({
        message: "Organization updated successfully",
        organization: result.rows[0],
      });
    } catch (err) {
      console.error("Error updating organization:", err);
      return res.status(500).json({ error: "Error updating organization" });
    }
  }
);

/**
 * DELETE /api/organizations/:id
 * Delete organization (owner only)
 */
router.delete("/:id", auth, requireParamOrgMatch, requireOwner, async (req, res) => {
  try {
    const organizationId = parseInt(req.params.id);
    const userId = req.user.id;
    
    // Get organization for audit
    const current = await query(
      "SELECT * FROM organizations WHERE id = $1",
      [organizationId]
    );
    
    if (current.rowCount === 0) {
      return res.status(404).json({ error: "Organization not found" });
    }
    
    // Delete organization (cascade will handle related records)
    await query("DELETE FROM organizations WHERE id = $1", [organizationId]);
    
    // Log audit
    await query(
      `INSERT INTO audit_logs (organization_id, user_id, action, entity_type, entity_id, old_values)
       VALUES ($1, $2, 'delete', 'organization', $3, $4)`,
      [organizationId, userId, organizationId, JSON.stringify(current.rows[0])]
    );
    
    return res.json({
      message: "Organization deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting organization:", err);
    return res.status(500).json({ error: "Error deleting organization" });
  }
});

/**
 * GET /api/organizations/:id/members
 * Get organization members
 */
router.get("/:id/members", auth, requireParamOrgMatch, requirePermission('team', 'view'), async (req, res) => {
  try {
    const organizationId = parseInt(req.params.id);
    const hasRoles = await query(`SELECT to_regclass('public.organization_roles') AS r`);
    const hasRoleCols = await query(
      `SELECT COUNT(*)::int AS n FROM information_schema.columns WHERE table_name='organization_members' AND column_name IN ('role_id','dashboard_config')`
    );
    const rich = hasRoles.rows[0] && hasRoles.rows[0].r && Number(hasRoleCols.rows[0].n) === 2;
    const result = rich
      ? await query(
        `SELECT
          om.id as member_id,
          om.role,
          om.status,
          om.joined_at,
          om.invited_at,
          om.role_id,
          om.dashboard_config,
          ro.name AS custom_role_name,
          ro.slug AS custom_role_slug,
          ro.permissions AS custom_permissions,
          ro.dashboard_config AS custom_dashboard,
          u.id as user_id,
          u.name,
          u.email,
          u.avatar_url,
          inviter.name as invited_by_name
         FROM organization_members om
         JOIN users u ON om.user_id = u.id
         LEFT JOIN users inviter ON om.invited_by = inviter.id
         LEFT JOIN organization_roles ro ON ro.id = om.role_id
         WHERE om.organization_id = $1
         ORDER BY om.created_at DESC`,
        [organizationId]
      )
      : await query(
        `SELECT
          om.id as member_id,
          om.role,
          om.status,
          om.joined_at,
          om.invited_at,
          u.id as user_id,
          u.name,
          u.email,
          u.avatar_url,
          inviter.name as invited_by_name
         FROM organization_members om
         JOIN users u ON om.user_id = u.id
         LEFT JOIN users inviter ON om.invited_by = inviter.id
         WHERE om.organization_id = $1
         ORDER BY om.created_at DESC`,
        [organizationId]
      );
    return res.json({ members: result.rows });
  } catch (err) {
    console.error("Error fetching members:", err);
    return res.status(500).json({ error: "Error fetching members" });
  }
});

/**
 * PUT /api/organizations/:id/members/:memberId
 * Update member role (legacy slug) and/or custom role + per-user dashboard.
 * Owner decides everything here.
 */
router.put(
  "/:id/members/:memberId",
  auth,
  requireParamOrgMatch,
  requireOwnerOrAdmin,
  [
    body("role").optional().isString(),
    body("roleId").optional().isInt(),
    body("dashboardConfig").optional().isObject(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const organizationId = parseInt(req.params.id);
      const memberId = parseInt(req.params.memberId);
      const userId = req.user.id;
      const { role, roleId, dashboardConfig, dashboard_config } = req.body;
      const dashboardInput =
        dashboardConfig !== undefined ? dashboardConfig : dashboard_config;
      // `undefined` = leave untouched, `null` = clear the override,
      // an object = keep only the keys/values the owner may actually set.
      const dashOverride =
        dashboardInput === undefined
          ? undefined
          : dashboardInput === null
          ? null
          : normalizeDashboardOverride(dashboardInput);

      // Only owner can touch the owner account or grant owner
      const current = await query(
        `SELECT om.*, u.name as user_name, u.email
         FROM organization_members om
         JOIN users u ON om.user_id = u.id
         WHERE om.id = $1 AND om.organization_id = $2`,
        [memberId, organizationId]
      );
      if (current.rowCount === 0) return res.status(404).json({ error: "Member not found" });
      if (current.rows[0].role === 'owner' && req.userRole !== 'owner') {
        return res.status(403).json({ error: "Only owner can change owner role" });
      }
      if (current.rows[0].user_id === userId) {
        return res.status(400).json({ error: "Cannot change your own role" });
      }
      // Only owner may grant owner slug
      if (role === 'owner' && req.userRole !== 'owner') {
        return res.status(403).json({ error: "Only owner can grant owner role" });
      }
      // Role slug may be legacy or any custom slug owned by this org
      let nextRole = current.rows[0].role;
      if (role !== undefined && role !== null && role !== '') {
        const slug = String(role).trim().toLowerCase();
        const known = ['owner','admin','manager','employee','accountant','viewer'];
        if (!known.includes(slug)) {
          const custom = await query(
            `SELECT id FROM organization_roles WHERE organization_id = $1 AND slug = $2`,
            [organizationId, slug]
          );
          if (custom.rowCount === 0) return res.status(400).json({ error: "Unknown role for this organization" });
        }
        nextRole = slug;
      }
      // Custom role link (owner-named roles)
      let nextRoleId = current.rows[0].role_id ?? null;
      if (roleId !== undefined) {
        if (roleId === null) nextRoleId = null;
        else {
          const rr = await query(
            `SELECT id, slug FROM organization_roles WHERE id = $1 AND organization_id = $2`,
            [parseInt(roleId), organizationId]
          );
          if (rr.rowCount === 0) return res.status(400).json({ error: "Role not found in this organization" });
          nextRoleId = rr.rows[0].id;
          // Keep text slug in sync when a custom role is chosen
          if (role === undefined) nextRole = rr.rows[0].slug;
        }
      }
      const hasDashCol = await query(
        `SELECT COUNT(*)::int AS n FROM information_schema.columns WHERE table_name='organization_members' AND column_name='dashboard_config'`
      );
      const canDash = Number(hasDashCol.rows[0].n) === 1;
      if (dashOverride !== undefined && !canDash) {
        return res.status(400).json({ error: "Dashboard overrides not enabled yet (run migrations)" });
      }
      if (canDash) {
        await query(
          `UPDATE organization_members
           SET role = $1, role_id = $2, dashboard_config = $3, updated_at = NOW()
           WHERE id = $4`,
          [nextRole, nextRoleId, dashOverride === undefined ? current.rows[0].dashboard_config ?? null : (dashOverride === null ? null : JSON.stringify(dashOverride)), memberId]
        );
      } else {
        await query(
          `UPDATE organization_members SET role = $1, updated_at = NOW() WHERE id = $2`,
          [nextRole, memberId]
        );
      }
      await query(
        `INSERT INTO audit_logs (organization_id, user_id, action, entity_type, entity_id, old_values, new_values)
         VALUES ($1, $2, 'update', 'member', $3, $4, $5)`,
        [organizationId, userId, memberId, JSON.stringify({ role: current.rows[0].role, role_id: current.rows[0].role_id ?? null }), JSON.stringify({ role: nextRole, role_id: nextRoleId, dashboard_config: dashOverride === undefined ? undefined : dashOverride })]
      );
      return res.json({ message: "Member role updated successfully" });
    } catch (err) {
      console.error("Error updating member role:", err);
      return res.status(500).json({ error: "Error updating member role" });
    }
  }
);

/**
 * DELETE /api/organizations/:id/members/:memberId
 * Remove member from organization
 */
router.delete("/:id/members/:memberId", auth, requireParamOrgMatch, requireOwnerOrAdmin, async (req, res) => {
  try {
    const organizationId = parseInt(req.params.id);
    const memberId = parseInt(req.params.memberId);
    const userId = req.user.id;
    
    // Get current member
    const current = await query(
      `SELECT om.*, u.name as user_name, u.email 
         FROM organization_members om
         JOIN users u ON om.user_id = u.id
         WHERE om.id = $1 AND om.organization_id = $2`,
      [memberId, organizationId]
    );
    
    if (current.rowCount === 0) {
      return res.status(404).json({ error: "Member not found" });
    }
    
    // Cannot remove owner
    if (current.rows[0].role === 'owner') {
      return res.status(400).json({ error: "Cannot remove owner from organization" });
    }
    
    // Cannot remove yourself
    if (current.rows[0].user_id === userId) {
      return res.status(400).json({ error: "Cannot remove yourself. Use leave endpoint instead." });
    }
    
    // Remove member
    await query(
      `UPDATE organization_members 
       SET status = 'removed', updated_at = NOW()
       WHERE id = $1`,
      [memberId]
    );
    
    // Log audit
    await query(
      `INSERT INTO audit_logs (organization_id, user_id, action, entity_type, entity_id, old_values)
       VALUES ($1, $2, 'remove', 'member', $3, $4)`,
      [organizationId, userId, memberId, JSON.stringify(current.rows[0])]
    );
    
    return res.json({
      message: "Member removed successfully",
    });
  } catch (err) {
    console.error("Error removing member:", err);
    return res.status(500).json({ error: "Error removing member" });
  }
});

/**
 * POST /api/organizations/:id/leave
 * Leave organization (for non-owners)
 */
router.post("/:id/leave", auth, requireParamOrgMatch, async (req, res) => {
  try {
    const organizationId = parseInt(req.params.id);
    const userId = req.user.id;
    
    // Get member
    const member = await query(
      `SELECT role FROM organization_members 
       WHERE user_id = $1 AND organization_id = $2`,
      [userId, organizationId]
    );
    
    if (member.rowCount === 0) {
      return res.status(404).json({ error: "Not a member of this organization" });
    }
    
    // Owner cannot leave
    if (member.rows[0].role === 'owner') {
      return res.status(400).json({ error: "Owner cannot leave organization. Transfer ownership first." });
    }
    
    // Update status
    await query(
      `UPDATE organization_members 
       SET status = 'inactive', updated_at = NOW()
       WHERE user_id = $1 AND organization_id = $2`,
      [userId, organizationId]
    );
    
    // Log audit
    await query(
      `INSERT INTO audit_logs (organization_id, user_id, action, entity_type, entity_id)
       VALUES ($1, $2, 'leave', 'organization', $3)`,
      [organizationId, userId, organizationId]
    );
    
    return res.json({
      message: "Left organization successfully",
    });
  } catch (err) {
    console.error("Error leaving organization:", err);
    return res.status(500).json({ error: "Error leaving organization" });
  }
});

/**
 * GET /api/organizations/:id/my-access
 * What the current user can do + what dashboard the owner gave them.
 *
 * Single source of truth for the frontend: navigation, dashboard widgets and KPI
 * cards are all derived from the same answer the API enforces. The backend
 * `requirePermission` middleware remains authoritative — this endpoint only tells
 * the UI what to render, it does not grant anything.
 */
router.get("/:id/my-access", auth, requireParamOrgMatch, async (req, res) => {
  try {
    const organizationId = parseInt(req.params.id);
    const { getMemberContext } = require("../middleware/permissions");
    const ctx = await getMemberContext(req.user.id, organizationId);
    if (!ctx) return res.status(403).json({ error: "Not a member of this organization" });

    const access = resolveAccess(ctx);

    return res.json({
      organizationId,
      role: access.role,
      roleLabel: access.roleLabel,
      customRole: access.customRole,
      isOwner: access.isOwner,
      permissions: access.permissions,
      dashboard: access.dashboard,
      // Flattened aliases kept for the navigation code and for callers that only
      // care about one dimension.
      widgets: access.dashboard.widgets,
      pages: access.dashboard.pages,
      kpis: access.dashboard.kpis,
      source: {
        roleDashboard: ctx.roleDashboard || null,
        memberOverride: ctx.memberDashboard || null,
      },
    });
  } catch (err) {
    console.error("Error fetching my-access:", err);
    return res.status(500).json({ error: "Error fetching access" });
  }
});

/**
 * GET /api/organizations/:id/members/:memberId/access
 * Owner-only: preview exactly what one member can see and do.
 * Used by the "Dashboard visibility" panel so the owner can review before saving.
 */
router.get(
  "/:id/members/:memberId/access",
  auth,
  requireParamOrgMatch,
  requireOwnerOrAdmin,
  async (req, res) => {
    try {
      const organizationId = parseInt(req.params.id);
      const memberId = parseInt(req.params.memberId);

      const member = await query(
        `SELECT om.id, om.user_id, om.role, om.role_id, om.status,
                om.dashboard_config AS member_override,
                ro.slug AS custom_slug, ro.name AS custom_name,
                ro.permissions AS role_permissions,
                ro.dashboard_config AS role_dashboard,
                u.name AS user_name, u.email
           FROM organization_members om
           JOIN users u ON u.id = om.user_id
           LEFT JOIN organization_roles ro
                  ON ro.id = om.role_id AND ro.organization_id = om.organization_id
          WHERE om.id = $1 AND om.organization_id = $2`,
        [memberId, organizationId],
      );

      if (member.rowCount === 0) {
        return res.status(404).json({ error: "Member not found" });
      }

      const row = member.rows[0];
      const access = resolveAccess({
        memberId: row.id,
        role: row.role,
        isOwner: row.role === "owner",
        roleId: row.role_id,
        customSlug: row.custom_slug,
        customName: row.custom_name,
        permissions: row.role_permissions,
        roleDashboard: row.role_dashboard,
        memberDashboard: row.member_override,
        status: row.status,
      });

      return res.json({
        member: {
          id: row.id,
          userId: row.user_id,
          name: row.user_name,
          email: row.email,
          role: row.role,
          status: row.status,
          customRole: access.customRole,
        },
        access,
      });
    } catch (err) {
      console.error("Error fetching member access:", err);
      return res.status(500).json({ error: "Error fetching member access" });
    }
  },
);

/**
 * GET /api/organizations/:id/branches
 * Get organization branches
 */
router.get("/:id/branches", auth, requireParamOrgMatch, requirePermission('branches', 'view'), async (req, res) => {
  try {
    const organizationId = parseInt(req.params.id);
    
    const result = await query(
      `SELECT * FROM branches 
       WHERE organization_id = $1 
       ORDER BY is_main DESC, name ASC`,
      [organizationId]
    );
    
    return res.json({
      branches: result.rows,
    });
  } catch (err) {
    console.error("Error fetching branches:", err);
    return res.status(500).json({ error: "Error fetching branches" });
  }
});

/**
 * POST /api/organizations/:id/branches
 * Create a new branch
 */
router.post(
  "/:id/branches",
  auth,
  requireParamOrgMatch,
  requirePermission('branches', 'create'),
  [
    body("name").trim().isLength({ min: 2, max: 200 }),
    body("address").optional().isLength({ max: 500 }),
    body("city").optional().isLength({ max: 100 }),
    body("country").optional().isLength({ max: 100 }),
    body("phone").optional().isLength({ max: 50 }),
    body("email").optional().isEmail(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const organizationId = parseInt(req.params.id);
      const userId = req.user.id;
      const { name, code, address, city, country, phone, email, is_main } = req.body;
      
      const result = await query(
        `INSERT INTO branches (organization_id, name, code, address, city, country, phone, email, is_main)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [organizationId, name, code || null, address || null, city || null, country || null, phone || null, email || null, is_main || false]
      );
      
      // Log audit
      await query(
        `INSERT INTO audit_logs (organization_id, user_id, action, entity_type, entity_id, new_values)
         VALUES ($1, $2, 'create', 'branch', $3, $4)`,
        [organizationId, userId, result.rows[0].id, JSON.stringify(result.rows[0])]
      );
      
      return res.status(201).json({
        message: "Branch created successfully",
        branch: result.rows[0],
      });
    } catch (err) {
      console.error("Error creating branch:", err);
      return res.status(500).json({ error: "Error creating branch" });
    }
  }
);

/**
 * PUT /api/organizations/:id/branches/:branchId
 * Update branch
 */
router.put(
  "/:id/branches/:branchId",
  auth,
  requireParamOrgMatch,
  requirePermission('branches', 'update'),
  [
    body("name").optional().trim().isLength({ min: 2, max: 200 }),
    body("email").optional().isEmail(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const organizationId = parseInt(req.params.id);
      const branchId = parseInt(req.params.branchId);
      const userId = req.user.id;
      const { name, code, address, city, country, phone, email, is_main, is_active } = req.body;
      
      // Get current branch
      const current = await query(
        "SELECT * FROM branches WHERE id = $1 AND organization_id = $2",
        [branchId, organizationId]
      );
      
      if (current.rowCount === 0) {
        return res.status(404).json({ error: "Branch not found" });
      }
      
      const updates = [];
      const values = [];
      let paramCount = 1;
      
      if (name !== undefined) {
        updates.push(`name = $${paramCount}`);
        values.push(name);
        paramCount++;
      }
      if (code !== undefined) {
        updates.push(`code = $${paramCount}`);
        values.push(code);
        paramCount++;
      }
      if (address !== undefined) {
        updates.push(`address = $${paramCount}`);
        values.push(address);
        paramCount++;
      }
      if (city !== undefined) {
        updates.push(`city = $${paramCount}`);
        values.push(city);
        paramCount++;
      }
      if (country !== undefined) {
        updates.push(`country = $${paramCount}`);
        values.push(country);
        paramCount++;
      }
      if (phone !== undefined) {
        updates.push(`phone = $${paramCount}`);
        values.push(phone);
        paramCount++;
      }
      if (email !== undefined) {
        updates.push(`email = $${paramCount}`);
        values.push(email);
        paramCount++;
      }
      if (is_main !== undefined) {
        updates.push(`is_main = $${paramCount}`);
        values.push(is_main);
        paramCount++;
      }
      if (is_active !== undefined) {
        updates.push(`is_active = $${paramCount}`);
        values.push(is_active);
        paramCount++;
      }
      
      if (updates.length === 0) {
        return res.status(400).json({ error: "No fields to update" });
      }
      
      values.push(branchId, organizationId);
      
      const result = await query(
        `UPDATE branches 
         SET ${updates.join(', ')}, updated_at = NOW()
         WHERE id = $${paramCount} AND organization_id = $${paramCount + 1}
         RETURNING *`,
        values
      );
      
      // Log audit
      await query(
        `INSERT INTO audit_logs (organization_id, user_id, action, entity_type, entity_id, old_values, new_values)
         VALUES ($1, $2, 'update', 'branch', $3, $4, $5)`,
        [organizationId, userId, branchId, JSON.stringify(current.rows[0]), JSON.stringify(result.rows[0])]
      );
      
      return res.json({
        message: "Branch updated successfully",
        branch: result.rows[0],
      });
    } catch (err) {
      console.error("Error updating branch:", err);
      return res.status(500).json({ error: "Error updating branch" });
    }
  }
);

/**
 * DELETE /api/organizations/:id/branches/:branchId
 * Delete branch
 */
router.delete("/:id/branches/:branchId", auth, requireParamOrgMatch, requireOwner, async (req, res) => {
  try {
    const organizationId = parseInt(req.params.id);
    const branchId = parseInt(req.params.branchId);
    const userId = req.user.id;
    
    // Get current branch
    const current = await query(
      "SELECT * FROM branches WHERE id = $1 AND organization_id = $2",
      [branchId, organizationId]
    );
    
    if (current.rowCount === 0) {
      return res.status(404).json({ error: "Branch not found" });
    }
    
    if (current.rows[0].is_main) {
      return res.status(400).json({ error: "Cannot delete main branch" });
    }
    
    // Delete branch
    await query("DELETE FROM branches WHERE id = $1", [branchId]);
    
    // Log audit
    await query(
      `INSERT INTO audit_logs (organization_id, user_id, action, entity_type, entity_id, old_values)
       VALUES ($1, $2, 'delete', 'branch', $3, $4)`,
      [organizationId, userId, branchId, JSON.stringify(current.rows[0])]
    );
    
    return res.json({
      message: "Branch deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting branch:", err);
    return res.status(500).json({ error: "Error deleting branch" });
  }
});

module.exports = router;
