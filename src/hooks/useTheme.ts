import { useState, useEffect, useCallback } from 'react';
import { ThemeMode } from '../types';

const THEME_STORAGE_KEY = 'my_pocket_theme';

export function useTheme(initialTheme?: ThemeMode) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'dark';
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored as ThemeMode;
    }
    return initialTheme || 'dark';
  });

  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('dark');

  const applyTheme = useCallback((mode: ThemeMode) => {
    let resolved: 'light' | 'dark' = 'dark';

    if (mode === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      resolved = systemPrefersDark ? 'dark' : 'light';
    } else {
      resolved = mode;
    }

    setEffectiveTheme(resolved);

    const root = document.documentElement;
    const body = document.body;

    if (resolved === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
      body.classList.add('light');
      body.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
      body.classList.add('dark');
      body.classList.remove('light');
    }
  }, []);

  useEffect(() => {
    applyTheme(theme);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        applyTheme('system');
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, applyTheme]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (e) {
      console.error('Error persisting theme preference', e);
    }
  };

  return {
    theme,
    effectiveTheme,
    setTheme,
  };
}
