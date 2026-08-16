import React, { useState, useRef } from 'react';
import Badge from '../ui/Badge';

const TRIP_DEMO_DATA = {
  title: 'Swiss Alps Escape',
  subtitle: 'Zurich • Interlaken • Jungfraujoch • 6 Days',
  dates: '12–17 Sep 2026',
  status: 'Upcoming',
  weather: '18°C Sunny • Zurich',
  collaborators: [
    { initials: 'SK', name: 'Suresh K' },
    { initials: 'AM', name: 'Ananya M' },
    { initials: 'RK', name: 'Rahul K' },
  ],
  extraCollaboratorsCount: 3,
  days: [
    {
      id: 'day-1',
      dayNumber: 'Day 1',
      tagline: 'Arrival & Zurich',
      activities: [
        {
          time: '09:00 AM',
          icon: '✈️',
          title: 'Zurich Airport Arrival',
          location: 'Airport → Hotel Transfer',
          category: 'Transport',
          categoryVariant: 'neutral',
        },
        {
          time: '02:00 PM',
          icon: '🏛️',
          title: 'Old Town Walking Tour',
          location: 'Zurich Old Town & Grossmünster',
          category: 'Sightseeing',
          categoryVariant: 'primary',
        },
        {
          time: '07:30 PM',
          icon: '🍷',
          title: 'Lake Sunset Dinner',
          location: 'Lake Zurich Waterfront',
          category: 'Dining',
          categoryVariant: 'warning',
        },
      ],
    },
    {
      id: 'day-2',
      dayNumber: 'Day 2',
      tagline: 'Alps Peak Experience',
      activities: [
        {
          time: '09:30 AM',
          icon: '🚠',
          title: 'Jungfraujoch Top of Europe',
          location: 'Lauterbrunnen Valley Departure',
          category: 'Sightseeing',
          categoryVariant: 'primary',
        },
        {
          time: '01:30 PM',
          icon: '🧀',
          title: 'Swiss Fondue Experience',
          location: 'Panorama Restaurant, Kleine Scheidegg',
          category: 'Dining',
          categoryVariant: 'warning',
        },
        {
          time: '05:00 PM',
          icon: '🚂',
          title: 'Scenic Cogwheel Railway',
          location: 'Railway to Interlaken',
          category: 'Transport',
          categoryVariant: 'neutral',
        },
      ],
    },
    {
      id: 'day-3',
      dayNumber: 'Day 3',
      tagline: 'Interlaken Adventure',
      activities: [
        {
          time: '08:30 AM',
          icon: '🪂',
          title: 'Paragliding Experience',
          location: 'Interlaken Adventure Center',
          category: 'Adventure',
          categoryVariant: 'info',
        },
        {
          time: '01:00 PM',
          icon: '⛴️',
          title: 'Lake Brienz Cruise',
          location: 'Lake Brienz Turquoise Waters',
          category: 'Sightseeing',
          categoryVariant: 'primary',
        },
        {
          time: '06:30 PM',
          icon: '🌄',
          title: 'Harder Kulm Sunset',
          location: 'Harder Kulm Panorama Viewpoint',
          category: 'Sightseeing',
          categoryVariant: 'primary',
        },
      ],
    },
  ],
  budget: {
    spent: '₹42,000',
    total: '₹60,000',
    percentage: 70,
  },
  document: {
    title: 'Swiss Travel Pass',
    status: 'Magic-Byte Verified ✓',
    subtext: 'PDF Voucher Ready',
  },
};

export const HeroProductPreview = () => {
  // Default to Day 2 (Alps Peak) per production design specifications
  const [activeDayIndex, setActiveDayIndex] = useState(1);
  const tabRefs = useRef([]);

  const currentDay = TRIP_DEMO_DATA.days[activeDayIndex] || TRIP_DEMO_DATA.days[0];

  const handleTabKeyDown = (e, index) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (index + 1) % TRIP_DEMO_DATA.days.length;
      setActiveDayIndex(nextIndex);
      tabRefs.current[nextIndex]?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (index - 1 + TRIP_DEMO_DATA.days.length) % TRIP_DEMO_DATA.days.length;
      setActiveDayIndex(prevIndex);
      tabRefs.current[prevIndex]?.focus();
    }
  };

  return (
    <div
      className="tn-hero-visual"
      aria-label="TripNest interactive travel planning demonstration"
      role="region"
    >
      <div className="tn-hero-card-preview">
        {/* 1. TRIP IDENTITY HEADER */}
        <div className="tn-preview-header">
          <div className="tn-preview-header-top">
            <Badge variant="primary" className="tn-preview-badge-status">
              {TRIP_DEMO_DATA.status}
            </Badge>

            <div className="tn-preview-weather" aria-label={`Weather: ${TRIP_DEMO_DATA.weather}`}>
              <span className="tn-preview-weather-icon" aria-hidden="true">☀️</span>
              <span>{TRIP_DEMO_DATA.weather}</span>
            </div>
          </div>

          <div className="tn-preview-header-main">
            <div>
              <h3 className="tn-preview-title">
                {TRIP_DEMO_DATA.title} 🏔️
              </h3>
              <p className="tn-preview-subtitle">
                {TRIP_DEMO_DATA.subtitle}
              </p>
            </div>
          </div>

          <div className="tn-preview-header-meta">
            <div className="tn-preview-dates">
              <span aria-hidden="true">📅</span>
              <span>{TRIP_DEMO_DATA.dates}</span>
            </div>

            {/* 2. COLLABORATOR AVATAR STACK */}
            <div
              className="tn-preview-collaborators"
              aria-label="6 Group Travel Collaborators"
              title="Collaborative planning with 6 members"
            >
              <div className="tn-preview-avatar-stack">
                {TRIP_DEMO_DATA.collaborators.map((c, idx) => (
                  <span
                    key={idx}
                    className="tn-preview-avatar"
                    title={c.name}
                    aria-hidden="true"
                  >
                    {c.initials}
                  </span>
                ))}
                <span className="tn-preview-avatar-extra" aria-hidden="true">
                  +{TRIP_DEMO_DATA.extraCollaboratorsCount}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. DAY SELECTOR (ACCESSIBLE TABS) */}
        <div
          className="tn-preview-tabs"
          role="tablist"
          aria-label="Itinerary Day Selector"
        >
          {TRIP_DEMO_DATA.days.map((day, idx) => {
            const isSelected = activeDayIndex === idx;
            return (
              <button
                key={day.id}
                ref={(el) => { tabRefs.current[idx] = el; }}
                type="button"
                role="tab"
                id={`hero-tab-${day.id}`}
                aria-selected={isSelected}
                aria-controls="hero-itinerary-panel"
                tabIndex={isSelected ? 0 : -1}
                className={`tn-preview-tab ${isSelected ? 'active' : ''}`}
                onClick={() => setActiveDayIndex(idx)}
                onKeyDown={(e) => handleTabKeyDown(e, idx)}
              >
                <span className="tn-preview-tab-number">{day.dayNumber}</span>
                <span className="tn-preview-tab-tagline">{day.tagline}</span>
              </button>
            );
          })}
        </div>

        {/* 4. ITINERARY TIMELINE PANEL */}
        <div
          id="hero-itinerary-panel"
          role="tabpanel"
          aria-labelledby={`hero-tab-${currentDay.id}`}
          className="tn-preview-timeline"
        >
          <div className="tn-preview-timeline-header">
            <span className="tn-timeline-day-title">
              {currentDay.dayNumber.toUpperCase()} — {currentDay.tagline.toUpperCase()}
            </span>
          </div>

          <div className="tn-preview-activity-list" key={currentDay.id}>
            {currentDay.activities.map((act, aIdx) => (
              <div key={aIdx} className="tn-preview-activity">
                <div className="tn-activity-time">{act.time}</div>
                <div className="tn-activity-icon" aria-hidden="true">{act.icon}</div>
                <div className="tn-activity-details">
                  <div className="tn-activity-title">{act.title}</div>
                  <div className="tn-activity-location">{act.location}</div>
                </div>
                <Badge variant={act.categoryVariant} className="tn-activity-badge">
                  {act.category}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* 5. BOTTOM MODULES: BUDGET HEALTH & SECURE DOCUMENT VAULT */}
        <div className="tn-preview-bottom-grid">
          {/* Budget Health Card */}
          <div className="tn-preview-module tn-preview-budget-card">
            <div className="tn-module-header">
              <span className="tn-module-title">
                <span aria-hidden="true">💰</span> Budget Health
              </span>
              <span className="tn-budget-pill">
                {TRIP_DEMO_DATA.budget.percentage}% Planned
              </span>
            </div>

            <div className="tn-budget-amount-row">
              <span className="tn-budget-spent">{TRIP_DEMO_DATA.budget.spent}</span>
              <span className="tn-budget-total">/ {TRIP_DEMO_DATA.budget.total}</span>
            </div>

            {/* Segmented Category Indicator */}
            <div
              className="tn-budget-segmented-bar"
              role="progressbar"
              aria-valuenow={TRIP_DEMO_DATA.budget.percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Budget planned utilization: 70%"
            >
              <div className="tn-budget-seg tn-budget-seg--stay" title="Stay (45%)" />
              <div className="tn-budget-seg tn-budget-seg--travel" title="Travel (35%)" />
              <div className="tn-budget-seg tn-budget-seg--activities" title="Activities (20%)" />
            </div>

            <div className="tn-budget-legend">
              <span className="tn-legend-item">
                <span className="tn-legend-dot tn-legend-dot--stay" aria-hidden="true" />
                Stay
              </span>
              <span className="tn-legend-item">
                <span className="tn-legend-dot tn-legend-dot--travel" aria-hidden="true" />
                Travel
              </span>
              <span className="tn-legend-item">
                <span className="tn-legend-dot tn-legend-dot--activities" aria-hidden="true" />
                Activities
              </span>
            </div>
          </div>

          {/* Secure Document Vault Card */}
          <div className="tn-preview-module tn-preview-document-card">
            <div className="tn-module-header">
              <span className="tn-module-title">
                <span aria-hidden="true">📁</span> Document Vault
              </span>
              <span className="tn-doc-verified-pill">
                <span aria-hidden="true">🔒</span> Verified
              </span>
            </div>

            <div className="tn-doc-body">
              <div className="tn-doc-title-row">
                <span className="tn-doc-icon" aria-hidden="true">🎫</span>
                <div>
                  <div className="tn-doc-name">{TRIP_DEMO_DATA.document.title}</div>
                  <div className="tn-doc-status">{TRIP_DEMO_DATA.document.status}</div>
                </div>
              </div>
              <div className="tn-doc-footer">
                <span className="tn-doc-type-badge">
                  {TRIP_DEMO_DATA.document.subtext}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroProductPreview;
