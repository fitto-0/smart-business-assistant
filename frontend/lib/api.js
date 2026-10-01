import Cookies from "js-cookie";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const TOKEN_KEY = "sba_token";
const ORG_KEY = "sba_org_id";

const getToken = () => {
  if (typeof window === "undefined") return null;
  const token = Cookies.get(TOKEN_KEY);
  console.log('Token retrieved:', token ? 'exists' : 'missing');
  return token;
};

/**
 * The organization the user is currently working in.
 *
 * The backend never trusts this value blindly: `middleware/orgContext.js` checks
 * that the caller is an active member of the organization it names. Without it the
 * backend falls back to the JWT claim and then to the user's default membership.
 */
export const getCurrentOrgId = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      Cookies.get(ORG_KEY) ||
      window.localStorage.getItem(ORG_KEY) ||
      null;
    const parsed = raw === null ? null : Number.parseInt(raw, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  } catch {
    return null;
  }
};

/** Remember the active organization and refresh any org-scoped cached view. */
export const setCurrentOrgId = (organizationId) => {
  if (typeof window === "undefined") return null;
  const parsed = Number.parseInt(organizationId, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  try {
    // Cookie so a full page reload keeps the same tenant.
    Cookies.set(ORG_KEY, String(parsed), { expires: 30, sameSite: "lax" });
    window.localStorage.setItem(ORG_KEY, String(parsed));
  } catch {
    /* storage unavailable (private mode) — the in-memory default still applies */
  }
  return parsed;
};

export const clearCurrentOrgId = () => {
  if (typeof window === "undefined") return;
  try {
    Cookies.remove(ORG_KEY);
    window.localStorage.removeItem(ORG_KEY);
  } catch {
    /* ignore */
  }
};

const getHeaders = (headers = {}) => {
  const token = getToken();
  const organizationId = getCurrentOrgId();

  const authHeaders = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(organizationId ? { "X-Organization-Id": String(organizationId) } : {}),
    ...headers,
  };

  console.log('Request headers:', authHeaders.Authorization ? 'Auth header present' : 'Auth header missing');
  return authHeaders;
};

const parseResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";

  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "object"
        ? payload?.error || payload?.message
        : payload;

    console.error(`API Error: ${response.status} - ${message}`);
    const error = new Error(message || "Request failed");
    error.status = response.status;
    throw error;
  }

  return payload;
};

export const apiRequest = async (path, options = {}) => {
  const { method = "GET", body, params, headers = {} } = options;

  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  const url = new URL(`${API_BASE_URL}${cleanPath}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const requestInit = {
    method,
    headers: getHeaders(headers),
  };

  if (body !== undefined) {
    // Don't stringify FormData - let the browser set the Content-Type with boundary
    if (body instanceof FormData) {
      requestInit.body = body;
      // Remove Content-Type header for FormData to let browser set it with boundary
      delete requestInit.headers['Content-Type'];
    } else {
      requestInit.body = JSON.stringify(body);
    }
  }

  console.log(`API Request: ${method} ${url.toString()}`);
  console.log('Headers:', requestInit.headers);

  let response = await fetch(url.toString(), requestInit);

  // The organization remembered in the cookie can go stale (the user was removed
  // from it, or it was deleted). Retry once without it: the backend then resolves
  // the scope from the JWT / the default membership and answers with real data
  // instead of a permission error.
  if (
    response.status === 403 &&
    requestInit.headers["X-Organization-Id"] &&
    !response.headers.get("content-type")?.includes("text/event-stream")
  ) {
    console.warn("Organization context rejected — falling back to the default one");
    clearCurrentOrgId();
    delete requestInit.headers["X-Organization-Id"];
    response = await fetch(url.toString(), requestInit);
  }

  return parseResponse(response);
};

export const apiGet = (path, params) =>
  apiRequest(path, {
    method: "GET",
    params,
  });

export const apiPost = (path, body, options = {}) =>
  apiRequest(path, {
    method: "POST",
    body,
    ...options,
  });

export const apiPut = (path, body) =>
  apiRequest(path, {
    method: "PUT",
    body,
  });

export const apiDelete = (path) =>
  apiRequest(path, {
    method: "DELETE",
  });

export const getApiBaseUrl = () => API_BASE_URL;
