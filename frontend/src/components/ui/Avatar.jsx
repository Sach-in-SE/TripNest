import React from 'react';

export const Avatar = ({
  name = '',
  src,
  size = 'md', // sm | md | lg
  className = '',
  ...props
}) => {
  const initial = name ? name.charAt(0).toUpperCase() : '?';

  return (
    <div className={`tn-avatar tn-avatar--${size} ${className}`} {...props}>
      {src ? (
        <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
};

export default Avatar;
