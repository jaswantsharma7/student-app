export const API_BASE = process.env.REACT_APP_API_URL;

export const getToken = () => localStorage.getItem("auth_token");
export const setToken = (t) => localStorage.setItem("auth_token", t);
export const clearToken = () => localStorage.removeItem("auth_token");

export const authFetch = (path, options = {}) => {
  const token = getToken();
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
};