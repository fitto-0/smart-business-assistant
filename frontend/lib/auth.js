import Cookies from "js-cookie";
import { apiGet, apiPost, apiPut } from "./api";

const TOKEN_KEY = "sba_token";
const USER_KEY = "sba_user";

export const register = async (name, email, password, company) => {
  const response = await apiPost("/api/auth/register", {
    name,
    email,
    password,
    company,
  });
  Cookies.set(TOKEN_KEY, response.token, { expires: 1 });
  localStorage.setItem(USER_KEY, JSON.stringify(response.user));
  return response;
};

export const login = async (email, password) => {
  const response = await apiPost("/auth/login", { email, password });
  Cookies.set(TOKEN_KEY, response.token, { expires: 1 });
  localStorage.setItem(USER_KEY, JSON.stringify(response.user));
  return response;
};

export const logout = () => {
  Cookies.remove(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getUser = () => {
  if (typeof window === "undefined") return null;
  const userData = localStorage.getItem(USER_KEY);
  return userData ? JSON.parse(userData) : null;
};

export const isAuthenticated = () => {
  const token = Cookies.get(TOKEN_KEY);
  return Boolean(token);
};

export const fetchCurrentUser = async () => {
  const response = await apiGet("/auth/me");
  localStorage.setItem(USER_KEY, JSON.stringify(response));
  return response;
};

export const updateProfile = async (updates) => {
  const response = await apiPut("/api/auth/profile", updates);
  const current = getUser() || {};
  const updatedUser = { ...current, ...response.user };
  localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
  return updatedUser;
};
