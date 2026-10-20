'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '@/lib/api';

const AuthContext = createContext(null);

function readStoredToken() {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('cf_token');
  } catch {
    return null;
  }
}

function decodeToken(token) {
  if (!token) return null;
  try {
    const decoded = jwtDecode(token);
    // An expired token is not a session.
    if (decoded.exp && decoded.exp * 1000 < Date.now()) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  // The stored token and the role it carries are read once, during the first
  // render, so no effect has to set them. The profile behind the token is
  // the only thing worth a request, and it is fetched once per app load.
  const [token, setToken] = useState(readStoredToken);
  const [user, setUser] = useState(() => decodeToken(readStoredToken()));
  const [profile, setProfile] = useState(null);
  // The session is unresolved until the browser has looked at the stored
  // token. The server has no token, so it renders the same waiting state the
  // browser renders first — the two agree, and the hydration matches.
  const [resolved, setResolved] = useState(false);

  const loading = !resolved;

  const refreshUser = useCallback(async () => {
    const stored = readStoredToken();
    if (!stored) return null;
    try {
      const res = await api.get('/api/auth/me');
      const decoded = decodeToken(stored);
      if (decoded) {
        setUser({ ...decoded, credits: res.data.credits ?? 0 });
      }
      setProfile(res.data);
      return res.data;
    } catch {
      // The interceptor already clears a stale token and sends the user to the
      // login screen; there is nothing to add here.
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Yield first, so the effect body never sets state synchronously.
      await Promise.resolve();

      if (!token) {
        if (!cancelled) setResolved(true);
        return;
      }

      try {
        const res = await api.get('/api/auth/me');
        if (cancelled) return;
        const decoded = decodeToken(token);
        if (decoded) {
          setUser({ ...decoded, credits: res.data.credits ?? 0 });
        }
        setProfile(res.data);
      } catch {
        // Leave the JWT-derived user in place; the interceptor handles a
        // rejected token.
      } finally {
        if (!cancelled) setResolved(true);
      }
    })();

    return () => { cancelled = true; };
  }, [token]);

  const login = (newToken) => {
    localStorage.setItem('cf_token', newToken);
    setToken(newToken);
    const decoded = decodeToken(newToken);
    setUser(decoded);
    setProfile(null);
    setResolved(false);
  };

  const logout = () => {
    localStorage.removeItem('cf_token');
    setToken(null);
    setUser(null);
    setProfile(null);
    setResolved(true);
  };

  return (
    <AuthContext.Provider value={{ user, token, profile, login, logout, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
