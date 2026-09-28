/**
 * context/AuthContext.js
 *
 * WHY REACT CONTEXT FOR AUTH: role (job_seeker / recruiter / admin) decides
 * which navbar links, routes and dashboards a person sees. Nearly every page
 * needs to read "who is logged in / what role are they", so this belongs in
 * a context provider wrapping the whole app rather than being re-fetched or
 * passed down as props through every route.
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load (or a full page refresh), if we still have a token in
  // localStorage, ask the backend who it belongs to, so the session
  // survives a refresh instead of bouncing the user back to /login.
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api.get('/auth/me/')
      .then(({ data }) => setUser(data))
      .catch(() => localStorage.clear())
      .finally(() => setLoading(false));
  }, []);

  const login = async (username, password) => {
    const { data } = await api.post('/auth/login/', { username, password });
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    const me = { id: data.user_id, username: data.username, role: data.role };
    setUser(me);
    return me;
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
