const express = require("express");
const bcrypt = require("bcryptjs");
const { query, transaction } = require("../db/pool");
const auth = require("../middleware/auth");

const router = express.Router();
router.use(auth, auth.requireRole("admin"));

router.get("/users", async (req, res) => {
  try {
    const search = `%${String(req.query.search || "").trim()}%`;
    const result = await query(
      `SELECT u.id, u.name, u.email, u.company, u.role, u.language, u.created_at,
        (SELECT MAX(l.login_time) FROM login_log l WHERE l.user_id = u.id AND l.success) AS last_login,
        COALESCE((SELECT COUNT(*) FROM login_log l WHERE l.user_id = u.id AND l.success), 0) AS login_count
       FROM users u
       WHERE u.name ILIKE $1 OR u.email ILIKE $1 OR COALESCE(u.company, '') ILIKE $1
       ORDER BY u.created_at DESC`,
      [search],
    );
    res.json({ users: result.rows });
  } catch (error) {
    console.error("Admin users error:", error.message);
    res.status(500).json({ error: "Impossible de charger les utilisateurs" });
  }
});

router.post("/users", async (req, res) => {
  const { name, email, company, role = "user", password } = req.body;
  if (!name || !email || !password || !["user", "manager", "admin"].includes(role)) {
    return res.status(400).json({ error: "Nom, email, mot de passe et rôle sont requis" });
  }
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO users (name, email, company, role, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, company, role, language, created_at`,
      [name.trim(), email.trim().toLowerCase(), company || null, role, passwordHash],
    );
    res.status(201).json({ user: result.rows[0] });
  } catch (error) {
    const duplicate = error.code === "23505";
    res.status(duplicate ? 409 : 500).json({ error: duplicate ? "Cet email est déjà utilisé" : "Impossible de créer l'utilisateur" });
  }
});

router.patch("/users/:id", async (req, res) => {
  const userId = Number(req.params.id);
  const { name, company, role, password } = req.body;
  if (!Number.isInteger(userId) || !name || !["user", "manager", "admin"].includes(role)) {
    return res.status(400).json({ error: "Données utilisateur invalides" });
  }

  try {
    const updated = await transaction(async (client) => {
      const current = await client.query("SELECT id, role FROM users WHERE id = $1 FOR UPDATE", [userId]);
      if (!current.rows[0]) throw Object.assign(new Error("Utilisateur introuvable"), { status: 404 });
      if (current.rows[0].role === "admin" && role !== "admin") {
        const admins = await client.query("SELECT COUNT(*)::int AS count FROM users WHERE role = 'admin'");
        if (admins.rows[0].count <= 1) throw Object.assign(new Error("Le dernier administrateur ne peut pas être rétrogradé"), { status: 409 });
      }
      const passwordHash = password ? await bcrypt.hash(password, 10) : null;
      const result = await client.query(
        `UPDATE users SET name = $1, company = $2, role = $3,
          password_hash = COALESCE($4, password_hash),
          password_last_changed = CASE WHEN $4 IS NULL THEN password_last_changed ELSE NOW() END,
          updated_at = NOW() WHERE id = $5
          RETURNING id, name, email, company, role, language, created_at`,
        [name.trim(), company || null, role, passwordHash, userId],
      );
      return result.rows[0];
    });
    res.json({ user: updated });
  } catch (error) {
    console.error("Admin user update error:", error.message);
    res.status(error.status || 500).json({ error: error.message || "Impossible de modifier l'utilisateur" });
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

router.get("/analytics", async (req, res) => {
  try {
    const [overview, monthly, roles, logins] = await Promise.all([
      query(`SELECT
        (SELECT COUNT(*)::int FROM users) AS users,
        (SELECT COUNT(*)::int FROM users WHERE role = 'admin') AS admins,
        (SELECT COUNT(*)::int FROM users WHERE created_at >= NOW() - INTERVAL '30 days') AS new_users,
        (SELECT COUNT(*)::int FROM login_log WHERE success AND login_time >= NOW() - INTERVAL '30 days') AS logins,
        (SELECT COALESCE(SUM(total_amount), 0)::numeric FROM sales) AS revenue,
        (SELECT COUNT(*)::int FROM sales) AS orders,
        (SELECT COUNT(*)::int FROM products) AS products,
        (SELECT COUNT(*)::int FROM reviews) AS reviews,
        (SELECT COUNT(*)::int FROM anomalies WHERE status != 'résolu') AS open_anomalies`),
      query(`SELECT TO_CHAR(date_trunc('month', date), 'YYYY-MM') AS month,
        COALESCE(SUM(total_amount), 0)::numeric AS revenue, COUNT(*)::int AS orders
        FROM sales WHERE date >= CURRENT_DATE - INTERVAL '11 months'
        GROUP BY 1 ORDER BY 1`),
      query("SELECT role, COUNT(*)::int AS count FROM users GROUP BY role ORDER BY count DESC"),
      query(`SELECT TO_CHAR(date_trunc('month', login_time), 'YYYY-MM') AS month,
        COUNT(*)::int AS count FROM login_log WHERE success AND login_time >= NOW() - INTERVAL '11 months'
        GROUP BY 1 ORDER BY 1`),
    ]);
    res.json({ overview: overview.rows[0], monthly: monthly.rows, roles: roles.rows, logins: logins.rows });
  } catch (error) {
    console.error("Admin analytics error:", error.message);
    res.status(500).json({ error: "Impossible de charger les analytics" });
  }
});

module.exports = router;
