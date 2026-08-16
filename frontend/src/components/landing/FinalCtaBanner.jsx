import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export const FinalCtaBanner = () => {
  const { user } = useAuth();
  const ctaPath = user ? '/trips/new' : '/signup';

  return (
    <section className="tn-landing-section tn-final-cta-section" aria-label="Get Started with TripNest">
      <div className="tn-final-cta-banner">
        <Badge variant="primary" style={{ marginBottom: '8px' }}>Start Your Next Journey</Badge>
        <h2 className="tn-final-cta-title">
          Plan your itinerary. Bring your people. Travel without the chaos.
        </h2>
        <p className="tn-final-cta-desc">
          Join travelers planning smarter journeys with day-by-day schedules, categorized budget tracking, and magic-byte verified document vaults.
        </p>

        <div className="tn-final-cta-actions">
          <Link to={ctaPath} style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="lg">
              Start Planning Free 🚀
            </Button>
          </Link>
          <Link to="/destinations" style={{ textDecoration: 'none' }}>
            <Button variant="secondary" size="lg">
              Explore Destinations 🌍
            </Button>
          </Link>
        </div>

        <div className="tn-final-cta-reassurance">
          <span className="tn-cta-badge-item">✓ No credit card required</span>
          <span className="tn-cta-badge-item">✓ Instant free setup</span>
          <span className="tn-cta-badge-item">✓ Offline PDF travel reports</span>
        </div>
      </div>
    </section>
  );
};

export default FinalCtaBanner;
