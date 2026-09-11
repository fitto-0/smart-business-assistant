/**
 * Security utilities for advanced security features
 */

const speakeasy = require('speakeasy');
const { query } = require('../db/pool');

/**
 * Generate 2FA secret for user
 */
const generate2FASecret = async (userId) => {
  const secret = speakeasy.generateSecret({
    name: `Smart Business Assistant (${userId})`,
    issuer: 'Smart Business Assistant',
  });

  // Store secret in database
  await query(
    `UPDATE users 
     SET two_factor_secret = $1, two_factor_enabled = false 
     WHERE id = $2`,
    [secret.base32, userId]
  );

  return {
    secret: secret.base32,
    qrCode: secret.otpauth_url,
  };
};

/**
 * Verify 2FA token
 */
const verify2FAToken = (secret, token) => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2, // Allow 2 time steps for clock drift
  });
};

/**
 * Enable 2FA for user
 */
const enable2FA = async (userId, token) => {
  const user = await query(
    `SELECT two_factor_secret FROM users WHERE id = $1`,
    [userId]
  );

  if (user.rowCount === 0) {
    return { success: false, error: 'User not found' };
  }

  const isValid = verify2FAToken(user.rows[0].two_factor_secret, token);

  if (!isValid) {
    return { success: false, error: 'Invalid token' };
  }

  await query(
    `UPDATE users 
     SET two_factor_enabled = true 
     WHERE id = $1`,
    [userId]
  );

  return { success: true };
};

/**
 * Disable 2FA for user
 */
const disable2FA = async (userId, token) => {
  const user = await query(
    `SELECT two_factor_secret FROM users WHERE id = $1`,
    [userId]
  );

  if (user.rowCount === 0) {
    return { success: false, error: 'User not found' };
  }

  const isValid = verify2FAToken(user.rows[0].two_factor_secret, token);

  if (!isValid) {
    return { success: false, error: 'Invalid token' };
  }

  await query(
    `UPDATE users 
     SET two_factor_enabled = false, two_factor_secret = NULL 
     WHERE id = $1`,
    [userId]
  );

  return { success: true };
};

/**
 * Check if IP is whitelisted for organization
 */
const isIPWhitelisted = async (organizationId, ip) => {
  const result = await query(
    `SELECT ip_addresses FROM ip_whitelist 
     WHERE organization_id = $1 AND status = 'active'`,
    [organizationId]
  );

  if (result.rowCount === 0) {
    return true; // No whitelist configured, allow all
  }

  const whitelist = result.rows[0].ip_addresses || [];
  
  // If whitelist is empty array, allow all
  if (whitelist.length === 0) {
    return true;
  }

  // Check if IP is in whitelist
  return whitelist.includes(ip) || whitelist.includes('*');
};

/**
 * Add IP to organization whitelist
 */
const addToWhitelist = async (organizationId, ip) => {
  const result = await query(
    `SELECT ip_addresses FROM ip_whitelist 
     WHERE organization_id = $1`,
    [organizationId]
  );

  if (result.rowCount === 0) {
    await query(
      `INSERT INTO ip_whitelist (organization_id, ip_addresses, status, created_at)
       VALUES ($1, ARRAY[$2], 'active', NOW())`,
      [organizationId, ip]
    );
  } else {
    await query(
      `UPDATE ip_whitelist 
       SET ip_addresses = array_append(ip_addresses, $2),
           updated_at = NOW()
       WHERE organization_id = $1`,
      [organizationId, ip]
    );
  }

  return { success: true };
};

/**
 * Remove IP from organization whitelist
 */
const removeFromWhitelist = async (organizationId, ip) => {
  await query(
    `UPDATE ip_whitelist 
     SET ip_addresses = array_remove(ip_addresses, $2),
         updated_at = NOW()
     WHERE organization_id = $1`,
    [organizationId, ip]
  );

  return { success: true };
};

/**
 * Get organization whitelist
 */
const getWhitelist = async (organizationId) => {
  const result = await query(
    `SELECT ip_addresses, status FROM ip_whitelist 
     WHERE organization_id = $1`,
    [organizationId]
  );

  if (result.rowCount === 0) {
    return { ip_addresses: [], status: 'inactive' };
  }

  return result.rows[0];
};

/**
 * Enable/disable IP whitelist for organization
 */
const setWhitelistStatus = async (organizationId, status) => {
  await query(
    `UPDATE ip_whitelist 
     SET status = $2, updated_at = NOW()
     WHERE organization_id = $1`,
    [organizationId, status]
  );

  return { success: true };
};

/**
 * Log security event
 */
const logSecurityEvent = async (userId, organizationId, eventType, details, ipAddress, userAgent) => {
  await query(
    `INSERT INTO security_events (user_id, organization_id, event_type, details, ip_address, user_agent, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
    [userId, organizationId, eventType, details, ipAddress, userAgent]
  );
};

/**
 * Get security events for organization
 */
const getSecurityEvents = async (organizationId, limit = 50) => {
  const result = await query(
    `SELECT * FROM security_events 
     WHERE organization_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [organizationId, limit]
  );

  return result.rows;
};

/**
 * Check for suspicious activity
 */
const checkSuspiciousActivity = async (userId, organizationId) => {
  // Check for multiple failed login attempts
  const failedLogins = await query(
    `SELECT COUNT(*) as count 
     FROM login_log 
     WHERE user_id = $1 AND success = false 
     AND login_time >= NOW() - INTERVAL '1 hour'`,
    [userId]
  );

  if (parseInt(failedLogins.rows[0].count) >= 5) {
    return {
      suspicious: true,
      reason: 'Multiple failed login attempts',
      count: failedLogins.rows[0].count,
    };
  }

  // Check for login from unusual location (simplified)
  const recentLogins = await query(
    `SELECT DISTINCT ip_address 
     FROM login_log 
     WHERE user_id = $1 
     AND login_time >= NOW() - INTERVAL '24 hours'
     ORDER BY login_time DESC`,
    [userId]
  );

  if (recentLogins.rowCount > 5) {
    return {
      suspicious: true,
      reason: 'Multiple login locations',
      locations: recentLogins.rowCount,
    };
  }

  return { suspicious: false };
};

module.exports = {
  generate2FASecret,
  verify2FAToken,
  enable2FA,
  disable2FA,
  isIPWhitelisted,
  addToWhitelist,
  removeFromWhitelist,
  getWhitelist,
  setWhitelistStatus,
  logSecurityEvent,
  getSecurityEvents,
  checkSuspiciousActivity,
};
