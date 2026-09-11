/**
 * Rate limiting middleware
 * Prevents abuse by limiting the number of requests from a single IP
 */

const rateLimit = require('express-rate-limit');

// Default rate limiter for general API endpoints
const defaultLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests per window
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health';
  },
});

// Strict rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: "Too many authentication attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Organization-based rate limiter
const createOrganizationLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
  const limiter = rateLimit({
    windowMs,
    max,
    keyGenerator: (req) => {
      // Use organization ID if available, otherwise fall back to IP
      return req.organizationId || req.ip;
    },
    message: "Too many requests from this organization, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  });
  return limiter;
};

// API rate limiter for external integrations
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 requests per minute
  message: "API rate limit exceeded, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  defaultLimiter,
  authLimiter,
  createOrganizationLimiter,
  apiLimiter,
};
