import React, { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import MobileDrawer from './MobileDrawer';
import Button from '../ui/Button';
import ThemeToggle from '../ui/ThemeToggle';

export const Navbar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleSectionScroll = (e, sectionId) => {
    e.preventDefault();
    if (location.pathname === '/') {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(`/#${sectionId}`, { state: { scrollTo: sectionId } });
    }
  };

  return (
    <>
      <header className="tn-navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            type="button"
            className="tn-hamburger-btn"
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Open mobile navigation menu"
            aria-expanded={isDrawerOpen}
          >
            ☰
          </button>

          <Link to={user ? "/dashboard" : "/"} className="tn-navbar-brand" aria-label="TripNest Home">
            <span style={{ fontSize: '26px' }}>🧳</span>
            <span className="tn-navbar-logo-text">TripNest</span>
          </Link>
        </div>

        {/* Desktop Navbar Navigation */}
        <nav aria-label="Primary Navigation">
          <ul className="tn-navbar-nav">
            <li>
              <NavLink to="/" end className={({ isActive }) => `tn-nav-link ${isActive ? 'active' : ''}`}>
                Home
              </NavLink>
            </li>
            <li>
              <NavLink to="/destinations" className={({ isActive }) => `tn-nav-link ${isActive ? 'active' : ''}`}>
                Destinations
              </NavLink>
            </li>
            <li>
              <a
                href="/#features"
                onClick={(e) => handleSectionScroll(e, 'features')}
                className="tn-nav-link"
              >
                Features
              </a>
            </li>
            <li>
              <a
                href="/#how-it-works"
                onClick={(e) => handleSectionScroll(e, 'how-it-works')}
                className="tn-nav-link"
              >
                How It Works
              </a>
            </li>
          </ul>
        </nav>

        {/* Action Buttons / User Menu & Theme Toggle */}
        <div className="tn-navbar-actions">
          <ThemeToggle />
          {user ? (
            <Link to="/dashboard" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="sm">Go to Dashboard ➔</Button>
            </Link>
          ) : (
            <>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <Button variant="ghost" size="sm">Log In</Button>
              </Link>
              <Link to="/signup" style={{ textDecoration: 'none' }}>
                <Button variant="primary" size="sm">Plan a Trip</Button>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <MobileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
};

export default Navbar;
