const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const { query } = require("../db/pool");
const auth = require("../middleware/auth");
const { requirePermission } = require("../middleware/permissions");
const { createAuditLog } = require("../middleware/audit");
const security = require("../lib/security");

/**
 * POST /api/security/2fa/setup
 * Setup 2FA for user
 */
router.post(
  "/2fa/setup",
  auth,
  async (req, res) => {
    try {
      const userId = req.user.id;

      const result = await security.generate2FASecret(userId);

      // Log audit
      await createAuditLog({
        organizationId: req.organizationId,
        userId,
        action: '2fa_setup_init',
        entityType: 'security',
        newValues: { userId },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.json(result);
    } catch (err) {
      console.error("Error setting up 2FA:", err);
      return res.status(500).json({ error: "Error setting up 2FA" });
    }
  }
);

/**
 * POST /api/security/2fa/enable
 * Enable 2FA with token verification
 */
router.post(
  "/2fa/enable",
  auth,
  [
    body("token").isString().isLength({ min: 6, max: 6 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { token } = req.body;
      const userId = req.user.id;

      const result = await security.enable2FA(userId, token);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      // Log audit
      await createAuditLog({
        organizationId: req.organizationId,
        userId,
        action: '2fa_enabled',
        entityType: 'security',
        newValues: { userId },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.json({ message: "2FA enabled successfully" });
    } catch (err) {
      console.error("Error enabling 2FA:", err);
      return res.status(500).json({ error: "Error enabling 2FA" });
    }
  }
);

/**
 * POST /api/security/2fa/disable
 * Disable 2FA
 */
router.post(
  "/2fa/disable",
  auth,
  [
    body("token").isString().isLength({ min: 6, max: 6 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { token } = req.body;
      const userId = req.user.id;

      const result = await security.disable2FA(userId, token);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      // Log audit
      await createAuditLog({
        organizationId: req.organizationId,
        userId,
        action: '2fa_disabled',
        entityType: 'security',
        newValues: { userId },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.json({ message: "2FA disabled successfully" });
    } catch (err) {
      console.error("Error disabling 2FA:", err);
      return res.status(500).json({ error: "Error disabling 2FA" });
    }
  }
);

/**
 * GET /api/security/2fa/status
 * Get 2FA status for user
 */
router.get(
  "/2fa/status",
  auth,
  async (req, res) => {
    try {
      const userId = req.user.id;

      const result = await query(
        `SELECT two_factor_enabled FROM users WHERE id = $1`,
        [userId]
      );

      return res.json({
        enabled: result.rows[0].two_factor_enabled,
      });
    } catch (err) {
      console.error("Error getting 2FA status:", err);
      return res.status(500).json({ error: "Error getting 2FA status" });
    }
  }
);

/**
 * GET /api/security/ip-whitelist
 * Get IP whitelist for organization
 */
router.get(
  "/ip-whitelist",
  auth,
  requirePermission('security', 'view'),
  async (req, res) => {
    try {
      const organizationId = req.organizationId;

      const whitelist = await security.getWhitelist(organizationId);

      return res.json(whitelist);
    } catch (err) {
      console.error("Error getting IP whitelist:", err);
      return res.status(500).json({ error: "Error getting IP whitelist" });
    }
  }
);

/**
 * POST /api/security/ip-whitelist
 * Add IP to whitelist
 */
router.post(
  "/ip-whitelist",
  auth,
  requirePermission('security', 'manage'),
  [
    body("ip").isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { ip } = req.body;
      const organizationId = req.organizationId;
      const userId = req.user.id;

      await security.addToWhitelist(organizationId, ip);

      // Log audit
      await createAuditLog({
        organizationId,
        userId,
        action: 'ip_whitelist_add',
        entityType: 'security',
        newValues: { ip },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.json({ message: "IP added to whitelist" });
    } catch (err) {
      console.error("Error adding IP to whitelist:", err);
      return res.status(500).json({ error: "Error adding IP to whitelist" });
    }
  }
);

/**
 * DELETE /api/security/ip-whitelist/:ip
 * Remove IP from whitelist
 */
router.delete(
  "/ip-whitelist/:ip",
  auth,
  requirePermission('security', 'manage'),
  async (req, res) => {
    try {
      const { ip } = req.params;
      const organizationId = req.organizationId;
      const userId = req.user.id;

      await security.removeFromWhitelist(organizationId, ip);

      // Log audit
      await createAuditLog({
        organizationId,
        userId,
        action: 'ip_whitelist_remove',
        entityType: 'security',
        newValues: { ip },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.json({ message: "IP removed from whitelist" });
    } catch (err) {
      console.error("Error removing IP from whitelist:", err);
      return res.status(500).json({ error: "Error removing IP from whitelist" });
    }
  }
);

/**
 * PUT /api/security/ip-whitelist/status
 * Enable/disable IP whitelist
 */
router.put(
  "/ip-whitelist/status",
  auth,
  requirePermission('security', 'manage'),
  [
    body("status").isIn(['active', 'inactive']),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { status } = req.body;
      const organizationId = req.organizationId;
      const userId = req.user.id;

      await security.setWhitelistStatus(organizationId, status);

      // Log audit
      await createAuditLog({
        organizationId,
        userId,
        action: 'ip_whitelist_status',
        entityType: 'security',
        newValues: { status },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.json({ message: `IP whitelist ${status}` });
    } catch (err) {
      console.error("Error setting whitelist status:", err);
      return res.status(500).json({ error: "Error setting whitelist status" });
    }
  }
);

/**
 * GET /api/security/events
 * Get security events for organization
 */
router.get(
  "/events",
  auth,
  requirePermission('security', 'view'),
  async (req, res) => {
    try {
      const { limit = 50 } = req.query;
      const organizationId = req.organizationId;

      const events = await security.getSecurityEvents(organizationId, limit);

      return res.json({ events });
    } catch (err) {
      console.error("Error getting security events:", err);
      return res.status(500).json({ error: "Error getting security events" });
    }
  }
);

/**
 * GET /api/security/check-suspicious
 * Check for suspicious activity
 */
router.get(
  "/check-suspicious",
  auth,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const organizationId = req.organizationId;

      const result = await security.checkSuspiciousActivity(userId, organizationId);

      return res.json(result);
    } catch (err) {
      console.error("Error checking suspicious activity:", err);
      return res.status(500).json({ error: "Error checking suspicious activity" });
    }
  }
);

module.exports = router;
