import React, { useEffect } from 'react';
import IconButton from './IconButton';

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = '520px',
  className = '',
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="tn-modal-overlay" onClick={onClose}>
      <div
        className={`tn-modal-container ${className}`}
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="tn-modal-header">
          <h3 className="tn-modal-title">{title}</h3>
          <IconButton icon="✕" onClick={onClose} aria-label="Close modal" />
        </div>
        <div className="tn-modal-body">{children}</div>
        {footer && <div className="tn-modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
