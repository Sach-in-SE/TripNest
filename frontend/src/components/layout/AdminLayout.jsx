import React, { useState, useEffect } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
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

  // Admin Self Password Change State
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");

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

  // Handle Escape key to close mobile drawer or modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (isChangePasswordOpen) {
          closeChangePasswordModal();
        } else if (isDrawerOpen) {
          setIsDrawerOpen(false);
        }
      }
    };
    if (isDrawerOpen || isChangePasswordOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDrawerOpen, isChangePasswordOpen]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess("");

    if (!currentPassword) {
      setPwdError("Current password is required");
      return;
    }
    if (newPassword.length < 6) {
      setPwdError("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError("New password and confirm password do not match");
      return;
    }

    setPwdLoading(true);
    try {
      await api.post("/user/change-password", {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setPwdSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setIsChangePasswordOpen(false);
        setPwdSuccess("");
      }, 1500);
    } catch (err) {
      console.error("Failed to change password:", err);
      setPwdError(err.response?.data?.message || "Failed to change password. Please verify current password.");
    } finally {
      setPwdLoading(false);
    }
  };

  const closeChangePasswordModal = () => {
    setIsChangePasswordOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPwdError("");
    setPwdSuccess("");
  };

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
              onClick={() => setIsChangePasswordOpen(true)}
              className="admin-change-pwd-btn"
              aria-label="Change Admin Password"
              title="Change Admin Password"
            >
              🔑 Change Password
            </button>
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

      {/* Admin Change Password Modal */}
      {isChangePasswordOpen && (
        <div
          className="admin-modal-overlay"
          onClick={closeChangePasswordModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-change-pwd-title"
        >
          <div
            className="admin-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "440px" }}
          >
            <div className="admin-modal-header">
              <h3 id="admin-change-pwd-title" className="admin-modal-title">
                🔑 Change Your Password
              </h3>
              <button
                type="button"
                onClick={closeChangePasswordModal}
                className="admin-modal-close"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleChangePassword}>
              <div className="admin-modal-body">
                {pwdError && (
                  <div
                    style={{
                      background: "rgba(239, 68, 68, 0.15)",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      color: "#fca5a5",
                      padding: "0.75rem",
                      borderRadius: "6px",
                      marginBottom: "1rem",
                      fontSize: "0.875rem",
                    }}
                    role="alert"
                  >
                    {pwdError}
                  </div>
                )}
                {pwdSuccess && (
                  <div
                    style={{
                      background: "rgba(34, 197, 94, 0.15)",
                      border: "1px solid rgba(34, 197, 94, 0.3)",
                      color: "#86efac",
                      padding: "0.75rem",
                      borderRadius: "6px",
                      marginBottom: "1rem",
                      fontSize: "0.875rem",
                    }}
                    role="status"
                  >
                    {pwdSuccess}
                  </div>
                )}

                <div style={{ marginBottom: "1rem" }}>
                  <label
                    htmlFor="current-admin-pwd"
                    style={{
                      display: "block",
                      marginBottom: "0.4rem",
                      fontSize: "0.85rem",
                      fontWeight: "600",
                      color: "#cbd5e1",
                    }}
                  >
                    Current Password
                  </label>
                  <input
                    id="current-admin-pwd"
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="admin-search-input"
                    style={{ width: "100%" }}
                  />
                </div>

                <div style={{ marginBottom: "1rem" }}>
                  <label
                    htmlFor="new-admin-pwd"
                    style={{
                      display: "block",
                      marginBottom: "0.4rem",
                      fontSize: "0.85rem",
                      fontWeight: "600",
                      color: "#cbd5e1",
                    }}
                  >
                    New Password (min 6 characters)
                  </label>
                  <input
                    id="new-admin-pwd"
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="admin-search-input"
                    style={{ width: "100%" }}
                  />
                </div>

                <div style={{ marginBottom: "1rem" }}>
                  <label
                    htmlFor="confirm-admin-pwd"
                    style={{
                      display: "block",
                      marginBottom: "0.4rem",
                      fontSize: "0.85rem",
                      fontWeight: "600",
                      color: "#cbd5e1",
                    }}
                  >
                    Confirm New Password
                  </label>
                  <input
                    id="confirm-admin-pwd"
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="admin-search-input"
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              <div className="admin-modal-actions admin-modal-footer">
                <button
                  type="button"
                  onClick={closeChangePasswordModal}
                  className="admin-btn-secondary btn-secondary"
                  disabled={pwdLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn-primary btn-primary"
                  disabled={pwdLoading}
                >
                  {pwdLoading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
