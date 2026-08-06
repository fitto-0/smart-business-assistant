import Cookies from 'js-cookie';

const USERS_KEY = 'sba_users';
const TOKEN_KEY = 'sba_token';
const USER_KEY = 'sba_user';

// Initialiser avec un utilisateur démo
const initUsers = () => {
  if (typeof window === 'undefined') return [];
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  if (users.length === 0) {
    const demo = [{ id: 1, name: 'Admin Demo', email: 'demo@smartbusiness.com', password: 'demo123', role: 'admin', company: 'SmartBiz SARL', createdAt: new Date().toISOString() }];
    localStorage.setItem(USERS_KEY, JSON.stringify(demo));
    return demo;
  }
  return users;
};

export const register = (name, email, password, company) => {
  const users = initUsers();
  if (users.find(u => u.email === email)) {
    throw new Error('Cet email est déjà utilisé');
  }
  const newUser = { id: Date.now(), name, email, password, company: company || '', role: 'user', createdAt: new Date().toISOString() };
  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return newUser;
};

export const login = (email, password) => {
  const users = initUsers();
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) throw new Error('Email ou mot de passe incorrect');
  const token = btoa(JSON.stringify({ id: user.id, email: user.email, exp: Date.now() + 86400000 }));
  Cookies.set(TOKEN_KEY, token, { expires: 1 });
  localStorage.setItem(USER_KEY, JSON.stringify({ id: user.id, name: user.name, email: user.email, company: user.company, role: user.role }));
  return { user: { id: user.id, name: user.name, email: user.email, company: user.company, role: user.role }, token };
};

export const logout = () => {
  Cookies.remove(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getUser = () => {
  if (typeof window === 'undefined') return null;
  const userData = localStorage.getItem(USER_KEY);
  return userData ? JSON.parse(userData) : null;
};

export const isAuthenticated = () => {
  const token = Cookies.get(TOKEN_KEY);
  if (!token) return false;
  try {
    const data = JSON.parse(atob(token));
    return data.exp > Date.now();
  } catch {
    return false;
  }
};

export const updateProfile = (updates) => {
  const users = initUsers();
  const current = getUser();
  const idx = users.findIndex(u => u.id === current.id);
  if (idx === -1) throw new Error('Utilisateur non trouvé');
  users[idx] = { ...users[idx], ...updates };
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  const updatedUser = { ...current, ...updates };
  localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
  return updatedUser;
};
