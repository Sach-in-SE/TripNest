import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import "./AdminLayout.css";

function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/admin/stats");
      setStats(response.data);
    } catch (err) {
      console.error("Failed to fetch admin stats:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load administrative system statistics. Please verify backend service and session credentials."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="admin-portal-layout">
      {/* Admin Sidebar Navigation */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-brand">
            <span>🛡️ TripNest</span>
            <span className="admin-brand-tag">ADMIN</span>
          </div>
        </div>

        <nav className="admin-nav">
          <Link to="/admin/dashboard" className="admin-nav-item active">
            📊 Overview
          </Link>
          <Link to="/admin/users" className="admin-nav-item">
            👥 User Management
          </Link>
          <Link to="/admin/destinations" className="admin-nav-item">
            📍 Destinations
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="admin-main-wrapper">
        {/* Top Header */}
        <header className="admin-topbar">
          <div className="admin-page-title">Admin Dashboard</div>

          <div className="admin-user-profile">
            <div className="admin-user-info">
              <div className="admin-username">{user?.username || "Admin"}</div>
              <div className="admin-role-badge">System Administrator</div>
            </div>
            <button onClick={handleLogout} className="admin-logout-btn">
              Sign Out
            </button>
          </div>
        </header>

        {/* Main Dashboard Content */}
        <main className="admin-content-area">
          <div className="admin-dashboard-header">
            <div>
              <h2>System Control Center</h2>
              <p>Real-time platform overview and operational metrics</p>
            </div>
            <button
              onClick={fetchStats}
              disabled={loading}
              className="admin-refresh-btn"
              title="Refresh statistics"
            >
              🔄 {loading ? "Refreshing..." : "Refresh Stats"}
            </button>
          </div>

          {loading ? (
            <div className="admin-loading-container">
              <div className="admin-spinner"></div>
              <p style={{ color: "#94a3b8", fontSize: "0.95rem" }}>
                Loading system metrics from server...
              </p>
            </div>
          ) : error ? (
            <div className="admin-error-container">
              <div className="admin-error-icon">⚠️</div>
              <div className="admin-error-msg">{error}</div>
              <button onClick={fetchStats} className="admin-retry-btn">
                Retry Loading
              </button>
            </div>
          ) : (
            <>
              {/* User Account Metrics */}
              <div className="admin-section-title">
                👥 User Management Metrics
              </div>
              <div className="admin-stats-grid">
                <div className="admin-stat-card">
                  <div className="admin-stat-icon users-total">👥</div>
                  <div className="admin-stat-info">
                    <div className="admin-stat-label">Total Users</div>
                    <div className="admin-stat-value">
                      {stats?.totalUsers ?? 0}
                    </div>
                    <div className="admin-stat-subtext">Registered Accounts</div>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-icon users-active">✅</div>
                  <div className="admin-stat-info">
                    <div className="admin-stat-label">Active Users</div>
                    <div className="admin-stat-value">
                      {stats?.activeUsers ?? 0}
                    </div>
                    <div className="admin-stat-subtext">Enabled Accounts</div>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-icon users-disabled">🚫</div>
                  <div className="admin-stat-info">
                    <div className="admin-stat-label">Disabled Users</div>
                    <div className="admin-stat-value">
                      {stats?.disabledUsers ?? 0}
                    </div>
                    <div className="admin-stat-subtext">Restricted Accounts</div>
                  </div>
                </div>
              </div>

              {/* Trip Operational Metrics */}
              <div className="admin-section-title">
                ✈️ Trip Operations & Status
              </div>
              <div className="admin-stats-grid">
                <div className="admin-stat-card">
                  <div className="admin-stat-icon trips-total">🗺️</div>
                  <div className="admin-stat-info">
                    <div className="admin-stat-label">Total Trips</div>
                    <div className="admin-stat-value">
                      {stats?.totalTrips ?? 0}
                    </div>
                    <div className="admin-stat-subtext">Platform-wide</div>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-icon trips-active">⚡</div>
                  <div className="admin-stat-info">
                    <div className="admin-stat-label">Active Trips</div>
                    <div className="admin-stat-value">
                      {stats?.activeTrips ?? 0}
                    </div>
                    <div className="admin-stat-subtext">Planning/Upcoming/Ongoing</div>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-icon trips-planning">📝</div>
                  <div className="admin-stat-info">
                    <div className="admin-stat-label">Planning Trips</div>
                    <div className="admin-stat-value">
                      {stats?.planningTrips ?? 0}
                    </div>
                    <div className="admin-stat-subtext">In Draft / Setup</div>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-icon trips-ongoing">🧭</div>
                  <div className="admin-stat-info">
                    <div className="admin-stat-label">Ongoing Trips</div>
                    <div className="admin-stat-value">
                      {stats?.ongoingTrips ?? 0}
                    </div>
                    <div className="admin-stat-subtext">Currently Active</div>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-icon trips-completed">🏁</div>
                  <div className="admin-stat-info">
                    <div className="admin-stat-label">Completed Trips</div>
                    <div className="admin-stat-value">
                      {stats?.completedTrips ?? 0}
                    </div>
                    <div className="admin-stat-subtext">Finished Journeys</div>
                  </div>
                </div>
              </div>

              {/* Destinations & Financial Overview */}
              <div className="admin-section-title">
                📍 Platform Catalog & Financial Overview
              </div>
              <div className="admin-stats-grid">
                <div className="admin-stat-card">
                  <div className="admin-stat-icon destinations">📍</div>
                  <div className="admin-stat-info">
                    <div className="admin-stat-label">Total Destinations</div>
                    <div className="admin-stat-value">
                      {stats?.totalDestinations ?? 0}
                    </div>
                    <div className="admin-stat-subtext">Cataloged Places</div>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-icon financial-budget">💰</div>
                  <div className="admin-stat-info">
                    <div className="admin-stat-label">Total Budget</div>
                    <div className="admin-stat-value">
                      {formatCurrency(stats?.totalBudgetedAmount)}
                    </div>
                    <div className="admin-stat-subtext">Allocated Funds</div>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-icon financial-expenses">💳</div>
                  <div className="admin-stat-info">
                    <div className="admin-stat-label">Total Expenses</div>
                    <div className="admin-stat-value">
                      {formatCurrency(stats?.totalExpensesAmount)}
                    </div>
                    <div className="admin-stat-subtext">Logged Spend ({stats?.totalExpensesCount ?? 0} entries)</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;
