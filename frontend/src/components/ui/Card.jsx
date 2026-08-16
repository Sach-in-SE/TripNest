import React from 'react';

export const Card = ({ children, interactive = false, className = '', ...props }) => (
  <div className={`tn-card ${interactive ? 'tn-card--interactive' : ''} ${className}`} {...props}>
    {children}
  </div>
);

export const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`tn-card-header ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '', ...props }) => (
  <h3 className={`tn-card-title ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription = ({ children, className = '', ...props }) => (
  <p className={`tn-card-description ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent = ({ children, className = '', ...props }) => (
  <div className={`tn-card-content ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '', ...props }) => (
  <div className={`tn-card-footer ${className}`} {...props}>
    {children}
  </div>
);

export default Card;
