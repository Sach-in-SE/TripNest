import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export const ThemeToggle = ({ className = '', showLabel = true }) => {
  const { theme, toggleTheme } = useTheme();
  const isEmerald = theme === 'emerald' || theme === 'obsidian' || theme === 'premium';

  const themeIcon = isEmerald ? '🌿' : '🌌';
  const themeName = isEmerald ? 'Emerald' : 'Aurora';
  const nextThemeName = isEmerald ? 'Aurora' : 'Emerald';

  return (
    <button
      type="button"
      className={`tn-theme-toggle ${className}`}
      onClick={toggleTheme}
      aria-label={`Current theme: ${themeName}. Switch to ${nextThemeName} theme`}
      aria-pressed={isEmerald}
      title={`Theme: ${themeName} (Click to switch to ${nextThemeName})`}
    >
      <span className="tn-theme-toggle-icon" aria-hidden="true">
        {themeIcon}
      </span>
      {showLabel && (
        <span className="tn-theme-toggle-label">
          {themeName}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
