import React from 'react';

export const Input = React.forwardRef(({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="tn-input-wrapper">
      {label && (
        <label htmlFor={inputId} className="tn-input-label">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`tn-input ${error ? 'tn-input--error' : ''} ${className}`}
        {...props}
      />
      {(error || helperText) && (
        <span className={`tn-input-helper ${error ? 'tn-input-helper--error' : ''}`}>
          {error || helperText}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
