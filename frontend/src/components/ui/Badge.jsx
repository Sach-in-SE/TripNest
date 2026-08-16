import React from 'react';

export const Badge = ({
  children,
  variant = 'neutral', // neutral | primary | success | warning | danger | info
  icon,
  className = '',
  ...props
}) => (
  <span className={`tn-badge tn-badge--${variant} ${className}`} {...props}>
    {icon && <span className="tn-badge-icon">{icon}</span>}
    <span>{children}</span>
  </span>
);

export default Badge;
