const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const auth = require("../middleware/auth");
const { requirePermission } = require("../middleware/permissions");
const { createAuditLog } = require("../middleware/audit");
const backup = require("../lib/backup");

/**
 * POST /api/backup/create
 * Create a new backup
 */
router.post(
  "/create",
  auth,
  requirePermission('admin', 'manage'),
  async (req, res) => {
    try {
      const { organizationId } = req.body;
      const userId = req.user.id;
      const orgId = organizationId || req.organizationId;

      const result = await backup.createBackup(orgId);

      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      // Log audit
      await createAuditLog({
        organizationId: req.organizationId,
        userId,
        action: 'backup_create',
        entityType: 'backup',
        newValues: { filename: result.filename },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.json(result);
    } catch (err) {
      console.error("Error creating backup:", err);
      return res.status(500).json({ error: "Error creating backup" });
    }
  }
);

/**
 * GET /api/backup/list
 * List available backups
 */
router.get(
  "/list",
  auth,
  requirePermission('admin', 'view'),
  async (req, res) => {
    try {
      const { organizationId } = req.query;
      const orgId = organizationId || req.organizationId;

      const result = await backup.listBackups(orgId);

      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      return res.json(result);
    } catch (err) {
      console.error("Error listing backups:", err);
      return res.status(500).json({ error: "Error listing backups" });
    }
  }
);

/**
 * POST /api/backup/restore/:id
 * Restore from backup
 */
router.post(
  "/restore/:id",
  auth,
  requirePermission('admin', 'manage'),
  async (req, res) => {
    try {
      const backupId = req.params.id;
      const userId = req.user.id;

      const result = await backup.restoreBackup(backupId);

      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      // Log audit
      await createAuditLog({
        organizationId: req.organizationId,
        userId,
        action: 'backup_restore',
        entityType: 'backup',
        newValues: { backupId },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.json(result);
    } catch (err) {
      console.error("Error restoring backup:", err);
      return res.status(500).json({ error: "Error restoring backup" });
    }
  }
);

/**
 * DELETE /api/backup/:id
 * Delete a backup
 */
router.delete(
  "/:id",
  auth,
  requirePermission('admin', 'manage'),
  async (req, res) => {
    try {
      const backupId = req.params.id;
      const userId = req.user.id;

      const result = await backup.deleteBackup(backupId);

      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      // Log audit
      await createAuditLog({
        organizationId: req.organizationId,
        userId,
        action: 'backup_delete',
        entityType: 'backup',
        newValues: { backupId },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.json(result);
    } catch (err) {
      console.error("Error deleting backup:", err);
      return res.status(500).json({ error: "Error deleting backup" });
    }
  }
);

/**
 * POST /api/backup/schedule
 * Schedule automated backups
 */
router.post(
  "/schedule",
  auth,
  requirePermission('admin', 'manage'),
  [
    body("frequency").isIn(['daily', 'weekly', 'monthly']),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { frequency } = req.body;
      const organizationId = req.organizationId;
      const userId = req.user.id;

      const result = await backup.scheduleBackup(organizationId, frequency);

      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      // Log audit
      await createAuditLog({
        organizationId,
        userId,
        action: 'backup_schedule',
        entityType: 'backup',
        newValues: { frequency },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.json({ message: `Backup scheduled: ${frequency}` });
    } catch (err) {
      console.error("Error scheduling backup:", err);
      return res.status(500).json({ error: "Error scheduling backup" });
    }
  }
);

/**
 * GET /api/backup/schedule
 * Get backup schedule
 */
router.get(
  "/schedule",
  auth,
  requirePermission('admin', 'view'),
  async (req, res) => {
    try {
      const organizationId = req.organizationId;

      const result = await backup.getBackupSchedule(organizationId);

      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      return res.json(result);
    } catch (err) {
      console.error("Error getting backup schedule:", err);
      return res.status(500).json({ error: "Error getting backup schedule" });
    }
  }
);

/**
 * PUT /api/backup/schedule/disable
 * Disable backup schedule
 */
router.put(
  "/schedule/disable",
  auth,
  requirePermission('admin', 'manage'),
  async (req, res) => {
    try {
      const organizationId = req.organizationId;
      const userId = req.user.id;

      const result = await backup.disableBackupSchedule(organizationId);

      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      // Log audit
      await createAuditLog({
        organizationId,
        userId,
        action: 'backup_schedule_disable',
        entityType: 'backup',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.json({ message: "Backup schedule disabled" });
    } catch (err) {
      console.error("Error disabling backup schedule:", err);
      return res.status(500).json({ error: "Error disabling backup schedule" });
    }
  }
);

/**
 * POST /api/backup/cleanup
 * Clean up old backups
 */
router.post(
  "/cleanup",
  auth,
  requirePermission('admin', 'manage'),
  [
    body("retentionDays").optional().isInt({ min: 1 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { retentionDays = 30 } = req.body;
      const userId = req.user.id;

      const result = await backup.cleanupOldBackups(retentionDays);

      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      // Log audit
      await createAuditLog({
        organizationId: req.organizationId,
        userId,
        action: 'backup_cleanup',
        entityType: 'backup',
        newValues: { retentionDays, deleted: result.deleted },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.json(result);
    } catch (err) {
      console.error("Error cleaning up backups:", err);
      return res.status(500).json({ error: "Error cleaning up backups" });
    }
  }
);

module.exports = router;
