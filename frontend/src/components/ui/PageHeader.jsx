import React from 'react';

export const PageHeader = ({ title, subtitle, actions, className = '' }) => (
  <div className={`tn-page-header ${className}`}>
    <div>
      <h1 className="tn-page-header-title">{title}</h1>
      {subtitle && <p className="tn-page-header-subtitle">{subtitle}</p>}
    </div>
    {actions && <div className="tn-page-header-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>{actions}</div>}
  </div>
);

export const SectionHeader = ({ title, subtitle, actions, className = '' }) => (
  <div className={`tn-section-header ${className}`} style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <div>
      <h2 style={{ fontFamily: 'var(--tn-font-display)', fontSize: 'var(--tn-text-xl)', fontWeight: 'var(--tn-weight-bold)', color: 'var(--tn-text-primary)' }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 'var(--tn-text-sm)', color: 'var(--tn-text-muted)' }}>{subtitle}</p>}
    </div>
    {actions && <div>{actions}</div>}
  </div>
);

export default PageHeader;
