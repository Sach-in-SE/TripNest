import React, { useState, useEffect } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../pages/admin/AdminLayout.css";

const ADMIN_NAV_ITEMS = [
  { path: "/admin/dashboard", label: "Overview", icon: "📊" },
  { path: "/admin/users", label: "User Management", icon: "👥" },
  { path: "/admin/destinations", label: "Destinations", icon: "📍" },
  { path: "/admin/messages", label: "Support Inbox", icon: "📨" },
  { path: "/admin/reports", label: "Analytics & Reports", icon: "📈" },
];

export const AdminLayout = ({ children, pageTitle = "Admin Portal" }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth > 768 && window.innerWidth <= 1024;
    }
    return false;
  });

  // Handle responsive collapse on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsCollapsed(false);
      } else if (window.innerWidth <= 1024) {
        setIsCollapsed(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [location.pathname]);

  // Handle Escape key to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isDrawerOpen) {
        setIsDrawerOpen(false);
      }
    };
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDrawerOpen]);

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const adminDisplayName =
    (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}`.trim() : null) ||
    user?.name ||
    user?.username ||
    user?.email?.split("@")[0] ||
    "Admin";

  return (
    <div className={`admin-portal-layout ${isCollapsed ? "sidebar-collapsed" : ""}`}>
      {/* Mobile Drawer Backdrop */}
      {isDrawerOpen && (
        <div
          className="admin-drawer-backdrop"
          onClick={() => setIsDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Admin Sidebar Navigation */}
      <aside
        id="admin-sidebar"
        className={`admin-sidebar ${isCollapsed ? "collapsed" : ""} ${isDrawerOpen ? "mobile-open" : ""}`}
        aria-label="Admin Navigation Sidebar"
      >
        <div className="admin-sidebar-header">
          <Link
            to="/admin/dashboard"
            className="admin-brand"
            title="TripNest Admin Portal"
            aria-label="TripNest Admin Portal"
          >
            <span className="admin-brand-icon">🛡️</span>
            {(!isCollapsed || isDrawerOpen) && (
              <>
                <span className="admin-brand-text">TripNest</span>
                <span className="admin-brand-tag">ADMIN</span>
              </>
            )}
          </Link>

          {/* Desktop/Tablet Collapse Button */}
          <button
            type="button"
            className="admin-collapse-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!isCollapsed}
            aria-controls="admin-sidebar"
          >
            {isCollapsed ? "⇥" : "⇤"}
          </button>

          {/* Mobile Drawer Close Button */}
          <button
            type="button"
            className="admin-mobile-close-btn"
            onClick={() => setIsDrawerOpen(false)}
            aria-label="Close admin menu"
          >
            ✕
          </button>
        </div>

        <nav className="admin-nav" aria-label="Admin Navigation">
          {ADMIN_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}
              title={item.label}
              aria-label={item.label}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              {(!isCollapsed || isDrawerOpen) && (
                <span className="admin-nav-label">{item.label}</span>
              )}
            </NavLink>
          ))}

          <div className="admin-nav-divider" />

          <Link
            to="/dashboard"
            className="admin-nav-item admin-nav-traveler-link"
            title="Switch to Traveler App"
            aria-label="Switch to Traveler App"
          >
            <span className="admin-nav-icon">🧳</span>
            {(!isCollapsed || isDrawerOpen) && (
              <span className="admin-nav-label">Traveler App</span>
            )}
          </Link>
        </nav>
      </aside>

      {/* Main Content Area Shell */}
      <div className="admin-main-wrapper">
        {/* Top Header */}
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              type="button"
              className="admin-hamburger-btn"
              onClick={() => setIsDrawerOpen(true)}
              aria-label="Open Admin Menu"
              aria-expanded={isDrawerOpen}
              aria-controls="admin-sidebar"
            >
              ☰
            </button>
            <div className="admin-page-title">{pageTitle}</div>
          </div>

          <div className="admin-user-profile">
            <div className="admin-user-info">
              <div className="admin-username">{adminDisplayName}</div>
              <div className="admin-role-badge">System Administrator</div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="admin-logout-btn"
              aria-label="Sign Out"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="admin-content-area">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
