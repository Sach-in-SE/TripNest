import React, { createContext, useState, useContext, useEffect } from 'react';

const THEME_STORAGE_KEY = 'tn-theme';
const DEFAULT_THEME = 'aurora';

const ThemeContext = createContext({
  theme: DEFAULT_THEME,
  setTheme: () => {},
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (['aurora', 'emerald', 'obsidian', 'premium'].includes(stored)) {
        return stored === 'obsidian' || stored === 'premium' ? 'emerald' : stored;
      }
    } catch {
      // Storage access error fallback
    }
    return DEFAULT_THEME;
  });

  const applyThemeAttributes = (themeName) => {
    const normalized = (themeName === 'obsidian' || themeName === 'premium') ? 'emerald' : themeName;
    document.documentElement.setAttribute('data-theme', normalized);
    // Both Aurora and Emerald are dark themes with high-contrast text
    document.documentElement.style.colorScheme = 'dark';
  };

  const setTheme = (newTheme) => {
    const validTheme = ['emerald', 'obsidian', 'premium'].includes(newTheme) ? 'emerald' : 'aurora';
    setThemeState(validTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, validTheme);
    } catch {
      // Ignore localStorage write failure
    }
    applyThemeAttributes(validTheme);
  };

  const toggleTheme = () => {
    const isEmerald = theme === 'emerald' || theme === 'obsidian' || theme === 'premium';
    setTheme(isEmerald ? 'aurora' : 'emerald');
  };

  useEffect(() => {
    applyThemeAttributes(theme);
  }, [theme]);

  // Listen for storage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === THEME_STORAGE_KEY && e.newValue) {
        const val = e.newValue;
        const normalized = ['emerald', 'obsidian', 'premium'].includes(val) ? 'emerald' : 'aurora';
        setThemeState(normalized);
        applyThemeAttributes(normalized);
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
