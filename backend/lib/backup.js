/**
 * Database Backup and Restore Service
 * Handles automated backups and restoration
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { query } = require('../db/pool');

const BACKUP_DIR = path.join(__dirname, '../../backups');

/**
 * Ensure backup directory exists
 */
const ensureBackupDir = () => {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
};

/**
 * Create database backup
 */
const createBackup = async (organizationId = null) => {
  try {
    ensureBackupDir();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = organizationId 
      ? `backup_org_${organizationId}_${timestamp}.sql`
      : `backup_full_${timestamp}.sql`;
    
    const filepath = path.join(BACKUP_DIR, filename);

    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    };

    let pgDumpCommand = `pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -F p`;

    if (organizationId) {
      // Backup only organization-specific data
      pgDumpCommand += ` -t organizations -t organization_members -t branches -t products -t sales -t categories -t audit_logs -t notifications -t integrations -t ip_whitelist -t security_events`;
    }

    pgDumpCommand += ` > "${filepath}"`;

    // Set PGPASSWORD environment variable for pg_dump
    const env = { ...process.env, PGPASSWORD: dbConfig.password };

    return new Promise((resolve, reject) => {
      exec(pgDumpCommand, { env }, (error, stdout, stderr) => {
        if (error) {
          console.error('Backup error:', error);
          reject({ success: false, error: error.message });
          return;
        }

        // Get file size
        const stats = fs.statSync(filepath);
        const fileSize = (stats.size / 1024 / 1024).toFixed(2); // MB

        // Log backup to database
        query(
          `INSERT INTO backups (organization_id, filename, filepath, file_size, status, created_at)
           VALUES ($1, $2, $3, $4, 'completed', NOW())
           RETURNING id`,
          [organizationId, filename, filepath, fileSize]
        ).then(() => {
          resolve({
            success: true,
            filename,
            filepath,
            fileSize: `${fileSize} MB`,
            timestamp,
          });
        }).catch(err => {
          // Still return success even if logging fails
          resolve({
            success: true,
            filename,
            filepath,
            fileSize: `${fileSize} MB`,
            timestamp,
          });
        });
      });
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Restore database from backup
 */
const restoreBackup = async (backupId) => {
  try {
    // Get backup info
    const backup = await query(
      `SELECT * FROM backups WHERE id = $1`,
      [backupId]
    );

    if (backup.rowCount === 0) {
      return { success: false, error: 'Backup not found' };
    }

    const { filepath } = backup.rows[0];

    if (!fs.existsSync(filepath)) {
      return { success: false, error: 'Backup file not found' };
    }

    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    };

    const psqlCommand = `psql -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -f "${filepath}"`;

    const env = { ...process.env, PGPASSWORD: dbConfig.password };

    return new Promise((resolve, reject) => {
      exec(psqlCommand, { env }, (error, stdout, stderr) => {
        if (error) {
          console.error('Restore error:', error);
          reject({ success: false, error: error.message });
          return;
        }

        // Update backup status
        query(
          `UPDATE backups SET last_restored_at = NOW() WHERE id = $1`,
          [backupId]
        ).then(() => {
          resolve({ success: true, message: 'Database restored successfully' });
        }).catch(() => {
          resolve({ success: true, message: 'Database restored successfully' });
        });
      });
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * List available backups
 */
const listBackups = async (organizationId = null) => {
  try {
    let queryStr = 'SELECT * FROM backups';
    const params = [];

    if (organizationId) {
      queryStr += ' WHERE organization_id = $1';
      params.push(organizationId);
    }

    queryStr += ' ORDER BY created_at DESC';

    const result = await query(queryStr, params);

    return {
      success: true,
      backups: result.rows.map(row => ({
        ...row,
        file_size: `${row.file_size} MB`,
      })),
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Delete backup
 */
const deleteBackup = async (backupId) => {
  try {
    const backup = await query(
      `SELECT filepath FROM backups WHERE id = $1`,
      [backupId]
    );

    if (backup.rowCount === 0) {
      return { success: false, error: 'Backup not found' };
    }

    const { filepath } = backup.rows[0];

    // Delete file
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

    // Delete database record
    await query(
      `DELETE FROM backups WHERE id = $1`,
      [backupId]
    );

    return { success: true, message: 'Backup deleted successfully' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Schedule automated backup
 */
const scheduleBackup = async (organizationId, frequency) => {
  try {
    await query(
      `INSERT INTO backup_schedules (organization_id, frequency, status, created_at, updated_at)
       VALUES ($1, $2, 'active', NOW(), NOW())
       ON CONFLICT (organization_id) 
       DO UPDATE SET frequency = $2, status = 'active', updated_at = NOW()`,
      [organizationId, frequency]
    );

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Get backup schedule
 */
const getBackupSchedule = async (organizationId) => {
  try {
    const result = await query(
      `SELECT * FROM backup_schedules WHERE organization_id = $1`,
      [organizationId]
    );

    if (result.rowCount === 0) {
      return { success: true, schedule: null };
    }

    return { success: true, schedule: result.rows[0] };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Disable backup schedule
 */
const disableBackupSchedule = async (organizationId) => {
  try {
    await query(
      `UPDATE backup_schedules SET status = 'disabled', updated_at = NOW() WHERE organization_id = $1`,
      [organizationId]
    );

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Clean up old backups (older than retention period)
 */
const cleanupOldBackups = async (retentionDays = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const oldBackups = await query(
      `SELECT id, filepath FROM backups 
       WHERE created_at < $1 
       AND status = 'completed'`,
      [cutoffDate]
    );

    for (const backup of oldBackups.rows) {
      if (fs.existsSync(backup.filepath)) {
        fs.unlinkSync(backup.filepath);
      }

      await query(
        `DELETE FROM backups WHERE id = $1`,
        [backup.id]
      );
    }

    return {
      success: true,
      deleted: oldBackups.rowCount,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = {
  createBackup,
  restoreBackup,
  listBackups,
  deleteBackup,
  scheduleBackup,
  getBackupSchedule,
  disableBackupSchedule,
  cleanupOldBackups,
};
