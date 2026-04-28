import { useState, useEffect, useCallback } from "react";
import { authFetch, getToken, clearToken } from "../utils/api";

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) { 
      setAuthChecked(true); 
      return; 
    }
    authFetch("/auth/me")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => { 
        if (data?.user) setUser(data.user); 
        else clearToken(); 
      })
      .catch(() => clearToken())
      .finally(() => setAuthChecked(true));
  }, []);

  const handleLogout = useCallback(() => {
    clearToken(); 
    setUser(null);
  }, []);

  return { user, setUser, authChecked, handleLogout };
}