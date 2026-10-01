-- 015: SEED THE SIX SYSTEM ROLES FOR EVERY ORGANIZATION
--
-- Before this migration, `organization_roles` was empty, so:
--   * the owner UI had nothing to edit,
--   * `organization_members.role_id` was always NULL,
--   * permission checks fell back to a hardcoded matrix instead of owner-editable rows.
--
-- System roles are seeded with `permissions = '{}'` and `dashboard_config = '{}'`.
-- An empty object means "no owner opinion yet", so the built-in matrix in
-- `middleware/permissions.js` applies until the owner edits the role — at which
-- point the JSONB becomes an explicit, authoritative matrix.
--
-- The runtime equivalent is `lib/roles.js:ensureSystemRoles()`, called on
-- organization creation, on organization switch and lazily by GET /api/roles/org/:id.

-- ===================== 1. SEED SYSTEM ROLES =====================
INSERT INTO organization_roles
  (organization_id, name, slug, description, permissions, dashboard_config, is_system)
SELECT
  o.id,
  d.name,
  d.slug,
  d.description,
  '{}'::jsonb,
  '{}'::jsonb,
  TRUE
FROM organizations o
CROSS JOIN (VALUES
  ('owner', 'Owner',
   'Unrestricted control of the organization: data, people, roles and dashboard visibility. Cannot be restricted.'),
  ('admin', 'Admin',
   'Runs the organization end to end — data, team, security and settings.'),
  ('manager', 'Manager',
   'Day-to-day operations: products, sales, analytics and team visibility.'),
  ('employee', 'Employee',
   'Records sales and consults products and stock. No analytics or settings.'),
  ('accountant', 'Accountant',
   'Read access to sales, products, analytics and reports for bookkeeping.'),
  ('viewer', 'Viewer',
   'Read-only access to the business data the owner shares.')
) AS d(slug, name, description)
ON CONFLICT (organization_id, slug) DO UPDATE
  SET is_system = TRUE;

-- ===================== 2. LINK MEMBERS TO THEIR ROLE ROW =====================
UPDATE organization_members om
   SET role_id = r.id,
       updated_at = NOW()
  FROM organization_roles r
 WHERE r.organization_id = om.organization_id
   AND r.slug = om.role
   AND om.role_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_org_members_role_id ON organization_members(role_id);

-- ===================== 3. LINK PENDING INVITATIONS TO THEIR ROLE ROW =====================
UPDATE invitations i
   SET role_id = r.id
  FROM organization_roles r
 WHERE r.organization_id = i.organization_id
   AND r.slug = i.role
   AND i.role_id IS NULL;
