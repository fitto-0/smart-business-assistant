/**
 * Email service using Nodemailer
 * Supports SMTP and various email providers (SendGrid, Mailgun, Gmail, etc.)
 */

const nodemailer = require('nodemailer');

let transporter = null;

/**
 * Initialize email transporter
 */
const initEmail = () => {
  if (transporter) {
    return transporter;
  }

  const config = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  };

  // If no SMTP config, use test account for development
  if (!config.host || !config.auth.user) {
    console.warn('⚠️  Email service not configured. Using test mode.');
    return null;
  }

  transporter = nodemailer.createTransport(config);

  // Verify connection
  transporter.verify((error, success) => {
    if (error) {
      console.error('Email service connection error:', error);
    } else {
      console.log('Email service connected successfully');
    }
  });

  return transporter;
};

/**
 * Get email transporter
 */
const getTransporter = () => {
  if (!transporter) {
    return initEmail();
  }
  return transporter;
};

/**
 * Send email
 */
const sendEmail = async (options) => {
  try {
    const transporter = getTransporter();
    
    if (!transporter) {
      console.log('[Email] Service not configured, skipping email send');
      console.log('[Email] Would send:', options);
      return { success: true, messageId: 'test-mode' };
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@smartbusiness.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`[Email] Sent to ${options.to}: ${info.messageId}`);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email] Send error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Email templates
 */
const templates = {
  /**
   * Team invitation email
   */
  invitation: (data) => {
    const { organizationName, inviterName, role, acceptUrl, declineUrl } = data;
    
    return {
      subject: `You're invited to join ${organizationName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9fafb; border-radius: 8px; margin-top: 20px; }
            .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
            .button-secondary { background: #6B7280; }
            .footer { text-align: center; margin-top: 30px; color: #6B7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Team Invitation</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p><strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> as a <strong>${role}</strong>.</p>
              <p>Click the button below to accept this invitation:</p>
              <p>
                <a href="${acceptUrl}" class="button">Accept Invitation</a>
                <a href="${declineUrl}" class="button button-secondary">Decline</a>
              </p>
              <p>This invitation will expire in 7 days.</p>
              <p>If you didn't expect this invitation, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>Smart Business Assistant</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        You're invited to join ${organizationName}
        
        ${inviterName} has invited you to join ${organizationName} as a ${role}.
        
        Accept: ${acceptUrl}
        Decline: ${declineUrl}
        
        This invitation will expire in 7 days.
        
        If you didn't expect this invitation, you can safely ignore this email.
      `,
    };
  },

  /**
   * Password reset email
   */
  passwordReset: (data) => {
    const { resetUrl, expiryHours } = data;
    
    return {
      subject: 'Reset Your Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9fafb; border-radius: 8px; margin-top: 20px; }
            .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; }
            .footer { text-align: center; margin-top: 30px; color: #6B7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>We received a request to reset your password. Click the button below to reset it:</p>
              <p>
                <a href="${resetUrl}" class="button">Reset Password</a>
              </p>
              <p>This link will expire in ${expiryHours} hours.</p>
              <p>If you didn't request this password reset, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>Smart Business Assistant</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Reset Your Password
        
        We received a request to reset your password.
        
        Reset link: ${resetUrl}
        
        This link will expire in ${expiryHours} hours.
        
        If you didn't request this password reset, you can safely ignore this email.
      `,
    };
  },

  /**
   * Email verification email
   */
  emailVerification: (data) => {
    const { verifyUrl, expiryHours } = data;
    
    return {
      subject: 'Verify Your Email Address',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9fafb; border-radius: 8px; margin-top: 20px; }
            .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; }
            .footer { text-align: center; margin-top: 30px; color: #6B7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Email Verification</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>Please verify your email address by clicking the button below:</p>
              <p>
                <a href="${verifyUrl}" class="button">Verify Email</a>
              </p>
              <p>This link will expire in ${expiryHours} hours.</p>
              <p>If you didn't create an account, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>Smart Business Assistant</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Verify Your Email Address
        
        Please verify your email address by clicking the link below:
        
        ${verifyUrl}
        
        This link will expire in ${expiryHours} hours.
        
        If you didn't create an account, you can safely ignore this email.
      `,
    };
  },

  /**
   * Welcome email
   */
  welcome: (data) => {
    const { name, organizationName, loginUrl } = data;
    
    return {
      subject: `Welcome to Smart Business Assistant`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9fafb; border-radius: 8px; margin-top: 20px; }
            .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; }
            .footer { text-align: center; margin-top: 30px; color: #6B7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome!</h1>
            </div>
            <div class="content">
              <p>Hello <strong>${name}</strong>,</p>
              <p>Welcome to Smart Business Assistant! Your organization <strong>${organizationName}</strong> is ready to use.</p>
              <p>Get started by logging in to your dashboard:</p>
              <p>
                <a href="${loginUrl}" class="button">Go to Dashboard</a>
              </p>
              <p>If you have any questions, feel free to reach out to our support team.</p>
            </div>
            <div class="footer">
              <p>Smart Business Assistant</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to Smart Business Assistant!
        
        Hello ${name},
        
        Welcome to Smart Business Assistant! Your organization ${organizationName} is ready to use.
        
        Login: ${loginUrl}
        
        If you have any questions, feel free to reach out to our support team.
      `,
    };
  },

  /**
   * Notification email
   */
  notification: (data) => {
    const { title, message, actionUrl, organizationName } = data;
    
    return {
      subject: `${title} - ${organizationName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9fafb; border-radius: 8px; margin-top: 20px; }
            .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; }
            .footer { text-align: center; margin-top: 30px; color: #6B7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Notification</h1>
            </div>
            <div class="content">
              <p><strong>${organizationName}</strong></p>
              <h2>${title}</h2>
              <p>${message}</p>
              ${actionUrl ? `<p><a href="${actionUrl}" class="button">View Details</a></p>` : ''}
            </div>
            <div class="footer">
              <p>Smart Business Assistant</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        ${title} - ${organizationName}
        
        ${message}
        
        ${actionUrl ? `View: ${actionUrl}` : ''}
      `,
    };
  },
};

/**
 * Send invitation email
 */
const sendInvitation = async (to, data) => {
  const template = templates.invitation(data);
  return sendEmail({
    to,
    ...template,
  });
};

/**
 * Send password reset email
 */
const sendPasswordReset = async (to, data) => {
  const template = templates.passwordReset(data);
  return sendEmail({
    to,
    ...template,
  });
};

/**
 * Send email verification
 */
const sendEmailVerification = async (to, data) => {
  const template = templates.emailVerification(data);
  return sendEmail({
    to,
    ...template,
  });
};

/**
 * Send welcome email
 */
const sendWelcome = async (to, data) => {
  const template = templates.welcome(data);
  return sendEmail({
    to,
    ...template,
  });
};

/**
 * Send notification email
 */
const sendNotification = async (to, data) => {
  const template = templates.notification(data);
  return sendEmail({
    to,
    ...template,
  });
};

module.exports = {
  initEmail,
  getTransporter,
  sendEmail,
  sendInvitation,
  sendPasswordReset,
  sendEmailVerification,
  sendWelcome,
  sendNotification,
  templates,
};
