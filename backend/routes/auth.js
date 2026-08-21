const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const query = (text, params) => pool.query(text, params);

// ⚠️ MUST match the secret used in middleware/auth.js (JWT verification).
const JWT_SECRET =
  process.env.JWT_SECRET || "aR2vT9xK8mNpQ4sW7zE6hJ3cL5yB1uF0dG8iV2nA";

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    },
  );
};

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, company } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Champs requis manquants",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Mot de passe trop court (6+ caractères)",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await query("SELECT id FROM users WHERE email = $1", [
      normalizedEmail,
    ]);

    if (existing.rowCount > 0) {
      return res.status(400).json({
        error: "Cet email est déjà utilisé",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await query(
      `INSERT INTO users
       (name, email, password_hash, company, role)
       VALUES ($1, $2, $3, $4, 'user')
       RETURNING id, name, email, company, role, created_at`,
      [name, normalizedEmail, hashedPassword, company || ""],
    );

    const user = result.rows[0];

    const token = generateToken(user);

    return res.status(201).json({
      message: "Compte créé avec succès",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        company: user.company,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Erreur register:", err);

    return res.status(500).json({
      error: "Erreur serveur lors de l'inscription",
    });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email et mot de passe requis",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const result = await query(
      `SELECT
        id,
        name,
        email,
        password_hash,
        company,
        role
       FROM users
       WHERE email = $1`,
      [normalizedEmail],
    );

    if (result.rowCount === 0) {
      return res.status(401).json({
        error: "Email ou mot de passe incorrect",
      });
    }

    const user = result.rows[0];

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({
        error: "Email ou mot de passe incorrect",
      });
    }

    const token = generateToken(user);

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        company: user.company,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Erreur login:", err);

    return res.status(500).json({
      error: "Erreur serveur lors de la connexion",
    });
  }
});

// CURRENT USER
router.get("/me", require("../middleware/auth"), async (req, res) => {
  try {
    const result = await query(
      `SELECT
          id,
          name,
          email,
          company,
          role,
          avatar_url,
          created_at
         FROM users
         WHERE id = $1`,
      [req.user.id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: "Utilisateur non trouvé",
      });
    }

    const u = result.rows[0];

    return res.json({
      id: u.id,
      name: u.name,
      email: u.email,
      company: u.company,
      role: u.role,
      avatar_url: u.avatar_url,
      createdAt: u.created_at,
    });
  } catch (err) {
    console.error("Erreur /me:", err);

    return res.status(500).json({
      error: "Erreur serveur",
    });
  }
});

// UPDATE PROFILE
router.put("/profile", require("../middleware/auth"), async (req, res) => {
  try {
    const { name, company } = req.body;

    if (!name) {
      return res.status(400).json({
        error: "Le nom est requis",
      });
    }

    const result = await query(
      `UPDATE users
         SET name = $1,
             company = $2
         WHERE id = $3
         RETURNING id, name, email, company, role`,
      [name, company || "", req.user.id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: "Utilisateur non trouvé",
      });
    }

    return res.json({
      message: "Profil mis à jour",
      user: result.rows[0],
    });
  } catch (err) {
    console.error("Erreur update profile:", err);

    return res.status(500).json({
      error: "Erreur serveur",
    });
  }
});

// GET USER STATS
router.get("/stats", require("../middleware/auth"), async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user creation date for active days calculation
    const userResult = await query(
      `SELECT created_at FROM users WHERE id = $1`,
      [userId]
    );
    
    const createdAt = userResult.rows[0]?.created_at || new Date();
    const activeDays = Math.ceil((new Date() - new Date(createdAt)) / (1000 * 60 * 60 * 24));

    // Count analyses (reviews, anomalies, recommendations)
    const analysesResult = await query(
      `SELECT
        (SELECT COUNT(*) FROM reviews WHERE user_id = $1) +
        (SELECT COUNT(*) FROM anomalies WHERE user_id = $1) +
        (SELECT COUNT(*) FROM recommendations WHERE user_id = $1) as total_analyses`,
      [userId]
    );

    // For logins, we'll use a simple count based on a proxy or return 0 if not tracked
    // In a real implementation, you'd have a login_log table
    const logins = analysesResult.rows[0].total_analyses; // Using analyses as proxy for now

    return res.json({
      logins: logins || 0,
      analyses: parseInt(analysesResult.rows[0].total_analyses) || 0,
      activeDays: activeDays || 0,
    });
  } catch (err) {
    console.error("Erreur /stats:", err);
    return res.status(500).json({
      error: "Erreur serveur",
    });
  }
});

module.exports = router;
