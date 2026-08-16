import React from 'react';

export const IconButton = ({ icon, className = '', ...props }) => (
  <button type="button" className={`tn-icon-btn ${className}`} {...props}>
    <span>{icon}</span>
  </button>
);

export default IconButton;
