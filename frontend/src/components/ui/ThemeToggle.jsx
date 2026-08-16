import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export const ThemeToggle = ({ className = '', showLabel = true }) => {
  const { theme, toggleTheme } = useTheme();
  const isPremium = theme === 'premium';

  return (
    <button
      type="button"
      className={`tn-theme-toggle ${className}`}
      onClick={toggleTheme}
      aria-label={`Switch to ${isPremium ? 'Classic Aurora' : 'Premium Travel'} theme`}
      aria-pressed={isPremium}
      title={`Theme: ${isPremium ? 'Premium Travel' : 'Classic Aurora'} (Click to switch)`}
    >
      <span className="tn-theme-toggle-icon" aria-hidden="true">
        {isPremium ? '🌿' : '✨'}
      </span>
      {showLabel && (
        <span className="tn-theme-toggle-label">
          {isPremium ? 'Premium' : 'Aurora'}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
