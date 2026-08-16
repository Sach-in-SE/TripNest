import React from 'react';

export const LoadingSkeleton = ({
  width = '100%',
  height = '20px',
  borderRadius = 'var(--tn-radius-sm)',
  count = 1,
  className = '',
}) => {
  const items = Array.from({ length: count });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
      {items.map((_, i) => (
        <div
          key={i}
          className={`tn-skeleton ${className}`}
          style={{ width, height, borderRadius }}
        />
      ))}
    </div>
  );
};

export default LoadingSkeleton;
