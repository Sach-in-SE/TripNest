import React from 'react';
import Badge from '../ui/Badge';

const STEPS_DATA = [
  {
    step: '01',
    phase: 'DISCOVER',
    title: 'Explore Destinations',
    desc: 'Browse hand-picked destinations with live Open-Meteo weather forecasts and seasonal travel recommendations.',
    pill: 'Weather & Wikipedia Guides',
    icon: '🌍',
  },
  {
    step: '02',
    phase: 'PLAN',
    title: 'Schedule & Allocate',
    desc: 'Build day-by-day itineraries with exact start times, map sightseeing spots, and assign category budget limits.',
    pill: 'Time Slots & Cost Limits',
    icon: '📅',
  },
  {
    step: '03',
    phase: 'COLLABORATE',
    title: 'Coordinate in Sync',
    desc: 'Invite family or friends with role-based permissions (Editor/Viewer) and chat in one synchronized workspace.',
    pill: 'Roles & Discussion Hub',
    icon: '👥',
  },
  {
    step: '04',
    phase: 'TRAVEL',
    title: 'Pack & Export PDF',
    desc: 'Store flight vouchers in the magic-byte vault and download a complete multi-page PDF travel report for offline journeys.',
    pill: 'Offline PDF & Verified Vault',
    icon: '✈️',
  },
];

export const HowItWorks = () => {
  return (
    <section
      id="how-it-works"
      className="tn-landing-section tn-how-it-works-section"
      aria-label="How TripNest Works"
    >
      <div className="tn-section-heading">
        <Badge variant="primary" style={{ marginBottom: '12px' }}>Simple 4-Step Workflow</Badge>
        <h2 className="tn-section-heading-title">How TripNest Works</h2>
        <p className="tn-section-heading-desc">
          From initial inspiration to packing your bags, TripNest guides you through every step of your travel journey.
        </p>
      </div>

      <div className="tn-pipeline-container">
        {STEPS_DATA.map((step, idx) => (
          <div key={idx} className="tn-pipeline-step">
            <div className="tn-pipeline-step-header">
              <div className="tn-pipeline-number">{step.step}</div>
              <span className="tn-pipeline-icon" aria-hidden="true">{step.icon}</span>
            </div>

            <div className="tn-pipeline-body">
              <span className="tn-pipeline-phase">{step.phase}</span>
              <h3 className="tn-pipeline-title">{step.title}</h3>
              <p className="tn-pipeline-desc">{step.desc}</p>
              <div className="tn-pipeline-footer">
                <span className="tn-pipeline-pill">{step.pill}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;
