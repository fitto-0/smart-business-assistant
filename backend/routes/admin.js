const express = require("express");
const bcrypt = require("bcryptjs");
const { query, transaction } = require("../db/pool");
const auth = require("../middleware/auth");

const router = express.Router();
router.use(auth, auth.requireRole("admin", "manager"));

/* Organization (tenant) roles — see migrations/001_organizations.sql. */
const ORG_ROLES = ["employee", "accountant", "viewer", "manager", "admin"];

const slugify = (value) =>
  String(value || "organization")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "organization";

const MANAGER_ORG_SQL = `
  SELECT o.id, o.name
    FROM organization_members om
    JOIN organizations o ON o.id = om.organization_id
   WHERE om.user_id = $1
     AND om.status = 'active'
     AND om.role IN ('owner', 'admin', 'manager')
   ORDER BY CASE om.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END, o.id
   LIMIT 1`;

/**
 * The organization a manager owns. Every manager gets one — created lazily on
 * first use so the account is never left without a tenant to manage.
 */
const managerOrganization = async (userId) => {
  const existing = await query(MANAGER_ORG_SQL, [userId]);
  if (existing.rows[0]) return existing.rows[0];

  const owner = await query("SELECT name, company FROM users WHERE id = $1", [userId]);
  const label = (owner.rows[0] && (owner.rows[0].company || owner.rows[0].name)) || "My organization";
  const slug = `${slugify(label)}-${Date.now().toString(36)}`;

  return transaction(async (client) => {
    const again = await client.query(MANAGER_ORG_SQL, [userId]);
    if (again.rows[0]) return again.rows[0];
    const org = await client.query(
      `INSERT INTO organizations (name, slug, industry, size, subscription_plan)
       VALUES ($1, $2, 'Retail', '1-10', 'free')
       RETURNING id, name`,
      [String(label).trim().slice(0, 200), slug],
    );
    await client.query(
      `INSERT INTO organization_members (organization_id, user_id, role, status)
       VALUES ($1, $2, 'owner', 'active')
       ON CONFLICT (organization_id, user_id) DO NOTHING`,
      [org.rows[0].id, userId],
    );
    return org.rows[0];
  });
};

router.get("/users", async (req, res) => {
  try {
    const search = `%${String(req.query.search || "").trim()}%`;

    // Manager: only the members of their own organization.
    if (req.user.role === "manager") {
      const org = await managerOrganization(req.user.id);
      const result = await query(
        `SELECT u.id, u.name, u.email, u.company, u.role, u.language, u.created_at,
          om.role AS org_role, om.status AS org_status, om.joined_at,
          (SELECT MAX(l.login_time) FROM login_log l WHERE l.user_id = u.id AND l.success) AS last_login,
          COALESCE((SELECT COUNT(*) FROM login_log l WHERE l.user_id = u.id AND l.success), 0) AS login_count
         FROM organization_members om
         JOIN users u ON u.id = om.user_id
         WHERE om.organization_id = $1
           AND om.status <> 'removed'
           AND (u.name ILIKE $2 OR u.email ILIKE $2 OR COALESCE(u.company, '') ILIKE $2)
         ORDER BY om.joined_at, u.id`,
        [org.id, search],
      );
      return res.json({ scope: "organization", organization: org, users: result.rows });
    }

    // Admin: every account on the platform.
    const result = await query(
      `SELECT u.id, u.name, u.email, u.company, u.role, u.language, u.created_at,
        (SELECT MAX(l.login_time) FROM login_log l WHERE l.user_id = u.id AND l.success) AS last_login,
        COALESCE((SELECT COUNT(*) FROM login_log l WHERE l.user_id = u.id AND l.success), 0) AS login_count
       FROM users u
       WHERE u.name ILIKE $1 OR u.email ILIKE $1 OR COALESCE(u.company, '') ILIKE $1
       ORDER BY u.created_at DESC`,
      [search],
    );
    res.json({ scope: "platform", organization: null, users: result.rows });
  } catch (error) {
    console.error("Admin users error:", error.message);
    res.status(500).json({ error: "Impossible de charger les utilisateurs" });
  }
});

router.post("/users", async (req, res) => {
  const { name, email, company, role = "user", password, orgRole } = req.body;
  const isManagerActor = req.user.role === "manager";
  const orgRoleValue = isManagerActor ? (orgRole || "employee") : null;

  if (!name || !email || !password || !["user", "manager", "admin"].includes(role)) {
    return res.status(400).json({ error: "Nom, email, mot de passe et rôle sont requis" });
  }
  if (isManagerActor && role === "admin") {
    return res.status(403).json({
      error: "Un gestionnaire ne peut pas créer de compte administrateur",
    });
  }
  if (orgRoleValue && !ORG_ROLES.includes(orgRoleValue)) {
    return res.status(400).json({ error: "Rôle d'organisation invalide" });
  }

  try {
    // Manager: the account lands in *their* organization, never at app level.
    const org = isManagerActor ? await managerOrganization(req.user.id) : null;
    const passwordHash = await bcrypt.hash(password, 10);
    const emailValue = email.trim().toLowerCase();

    const created = await transaction(async (client) => {
      if (isManagerActor) {
        const existing = await client.query(
          "SELECT id, name, email, company, role, language, created_at FROM users WHERE email = $1",
          [emailValue],
        );
        if (existing.rows[0]) {
          const busy = await client.query(
            "SELECT 1 FROM organization_members WHERE user_id = $1 AND status = 'active'",
            [existing.rows[0].id],
          );
          if (busy.rows[0]) {
            throw Object.assign(new Error("Cet email est déjà utilisé"), { status: 409 });
          }
          // Orphan platform account (no organization) — adopt it into this org.
          await client.query(
            `INSERT INTO organization_members (organization_id, user_id, role, status, invited_by, invited_at)
             VALUES ($1, $2, $3, 'active', $4, NOW())
             ON CONFLICT (organization_id, user_id)
             DO UPDATE SET role = EXCLUDED.role, status = 'active',
               invited_by = EXCLUDED.invited_by, invited_at = NOW(), updated_at = NOW()`,
            [org.id, existing.rows[0].id, orgRoleValue, req.user.id],
          );
          return { ...existing.rows[0], adopted: true };
        }
      }

      const result = await client.query(
        `INSERT INTO users (name, email, company, role, password_hash)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, email, company, role, language, created_at`,
        [name.trim(), emailValue, company || null, isManagerActor ? "user" : role, passwordHash],
      );
      const user = result.rows[0];
      if (org) {
        await client.query(
          `INSERT INTO organization_members (organization_id, user_id, role, status, invited_by, invited_at)
           VALUES ($1, $2, $3, 'active', $4, NOW())
           ON CONFLICT (organization_id, user_id)
           DO UPDATE SET role = EXCLUDED.role, status = 'active',
             invited_by = EXCLUDED.invited_by, invited_at = NOW(), updated_at = NOW()`,
          [org.id, user.id, orgRoleValue, req.user.id],
        );
      }
      return user;
    });

    // A new app-level manager always owns an organization.
    if (!isManagerActor && role === "manager") await managerOrganization(created.id);

    res.status(201).json({ user: created, organization: org });
  } catch (error) {
    const duplicate = error.code === "23505";
    res.status(duplicate || error.status === 409 ? 409 : 500).json({
      error: duplicate || error.status === 409 ? "Cet email est déjà utilisé" : "Impossible de créer l'utilisateur",
    });
  }
});

router.patch("/users/:id", async (req, res) => {
  const userId = Number(req.params.id);
  const { name, email, company, role, password, orgRole } = req.body;
  const isManagerActor = req.user.role === "manager";
  if (!Number.isInteger(userId) || !name || (!isManagerActor && !["user", "manager", "admin"].includes(role))) {
    return res.status(400).json({ error: "Données utilisateur invalides" });
  }
  if (orgRole !== undefined && orgRole !== null && !ORG_ROLES.includes(orgRole)) {
    return res.status(400).json({ error: "Rôle d'organisation invalide" });
  }

  const cleanEmail =
    email === undefined || email === null || String(email).trim() === ""
      ? null
      : String(email).trim().toLowerCase();
  if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return res.status(400).json({ error: "Adresse email invalide" });
  }

  try {
    const org = isManagerActor ? await managerOrganization(req.user.id) : null;

    const updated = await transaction(async (client) => {
      const current = await client.query("SELECT id, role FROM users WHERE id = $1 FOR UPDATE", [userId]);
      if (!current.rows[0]) throw Object.assign(new Error("Utilisateur introuvable"), { status: 404 });

      let orgRoleValue = null;
      if (isManagerActor) {
        // Only members of the manager's own organization are visible/mutable.
        const member = await client.query(
          `SELECT id, role FROM organization_members
            WHERE organization_id = $1 AND user_id = $2 AND status <> 'removed' FOR UPDATE`,
          [org.id, userId],
        );
        if (!member.rows[0]) {
          throw Object.assign(new Error("Utilisateur introuvable"), { status: 404 });
        }
        if (current.rows[0].role === "admin") {
          throw Object.assign(
            new Error("Un gestionnaire ne peut pas modifier un compte administrateur"),
            { status: 403 },
          );
        }
        if (role === "admin") {
          throw Object.assign(
            new Error("Un gestionnaire ne peut pas attribuer le rôle administrateur"),
            { status: 403 },
          );
        }
        if (orgRole && member.rows[0].role !== "owner") {
          await client.query(
            "UPDATE organization_members SET role = $1, updated_at = NOW() WHERE id = $2",
            [orgRole, member.rows[0].id],
          );
          orgRoleValue = orgRole;
        } else {
          orgRoleValue = member.rows[0].role;
        }
      }

      if (!isManagerActor && current.rows[0].role === "admin" && role !== "admin") {
        const admins = await client.query("SELECT COUNT(*)::int AS count FROM users WHERE role = 'admin'");
        if (admins.rows[0].count <= 1) throw Object.assign(new Error("Le dernier administrateur ne peut pas être rétrogradé"), { status: 409 });
      }

      const passwordHash = password ? await bcrypt.hash(password, 10) : null;
      const targetRole = isManagerActor ? current.rows[0].role : role;
      const result = await client.query(
        `UPDATE users SET name = $1, company = $2, role = $3,
          password_hash = COALESCE($4, password_hash),
          password_last_changed = CASE WHEN $4 IS NULL THEN password_last_changed ELSE NOW() END,
          email = COALESCE($6, email),
          updated_at = NOW() WHERE id = $5
          RETURNING id, name, email, company, role, language, created_at`,
        [name.trim(), company || null, targetRole, passwordHash, userId, cleanEmail],
      );
      return { ...result.rows[0], org_role: orgRoleValue };
    });
    res.json({ user: updated });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Cet email est déjà utilisé" });
    }
    console.error("Admin user update error:", error.message);
    res.status(error.status || 500).json({ error: error.message || "Impossible de modifier l'utilisateur" });
  }
});

router.delete("/users/:id", async (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId) || userId < 1) {
    return res.status(400).json({ error: "Identifiant utilisateur invalide" });
  }
  if (userId === req.user.id) {
    return res.status(409).json({ error: "Vous ne pouvez pas supprimer votre propre compte" });
  }

  try {
    const isManagerActor = req.user.role === "manager";
    const org = isManagerActor ? await managerOrganization(req.user.id) : null;

    const removed = await transaction(async (client) => {
      const current = await client.query(
        "SELECT id, name, email, role FROM users WHERE id = $1 FOR UPDATE",
        [userId],
      );
      if (!current.rows[0]) throw Object.assign(new Error("Utilisateur introuvable"), { status: 404 });

      if (isManagerActor) {
        const member = await client.query(
          `SELECT id FROM organization_members
            WHERE organization_id = $1 AND user_id = $2 AND status <> 'removed' FOR UPDATE`,
          [org.id, userId],
        );
        if (!member.rows[0]) {
          throw Object.assign(new Error("Utilisateur introuvable"), { status: 404 });
        }
        if (current.rows[0].role === "admin") {
          throw Object.assign(
            new Error("Un gestionnaire ne peut pas supprimer un compte administrateur"),
            { status: 403 },
          );
        }
        // Manager: leave the platform account alone — just take them out of the org.
        await client.query(
          `UPDATE organization_members
             SET status = 'removed', updated_at = NOW()
           WHERE organization_id = $1 AND user_id = $2`,
          [org.id, userId],
        );
        return { ...current.rows[0], removed_from_org: true };
      }

      const admins = await client.query("SELECT COUNT(*)::int AS count FROM users WHERE role = 'admin'");
      if (current.rows[0].role === "admin" && admins.rows[0].count <= 1) {
        throw Object.assign(
          new Error("Le dernier administrateur ne peut pas être supprimé"),
          { status: 409 },
        );
      }

      const result = await client.query(
        "DELETE FROM users WHERE id = $1 RETURNING id, name, email",
        [userId],
      );
      return result.rows[0];
    });

    res.json({ success: true, user: removed });
  } catch (error) {
    console.error("Admin user delete error:", error.message);
    res.status(error.status || 500).json({
      error: error.message || "Impossible de supprimer l'utilisateur",
    });
  }
});

router.get("/settings", async (req, res) => {
  try {
    const result = await query("SELECT * FROM system_settings WHERE id = 1");
    res.json({ settings: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: "Impossible de charger les paramètres" });
  }
});

router.patch("/settings", async (req, res) => {
  const { platformName, supportEmail, defaultLanguage, maintenanceMode } = req.body;
  if (!platformName || !supportEmail || !["en", "fr", "ar"].includes(defaultLanguage)) {
    return res.status(400).json({ error: "Paramètres invalides" });
  }
  try {
    const result = await query(
      `UPDATE system_settings SET platform_name = $1, support_email = $2,
       default_language = $3, maintenance_mode = $4, updated_at = NOW() WHERE id = 1 RETURNING *`,
      [platformName.trim(), supportEmail.trim(), defaultLanguage, Boolean(maintenanceMode)],
    );
    res.json({ settings: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: "Impossible d'enregistrer les paramètres" });
  }
});

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const growthPct = (now, prev) => {
  const n = Number(now);
  const p = Number(prev);
  if (!Number.isFinite(n)) return null;
  if (p > 0) return ((n - p) / p) * 100;
  return n > 0 ? null : 0;
};

const buildTrend = (monthly, logins, signups) => {
  const series = new Map();
  for (let i = 11; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    series.set(key, {
      month: key,
      label: MONTH_LABELS[d.getMonth()],
      revenue: 0,
      orders: 0,
      logins: 0,
      signups: 0,
    });
  }
  monthly.forEach((row) => {
    const entry = series.get(row.month);
    if (entry) {
      entry.revenue = Number(row.revenue);
      entry.orders = Number(row.orders);
    }
  });
  logins.forEach((row) => {
    const entry = series.get(row.month);
    if (entry) entry.logins = Number(row.count);
  });
  signups.forEach((row) => {
    const entry = series.get(row.month);
    if (entry) entry.signups = Number(row.count);
  });
  return Array.from(series.values());
};

// Owner view: platform-wide analytics, admin only.
router.get("/analytics", auth.requireRole("admin"), async (req, res) => {
  try {
    const [overview, windows, monthly, roles, logins, signups, recentSignups, recentLogins, health] =
      await Promise.all([
        query(`SELECT
          (SELECT COUNT(*)::int FROM users) AS users,
          (SELECT COUNT(*)::int FROM users WHERE role = 'admin') AS admins,
          (SELECT COUNT(*)::int FROM users WHERE created_at >= NOW() - INTERVAL '30 days') AS new_users,
          (SELECT COUNT(*)::int FROM login_log WHERE success AND login_time >= NOW() - INTERVAL '30 days') AS logins,
          (SELECT COALESCE(SUM(total_amount), 0)::numeric FROM sales) AS revenue,
          (SELECT COUNT(*)::int FROM sales) AS orders,
          (SELECT COUNT(*)::int FROM products WHERE deleted_at IS NULL) AS products,
          (SELECT COUNT(*)::int FROM reviews) AS reviews,
          (SELECT COUNT(*)::int FROM anomalies WHERE resolved_at IS NULL) AS open_anomalies,
          (SELECT COUNT(DISTINCT user_id)::int FROM sales WHERE date >= CURRENT_DATE - 90) AS active_tenants,
          (SELECT COUNT(*)::int FROM store_settings) AS storefronts,
          (SELECT COUNT(*)::int FROM integrations) AS integrations,
          (SELECT COUNT(*)::int FROM reviews WHERE created_at >= NOW() - INTERVAL '30 days') AS new_reviews`),
        query(`SELECT
          (SELECT COALESCE(SUM(total_amount), 0)::numeric FROM sales WHERE date >= CURRENT_DATE - 30) AS revenue_now,
          (SELECT COALESCE(SUM(total_amount), 0)::numeric FROM sales WHERE date >= CURRENT_DATE - 60 AND date < CURRENT_DATE - 30) AS revenue_prev,
          (SELECT COUNT(*)::int FROM sales WHERE date >= CURRENT_DATE - 30) AS orders_now,
          (SELECT COUNT(*)::int FROM sales WHERE date >= CURRENT_DATE - 60 AND date < CURRENT_DATE - 30) AS orders_prev,
          (SELECT COUNT(*)::int FROM login_log WHERE success AND login_time >= NOW() - INTERVAL '30 days') AS logins_now,
          (SELECT COUNT(*)::int FROM login_log WHERE success AND login_time < NOW() - INTERVAL '30 days' AND login_time >= NOW() - INTERVAL '60 days') AS logins_prev,
          (SELECT COUNT(*)::int FROM users WHERE created_at >= NOW() - INTERVAL '30 days') AS users_now,
          (SELECT COUNT(*)::int FROM users WHERE created_at < NOW() - INTERVAL '30 days' AND created_at >= NOW() - INTERVAL '60 days') AS users_prev`),
        query(`SELECT TO_CHAR(date_trunc('month', date), 'YYYY-MM') AS month,
          COALESCE(SUM(total_amount), 0)::numeric AS revenue, COUNT(*)::int AS orders
          FROM sales WHERE date >= CURRENT_DATE - INTERVAL '12 months'
          GROUP BY 1 ORDER BY 1`),
        query("SELECT role, COUNT(*)::int AS count FROM users GROUP BY role ORDER BY count DESC"),
        query(`SELECT TO_CHAR(date_trunc('month', login_time), 'YYYY-MM') AS month,
          COUNT(*)::int AS count FROM login_log WHERE success AND login_time >= NOW() - INTERVAL '12 months'
          GROUP BY 1 ORDER BY 1`),
        query(`SELECT TO_CHAR(date_trunc('month', created_at), 'YYYY-MM') AS month,
          COUNT(*)::int AS count FROM users WHERE created_at >= NOW() - INTERVAL '12 months'
          GROUP BY 1 ORDER BY 1`),
        query(`SELECT id, name, email, company, role, created_at FROM users
          ORDER BY created_at DESC LIMIT 5`),
        query(`SELECT u.name, u.email, l.login_time, l.success, l.ip_address
          FROM login_log l JOIN users u ON u.id = l.user_id
          ORDER BY l.login_time DESC LIMIT 8`),
        query(`SELECT
          (SELECT platform_name FROM system_settings WHERE id = 1) AS platform_name,
          (SELECT maintenance_mode FROM system_settings WHERE id = 1) AS maintenance_mode,
          (SELECT status FROM backups ORDER BY updated_at DESC LIMIT 1) AS backup_status,
          (SELECT updated_at FROM backups ORDER BY updated_at DESC LIMIT 1) AS backup_at,
          (SELECT status FROM backup_schedules ORDER BY id LIMIT 1) AS backup_schedule,
          (SELECT COUNT(*)::int FROM security_events) AS security_events_total,
          (SELECT COUNT(*)::int FROM security_events WHERE created_at >= NOW() - INTERVAL '7 days') AS security_events_7d,
          (SELECT COUNT(*)::int FROM anomalies WHERE detected_at >= NOW() - INTERVAL '7 days') AS anomalies_7d`),
      ]);

    const base = overview.rows[0];
    const w = windows.rows[0];
    const orders30 = Number(w.orders_now);

    res.json({
      overview: {
        ...base,
        revenue_30d: w.revenue_now,
        orders_30d: w.orders_now,
        aov: orders30 > 0 ? (Number(w.revenue_now) / orders30).toFixed(2) : "0",
        growth: {
          revenue: growthPct(w.revenue_now, w.revenue_prev),
          orders: growthPct(w.orders_now, w.orders_prev),
          logins: growthPct(w.logins_now, w.logins_prev),
          users: growthPct(w.users_now, w.users_prev),
        },
      },
      trend: buildTrend(monthly.rows, logins.rows, signups.rows),
      monthly: monthly.rows,
      roles: roles.rows,
      activity: { signups: recentSignups.rows, logins: recentLogins.rows },
      health: health.rows[0],
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Admin analytics error:", error.message);
    res.status(500).json({ error: "Impossible de charger les analytics" });
  }
});

module.exports = router;
