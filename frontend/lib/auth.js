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

export const login = async (email, password, totpCode) => {
  const response = await apiPost("/auth/login", {
    email,
    password,
    ...(totpCode && { totpCode }),
  });

  const token = response.token;
  const user = response.user;

  Cookies.set(TOKEN_KEY, token, { expires: 7 });

  localStorage.setItem(USER_KEY, JSON.stringify(user));

  return user;
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

export const changePassword = async (oldPassword, newPassword) => {
  const response = await apiPost("/auth/change-password", {
    oldPassword,
    newPassword,
  });

  return response;
};

export const toggleEmailNotifications = async (enabled) => {
  const response = await apiPut("/auth/toggle-notifications", { enabled });

  return response;
};

export const toggleTwoFactorAuth = async (enabled) => {
  const response = await apiPut("/auth/toggle-2fa", { enabled });

  return response;
};

export const setupTwoFactorAuth = async () => {
  const response = await apiPost("/auth/setup-2fa");

  return response;
};

export const verifyTwoFactorAuth = async (token) => {
  const response = await apiPost("/auth/verify-2fa", { token });

  return response;
};

export const disableTwoFactorAuth = async (password) => {
  const response = await apiPost("/auth/disable-2fa", { password });

  return response;
};
