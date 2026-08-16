import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import PublicLayout from '../components/layout/PublicLayout';
import {
  HeroSection,
  DestinationCatalog,
  FeatureShowcase,
  HowItWorks,
  TrustSection,
  FinalCtaBanner,
} from '../components/landing';

export const LandingPage = () => {
  const location = useLocation();

  // Smooth scroll handler for anchor links and cross-page navigation
  useEffect(() => {
    const hash = location.hash || (location.state?.scrollTo ? `#${location.state.scrollTo}` : '');
    if (hash) {
      const targetId = hash.replace('#', '');
      const element = document.getElementById(targetId);
      if (element) {
        // Slight delay to ensure child components are fully mounted
        const timer = setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        return () => clearTimeout(timer);
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [location.hash, location.state]);

  return (
    <PublicLayout>
      <HeroSection />
      <DestinationCatalog />
      <FeatureShowcase />
      <HowItWorks />
      <TrustSection />
      <FinalCtaBanner />
    </PublicLayout>
  );
};

export default LandingPage;
