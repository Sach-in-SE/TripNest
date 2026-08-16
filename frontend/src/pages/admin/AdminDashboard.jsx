import { useState, useEffect, useCallback } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import api from "../../services/api";
import { Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import "./AdminLayout.css";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

const CATEGORIES = [
  "Beach",
  "Mountains",
  "Historical",
  "Adventure",
  "Spiritual",
  "Wildlife",
  "City",
];

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, usersRes, destsRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/users").catch(() => ({ data: [] })),
        api.get("/destinations").catch(() => ({ data: [] })),
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data || []);
      setDestinations(destsRes.data || []);
    } catch (err) {
      console.error("Failed to fetch admin dashboard data:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load administrative system statistics. Please verify backend service and session credentials."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // --- CHART 1: USER ROLE DISTRIBUTION ---
  const countTravelers = users.filter((u) =>
    u.roles?.some((r) => r === "ROLE_TRAVELER" || r === "TRAVELER")
  ).length;
  const countGroupAdmins = users.filter((u) =>
    u.roles?.some((r) => r === "ROLE_GROUP_ADMIN" || r === "GROUP_ADMIN")
  ).length;
  const countAdmins = users.filter((u) =>
    u.roles?.some((r) => r === "ROLE_ADMIN" || r === "ADMIN")
  ).length;

  const userRoleData = {
    labels: ["Traveler", "Group Admin", "Administrator"],
    datasets: [
      {
        data:
          users.length > 0
            ? [countTravelers, countGroupAdmins, countAdmins]
            : [stats?.activeUsers || 0, 0, 1],
        backgroundColor: ["#38bdf8", "#c084fc", "#818cf8"],
        borderColor: ["#0284c7", "#9333ea", "#4f46e5"],
        borderWidth: 1.5,
      },
    ],
  };

  // --- CHART 2: TRIP STATUS DISTRIBUTION ---
  const tripStatusData = {
    labels: ["Planning", "Upcoming", "Ongoing", "Completed", "Cancelled"],
    datasets: [
      {
        data: [
          stats?.planningTrips || 0,
          stats?.upcomingTrips || 0,
          stats?.ongoingTrips || 0,
          stats?.completedTrips || 0,
          stats?.cancelledTrips || 0,
        ],
        backgroundColor: ["#fde047", "#38bdf8", "#fb923c", "#34d399", "#fca5a5"],
        borderColor: ["#ca8a04", "#0284c7", "#ea580c", "#059669", "#dc2626"],
        borderWidth: 1.5,
      },
    ],
  };

  // --- CHART 3: DESTINATION CATEGORY DISTRIBUTION ---
  const destCategoryCounts = CATEGORIES.map(
    (cat) =>
      destinations.filter(
        (d) => (d.category || "").toLowerCase() === cat.toLowerCase()
      ).length
  );

  const destCategoryData = {
    labels: CATEGORIES,
    datasets: [
      {
        label: "Destinations",
        data: destCategoryCounts,
        backgroundColor: [
          "#f472b6",
          "#38bdf8",
          "#fb923c",
          "#34d399",
          "#c084fc",
          "#fde047",
          "#818cf8",
        ],
        borderRadius: 6,
      },
    ],
  };

  // --- CHART 4: FINANCIAL OVERVIEW (BUDGET VS EXPENSES) ---
  const financialData = {
    labels: ["Total Allocated Budget", "Total Logged Expenses"],
    datasets: [
      {
        label: "Amount (₹)",
        data: [stats?.totalBudgetedAmount || 0, stats?.totalExpensesAmount || 0],
        backgroundColor: ["#4ade80", "#fb7185"],
        borderColor: ["#16a34a", "#e11d48"],
        borderWidth: 1.5,
        borderRadius: 8,
      },
    ],
  };

  // --- COMMON CHART OPTIONS ---
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#cbd5e1",
          font: { family: "Inter, sans-serif", size: 12 },
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: "#0f172a",
        titleColor: "#ffffff",
        bodyColor: "#cbd5e1",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
      },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0f172a",
        titleColor: "#ffffff",
        bodyColor: "#cbd5e1",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: { color: "#94a3b8", font: { size: 11 } },
        grid: { color: "rgba(255, 255, 255, 0.05)" },
      },
      y: {
        ticks: { color: "#94a3b8", precision: 0 },
        grid: { color: "rgba(255, 255, 255, 0.05)" },
        beginAtZero: true,
      },
    },
  };

  const financialBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0f172a",
        titleColor: "#ffffff",
        bodyColor: "#4ade80",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        callbacks: {
          label: (context) =>
            ` Amount: ₹${Number(context.raw || 0).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "#cbd5e1", font: { weight: "600" } },
        grid: { color: "rgba(255, 255, 255, 0.05)" },
      },
      y: {
        ticks: {
          color: "#94a3b8",
          callback: (value) => `₹${Number(value).toLocaleString("en-IN")}`,
        },
        grid: { color: "rgba(255, 255, 255, 0.05)" },
        beginAtZero: true,
      },
    },
  };

  return (
    <AdminLayout pageTitle="Admin Dashboard">
      <div className="admin-dashboard-header">
        <div>
          <h2>System Control Center</h2>
          <p>Real-time platform overview and operational metrics</p>
        </div>
            <button
              onClick={fetchDashboardData}
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
                Loading system metrics and graphical analytics from server...
              </p>
            </div>
          ) : error ? (
            <div className="admin-error-container">
              <div className="admin-error-icon">⚠️</div>
              <div className="admin-error-msg">{error}</div>
              <button onClick={fetchDashboardData} className="admin-retry-btn">
                Retry Loading
              </button>
            </div>
          ) : (
            <>
              {/* User Account Metrics Cards */}
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

              {/* Trip Operational Metrics Cards */}
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

              {/* Destinations & Financial Overview Cards */}
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
                    <div className="admin-stat-subtext">
                      Logged Spend ({stats?.totalExpensesCount ?? 0} entries)
                    </div>
                  </div>
                </div>
              </div>

              {/* --- GRAPHICAL ANALYTICS SECTION --- */}
              <div className="admin-section-title" style={{ marginTop: "2.5rem" }}>
                📈 Graphical Analytics Overview
              </div>

              <div className="admin-charts-grid">
                {/* 1. User Role Distribution */}
                <div className="admin-chart-card">
                  <div className="admin-chart-header">
                    <h3>👥 User Role Distribution</h3>
                    <p>Platform user accounts categorized by assigned roles</p>
                  </div>
                  <div className="admin-chart-body">
                    <Doughnut data={userRoleData} options={doughnutOptions} />
                  </div>
                </div>

                {/* 2. Trip Status Distribution */}
                <div className="admin-chart-card">
                  <div className="admin-chart-header">
                    <h3>✈️ Trip Status Breakdown</h3>
                    <p>Visual distribution across planning, ongoing, completed & cancelled trips</p>
                  </div>
                  <div className="admin-chart-body">
                    <Doughnut data={tripStatusData} options={doughnutOptions} />
                  </div>
                </div>

                {/* 3. Destination Categories */}
                <div className="admin-chart-card">
                  <div className="admin-chart-header">
                    <h3>📍 Destination Categories</h3>
                    <p>Destination count per travel category</p>
                  </div>
                  <div className="admin-chart-body">
                    <Bar data={destCategoryData} options={barOptions} />
                  </div>
                </div>

                {/* 4. Financial Analytics */}
                <div className="admin-chart-card">
                  <div className="admin-chart-header">
                    <h3>💰 Financial Analytics (Budget vs Expenses)</h3>
                    <p>System-wide allocated budget vs logged expenditures (in ₹)</p>
                  </div>
                  <div className="admin-chart-body">
                    <Bar data={financialData} options={financialBarOptions} />
                  </div>
                </div>
              </div>
            </>
          )}
    </AdminLayout>
  );
}

export default AdminDashboard;
