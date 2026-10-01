const jwt = require("jsonwebtoken");

// JWT_SECRET must be set in environment variables for production
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is required in production');
}

const JWT_SECRET_FALLBACK = "aR2vT9xK8mNpQ4sW7zE6hJ3cL5yB1uF0dG8iV2nA"; // Only for development

/**
 * Authentication middleware
 * Verifies JWT token and sets req.user and req.organizationId
 */
module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: "Token manquant",
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Format du token invalide",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        error: "Token manquant",
      });
    }

    const secret = JWT_SECRET || JWT_SECRET_FALLBACK;
    const decoded = jwt.verify(token, secret);

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    // Set organization context if present in token
    if (decoded.organizationId) {
      req.organizationId = decoded.organizationId;
    }

    // Unverified organization *hint* from the client (X-Organization-Id).
    // It is deliberately NOT written to req.organizationId: only
    // `middleware/orgContext.js` may promote a hint into a verified context,
    // after checking the user is an active member of that organization.
    const hintHeader =
      req.headers["x-organization-id"] || req.headers["x-org-id"];
    const hintValue = Array.isArray(hintHeader) ? hintHeader[0] : hintHeader;
    const hintId = Number.parseInt(hintValue, 10);
    if (Number.isInteger(hintId) && hintId > 0) {
      req.organizationHintId = hintId;
    }

    next();
  } catch (err) {
    console.error("Auth error:", err.message);

    return res.status(403).json({
      error: "Token invalide ou expiré",
    });
  }
};

/**
 * Middleware to require organization context
 * Ensures the user has selected an organization to work with
 */
module.exports.requireOrganization = (req, res, next) => {
  if (!req.organizationId) {
    return res.status(400).json({
      error: "Organization context required. Please select an organization.",
    });
  }
  next();
};

/**
 * Legacy role check (deprecated - use permissions middleware instead)
 */
module.exports.requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: "Permissions insuffisantes" });
  }

  next();
};
