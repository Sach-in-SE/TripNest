import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import HeroProductPreview from './HeroProductPreview';

export const HeroSection = () => {
  const { user } = useAuth();
  const primaryCtaPath = user ? '/trips/new' : '/signup';

  return (
    <section className="tn-hero" aria-label="Hero Introduction">
      <div>
        <div className="tn-hero-badge">
          <span>✨ Smart Travel Planning Platform</span>
        </div>
        <h1 className="tn-hero-title">
          Plan Better. <br />
          <span className="gradient-text">Travel Smarter.</span>
        </h1>
        <p className="tn-hero-description">
          TripNest is your all-in-one travel companion for creating day-wise itineraries, tracking budgets in real time, collaborating with travel groups, and keeping travel documents safe.
        </p>
        <div className="tn-hero-ctas">
          <Link to={primaryCtaPath} style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="lg">
              Start Planning Free
            </Button>
          </Link>
          <Link to="/destinations" style={{ textDecoration: 'none' }}>
            <Button variant="outline" size="lg">
              Explore Destinations
            </Button>
          </Link>
        </div>
      </div>

      <HeroProductPreview />
    </section>
  );
};

export default HeroSection;
