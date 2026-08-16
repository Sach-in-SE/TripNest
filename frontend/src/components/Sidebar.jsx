import { useState, useEffect, useCallback } from "react";
import { NavLink, useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import MobileDrawer from "./layout/MobileDrawer";

const PRIMARY_TRAVELER_NAV = [
  { path: "/dashboard", icon: "⊞", label: "Dashboard" },
  { path: "/trips", icon: "✈️", label: "My Trips" },
  { path: "/itineraries", icon: "📅", label: "Itineraries" },
  { path: "/budget", icon: "💰", label: "Budget" },
  { path: "/destinations", icon: "🌍", label: "Destinations" },
  { path: "/groups", icon: "👥", label: "Groups" },
  { path: "/documents", icon: "📁", label: "Documents" },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isTabletExpanded, setIsTabletExpanded] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profile, setProfile] = useState(null);

  // Fetch unread notification count & profile info safely
  const fetchNavData = useCallback(async () => {
    try {
      const [countRes, profileRes] = await Promise.all([
        api.get("/notifications/unread/count").catch(() => ({ data: 0 })),
        api.get("/user/profile").catch(() => ({ data: null })),
      ]);
      if (typeof countRes.data === "number") {
        setUnreadCount(countRes.data);
      }
      if (profileRes.data) {
        setProfile(profileRes.data);
      }
    } catch {
      // Safe fallback - zero fabricated data
    }
  }, []);

  useEffect(() => {
    fetchNavData();
  }, [fetchNavData, location.pathname]);

  // Close menus on route navigation or Escape key
  useEffect(() => {
    setIsAccountMenuOpen(false);
    setIsDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsAccountMenuOpen(false);
        setIsDrawerOpen(false);
      }
    };
    if (isAccountMenuOpen || isDrawerOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAccountMenuOpen, isDrawerOpen]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = PRIMARY_TRAVELER_NAV;

  // Dynamic user avatar initial
  const userInitial = (
    profile?.firstName ||
    user?.username ||
    user?.email ||
    "T"
  )
    .charAt(0)
    .toUpperCase();

  const userDisplayName =
    profile?.firstName
      ? `${profile.firstName} ${profile.lastName || ""}`.trim()
      : user?.username || "Traveler";

  // Derive current page context title & icon
  const getPageContext = (pathname) => {
    if (pathname.startsWith("/dashboard")) return { title: "Dashboard", icon: "⊞" };
    if (pathname.startsWith("/trips/new")) return { title: "Plan New Trip", icon: "✈️" };
    if (pathname.startsWith("/trips")) return { title: "My Trips", icon: "✈️" };
    if (pathname.startsWith("/itineraries")) return { title: "Trip Itineraries", icon: "📅" };
    if (pathname.startsWith("/budget")) return { title: "Budget Tracker", icon: "💰" };
    if (pathname.startsWith("/destinations")) return { title: "Destinations Catalog", icon: "🌍" };
    if (pathname.startsWith("/groups")) return { title: "Group Travel", icon: "👥" };
    if (pathname.startsWith("/documents")) return { title: "Travel Documents", icon: "📁" };
    if (pathname.startsWith("/notifications")) return { title: "Notifications", icon: "🔔" };
    if (pathname.startsWith("/settings/notifications") || pathname.startsWith("/notification-preferences")) return { title: "Notification Settings", icon: "⚙️" };
    if (pathname.startsWith("/settings")) return { title: "Settings", icon: "⚙️" };
    if (pathname.startsWith("/profile")) return { title: "Traveler Profile", icon: "👤" };
    return { title: "Travel Workspace", icon: "🧳" };
  };

  const pageContext = getPageContext(location.pathname);

  return (
    <>
      {/* 1. Mobile Top Header (< 640px) */}
      <header className="tn-mobile-header">
        <div className="tn-mobile-header-left">
          <button
            type="button"
            className="tn-mobile-hamburger"
            onClick={() => {
              setIsAccountMenuOpen(false);
              setIsDrawerOpen(true);
            }}
            aria-label="Open navigation menu"
            aria-expanded={isDrawerOpen}
          >
            ☰
          </button>
          <Link to="/dashboard" className="tn-mobile-brand" aria-label="TripNest Dashboard">
            <span className="tn-mobile-brand-icon">🧳</span>
            <span className="tn-mobile-brand-text gradient-text">TripNest</span>
          </Link>
        </div>

        <div className="tn-mobile-header-right">
          {/* Notification Icon */}
          <Link
            to="/notifications"
            className="tn-navbar-action-btn"
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
            title="Notifications"
          >
            <span className="tn-navbar-bell-icon">🔔</span>
            {unreadCount > 0 && (
              <span className="tn-navbar-badge">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          {/* User Avatar Button (Opens Account Menu) */}
          <button
            type="button"
            className={`tn-navbar-avatar-btn ${isAccountMenuOpen ? "active" : ""}`}
            onClick={() => {
              setIsDrawerOpen(false);
              setIsAccountMenuOpen((prev) => !prev);
            }}
            aria-label="Open account menu"
            aria-expanded={isAccountMenuOpen}
            title="Account Menu"
          >
            <span className="tn-navbar-avatar-initial">{userInitial}</span>
          </button>
        </div>
      </header>

      {/* 2. Connected Mobile Navigation Drawer (< 640px) */}
      <MobileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      {/* 3. Top Traveler Navbar (Desktop & Tablet >= 640px) */}
      <header className="tn-user-navbar">
        {/* Left: Minimal Page Context */}
        <div className="tn-user-navbar-left">
          <div className="tn-navbar-context">
            <span className="tn-navbar-context-icon">{pageContext.icon}</span>
            <span className="tn-navbar-context-title">{pageContext.title}</span>
          </div>
        </div>

        {/* Right: Notification Bell + User Avatar Button */}
        <div className="tn-user-navbar-right">
          <Link
            to="/notifications"
            className="tn-navbar-action-btn"
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
            title="Notifications"
          >
            <span className="tn-navbar-bell-icon">🔔</span>
            {unreadCount > 0 && (
              <span className="tn-navbar-badge">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            className={`tn-navbar-avatar-btn ${isAccountMenuOpen ? "active" : ""}`}
            onClick={() => setIsAccountMenuOpen((prev) => !prev)}
            aria-label="Open account menu"
            aria-expanded={isAccountMenuOpen}
            title="Account & Settings"
          >
            <span className="tn-navbar-avatar-initial">{userInitial}</span>
          </button>
        </div>
      </header>

      {/* 4. Desktop & Tablet Sidebar (>= 640px) */}
      <aside className={`tn-user-sidebar ${isTabletExpanded ? "tn-user-sidebar--expanded" : ""}`}>
        {/* Brand Logo & Tablet Toggle */}
        <div className="tn-user-sidebar-header">
          <div
            className="tn-user-sidebar-logo"
            onClick={() => navigate("/dashboard")}
            role="button"
            tabIndex={0}
            title="TripNest Dashboard"
          >
            <span className="tn-user-sidebar-logo-icon">🧳</span>
            <span className="tn-user-sidebar-logo-text gradient-text">
              TripNest
            </span>
          </div>

          <button
            type="button"
            className="tn-tablet-sidebar-toggle"
            onClick={() => setIsTabletExpanded((prev) => !prev)}
            aria-label={isTabletExpanded ? "Collapse sidebar" : "Expand sidebar"}
            title={isTabletExpanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            <span style={{ fontSize: "18px", lineHeight: 1 }}>{isTabletExpanded ? "✕" : "☰"}</span>
          </button>
        </div>

        {/* Focused Primary Navigation Links */}
        <nav className="tn-user-sidebar-nav" aria-label="Traveler Navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `tn-user-sidebar-item ${isActive ? "active" : ""}`
              }
              title={item.label}
            >
              <span className="tn-user-sidebar-icon">{item.icon}</span>
              <span className="tn-user-sidebar-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* 5. User Account Compact Dropdown Popover */}
      {isAccountMenuOpen && (
        <>
          <div
            className="tn-account-backdrop"
            onClick={() => setIsAccountMenuOpen(false)}
            aria-hidden="true"
          />
          <div
            className="tn-account-menu"
            role="dialog"
            aria-label="User Account Menu"
            aria-modal="true"
          >
            {/* Account Header */}
            <div className="tn-account-header">
              <div className="tn-account-avatar">{userInitial}</div>
              <div className="tn-account-user-info">
                <p className="tn-account-user-name">{userDisplayName}</p>
                <p className="tn-account-user-email">
                  {user?.email || "traveler@tripnest.com"}
                </p>
              </div>
            </div>

            <div className="tn-account-divider" />

            {/* Account Navigation */}
            <nav className="tn-account-nav" aria-label="Account Menu Navigation">
              <Link
                to="/profile"
                className="tn-account-item"
                onClick={() => setIsAccountMenuOpen(false)}
              >
                <span className="tn-account-icon">👤</span>
                <span className="tn-account-label">Profile & Preferences</span>
              </Link>

              <Link
                to="/settings"
                className="tn-account-item"
                onClick={() => setIsAccountMenuOpen(false)}
              >
                <span className="tn-account-icon">⚙️</span>
                <span className="tn-account-label">Settings</span>
              </Link>
            </nav>

            <div className="tn-account-divider" />

            {/* Logout Action */}
            <div className="tn-account-footer">
              <button
                type="button"
                className="tn-account-logout-btn"
                onClick={handleLogout}
              >
                <span className="tn-account-icon">🚪</span>
                <span>Log out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Sidebar;