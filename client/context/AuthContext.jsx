'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null);
  const [token, setToken]   = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const stored = localStorage.getItem('cf_token');
    if (!stored) return;
    try {
      const res = await api.get('/api/auth/me');
      const decoded = jwtDecode(stored);
      setUser({ ...decoded, credits: res.data.credits ?? 0 });
    } catch {
      // Token might be invalid, logout will be handled by interceptor
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('cf_token');
    if (stored) {
      try {
        const decoded = jwtDecode(stored);
        // Reject expired tokens
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem('cf_token');
        } else {
          setToken(stored);
          setUser(decoded); // { email, role }
          // Fetch credits from server
          api.get('/api/auth/me')
            .then(res => setUser(u => ({ ...u, credits: res.data.credits ?? 0 })))
            .catch(() => {});
        }
      } catch {
        localStorage.removeItem('cf_token');
      }
    }
    setLoading(false);
  }, []);

  const login = (newToken) => {
    localStorage.setItem('cf_token', newToken);
    setToken(newToken);
    try {
      setUser(jwtDecode(newToken));
    } catch {
      setUser(null);
    }
  };

  const logout = () => {
    localStorage.removeItem('cf_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
