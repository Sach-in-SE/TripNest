import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';
import IconButton from '../ui/IconButton';
import Footer from './Footer';

export const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        setIsDrawerOpen(false);
      }
    };
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDrawerOpen]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const adminDisplayName =
    (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}`.trim() : null) ||
    user?.name ||
    user?.username ||
    user?.email?.split('@')[0] ||
    'Administrator';

  const adminNavItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin/users', label: 'Users', icon: '👥' },
    { path: '/admin/destinations', label: 'Destinations', icon: '📍' },
    { path: '/admin/reports', label: 'Reports & Logs', icon: '📑' },
  ];

  return (
    <div className="tn-app-shell tn-user-layout">
      {/* Universal Admin Top Navbar */}
      <header className="tn-navbar" style={{ borderBottom: '1px solid rgba(239, 68, 68, 0.4)', background: 'rgba(15, 23, 42, 0.85)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            type="button"
            className="tn-hamburger-btn"
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Open Admin Menu"
            style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#fca5a5' }}
          >
            ☰
          </button>

          <Link to="/admin/dashboard" className="tn-navbar-brand">
            <span style={{ fontSize: '24px' }}>🛡️</span>
            <span
              className="tn-navbar-logo-text"
              style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              TripNest Admin
            </span>
          </Link>
        </div>

        {/* Right User Control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link
            to="/dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#94a3b8',
              textDecoration: 'none',
              fontSize: '13px',
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <span>🧳</span> Traveler App
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Avatar name={adminDisplayName} size="sm" />
            <div style={{ display: 'none', flexDirection: 'column' }} className="admin-user-details">
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#f8fafc' }}>
                {adminDisplayName}
              </span>
              <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: '700', letterSpacing: '0.05em' }}>
                ADMIN
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#fca5a5',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Universal Slide-in Admin Drawer */}
      {isDrawerOpen && (
        <>
          <div
            className="tn-drawer-overlay"
            onClick={() => setIsDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside
            className="tn-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Admin Navigation Drawer"
            style={{ borderRight: '1px solid rgba(239, 68, 68, 0.3)' }}
          >
            <div className="tn-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>🛡️</span>
                <span
                  style={{
                    fontFamily: 'var(--tn-font-display)',
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#f8fafc',
                  }}
                >
                  Admin Portal
                </span>
              </div>
              <IconButton icon="✕" onClick={() => setIsDrawerOpen(false)} aria-label="Close Admin Drawer" />
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '12px',
                marginBottom: '16px',
              }}
            >
              <Avatar name={adminDisplayName} size="md" />
              <div>
                <div style={{ fontWeight: '600', fontSize: '14px', color: '#f8fafc' }}>
                  {adminDisplayName}
                </div>
                <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: '700', letterSpacing: '0.05em' }}>
                  ROLE_ADMINISTRATOR
                </div>
              </div>
            </div>

            <nav className="tn-sidebar-nav">
              {adminNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `tn-sidebar-item ${isActive ? 'active' : ''}`}
                  onClick={() => setIsDrawerOpen(false)}
                  style={({ isActive }) => ({
                    color: isActive ? '#f87171' : 'var(--tn-text-muted)',
                    borderColor: isActive ? '#ef4444' : 'transparent',
                  })}
                >
                  <span style={{ fontSize: '18px' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}

              <div style={{ borderTop: '1px solid var(--tn-border-subtle)', margin: '12px 0' }} />

              <Link
                to="/dashboard"
                className="tn-sidebar-item"
                onClick={() => setIsDrawerOpen(false)}
              >
                <span style={{ fontSize: '18px' }}>🧳</span>
                <span>Traveler Experience</span>
              </Link>
            </nav>
          </aside>
        </>
      )}

      {/* Main Content Shell (Zero Left Margin Offset) */}
      <div className="tn-layout-body">
        <main className="tn-main-content" style={{ marginLeft: 0 }}>
          <div style={{ flex: 1 }}>{children}</div>
          <Footer />
        </main>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .admin-user-details {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminLayout;
