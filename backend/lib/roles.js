/**
 * Organization roles & dashboard visibility engine.
 *
 * Every organization owns a set of roles in `organization_roles`:
 *   - the six *system* roles (owner, admin, manager, employee, accountant, viewer)
 *     are seeded automatically with `permissions = '{}'` / `dashboard_config = '{}'`.
 *     An empty object means "no owner opinion yet" -> the built-in matrix below is
 *     applied. As soon as the owner edits the role, the JSONB becomes an explicit
 *     matrix and is honoured verbatim.
 *   - custom roles created by the owner always carry an explicit matrix.
 *
 * The same "empty means inherit" rule applies to the per-member dashboard override
 * stored on `organization_members.dashboard_config`.
 *
 * An owner can never be restricted: resolveAccess() always returns FULL access for
 * the `owner` slug, which is what makes "the owner keeps full control" true.
 */

const { query } = require("../db/pool");
const {
  AVAILABLE_PERMISSIONS,
  AVAILABLE_WIDGETS,
  AVAILABLE_PAGES,
  permissionsForLegacyRole,
} = require("../middleware/permissions");

/* ------------------------------------------------------------------ *
 * Catalogs
 * ------------------------------------------------------------------ */

const ALL_KPIS = [
  "totalRevenue",
  "totalOrders",
  "customerSatisfaction",
  "stockAlerts",
];

/* Which permission unlocks which piece of the UI. */
const WIDGET_SOURCES = {
  revenue: ["sales", "view"],
  orders: ["sales", "view"],
  satisfaction: ["products", "view"],
  stock_alerts: ["inventory", "view"],
  monthly_sales: ["analytics", "view"],
  categories: ["products", "view"],
  top_products: ["analytics", "view"],
  anomalies: ["analytics", "view"],
  recommendations: ["analytics", "view"],
};

const PAGE_SOURCES = {
  /*
   * The dashboard is the landing page of the app, so it is never hidden: what the
   * member may actually read inside it is decided by the widget/KPI catalogs.
   * Hiding the page itself would leave a role without `analytics.view` (an
   * Employee, for instance) with nowhere to land after signing in.
   */
  "/dashboard": null,
  "/sales": ["sales", "view"],
  "/products": ["products", "view"],
  "/anomalies": ["analytics", "view"],
  "/predictions": ["analytics", "view"],
  "/recommendations": ["analytics", "view"],
  "/reviews": ["products", "view"],
  "/security": ["security", "view"],
  "/backup": ["backup", "view"],
  "/reports": ["reports", "view"],
  "/dashboard/storefront": ["products", "view"],
  "/profile": null, // always available to every authenticated member
};

const KPI_SOURCES = {
  totalRevenue: ["analytics", "view"],
  totalOrders: ["analytics", "view"],
  customerSatisfaction: ["products", "view"],
  stockAlerts: ["inventory", "view"],
};

const FULL_DASHBOARD = {
  widgets: [...AVAILABLE_WIDGETS],
  pages: [...AVAILABLE_PAGES],
  kpis: [...ALL_KPIS],
};

const SYSTEM_ROLE_DEFS = [
  {
    slug: "owner",
    name: "Owner",
    description:
      "Unrestricted control of the organization: data, people, roles and dashboard visibility. Cannot be restricted.",
  },
  {
    slug: "admin",
    name: "Admin",
    description:
      "Runs the organization end to end — data, team, security and settings.",
  },
  {
    slug: "manager",
    name: "Manager",
    description:
      "Day-to-day operations: products, sales, analytics and team visibility.",
  },
  {
    slug: "employee",
    name: "Employee",
    description:
      "Records sales and consults products and stock. No analytics or settings.",
  },
  {
    slug: "accountant",
    name: "Accountant",
    description:
      "Read access to sales, products, analytics and reports for bookkeeping.",
  },
  {
    slug: "viewer",
    name: "Viewer",
    description: "Read-only access to the business data the owner shares.",
  },
];

const SYSTEM_ROLE_SLUGS = SYSTEM_ROLE_DEFS.map((r) => r.slug);

/** Legacy slug list kept because `organization_members.role` is still a text slug. */
const isSystemRoleSlug = (slug) =>
  SYSTEM_ROLE_SLUGS.includes(String(slug || ""));

/* ------------------------------------------------------------------ *
 * Matrix helpers
 * ------------------------------------------------------------------ */

const hasKeys = (value) =>
  Boolean(value) &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.keys(value).length > 0;

/** Expand the built-in PERMISSIONS matrix for one or more legacy slugs. */
const buildMatrix = permissionsForLegacyRole;

/** Explicit permissions for a legacy slug (unknown slug -> everything denied). */
const permissionsForRole = (roleSlug) => permissionsForLegacyRole(roleSlug);

/** Force the shape of an owner-supplied permission payload. */
const normalizePermissions = (input) => {
  const safe = input && typeof input === "object" ? input : {};
  const out = {};
  for (const resource of Object.keys(AVAILABLE_PERMISSIONS)) {
    out[resource] = {};
    for (const action of AVAILABLE_PERMISSIONS[resource]) {
      out[resource][action] = safe?.[resource]?.[action] === true;
    }
  }
  return out;
};

/* ------------------------------------------------------------------ *
 * Dashboard visibility
 * ------------------------------------------------------------------ */

/** Derive the dashboard a role may see from its effective permissions. */
const dashboardForPermissions = (permissions) => {
  const can = (resource, action) =>
    Boolean(
      permissions && permissions[resource] && permissions[resource][action],
    );

  const keep = (catalog, sources) =>
    catalog.filter((key) => {
      const src = sources[key];
      return !src || can(src[0], src[1]);
    });

  return {
    widgets: keep(AVAILABLE_WIDGETS, WIDGET_SOURCES),
    pages: keep(AVAILABLE_PAGES, PAGE_SOURCES),
    kpis: keep(ALL_KPIS, KPI_SOURCES),
  };
};

/**
 * Merge a role dashboard with an optional per-member override.
 * Any key the override does not mention is inherited from the role, which keeps
 * "the owner hides two pages for one person" a one-key operation.
 */
const resolveDashboard = (roleDashboard, memberOverride) => {
  const base = hasKeys(roleDashboard) ? roleDashboard : null;
  const src = hasKeys(memberOverride) ? memberOverride : null;

  const pick = (key, allowed, fallback) => {
    const fromOverride = src ? src[key] : undefined;
    if (Array.isArray(fromOverride)) {
      return fromOverride.filter((v) => allowed.includes(v));
    }
    const fromRole = base ? base[key] : undefined;
    if (Array.isArray(fromRole)) {
      return fromRole.filter((v) => allowed.includes(v));
    }
    return fallback ? [...fallback] : [...allowed];
  };

  return {
    widgets: pick("widgets", AVAILABLE_WIDGETS, FULL_DASHBOARD.widgets),
    pages: pick("pages", AVAILABLE_PAGES, FULL_DASHBOARD.pages),
    kpis: pick("kpis", ALL_KPIS, FULL_DASHBOARD.kpis),
  };
};

/** Sanitise a per-member override: only the keys the owner actually sent are kept. */
const normalizeDashboardOverride = (input) => {
  if (!hasKeys(input)) return null;
  const pick = (key, allowed) =>
    Array.isArray(input[key])
      ? input[key].filter((v) => allowed.includes(v))
      : undefined;
  const out = {};
  const widgets = pick("widgets", AVAILABLE_WIDGETS);
  const pages = pick("pages", AVAILABLE_PAGES);
  const kpis = pick("kpis", ALL_KPIS);
  if (widgets) out.widgets = widgets;
  if (pages) out.pages = pages;
  if (kpis) out.kpis = kpis;
  return hasKeys(out) ? out : null;
};

/**
 * Turn a member context into the authoritative access answer.
 * Owner always wins — no role edit and no override can restrict an owner.
 */
const resolveAccess = (ctx) => {
  if (!ctx) return null;

  if (ctx.isOwner === true || ctx.role === "owner") {
    return {
      role: "owner",
      roleLabel: "Owner",
      isOwner: true,
      customRole: null,
      permissions: "all",
      effectivePermissions: permissionsForRole("owner"),
      dashboard: { ...FULL_DASHBOARD },
    };
  }

  const explicit = hasKeys(ctx.permissions)
    ? normalizePermissions(ctx.permissions)
    : null;
  const effectivePermissions = explicit || permissionsForRole(ctx.role);
  const storedRoleDashboard = hasKeys(ctx.roleDashboard)
    ? ctx.roleDashboard
    : null;
  const roleBase =
    storedRoleDashboard || dashboardForPermissions(effectivePermissions);

  return {
    role: ctx.role,
    roleLabel: ctx.customName || ctx.role,
    isOwner: false,
    customRole: ctx.customSlug
      ? {
          id: ctx.roleId,
          slug: ctx.customSlug,
          name: ctx.customName || ctx.customSlug,
        }
      : null,
    permissions: effectivePermissions,
    effectivePermissions,
    dashboard: resolveDashboard(roleBase, ctx.memberDashboard),
  };
};

/* ------------------------------------------------------------------ *
 * Seeding & linking
 * ------------------------------------------------------------------ */

/**
 * Make sure the six system roles exist for an organization.
 *
 * Runs with `ON CONFLICT DO NOTHING` semantics for the payload: an existing row
 * (possibly customised by the owner) keeps its name/permissions/dashboard. Only
 * `is_system` is re-asserted so nobody can turn a system role into a deletable one.
 */
const ensureSystemRoles = async (organizationId) => {
  const orgId = Number.parseInt(organizationId, 10);
  if (!Number.isInteger(orgId)) return {};

  await query(
    `INSERT INTO organization_roles
       (organization_id, name, slug, description, permissions, dashboard_config, is_system)
     SELECT $1, d.name, d.slug, d.description, '{}'::jsonb, '{}'::jsonb, TRUE
     FROM jsonb_to_recordset($2::jsonb)
       AS d(slug TEXT, name TEXT, description TEXT)
     ON CONFLICT (organization_id, slug) DO UPDATE
       SET is_system = TRUE,
           updated_at = NOW()`,
    [
      orgId,
      JSON.stringify(
        SYSTEM_ROLE_DEFS.map((d) => ({
          slug: d.slug,
          name: d.name,
          description: d.description,
        })),
      ),
    ],
  );

  return linkMembersToRoles(orgId);
};

/** Point `organization_members.role_id` at the matching role row (idempotent). */
const linkMembersToRoles = async (organizationId) => {
  const orgId = Number.parseInt(organizationId, 10);
  if (!Number.isInteger(orgId)) return {};

  await query(
    `UPDATE organization_members om
        SET role_id = r.id
       FROM organization_roles r
      WHERE r.organization_id = om.organization_id
        AND r.slug = om.role
        AND om.role_id IS NULL`,
    [],
  );

  const rows = await query(
    `SELECT id, slug FROM organization_roles WHERE organization_id = $1`,
    [orgId],
  );
  return Object.fromEntries(rows.rows.map((r) => [r.slug, r.id]));
};

/**
 * Full onboarding for one organization: seed system roles + link members.
 * Never throws — a pre-013 database must not take the API down.
 */
const ensureOrganizationRoles = async (organizationId) => {
  try {
    return await ensureSystemRoles(organizationId);
  } catch (error) {
    if (process.env.NODE_ENV !== "test") {
      console.warn(
        "ensureOrganizationRoles skipped:",
        error.message,
      );
    }
    return {};
  }
};

/** Catalog the owner UI needs to render role editors. */
const getRoleCatalog = () => ({
  permissions: AVAILABLE_PERMISSIONS,
  widgets: AVAILABLE_WIDGETS,
  pages: AVAILABLE_PAGES,
  kpis: ALL_KPIS,
  systemRoles: SYSTEM_ROLE_DEFS,
});

module.exports = {
  ALL_KPIS,
  FULL_DASHBOARD,
  SYSTEM_ROLE_DEFS,
  SYSTEM_ROLE_SLUGS,
  isSystemRoleSlug,
  hasKeys,
  buildMatrix,
  permissionsForRole,
  normalizePermissions,
  dashboardForPermissions,
  resolveDashboard,
  normalizeDashboardOverride,
  resolveAccess,
  ensureSystemRoles,
  linkMembersToRoles,
  ensureOrganizationRoles,
  getRoleCatalog,
};

