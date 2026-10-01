/**
 * Organization context helpers.
 *
 * The whole application scopes business data by `organization_id`. These helpers
 * answer the two questions every request asks:
 *   1. which organization is this user acting inside?
 *   2. is that user actually allowed to act inside it?
 */

const { query } = require("../db/pool");
const { ensureOrganizationRoles } = require("./roles");
const {
  MEMBER_STATUSES_BLOCKED,
  isUsableMemberStatus,
} = require("../middleware/permissions");

/** Strictly positive integer or null. */
const parseOrgId = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const n = Number.parseInt(value, 10);
  return Number.isInteger(n) && n > 0 ? n : null;
};

/** Every organization the user belongs to, most recently joined first. */
const listUserOrganizations = async (userId) => {
  const result = await query(
    `SELECT om.id AS member_id,
            om.organization_id,
            om.role,
            om.role_id,
            om.status,
            om.joined_at,
            o.name,
            o.slug,
            o.logo_url
       FROM organization_members om
       JOIN organizations o ON o.id = om.organization_id
      WHERE om.user_id = $1
        AND COALESCE(om.status, 'active') <> 'removed'
      ORDER BY om.joined_at ASC NULLS LAST, om.id ASC`,
    [userId],
  );
  return result.rows;
};

/** The user's usable membership for one organization, or null. */
const getActiveMembership = async (userId, organizationId) => {
  const orgId = parseOrgId(organizationId);
  if (!orgId) return null;

  const result = await query(
    `SELECT om.id AS member_id, om.organization_id, om.role, om.role_id, om.status
       FROM organization_members om
      WHERE om.user_id = $1 AND om.organization_id = $2`,
    [userId, orgId],
  );

  if (result.rowCount === 0) return null;
  if (!isUsableMemberStatus(result.rows[0].status)) return null;
  return result.rows[0];
};

/**
 * Default organization when the client sent no hint:
 * a single usable membership is unambiguous; otherwise prefer the oldest one.
 */
const pickDefaultOrganizationId = async (userId) => {
  const memberships = (await listUserOrganizations(userId)).filter((m) =>
    isUsableMemberStatus(m.status),
  );
  if (memberships.length === 0) return null;
  const owner = memberships.find((m) => m.role === "owner");
  return (owner || memberships[0]).organization_id;
};

const slugifyOrganization = (name) =>
  String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);

/**
 * Self-heal a legacy account that has no organization left (or never had one).
 * Creates a personal organization, makes the user its owner and seeds the system
 * roles so permissions resolve immediately.
 */
const ensurePersonalOrganization = async (user) => {
  if (!user || !user.id) return null;

  const existing = await pickDefaultOrganizationId(user.id);
  if (existing) return existing;

  const profile = await query(
    `SELECT id, name, email, company FROM users WHERE id = $1`,
    [user.id],
  );
  if (profile.rowCount === 0) return null;

  const row = profile.rows[0];
  const baseName =
    (row.company && String(row.company).trim()) || `${row.name || "Personal"}'s business`;
  const baseSlug = slugifyOrganization(baseName) || `org-${row.id}`;

  let organizationId = null;
  for (let attempt = 0; attempt < 5 && !organizationId; attempt += 1) {
    const slug =
      attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`.slice(0, 60);
    try {
      const created = await query(
        `INSERT INTO organizations (name, slug, industry, size, subscription_plan)
         VALUES ($1, $2, 'Retail', '1-10', 'free')
         RETURNING id`,
        [String(baseName).slice(0, 200), slug],
      );
      const orgId = created.rows[0].id;

      await query(
        `INSERT INTO organization_members (organization_id, user_id, role, status, joined_at)
         VALUES ($1, $2, 'owner', 'active', NOW())
         ON CONFLICT (organization_id, user_id) DO NOTHING`,
        [orgId, row.id],
      );

      organizationId = orgId;
    } catch (error) {
      if (error.code !== "23505") throw error;
    }
  }

  if (organizationId) {
    await ensureOrganizationRoles(organizationId);
  }
  return organizationId;
};

module.exports = {
  MEMBER_STATUSES_BLOCKED,
  parseOrgId,
  isUsableMemberStatus,
  listUserOrganizations,
  getActiveMembership,
  pickDefaultOrganizationId,
  slugifyOrganization,
  ensurePersonalOrganization,
};
