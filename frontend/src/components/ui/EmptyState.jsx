import React from 'react';

export const EmptyState = ({
  icon = '🏖️',
  title = 'No items found',
  description = 'There are no items to display at this time.',
  action,
  className = '',
}) => (
  <div className={`tn-empty-state ${className}`}>
    <div className="tn-empty-icon">{icon}</div>
    <h3 className="tn-empty-title">{title}</h3>
    <p className="tn-empty-description">{description}</p>
    {action && <div style={{ marginTop: '8px' }}>{action}</div>}
  </div>
);

export const ErrorState = ({
  icon = '⚠️',
  title = 'Something went wrong',
  description = 'An error occurred while loading this section. Please try again.',
  action,
  className = '',
}) => (
  <div className={`tn-error-state ${className}`}>
    <div className="tn-error-icon">{icon}</div>
    <h3 className="tn-error-title">{title}</h3>
    <p className="tn-error-description">{description}</p>
    {action && <div style={{ marginTop: '8px' }}>{action}</div>}
  </div>
);

export default EmptyState;
