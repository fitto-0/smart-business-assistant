/**
 * Organization context middleware.
 *
 * Purpose: make `req.organizationId` mean "the organization this request is allowed
 * to touch", verified against `organization_members` — never a value the client
 * simply asserted.
 *
 * Resolution order (first match wins):
 *   1. `X-Organization-Id` header (what the frontend sends)
 *   2. `?organizationId=` query parameter
 *   3. `organizationId` in the JSON body
 *   4. the `organizationId` claim of the JWT (signature-verified)
 *   5. the user's default membership (owner membership, else oldest)
 *   6. self-healing: a personal organization is created for legacy accounts
 *
 * On success it sets the same fields `permissions.js` already relies on:
 *   req.organizationId, req.userRole, req.memberId, req.memberContext
 */

const {
  parseOrgId,
  getActiveMembership,
  pickDefaultOrganizationId,
  ensurePersonalOrganization,
} = require("../lib/orgs");
const { getMemberContext, requirePermission } = require("./permissions");

const ORG_HEADER = "x-organization-id";
const ORG_HEADER_ALIASES = [ORG_HEADER, "x-org-id", "organization-id"];

const headerValue = (req, name) => {
  if (!req.headers) return null;
  const value = req.headers[name];
  return Array.isArray(value) ? value[0] : value;
};

/** First usable organization id the request carries, or null. */
const readOrganizationHint = (req) => {
  const body = req.body && typeof req.body === "object" ? req.body : null;
  const queryParams = req.query && typeof req.query === "object" ? req.query : null;

  const candidates = [
    ...ORG_HEADER_ALIASES.map((name) => headerValue(req, name)),
    queryParams ? queryParams.organizationId : null,
    queryParams ? queryParams.organization_id : null,
    body ? body.organizationId : null,
    body ? body.organization_id : null,
    req.organizationHintId,
    req.organizationId,
  ];

  for (const candidate of candidates) {
    const id = parseOrgId(candidate);
    if (id) return id;
  }
  return null;
};

/**
 * @param {{ optional?: boolean, provision?: boolean, ignoreInvalidHint?: boolean }} [options]
 *  - optional:          when no organization can be resolved, continue without context
 *                       instead of failing (used by routes that also work pre-onboarding).
 *  - provision:         set to false to never self-heal a missing organization.
 *  - ignoreInvalidHint: a hint the user is not a member of falls back to the default
 *                       organization instead of failing. Used by the global middleware
 *                       so a stale client-side organization id cannot lock a user out.
 */
const withOrgContext = (options = {}) => {
  const { optional = false, provision = true, ignoreInvalidHint = false } = options;

  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const hintedId = readOrganizationHint(req);
      let organizationId = hintedId;
      let membership = hintedId
        ? await getActiveMembership(req.user.id, hintedId)
        : null;

      if (hintedId && !membership) {
        if (!ignoreInvalidHint) {
          return res.status(403).json({
            error: "Not a member of this organization",
          });
        }
        organizationId = null;
      }

      if (!organizationId) {
        organizationId = await pickDefaultOrganizationId(req.user.id);
        if (!organizationId && provision) {
          organizationId = await ensurePersonalOrganization(req.user);
        }
        if (!organizationId) {
          if (optional) return next();
          return res.status(400).json({
            error:
              "Organization context required. Select an organization or create one.",
          });
        }
        membership = await getActiveMembership(req.user.id, organizationId);
        if (!membership) {
          if (optional) return next();
          return res.status(403).json({
            error: "Not a member of this organization",
          });
        }
      }

      const ctx = await getMemberContext(req.user.id, organizationId);
      if (!ctx) {
        return res
          .status(403)
          .json({ error: "Not a member of this organization" });
      }

      req.organizationId = organizationId;
      req.organizationContextVerified = true;
      req.memberContext = ctx;
      req.memberId = ctx.memberId;
      req.userRole = ctx.role;
      req.membershipStatus = membership.status || "active";

      return next();
    } catch (error) {
      console.error("Organization context error:", error);
      return res
        .status(500)
        .json({ error: "Error resolving organization context" });
    }
  };
};

/** Shorthand: verify organization context, then enforce a permission. */
const requireOrgPermission = (resource, action, options = {}) => [
  withOrgContext(options),
  requirePermission(resource, action),
];

/**
 * Guard for routes shaped `/:id/...` where `:id` IS the organization id
 * (`/api/organizations/:id/members`, `/api/roles/org/:id`, ...).
 *
 * `resolveOrganizationId()` gives priority to the verified context, so without this
 * guard a user legitimately owning organization A could pass `/organizations/B/...`
 * and have the permission check evaluated against A while the SQL ran on B.
 * The guard forces the two to be identical.
 */
const requireParamOrgMatch = (req, res, next) => {
  const paramOrgId = parseOrgId(req.params && req.params.id);
  const contextOrgId = parseOrgId(req.organizationId);

  // Nothing to compare (no path organization id, or no verified context yet):
  // the permission middleware will resolve and verify the organization itself.
  if (!paramOrgId || !contextOrgId) return next();
  if (paramOrgId === contextOrgId) return next();

  return res.status(403).json({
    error:
      "Organization mismatch: the organization in the path is not the active one",
  });
};

module.exports = {
  ORG_HEADER,
  readOrganizationHint,
  withOrgContext,
  requireOrgPermission,
  requireParamOrgMatch,
};
