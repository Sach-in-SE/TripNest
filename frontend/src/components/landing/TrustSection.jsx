import React from 'react';
import Badge from '../ui/Badge';

const SECURITY_PILLARS = [
  {
    icon: '🛡️',
    title: 'Binary Magic-Byte Inspection',
    desc: 'Uploaded travel documents are validated at the byte-header level (%PDF-, PNG, JPEG, DOCX) to block spoofed files and executable script injections before server storage.',
    tag: '10MB Limit • Traversal Defenses',
  },
  {
    icon: '🔐',
    title: 'Granular Access Permissions',
    desc: 'Trip data, expense ledgers, and document vaults are strictly isolated. Only authenticated trip owners and explicitly invited group companions can access or modify your plans.',
    tag: 'JWT Stateless • Scoped Authorization',
  },
  {
    icon: '📄',
    title: 'Offline PDF Portability',
    desc: 'Generate complete, multi-page A4 travel itinerary reports directly on your device. Access day-by-day schedules and expense breakdowns offline during flights and transit.',
    tag: 'A4 Formatted • Zero Cloud Lock-In',
  },
  {
    icon: '⛅',
    title: 'Direct Weather Intelligence',
    desc: 'Outdoor itinerary planning is connected with live Open-Meteo meteorological forecasts, delivering hourly temperatures and seasonal trends without third-party tracking.',
    tag: 'Live Forecasts • No Ad Trackers',
  },
];

export const TrustSection = () => {
  return (
    <section
      id="security"
      className="tn-landing-section tn-trust-section"
      aria-label="Security and Technical Reliability"
    >
      <div className="tn-section-heading">
        <Badge variant="primary" style={{ marginBottom: '12px' }}>Verified Architecture</Badge>
        <h2 className="tn-section-heading-title">Engineering-Grade Security & Reliability</h2>
        <p className="tn-section-heading-desc">
          TripNest is built with strict security boundaries, data scoping, and offline portability at its core.
        </p>
      </div>

      <div className="tn-security-grid">
        {SECURITY_PILLARS.map((pillar, idx) => (
          <div key={idx} className="tn-security-card">
            <div className="tn-security-card-header">
              <span className="tn-security-icon" aria-hidden="true">{pillar.icon}</span>
              <span className="tn-security-tag">{pillar.tag}</span>
            </div>
            <h3 className="tn-security-title">{pillar.title}</h3>
            <p className="tn-security-desc">{pillar.desc}</p>
          </div>
        ))}
      </div>

      {/* Platform Transparency Banner */}
      <div className="tn-trust-reassurance-strip">
        <div className="tn-reassurance-item">
          <span className="tn-reassurance-icon" aria-hidden="true">✓</span>
          <span>100% Free Core Planning Workspace</span>
        </div>
        <div className="tn-reassurance-item">
          <span className="tn-reassurance-icon" aria-hidden="true">✓</span>
          <span>Open Platform Standards & PDF Portability</span>
        </div>
        <div className="tn-reassurance-item">
          <span className="tn-reassurance-icon" aria-hidden="true">✓</span>
          <span>Zero Hidden Paywalls or Ad Tracking</span>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
