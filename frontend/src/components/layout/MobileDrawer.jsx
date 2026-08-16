import React, { useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import IconButton from '../ui/IconButton';
import ThemeToggle from '../ui/ThemeToggle';

export const MobileDrawer = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const publicLinks = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/destinations', label: 'Destinations', icon: '🌍' },
    { path: '/login', label: 'Log In', icon: '🔑' },
    { path: '/signup', label: 'Plan a Trip', icon: '🚀' },
  ];

  const authenticatedWorkspaceItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '⊞' },
    { path: '/trips', label: 'My Trips', icon: '✈️' },
    { path: '/itineraries', label: 'Itineraries', icon: '📅' },
    { path: '/budget', label: 'Budget', icon: '💰' },
    { path: '/destinations', label: 'Destinations', icon: '🌍' },
    { path: '/groups', label: 'Groups', icon: '👥' },
    { path: '/documents', label: 'Documents', icon: '📁' },
  ];

  const navItems = user ? authenticatedWorkspaceItems : publicLinks;

  return (
    <>
      <div
        className="tn-drawer-overlay"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className="tn-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation Menu"
      >
        <div className="tn-drawer-header">
          <Link to={user ? "/dashboard" : "/"} className="tn-navbar-brand" onClick={onClose} aria-label="TripNest Home">
            <span style={{ fontSize: '24px' }}>🧳</span>
            <span className="tn-navbar-logo-text">TripNest</span>
          </Link>
          <IconButton icon="✕" onClick={onClose} aria-label="Close navigation menu" />
        </div>

        <nav className="tn-sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `tn-sidebar-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--tn-border-subtle)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
            <span style={{ fontSize: 'var(--tn-text-xs)', color: 'var(--tn-text-muted)' }}>Appearance</span>
            <ThemeToggle />
          </div>
        </div>
      </aside>
    </>
  );
};

export const NavDrawer = MobileDrawer;
export default MobileDrawer;
