import React from 'react';

export const Select = React.forwardRef(({
  label,
  options = [],
  error,
  helperText,
  className = '',
  children,
  id,
  ...props
}, ref) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="tn-input-wrapper">
      {label && (
        <label htmlFor={selectId} className="tn-input-label">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={`tn-input tn-select ${error ? 'tn-input--error' : ''} ${className}`}
        {...props}
      >
        {children
          ? children
          : options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
      </select>
      {(error || helperText) && (
        <span className={`tn-input-helper ${error ? 'tn-input-helper--error' : ''}`}>
          {error || helperText}
        </span>
      )}
    </div>
  );
});

Select.displayName = 'Select';
export default Select;
