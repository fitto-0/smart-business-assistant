const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { query } = require("../db/pool");

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../../uploads/avatars");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "avatar-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

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
    const { email, password, totpCode } = req.body;

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
        role,
        two_factor_enabled,
        two_factor_secret
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

    // Check if 2FA is enabled
    const twoFactorEnabled = user.two_factor_enabled || false;

    if (twoFactorEnabled) {
      if (!totpCode) {
        return res.status(400).json({
          error: "Code 2FA requis",
          requires2FA: true,
        });
      }

      // Verify TOTP code
      const verified = speakeasy.totp.verify({
        secret: user.two_factor_secret,
        encoding: "base32",
        token: totpCode,
      });

      if (!verified) {
        return res.status(401).json({
          error: "Code 2FA invalide",
          requires2FA: true,
        });
      }
    }

    // Record successful login
    const ipAddress = req.ip || req.connection.remoteAddress || null;
    const userAgent = req.headers["user-agent"] || null;

    await query(
      `INSERT INTO login_log (user_id, ip_address, user_agent, success)
       VALUES ($1, $2, $3, true)`,
      [user.id, ipAddress, userAgent],
    );

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
          language,
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
      language: u.language || 'en',
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
    const { name, company, language, avatar_url } = req.body;

    if (!name) {
      return res.status(400).json({
        error: "Le nom est requis",
      });
    }

    // Validate language if provided
    if (language && !['en', 'fr', 'ar'].includes(language)) {
      return res.status(400).json({
        error: "Langue invalide. Valeurs acceptées: en, fr, ar",
      });
    }

    const result = await query(
      `UPDATE users
         SET name = $1,
             company = $2,
             language = COALESCE($3, language),
             avatar_url = COALESCE($4, avatar_url)
         WHERE id = $5
         RETURNING id, name, email, company, role, language, avatar_url`,
      [name, company || "", language || null, avatar_url || null, req.user.id],
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

// UPLOAD AVATAR
router.post("/upload-avatar", require("../middleware/auth"), upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "No file uploaded",
      });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // Update user's avatar_url in database
    await query(
      `UPDATE users SET avatar_url = $1 WHERE id = $2`,
      [avatarUrl, req.user.id],
    );

    return res.json({
      message: "Avatar uploaded successfully",
      avatar_url: avatarUrl,
    });
  } catch (err) {
    console.error("Erreur upload avatar:", err);

    return res.status(500).json({
      error: "Erreur serveur lors de l'upload",
    });
  }
});

// GET NOTIFICATIONS
router.get("/notifications", require("../middleware/auth"), async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    const unreadOnly = req.query.unreadOnly === 'true';

    let queryText = `
      SELECT id, type, title, message, read, metadata, created_at
      FROM notifications
      WHERE user_id = $1
    `;
    const queryParams = [userId];

    if (unreadOnly) {
      queryText += ` AND read = FALSE`;
    }

    queryText += `
      ORDER BY created_at DESC
      LIMIT $2
    `;
    queryParams.push(limit);

    const result = await query(queryText, queryParams);

    return res.json({
      notifications: result.rows,
      total: result.rowCount,
    });
  } catch (err) {
    console.error("Erreur get notifications:", err);
    return res.status(500).json({
      error: "Erreur serveur",
    });
  }
});

// MARK NOTIFICATION AS READ
router.put("/notifications/:id/read", require("../middleware/auth"), async (req, res) => {
  try {
    const notificationId = req.params.id;

    const result = await query(
      `UPDATE notifications
         SET read = TRUE
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
      [notificationId, req.user.id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: "Notification non trouvée",
      });
    }

    return res.json({
      message: "Notification marquée comme lue",
      notification: result.rows[0],
    });
  } catch (err) {
    console.error("Erreur mark notification read:", err);
    return res.status(500).json({
      error: "Erreur serveur",
    });
  }
});

// MARK ALL NOTIFICATIONS AS READ
router.put("/notifications/read-all", require("../middleware/auth"), async (req, res) => {
  try {
    await query(
      `UPDATE notifications
         SET read = TRUE
         WHERE user_id = $1 AND read = FALSE`,
      [req.user.id],
    );

    return res.json({
      message: "Toutes les notifications marquées comme lues",
    });
  } catch (err) {
    console.error("Erreur mark all notifications read:", err);
    return res.status(500).json({
      error: "Erreur serveur",
    });
  }
});

// CREATE NOTIFICATION (internal function)
const createNotification = async (userId, type, title, message, metadata = {}) => {
  try {
    await query(
      `INSERT INTO notifications (user_id, type, title, message, metadata)
         VALUES ($1, $2, $3, $4, $5)`,
      [userId, type, title, message, JSON.stringify(metadata)],
    );
  } catch (err) {
    console.error("Erreur create notification:", err);
  }
};

// GET USER STATS
router.get("/stats", require("../middleware/auth"), async (req, res) => {
  try {
    const userId = req.user.id;

    // Count logins from login_log table
    const loginsResult = await query(
      `SELECT COUNT(*) as total_logins FROM login_log WHERE user_id = $1 AND success = true`,
      [userId],
    );

    // Count analyses (reviews, anomalies, recommendations)
    const analysesResult = await query(
      `SELECT
        (SELECT COUNT(*) FROM reviews WHERE user_id = $1) +
        (SELECT COUNT(*) FROM anomalies WHERE user_id = $1) +
        (SELECT COUNT(*) FROM recommendations WHERE user_id = $1) as total_analyses`,
      [userId],
    );

    // Count active days (days with at least one login)
    const activeDaysResult = await query(
      `SELECT COUNT(DISTINCT DATE(login_time)) as active_days
       FROM login_log
       WHERE user_id = $1 AND success = true`,
      [userId],
    );

    return res.json({
      logins: parseInt(loginsResult.rows[0].total_logins) || 0,
      analyses: parseInt(analysesResult.rows[0].total_analyses) || 0,
      activeDays: parseInt(activeDaysResult.rows[0].active_days) || 0,
    });
  } catch (err) {
    console.error("Erreur /stats:", err);
    return res.status(500).json({
      error: "Erreur serveur",
    });
  }
});

// GET SECURITY INFO
router.get("/security", require("../middleware/auth"), async (req, res) => {
  try {
    const userId = req.user.id;

    // First check if columns exist by trying to get basic user info
    const userResult = await query(
      `SELECT id, created_at FROM users WHERE id = $1`,
      [userId],
    );

    if (userResult.rowCount === 0) {
      return res.status(404).json({
        error: "Utilisateur non trouvé",
      });
    }

    // Try to get security columns, fall back to defaults if they don't exist
    let passwordLastChanged = userResult.rows[0].created_at;
    let emailNotificationsEnabled = true;
    let twoFactorEnabled = false;

    try {
      const securityResult = await query(
        `SELECT
          COALESCE(password_last_changed, created_at) as password_last_changed,
          COALESCE(email_notifications_enabled, true) as email_notifications_enabled,
          COALESCE(two_factor_enabled, false) as two_factor_enabled
         FROM users
         WHERE id = $1`,
        [userId],
      );

      if (securityResult.rowCount > 0) {
        passwordLastChanged = securityResult.rows[0].password_last_changed;
        emailNotificationsEnabled =
          securityResult.rows[0].email_notifications_enabled;
        twoFactorEnabled = securityResult.rows[0].two_factor_enabled;
      }
    } catch (err) {
      // Columns don't exist yet, use defaults
      console.log("Security columns not yet available, using defaults");
    }

    // Calculate days since password change
    const daysSincePasswordChange = Math.floor(
      (new Date() - new Date(passwordLastChanged)) / (1000 * 60 * 60 * 24),
    );

    return res.json({
      passwordLastChanged: passwordLastChanged,
      daysSincePasswordChange: daysSincePasswordChange,
      emailNotificationsEnabled: emailNotificationsEnabled,
      twoFactorEnabled: twoFactorEnabled,
    });
  } catch (err) {
    console.error("Erreur /security:", err);
    return res.status(500).json({
      error: "Erreur serveur",
    });
  }
});

// CHANGE PASSWORD
router.post(
  "/change-password",
  require("../middleware/auth"),
  async (req, res) => {
    try {
      const { oldPassword, newPassword } = req.body;
      const userId = req.user.id;

      if (!oldPassword || !newPassword) {
        return res.status(400).json({
          error: "Ancien mot de passe et nouveau mot de passe requis",
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          error: "Le nouveau mot de passe doit contenir au moins 6 caractères",
        });
      }

      // Get current password hash
      const result = await query(
        `SELECT password_hash FROM users WHERE id = $1`,
        [userId],
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          error: "Utilisateur non trouvé",
        });
      }

      // Verify old password
      const valid = await bcrypt.compare(
        oldPassword,
        result.rows[0].password_hash,
      );

      if (!valid) {
        return res.status(401).json({
          error: "Ancien mot de passe incorrect",
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password and password_last_changed
      await query(
        `UPDATE users
         SET password_hash = $1,
             password_last_changed = NOW()
         WHERE id = $2`,
        [hashedPassword, userId],
      );

      return res.json({
        message: "Mot de passe changé avec succès",
      });
    } catch (err) {
      console.error("Erreur change-password:", err);
      return res.status(500).json({
        error: "Erreur serveur",
      });
    }
  },
);

// TOGGLE EMAIL NOTIFICATIONS
router.put(
  "/toggle-notifications",
  require("../middleware/auth"),
  async (req, res) => {
    try {
      const { enabled } = req.body;
      const userId = req.user.id;

      if (typeof enabled !== "boolean") {
        return res.status(400).json({
          error: "Le paramètre 'enabled' doit être un booléen",
        });
      }

      try {
        await query(
          `UPDATE users
         SET email_notifications_enabled = $1
         WHERE id = $2`,
          [enabled, userId],
        );
      } catch (err) {
        // Column doesn't exist, just ignore
        console.log("email_notifications_enabled column not available");
      }

      return res.json({
        message: enabled
          ? "Notifications activées"
          : "Notifications désactivées",
        emailNotificationsEnabled: enabled,
      });
    } catch (err) {
      console.error("Erreur toggle-notifications:", err);
      return res.status(500).json({
        error: "Erreur serveur",
      });
    }
  },
);

// TOGGLE TWO-FACTOR AUTHENTICATION
router.put("/toggle-2fa", require("../middleware/auth"), async (req, res) => {
  try {
    const { enabled } = req.body;
    const userId = req.user.id;

    if (typeof enabled !== "boolean") {
      return res.status(400).json({
        error: "Le paramètre 'enabled' doit être un booléen",
      });
    }

    try {
      await query(
        `UPDATE users
         SET two_factor_enabled = $1
         WHERE id = $2`,
        [enabled, userId],
      );
    } catch (err) {
      // Column doesn't exist, just ignore
      console.log("two_factor_enabled column not available");
    }

    return res.json({
      message: enabled ? "2FA activée" : "2FA désactivée",
      twoFactorEnabled: enabled,
    });
  } catch (err) {
    console.error("Erreur toggle-2fa:", err);
    return res.status(500).json({
      error: "Erreur serveur",
    });
  }
});

// SETUP 2FA - Generate secret and QR code
router.post("/setup-2fa", require("../middleware/auth"), async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user email for the TOTP issuer
    const userResult = await query(
      `SELECT email, name FROM users WHERE id = $1`,
      [userId],
    );

    if (userResult.rowCount === 0) {
      return res.status(404).json({
        error: "Utilisateur non trouvé",
      });
    }

    const user = userResult.rows[0];

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `Smart Business Assistant (${user.email})`,
      issuer: "Smart Business Assistant",
    });

    // Generate QR code as data URL
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Store the secret temporarily (not yet enabled)
    try {
      await query(
        `UPDATE users
         SET two_factor_secret = $1
         WHERE id = $2`,
        [secret.base32, userId],
      );
    } catch (err) {
      console.log("two_factor_secret column not available");
    }

    return res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      message: "Scan the QR code with your authenticator app",
    });
  } catch (err) {
    console.error("Erreur setup-2fa:", err);
    return res.status(500).json({
      error: "Erreur serveur",
    });
  }
});

// VERIFY 2FA - Verify TOTP code and enable 2FA
router.post("/verify-2fa", require("../middleware/auth"), async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;

    if (!token) {
      return res.status(400).json({
        error: "Token requis",
      });
    }

    // Get user's 2FA secret
    const userResult = await query(
      `SELECT two_factor_secret FROM users WHERE id = $1`,
      [userId],
    );

    if (userResult.rowCount === 0) {
      return res.status(404).json({
        error: "Utilisateur non trouvé",
      });
    }

    const user = userResult.rows[0];

    if (!user.two_factor_secret) {
      return res.status(400).json({
        error: "2FA non configuré. Veuillez d'abord configurer 2FA.",
      });
    }

    // Verify TOTP token
    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: "base32",
      token: token,
    });

    if (!verified) {
      return res.status(401).json({
        error: "Token invalide",
      });
    }

    // Enable 2FA
    try {
      await query(
        `UPDATE users
         SET two_factor_enabled = true
         WHERE id = $1`,
        [userId],
      );
    } catch (err) {
      console.log("two_factor_enabled column not available");
    }

    return res.json({
      message: "2FA activé avec succès",
      twoFactorEnabled: true,
    });
  } catch (err) {
    console.error("Erreur verify-2fa:", err);
    return res.status(500).json({
      error: "Erreur serveur",
    });
  }
});

// DISABLE 2FA - Require password to disable
router.post("/disable-2fa", require("../middleware/auth"), async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.id;

    if (!password) {
      return res.status(400).json({
        error: "Mot de passe requis",
      });
    }

    // Get user's password hash
    const userResult = await query(
      `SELECT password_hash FROM users WHERE id = $1`,
      [userId],
    );

    if (userResult.rowCount === 0) {
      return res.status(404).json({
        error: "Utilisateur non trouvé",
      });
    }

    // Verify password
    const valid = await bcrypt.compare(
      password,
      userResult.rows[0].password_hash,
    );

    if (!valid) {
      return res.status(401).json({
        error: "Mot de passe incorrect",
      });
    }

    // Disable 2FA and clear secret
    try {
      await query(
        `UPDATE users
         SET two_factor_enabled = false,
             two_factor_secret = NULL
         WHERE id = $1`,
        [userId],
      );
    } catch (err) {
      console.log("2FA columns not available");
    }

    return res.json({
      message: "2FA désactivé avec succès",
      twoFactorEnabled: false,
    });
  } catch (err) {
    console.error("Erreur disable-2fa:", err);
    return res.status(500).json({
      error: "Erreur serveur",
    });
  }
});

module.exports = router;
