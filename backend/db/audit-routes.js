/**
 * One-off audit helper: list every express route of the mounted routers together
 * with the path and whether an `auth` middleware guards it.
 *
 * Used to build the public allowlist of `server.js` (global auth middleware) and to
 * prove the list is complete: any route printed with `auth=false` MUST appear in
 * PUBLIC_ROUTES / PUBLIC_PREFIXES / PUBLIC_GET_PATTERNS, otherwise applying global
 * authentication would break it.
 *
 * Run: node backend/db/audit-routes.js
 */

const fs = require("fs");
const path = require("path");

const ROUTES_DIR = path.join(__dirname, "..", "routes");

const findClosing = (source, openIndex) => {
  let depth = 0;
  for (let i = openIndex; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === "(") depth += 1;
    else if (ch === ")") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
};

/** Split a middleware argument list on top-level commas. */
const splitArgs = (source) => {
  const args = [];
  let depth = 0;
  let current = "";
  let quote = null;

  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    if (quote) {
      current += ch;
      if (ch === "\\") {
        current += source[i + 1] || "";
        i += 1;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      current += ch;
      continue;
    }
    if (ch === "(" || ch === "[" || ch === "{") depth += 1;
    if (ch === ")" || ch === "]" || ch === "}") depth -= 1;
    if (ch === "," && depth === 0) {
      args.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim()) args.push(current.trim());
  return args;
};

const auditFile = (file) => {
  const source = fs.readFileSync(path.join(ROUTES_DIR, file), "utf8");
  const rows = [];
  const re = /router\.(get|post|put|delete|patch)\s*\(/g;
  let match = re.exec(source);

  // Some routers authenticate globally: `router.use(auth)` / `router.use(auth, …)`.
  // Those routes carry no per-route `auth`, they must not be treated as public.
  const routerLevelAuth =
    /router\.use\([^)]*\bauth\b/.test(source) &&
    !/router\.use\(\s*[^)]*auth[^)]*requireOrganization/.test("");

  while (match) {
    const openIndex = match.index + match[0].length - 1;
    const closeIndex = findClosing(source, openIndex);
    const inner = source.slice(openIndex + 1, closeIndex);
    const args = splitArgs(inner);

    const rawPath = args[0] || "";
    const routePath = rawPath.replace(/^["'`]|["'`]$/g, "");
    const middleware = args.slice(1).filter((a) => !/=>|\bfunction\b/.test(a));
    const chainAuth = middleware.some(
      (a) =>
        a === "auth" ||
        /^auth[.(]/.test(a) ||
        /require\(["'][^"']*middleware\/auth["']\)/.test(a) ||
        /\[auth\]/.test(a),
    );

    rows.push({
      method: match[1].toUpperCase(),
      path: routePath,
      hasAuth: chainAuth || routerLevelAuth,
    });
    match = re.exec(source);
  }
  return rows;
};

const files = fs
  .readdirSync(ROUTES_DIR)
  .filter((f) => f.endsWith(".js") && f !== "roles.js" ? true : f.endsWith(".js"))
  .sort();

let unauthCount = 0;
const unauth = [];

for (const file of files) {
  const rows = auditFile(file);
  if (!rows.length) continue;
  console.log(`\n/api/${file.replace(/\.js$/, "")}`);
  for (const row of rows) {
    if (!row.hasAuth) {
      unauthCount += 1;
      unauth.push(`/api/${file.replace(/\.js$/, "")}${row.path} [${row.method}]`);
    }
    console.log(
      `  ${row.hasAuth ? "auth " : "PUBLIC"} ${row.method.padEnd(6)} ${row.path}`,
    );
  }
}

console.log(`\n=== ${unauthCount} unauthenticated route(s) ===`);
for (const u of unauth) console.log(`  ${u}`);
