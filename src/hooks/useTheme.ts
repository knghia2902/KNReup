import { useState, useEffect, useCallback } from 'react';

const THEME_KEY = 'knreup-theme-v2';

/**
 * useTheme Hook
 * Provides theme state and a toggle function.
 * Listens for cross-window storage events to keep all windows in sync.
 */
export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) return saved === 'dark';
    return true; // Default to dark mode
  });

  // Sync state with DOM and localStorage
  const applyTheme = useCallback((dark: boolean) => {
    if (dark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    applyTheme(isDark);
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
  }, [isDark, applyTheme]);

  // Listen for changes from other windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === THEME_KEY) {
        setIsDark(e.newValue === 'dark');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const toggle = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  return { isDark, toggle };
}
