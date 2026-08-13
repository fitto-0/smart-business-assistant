import Cookies from "js-cookie";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const TOKEN_KEY = "sba_token";

const getToken = () => {
  if (typeof window === "undefined") return null;
  return Cookies.get(TOKEN_KEY);
};

const getHeaders = (headers = {}) => {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };
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

    throw new Error(message || "Request failed");
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
    requestInit.body = JSON.stringify(body);
  }

  const response = await fetch(url.toString(), requestInit);

  return parseResponse(response);
};

export const apiGet = (path, params) =>
  apiRequest(path, {
    method: "GET",
    params,
  });

export const apiPost = (path, body) =>
  apiRequest(path, {
    method: "POST",
    body,
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
