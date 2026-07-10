import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('ht-theme') || 'light';
  });
  const [isThemeAnimating, setIsThemeAnimating] = useState(false);

  useEffect(() => {
    localStorage.setItem('ht-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () => {
    setIsThemeAnimating(true);
    document.documentElement.classList.add('theme-changing');
    setTheme(t => t === 'light' ? 'dark' : 'light');
    window.setTimeout(() => {
      document.documentElement.classList.remove('theme-changing');
      setIsThemeAnimating(false);
    }, 760);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isThemeAnimating }}>
      {children}
      <div aria-hidden="true" className={`theme-sweep ${isThemeAnimating ? 'is-active' : ''}`} />
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
