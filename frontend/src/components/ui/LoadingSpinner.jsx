import React from 'react';

export const LoadingSpinner = ({ message = 'Loading...', fullScreen = false }) => {
  const containerStyle = fullScreen
    ? {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100%',
        background: 'var(--bg-primary, #0a0f1e)',
        color: 'var(--text-secondary, #94a3b8)',
      }
    : {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        width: '100%',
        color: 'var(--text-secondary, #94a3b8)',
      };

  return (
    <div style={containerStyle} role="status" aria-live="polite">
      <div
        style={{
          width: '36px',
          height: '36px',
          border: '3px solid rgba(124, 58, 237, 0.2)',
          borderTopColor: '#7c3aed',
          borderRadius: '50%',
          animation: 'tn-spin 0.8s linear infinite',
        }}
      />
      {message && (
        <p style={{ marginTop: '14px', fontSize: '0.875rem', letterSpacing: '0.02em' }}>
          {message}
        </p>
      )}
      <style>{`
        @keyframes tn-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;
