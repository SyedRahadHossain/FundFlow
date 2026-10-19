'use client';

import { createContext, useCallback, useContext, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'fundflow-theme';

// Every mounted ThemeProvider re-renders when the class on <html> changes.
const listeners = new Set();

function notify() {
  listeners.forEach(listener => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * The theme is not React state — it lives on <html class="dark">, set before
 * first paint by the inline script in the root layout. Reading it through
 * useSyncExternalStore keeps React in sync with that source without a
 * setState-in-effect, and the server snapshot keeps SSR stable.
 */
function readTheme() {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function setTheme(next) {
  const value = next === 'dark' ? 'dark' : 'light';
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Private browsing / storage disabled — the toggle still works for this
    // session, it just will not survive a reload.
  }
  const root = document.documentElement;
  root.classList.toggle('dark', value === 'dark');
  root.style.colorScheme = value;
  notify();
}

const ThemeContext = createContext({ theme: 'light', setTheme });

export function ThemeProvider({ children }) {
  const theme = useSyncExternalStore(subscribe, readTheme, () => 'light');
  const value = { theme, setTheme: useCallback(next => setTheme(next), []) };
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
