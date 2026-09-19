/**
 * Rate limiting middleware
 * Prevents abuse by limiting the number of requests from a single IP
 */

const rateLimit = require("express-rate-limit");

// Détection de l'environnement
const isDev = process.env.NODE_ENV !== "production";

// Limite par défaut (très permissive en dev)
const DEV_MAX = 100000; // 100 000 requêtes / 15 min en dev
const PROD_MAX = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;

const defaultLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: isDev ? DEV_MAX : PROD_MAX,
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === "/api/health";
  },
});

// Limite stricte pour l'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 5, // 10 000 en dev, 5 en prod
  message: "Too many authentication attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Limite par organisation
const createOrganizationLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
  const limiter = rateLimit({
    windowMs,
    max: isDev ? 100000 : max,
    keyGenerator: (req) => {
      return req.organizationId || req.ip;
    },
    message:
      "Too many requests from this organization, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  });
  return limiter;
};

// Limite pour les intégrations externes
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? 1000 : 30,
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
