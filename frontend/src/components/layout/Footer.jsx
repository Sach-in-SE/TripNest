import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export const Footer = () => {
  const location = useLocation();
  const navigate = useNavigate();

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
    <footer className="tn-footer" role="contentinfo" aria-label="TripNest Site Footer">
      <div className="tn-footer-container">
        <div className="tn-footer-grid">
          {/* Brand & Tagline */}
          <div className="tn-footer-brand-col">
            <Link to="/" className="tn-footer-logo" style={{ textDecoration: 'none' }}>
              <span className="tn-footer-logo-icon" aria-hidden="true">🧳</span>
              <span className="tn-footer-logo-text">TripNest</span>
            </Link>
            <p className="tn-footer-tagline">
              Smart travel planning made simple.
            </p>
          </div>

          {/* Product Links */}
          <div className="tn-footer-col">
            <h4 className="tn-footer-heading">Product</h4>
            <ul className="tn-footer-links">
              <li>
                <Link to="/destinations" className="tn-footer-link">Destinations</Link>
              </li>
              <li>
                <a
                  href="/#how-it-works"
                  onClick={(e) => handleSectionScroll(e, 'how-it-works')}
                  className="tn-footer-link"
                >
                  How It Works
                </a>
              </li>
              <li>
                <a
                  href="/#features"
                  onClick={(e) => handleSectionScroll(e, 'features')}
                  className="tn-footer-link"
                >
                  Features
                </a>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="tn-footer-col">
            <h4 className="tn-footer-heading">Company</h4>
            <ul className="tn-footer-links">
              <li>
                <Link to="/about" className="tn-footer-link">About</Link>
              </li>
              <li>
                <Link to="/contact" className="tn-footer-link">Contact</Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="tn-footer-col">
            <h4 className="tn-footer-heading">Legal</h4>
            <ul className="tn-footer-links">
              <li>
                <Link to="/privacy" className="tn-footer-link">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/terms" className="tn-footer-link">Terms of Service</Link>
              </li>
            </ul>
          </div>

          {/* Account Links */}
          <div className="tn-footer-col">
            <h4 className="tn-footer-heading">Account</h4>
            <ul className="tn-footer-links">
              <li>
                <Link to="/login" className="tn-footer-link">Login</Link>
              </li>
              <li>
                <Link to="/signup" className="tn-footer-link">Sign Up</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="tn-footer-bottom">
          <p className="tn-footer-copyright">
            © {new Date().getFullYear()} TripNest. All rights reserved.
          </p>
          <div className="tn-footer-status">
            <span className="tn-status-indicator" aria-hidden="true" />
            <span>Open-Meteo & Wikipedia Verified Data</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
