import Cookies from "js-cookie";
import { apiGet, apiPost, apiPut } from "./api";

const TOKEN_KEY = "sba_token";
const USER_KEY = "sba_user";

export const register = async (name, email, password, company) => {
  const response = await apiPost("/auth/register", {
    name,
    email,
    password,
    company,
  });

  Cookies.set(TOKEN_KEY, response.token, {
    expires: 1,
    sameSite: "lax",
  });

  localStorage.setItem(USER_KEY, JSON.stringify(response.user));

  return response;
};

export const login = async (email, password) => {
  const response = await apiPost("/auth/login", {
    email,
    password,
  });

  if (!response?.token) {
    throw new Error("Token non reçu du serveur");
  }

  Cookies.set(TOKEN_KEY, response.token, {
    expires: 1,
    sameSite: "lax",
  });

  localStorage.setItem(USER_KEY, JSON.stringify(response.user));

  return response;
};

export const logout = () => {
  Cookies.remove(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getToken = () => {
  if (typeof window === "undefined") return null;

  return Cookies.get(TOKEN_KEY) || null;
};

export const getUser = () => {
  if (typeof window === "undefined") return null;

  const userData = localStorage.getItem(USER_KEY);

  if (!userData) return null;

  try {
    return JSON.parse(userData);
  } catch {
    return null;
  }
};

export const isAuthenticated = () => {
  return Boolean(getToken());
};

export const fetchCurrentUser = async () => {
  const response = await apiGet("/auth/me");

  localStorage.setItem(USER_KEY, JSON.stringify(response));

  return response;
};

export const updateProfile = async (updates) => {
  const response = await apiPut("/auth/profile", updates);

  const current = getUser() || {};

  const updatedUser = {
    ...current,
    ...response.user,
  };

  localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));

  return updatedUser;
};
