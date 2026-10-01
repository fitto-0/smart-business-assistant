const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const rateLimit = require("express-rate-limit");
const http = require("http");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize WebSocket
const { initWebSocket } = require("./lib/websocket");
initWebSocket(server);

// Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        process.env.FRONTEND_URL || "http://localhost:3000",
        "http://127.0.0.1:52266",
        "http://127.0.0.1:3000",
      ];
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(morgan("dev"));

// Apply default rate limiting to all routes
const { defaultLimiter } = require("./middleware/rateLimit");
app.use(defaultLimiter);

// Serve static files (uploads)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ===================== AUTHENTICATION + ORGANIZATION CONTEXT =====================
// Applied once, above every API router, so that:
//   * `req.user` is always the JWT-verified user (no route can forget `auth`);
//   * `req.organizationId` is always a *verified* organization — resolved from
//     `X-Organization-Id`, the query/body, the JWT claim or the user's default
//     membership, and always checked against `organization_members`.
// `middleware/permissions.js` stays the authority on *what* a role may do.
const authMiddleware = require("./middleware/auth");
const { withOrgContext } = require("./middleware/orgContext");

/**
 * The only API routes allowed to run without a JWT.
 * Exhaustive and kept honest by `node backend/db/audit-routes.js`, which lists every
 * route that is not guarded by `auth`.
 */
const PUBLIC_API_ROUTES = [
  { method: "POST", path: "/api/auth/register" },
  { method: "POST", path: "/api/auth/login" },
  { method: "POST", path: "/api/auth/refresh-token" },
  { method: "POST", path: "/api/auth/request-password-reset" },
  { method: "POST", path: "/api/auth/reset-password" },
  { method: "POST", path: "/api/auth/verify-email" },
];

/** Customer-facing surfaces: public catalogs, hosted storefronts and health. */
const PUBLIC_API_PREFIXES = [
  "/api/storefront",
  "/api/store-settings/public",
  "/api/health",
];

/** Reading one invitation by its opaque token (the invitee has no account yet). */
const PUBLIC_GET_PATTERNS = [/^\/api\/invitations\/[A-Za-z0-9_-]+$/];

const isPublicApiRequest = (req) => {
  // Inside the /api mount, req.path is relative to /api (e.g. "/auth/login").
  // The public route lists below are written with the full /api prefix, so
  // reconstruct the full path before comparing.
  const requestPath = `/api${req.path}`;
  return (
    PUBLIC_API_PREFIXES.some(
      (prefix) => requestPath === prefix || requestPath.startsWith(`${prefix}/`),
    ) ||
    PUBLIC_API_ROUTES.some(
      (route) => route.method === req.method && route.path === requestPath,
    ) ||
    (req.method === "GET" &&
      PUBLIC_GET_PATTERNS.some((pattern) => pattern.test(requestPath)))
  );
};

app.use("/api", (req, res, next) => {
  if (isPublicApiRequest(req)) return next();
  return authMiddleware(req, res, next);
});

// `ignoreInvalidHint` keeps the app usable when the browser still holds the id of an
// organization the user was removed from: the request falls back to their default
// organization instead of failing every call.
// Public routes (login, register, health, ...) are skipped entirely — they have no
// `req.user` yet, so org context would reject them with a spurious 401.
app.use("/api", (req, res, next) => {
  if (isPublicApiRequest(req)) return next();
  return withOrgContext({ optional: true, ignoreInvalidHint: true })(req, res, next);
});

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/organizations", require("./routes/organizations"));
app.use("/api/integrations", require("./routes/integrations"));
app.use("/api/ai-copilot", require("./routes/ai-copilot"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/security", require("./routes/security"));
app.use("/api/visualization", require("./routes/visualization"));
app.use("/api/backup", require("./routes/backup"));
app.use("/api/reports", require("./routes/reports"));
app.use("/api/products", require("./routes/products"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/sales", require("./routes/sales"));
app.use("/api/analysis", require("./routes/analysis"));
app.use("/api/csv", require("./routes/csv"));
app.use("/api/chatbot", require("./routes/chatbot"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/storefront", require("./routes/storefront"));
app.use("/api/store-settings", require("./routes/store-settings"));

console.log("Routes loaded:");
console.log("  /api/auth");
console.log("  /api/organizations");
console.log("  /api/invitations");
console.log("  /api/integrations");
console.log("  /api/ai-copilot");
console.log("  /api/dashboard");
console.log("  /api/security");
console.log("  /api/visualization");
console.log("  /api/backup");
console.log("  /api/reports");
console.log("  /api/products");
console.log("  /api/sales");
console.log("  /api/analysis");
console.log("  /api/csv");
console.log("  /api/admin");
console.log("  /api/storefront (public)");

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Smart Business Assistant Backend running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   WebSocket: ws://localhost:${PORT}`);
});

module.exports = app;
