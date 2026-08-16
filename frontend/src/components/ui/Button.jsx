import React from 'react';

export const Button = ({
  children,
  variant = 'primary', // primary | secondary | outline | ghost | danger
  size = 'md',        // sm | md | lg
  fullWidth = false,
  loading = false,
  disabled = false,
  icon,
  className = '',
  ...props
}) => {
  const classes = [
    'tn-btn',
    `tn-btn--${variant}`,
    `tn-btn--${size}`,
    fullWidth ? 'tn-btn--full' : '',
    loading ? 'tn-btn--loading' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading ? (
        <span className="tn-spinner" style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      ) : icon ? (
        <span className="tn-btn-icon">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
};

export default Button;
