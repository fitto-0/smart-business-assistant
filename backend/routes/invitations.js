const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const crypto = require("crypto");
const { query } = require("../db/pool");
const auth = require("../middleware/auth");
const { requirePermission, requireOwnerOrAdmin } = require("../middleware/permissions");
const { createAuditLog } = require("../middleware/audit");

/**
 * Generate a secure invitation token
 */
const generateInvitationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * POST /api/invitations
 * Send an invitation to join an organization
 */
router.post(
  "/",
  auth,
  requirePermission('team', 'invite'),
  [
    body("email").isEmail().normalizeEmail(),
    body("role").isIn(['owner', 'admin', 'manager', 'employee', 'accountant', 'viewer']),
    body("organizationId").isInt(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, role, organizationId } = req.body;
      const userId = req.user.id;

      // Verify user has permission to invite to this organization
      const memberCheck = await query(
        `SELECT role FROM organization_members 
         WHERE user_id = $1 AND organization_id = $2 AND status = 'active'`,
        [userId, organizationId]
      );

      if (memberCheck.rowCount === 0) {
        return res.status(403).json({ error: "Not a member of this organization" });
      }

      const inviterRole = memberCheck.rows[0].role;

      // Only owners can invite other owners
      if (role === 'owner' && inviterRole !== 'owner') {
        return res.status(403).json({ error: "Only owners can invite other owners" });
      }

      // Check if email already exists as a member
      const existingMember = await query(
        `SELECT om.status FROM organization_members om
         JOIN users u ON om.user_id = u.id
         WHERE om.organization_id = $1 AND u.email = $2`,
        [organizationId, email]
      );

      if (existingMember.rowCount > 0) {
        if (existingMember.rows[0].status === 'active') {
          return res.status(400).json({ error: "User is already a member of this organization" });
        }
        if (existingMember.rows[0].status === 'pending') {
          return res.status(400).json({ error: "User already has a pending invitation" });
        }
      }

      // Check if there's already a pending invitation for this email
      const existingInvitation = await query(
        `SELECT id, expires_at, status FROM invitations
         WHERE organization_id = $1 AND email = $2 AND status = 'pending'`,
        [organizationId, email]
      );

      if (existingInvitation.rowCount > 0) {
        const invitation = existingInvitation.rows[0];
        
        // If invitation is expired, delete it and create a new one
        if (new Date(invitation.expires_at) < new Date()) {
          await query(
            `UPDATE invitations SET status = 'expired' WHERE id = $1`,
            [invitation.id]
          );
        } else {
          return res.status(400).json({ error: "Pending invitation already exists for this email" });
        }
      }

      // Create invitation token
      const token = generateInvitationToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

      // Insert invitation
      const result = await query(
        `INSERT INTO invitations (organization_id, email, role, invited_by, token, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [organizationId, email, role, userId, token, expiresAt]
      );

      const invitation = result.rows[0];

      // Log audit
      await createAuditLog({
        organizationId,
        userId,
        action: 'invite',
        entityType: 'invitation',
        entityId: invitation.id,
        newValues: { email, role },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      // TODO: Send invitation email
      // This would integrate with an email service like SendGrid, Mailgun, or AWS SES
      console.log(`Invitation email would be sent to ${email} with token ${token}`);

      return res.status(201).json({
        message: "Invitation sent successfully",
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          expires_at: invitation.expires_at,
        },
      });
    } catch (err) {
      console.error("Error creating invitation:", err);
      return res.status(500).json({ error: "Error creating invitation" });
    }
  }
);

/**
 * GET /api/invitations/:token
 * Get invitation details by token (public endpoint for acceptance page)
 */
router.get("/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const result = await query(
      `SELECT 
        i.*,
        o.name as organization_name,
        o.slug as organization_slug,
        inviter.name as invited_by_name
       FROM invitations i
       JOIN organizations o ON i.organization_id = o.id
       JOIN users inviter ON i.invited_by = inviter.id
       WHERE i.token = $1`,
      [token]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Invitation not found" });
    }

    const invitation = result.rows[0];

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      await query(
        `UPDATE invitations SET status = 'expired' WHERE id = $1`,
        [invitation.id]
      );
      return res.status(400).json({ error: "Invitation has expired" });
    }

    // Check if invitation is already accepted or declined
    if (invitation.status !== 'pending') {
      return res.status(400).json({ 
        error: `Invitation has been ${invitation.status}`,
        status: invitation.status,
      });
    }

    return res.json({
      invitation: {
        id: invitation.id,
        organization_name: invitation.organization_name,
        organization_slug: invitation.organization_slug,
        role: invitation.role,
        invited_by: invitation.invited_by_name,
        email: invitation.email,
        expires_at: invitation.expires_at,
      },
    });
  } catch (err) {
    console.error("Error fetching invitation:", err);
    return res.status(500).json({ error: "Error fetching invitation" });
  }
});

/**
 * POST /api/invitations/:token/accept
 * Accept an invitation (requires authentication)
 */
router.post("/:token/accept", auth, async (req, res) => {
  try {
    const { token } = req.params;
    const userId = req.user.id;

    // Get invitation
    const invitationResult = await query(
      `SELECT * FROM invitations WHERE token = $1`,
      [token]
    );

    if (invitationResult.rowCount === 0) {
      return res.status(404).json({ error: "Invitation not found" });
    }

    const invitation = invitationResult.rows[0];

    // Check invitation status
    if (invitation.status !== 'pending') {
      return res.status(400).json({ 
        error: `Invitation has been ${invitation.status}`,
        status: invitation.status,
      });
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      await query(
        `UPDATE invitations SET status = 'expired' WHERE id = $1`,
        [invitation.id]
      );
      return res.status(400).json({ error: "Invitation has expired" });
    }

    // Verify email matches
    const userResult = await query(
      `SELECT email FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    if (userResult.rows[0].email.toLowerCase() !== invitation.email.toLowerCase()) {
      return res.status(400).json({ error: "Invitation email does not match your account email" });
    }

    // Check if user is already a member
    const existingMember = await query(
      `SELECT id, status FROM organization_members
       WHERE user_id = $1 AND organization_id = $2`,
      [userId, invitation.organization_id]
    );

    if (existingMember.rowCount > 0) {
      // Reactivate if inactive
      if (existingMember.rows[0].status === 'inactive') {
        await query(
          `UPDATE organization_members 
           SET status = 'active', role = $1, joined_at = NOW(), updated_at = NOW()
           WHERE id = $2`,
          [invitation.role, existingMember.rows[0].id]
        );
      } else {
        return res.status(400).json({ error: "You are already a member of this organization" });
      }
    } else {
      // Add as new member
      await query(
        `INSERT INTO organization_members (organization_id, user_id, role, status, invited_by, joined_at)
         VALUES ($1, $2, $3, 'active', $4, NOW())`,
        [invitation.organization_id, userId, invitation.role, invitation.invited_by]
      );
    }

    // Update invitation status
    await query(
      `UPDATE invitations SET status = 'accepted', accepted_at = NOW() WHERE id = $1`,
      [invitation.id]
    );

    // Log audit
    await createAuditLog({
      organizationId: invitation.organization_id,
      userId,
      action: 'accept_invitation',
      entityType: 'invitation',
      entityId: invitation.id,
      newValues: { role: invitation.role },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({
      message: "Invitation accepted successfully",
    });
  } catch (err) {
    console.error("Error accepting invitation:", err);
    return res.status(500).json({ error: "Error accepting invitation" });
  }
});

/**
 * POST /api/invitations/:token/decline
 * Decline an invitation (requires authentication)
 */
router.post("/:token/decline", auth, async (req, res) => {
  try {
    const { token } = req.params;
    const userId = req.user.id;

    // Get invitation
    const invitationResult = await query(
      `SELECT * FROM invitations WHERE token = $1`,
      [token]
    );

    if (invitationResult.rowCount === 0) {
      return res.status(404).json({ error: "Invitation not found" });
    }

    const invitation = invitationResult.rows[0];

    // Check invitation status
    if (invitation.status !== 'pending') {
      return res.status(400).json({ 
        error: `Invitation has been ${invitation.status}`,
        status: invitation.status,
      });
    }

    // Verify email matches
    const userResult = await query(
      `SELECT email FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    if (userResult.rows[0].email.toLowerCase() !== invitation.email.toLowerCase()) {
      return res.status(400).json({ error: "Invitation email does not match your account email" });
    }

    // Update invitation status
    await query(
      `UPDATE invitations SET status = 'declined', declined_at = NOW() WHERE id = $1`,
      [invitation.id]
    );

    // Log audit
    await createAuditLog({
      organizationId: invitation.organization_id,
      userId,
      action: 'decline_invitation',
      entityType: 'invitation',
      entityId: invitation.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({
      message: "Invitation declined",
    });
  } catch (err) {
    console.error("Error declining invitation:", err);
    return res.status(500).json({ error: "Error declining invitation" });
  }
});

/**
 * GET /api/organizations/:id/invitations
 * Get all pending invitations for an organization
 */
router.get("/organizations/:id/invitations", auth, requirePermission('team', 'view'), async (req, res) => {
  try {
    const organizationId = parseInt(req.params.id);

    const result = await query(
      `SELECT 
        i.*,
        inviter.name as invited_by_name
       FROM invitations i
       JOIN users inviter ON i.invited_by = inviter.id
       WHERE i.organization_id = $1 AND i.status = 'pending'
       ORDER BY i.created_at DESC`,
      [organizationId]
    );

    return res.json({
      invitations: result.rows,
    });
  } catch (err) {
    console.error("Error fetching invitations:", err);
    return res.status(500).json({ error: "Error fetching invitations" });
  }
});

/**
 * DELETE /api/invitations/:id
 * Cancel/delete an invitation
 */
router.delete("/:id", auth, requireOwnerOrAdmin, async (req, res) => {
  try {
    const invitationId = parseInt(req.params.id);
    const userId = req.user.id;

    // Get invitation
    const invitationResult = await query(
      `SELECT i.*, om.organization_id FROM invitations i
       JOIN organization_members om ON i.organization_id = om.organization_id
       WHERE i.id = $1 AND om.user_id = $2 AND om.status = 'active'`,
      [invitationId, userId]
    );

    if (invitationResult.rowCount === 0) {
      return res.status(404).json({ error: "Invitation not found or no access" });
    }

    const invitation = invitationResult.rows[0];

    // Delete invitation
    await query(
      `DELETE FROM invitations WHERE id = $1`,
      [invitationId]
    );

    // Log audit
    await createAuditLog({
      organizationId: invitation.organization_id,
      userId,
      action: 'cancel_invitation',
      entityType: 'invitation',
      entityId: invitationId,
      oldValues: { email: invitation.email, role: invitation.role },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({
      message: "Invitation cancelled successfully",
    });
  } catch (err) {
    console.error("Error cancelling invitation:", err);
    return res.status(500).json({ error: "Error cancelling invitation" });
  }
});

module.exports = router;
