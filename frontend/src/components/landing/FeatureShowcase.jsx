import React, { useState, useRef } from 'react';
import Badge from '../ui/Badge';

const FEATURE_PILLARS = [
  {
    id: 'itineraries',
    title: 'Smart Itineraries',
    tagline: 'Time-Blocked Day Planning',
    description: 'Schedule daily sightseeing, dining, transportation, and activities with exact time slots, location notes, and automatic timeline sequence validation.',
    highlights: [
      'Day-by-day structured activity scheduling',
      'Categorized tags: Sightseeing, Dining, Transport & Adventure',
      'Direct coordination with destination locations',
    ],
    demo: {
      title: 'Swiss Alps Expedition — Day 1',
      badge: 'Active Timeline',
      items: [
        { time: '09:00 AM', icon: '✈️', title: 'Zurich Airport Arrival', meta: 'Terminal 2 → Hotel Shuttle', tag: 'Transport', tagVariant: 'neutral' },
        { time: '02:00 PM', icon: '🏛️', title: 'Old Town Walking Tour', meta: 'Grossmünster & Lindenhof Viewpoint', tag: 'Sightseeing', tagVariant: 'primary' },
        { time: '07:30 PM', icon: '🍷', title: 'Lakefront Sunset Dinner', meta: 'Restaurant Bürgli, Lake Zurich', tag: 'Dining', tagVariant: 'warning' },
      ],
    },
  },
  {
    id: 'budget',
    title: 'Budget Intelligence',
    tagline: 'Real-Time Category Allocation',
    description: 'Keep expenses firmly under control with automated category tracking, budget ceiling progress bars, and instant spend alerts.',
    highlights: [
      'Multi-category allocation (Stay, Travel, Food, Misc)',
      'Visual utilization percentages and remaining headroom',
      'Transparent payment tracking for individuals and groups',
    ],
    demo: {
      title: 'Trip Budget Utilization',
      badge: '70% Planned',
      totalBudget: '₹60,000 Total Limit',
      spentAmount: '₹42,000 Allocated',
      categories: [
        { name: 'Stay & Accommodation', amount: '₹22,000', percent: 52, colorClass: 'stay' },
        { name: 'Transport & Flights', amount: '₹14,000', percent: 33, colorClass: 'travel' },
        { name: 'Activities & Sightseeing', amount: '₹6,000', percent: 15, colorClass: 'activities' },
      ],
    },
  },
  {
    id: 'collaboration',
    title: 'Group Collaboration',
    tagline: 'Synchronized Companion Workspace',
    description: 'Invite friends and family to plan together with role-based permissions, synchronized live updates, and integrated group discussion channels.',
    highlights: [
      'Role-based access controls (Owner, Editor, Viewer)',
      'Shared group discussion and live coordinate hub',
      'Real-time itinerary & expense synchronization',
    ],
    demo: {
      title: 'Group Travel Workspace',
      badge: '4 Collaborators',
      members: [
        { name: 'Suresh Kumar', role: 'Owner', initials: 'SK', status: 'Active' },
        { name: 'Ananya Mishra', role: 'Editor', initials: 'AM', status: 'Active' },
        { name: 'Rahul Kapoor', role: 'Viewer', initials: 'RK', status: 'Active' },
        { name: 'Priya Sharma', role: 'Viewer', initials: 'PS', status: 'Invited' },
      ],
      chatSnippet: {
        sender: 'Ananya M.',
        text: 'Just added the Jungfraujoch cogwheel tickets to our Day 2 plan! 🏔️',
        time: '10:45 AM',
      },
    },
  },
  {
    id: 'documents',
    title: 'Document Vault & PDF Export',
    tagline: 'Magic-Byte Verified Travel Assets',
    description: 'Safely store booking confirmations, flight passes, and hotel vouchers with binary header inspection, and export complete multi-page PDF itineraries for offline travel.',
    highlights: [
      'Deep binary magic-byte inspection (%PDF-, PNG, JPEG, DOCX)',
      '10MB individual limit with path traversal protection',
      '1-click offline multi-page PDF travel report generation',
    ],
    demo: {
      title: 'Secure Document Vault',
      badge: 'All Files Verified',
      files: [
        { name: 'Swiss_Travel_Pass_2026.pdf', type: 'PDF Document', size: '1.8 MB', verified: true, icon: '🎫' },
        { name: 'Alpine_Resort_Voucher.pdf', type: 'Hotel Booking', size: '640 KB', verified: true, icon: '🏨' },
      ],
      pdfActionText: 'Export Travel Itinerary PDF ➔',
    },
  },
];

export const FeatureShowcase = () => {
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);
  const tabRefs = useRef([]);

  const activeFeature = FEATURE_PILLARS[activeFeatureIndex];

  const handleKeyDown = (e, index) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      const next = (index + 1) % FEATURE_PILLARS.length;
      setActiveFeatureIndex(next);
      tabRefs.current[next]?.focus();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = (index - 1 + FEATURE_PILLARS.length) % FEATURE_PILLARS.length;
      setActiveFeatureIndex(prev);
      tabRefs.current[prev]?.focus();
    }
  };

  return (
    <section id="features" className="tn-landing-section" aria-label="Platform Capabilities">
      <div className="tn-section-heading">
        <Badge variant="info" style={{ marginBottom: '12px' }}>Platform Capabilities</Badge>
        <h2 className="tn-section-heading-title">Everything You Need for Seamless Travel</h2>
        <p className="tn-section-heading-desc">
          Designed for modern travelers and groups. Take control of every stage of your trip with dedicated tools.
        </p>
      </div>

      <div className="tn-features-showcase-container">
        {/* Left Side: Interactive Feature Selector Tabs */}
        <div
          className="tn-feature-nav-list"
          role="tablist"
          aria-label="Core Feature Pillars"
        >
          {FEATURE_PILLARS.map((pillar, idx) => {
            const isSelected = activeFeatureIndex === idx;
            return (
              <button
                key={pillar.id}
                ref={(el) => { tabRefs.current[idx] = el; }}
                type="button"
                role="tab"
                id={`feature-tab-${pillar.id}`}
                aria-selected={isSelected}
                aria-controls="feature-demo-panel"
                tabIndex={isSelected ? 0 : -1}
                className={`tn-feature-nav-item ${isSelected ? 'active' : ''}`}
                onClick={() => setActiveFeatureIndex(idx)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
              >
                <div className="tn-feature-nav-header">
                  <span className="tn-feature-nav-index">0{idx + 1}</span>
                  <div>
                    <h3 className="tn-feature-nav-title">{pillar.title}</h3>
                    <p className="tn-feature-nav-tagline">{pillar.tagline}</p>
                  </div>
                </div>
                {isSelected && (
                  <p className="tn-feature-nav-desc">{pillar.description}</p>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Side: Live Demonstration Preview Panel */}
        <div
          id="feature-demo-panel"
          role="tabpanel"
          aria-labelledby={`feature-tab-${activeFeature.id}`}
          className="tn-feature-preview-panel"
          key={activeFeature.id}
        >
          <div className="tn-feature-preview-card">
            {/* Header */}
            <div className="tn-feature-preview-header">
              <div>
                <span className="tn-feature-preview-title">{activeFeature.demo.title}</span>
              </div>
              <Badge variant="primary">{activeFeature.demo.badge}</Badge>
            </div>

            {/* Pillar 1: Itineraries Demo */}
            {activeFeature.id === 'itineraries' && (
              <div className="tn-demo-activities-list">
                {activeFeature.demo.items.map((act, i) => (
                  <div key={i} className="tn-demo-activity-item">
                    <div className="tn-demo-time">{act.time}</div>
                    <span className="tn-demo-icon" aria-hidden="true">{act.icon}</span>
                    <div className="tn-demo-details">
                      <div className="tn-demo-act-title">{act.title}</div>
                      <div className="tn-demo-act-meta">{act.meta}</div>
                    </div>
                    <Badge variant={act.tagVariant} className="tn-demo-badge">{act.tag}</Badge>
                  </div>
                ))}
              </div>
            )}

            {/* Pillar 2: Budget Demo */}
            {activeFeature.id === 'budget' && (
              <div className="tn-demo-budget-content">
                <div className="tn-demo-budget-amounts">
                  <div>
                    <span className="tn-demo-budget-spent">{activeFeature.demo.spentAmount}</span>
                    <span className="tn-demo-budget-total"> / {activeFeature.demo.totalBudget}</span>
                  </div>
                  <span className="tn-demo-budget-badge">3 Categories</span>
                </div>

                <div className="tn-demo-budget-bar">
                  <div className="tn-demo-bar-seg tn-demo-bar--stay" style={{ width: '52%' }} />
                  <div className="tn-demo-bar-seg tn-demo-bar--travel" style={{ width: '33%' }} />
                  <div className="tn-demo-bar-seg tn-demo-bar--act" style={{ width: '15%' }} />
                </div>

                <div className="tn-demo-budget-categories">
                  {activeFeature.demo.categories.map((c, i) => (
                    <div key={i} className="tn-demo-cat-row">
                      <span className={`tn-demo-cat-dot tn-demo-dot--${c.colorClass}`} aria-hidden="true" />
                      <span className="tn-demo-cat-name">{c.name}</span>
                      <span className="tn-demo-cat-amount">{c.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pillar 3: Collaboration Demo */}
            {activeFeature.id === 'collaboration' && (
              <div className="tn-demo-collab-content">
                <div className="tn-demo-members-list">
                  {activeFeature.demo.members.map((m, i) => (
                    <div key={i} className="tn-demo-member-row">
                      <div className="tn-demo-member-avatar" aria-hidden="true">{m.initials}</div>
                      <div className="tn-demo-member-info">
                        <span className="tn-demo-member-name">{m.name}</span>
                      </div>
                      <Badge variant={m.role === 'Owner' ? 'primary' : 'neutral'} className="tn-demo-role-badge">
                        {m.role}
                      </Badge>
                    </div>
                  ))}
                </div>

                <div className="tn-demo-chat-bubble">
                  <span className="tn-demo-chat-author">{activeFeature.demo.chatSnippet.sender}</span>
                  <p className="tn-demo-chat-text">{activeFeature.demo.chatSnippet.text}</p>
                  <span className="tn-demo-chat-time">{activeFeature.demo.chatSnippet.time}</span>
                </div>
              </div>
            )}

            {/* Pillar 4: Documents & PDF Demo */}
            {activeFeature.id === 'documents' && (
              <div className="tn-demo-docs-content">
                <div className="tn-demo-files-list">
                  {activeFeature.demo.files.map((f, i) => (
                    <div key={i} className="tn-demo-file-row">
                      <span className="tn-demo-file-icon" aria-hidden="true">{f.icon}</span>
                      <div className="tn-demo-file-details">
                        <span className="tn-demo-file-name">{f.name}</span>
                        <span className="tn-demo-file-meta">{f.type} • {f.size}</span>
                      </div>
                      <Badge variant="success" className="tn-demo-verified-badge">Magic-Byte ✓</Badge>
                    </div>
                  ))}
                </div>

                <div className="tn-demo-pdf-action-box">
                  <span className="tn-demo-pdf-icon" aria-hidden="true">📄</span>
                  <div style={{ flex: 1 }}>
                    <span className="tn-demo-pdf-title">Multi-Page Travel Itinerary Report</span>
                    <span className="tn-demo-pdf-subtitle">A4 Formatted • Complete Daily Itinerary & Budget</span>
                  </div>
                  <span className="tn-demo-pdf-chip">A4 PDF</span>
                </div>
              </div>
            )}

            {/* Highlights List Footer */}
            <div className="tn-feature-highlights-box">
              <span className="tn-highlights-title">Core Benefits:</span>
              <ul className="tn-highlights-list">
                {activeFeature.highlights.map((h, i) => (
                  <li key={i} className="tn-highlight-item">
                    <span className="tn-highlight-check" aria-hidden="true">✓</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureShowcase;
