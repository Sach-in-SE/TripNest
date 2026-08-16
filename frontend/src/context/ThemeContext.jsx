import React, { createContext, useState, useContext, useEffect } from 'react';

const THEME_STORAGE_KEY = 'tn-theme';
const DEFAULT_THEME = 'classic';

const ThemeContext = createContext({
  theme: DEFAULT_THEME,
  setTheme: () => {},
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'classic' || stored === 'premium') {
        return stored;
      }
    } catch {
      // Storage access error fallback
    }
    return DEFAULT_THEME;
  });

  const setTheme = (newTheme) => {
    const validTheme = newTheme === 'premium' ? 'premium' : 'classic';
    setThemeState(validTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, validTheme);
    } catch {
      // Ignore localStorage write failure
    }
    document.documentElement.setAttribute('data-theme', validTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'classic' ? 'premium' : 'classic');
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Listen for storage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === THEME_STORAGE_KEY && (e.newValue === 'classic' || e.newValue === 'premium')) {
        setThemeState(e.newValue);
        document.documentElement.setAttribute('data-theme', e.newValue);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
