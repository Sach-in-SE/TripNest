import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import api from "../services/api";
import { Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
} from "chart.js";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title
);

const Dashboard = () => {
  const [profile, setProfile] = useState(null);
  const [trips, setTrips] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState("categories");

  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileRes, tripsRes, notifRes] = await Promise.all([
        api.get("/user/profile").catch(() => ({ data: null })),
        api.get("/trips").catch(() => ({ data: [] })),
        api.get("/notifications").catch(() => ({ data: [] })),
      ]);

      setProfile(profileRes.data);
      const fetchedTrips = Array.isArray(tripsRes.data) ? tripsRes.data : [];
      setTrips(fetchedTrips);
      setNotifications(Array.isArray(notifRes.data) ? notifRes.data : []);

      // Fetch expenses across all trips safely
      if (fetchedTrips.length > 0) {
        const allExpenses = await Promise.all(
          fetchedTrips.map((trip) =>
            api.get(`/expenses/trip/${trip.id}`).catch(() => ({ data: [] }))
          )
        );
        setExpenses(allExpenses.flatMap((res) => res.data || []));
      } else {
        setExpenses([]);
      }
    } catch (err) {
      console.error("Dashboard data fetch error:", err);
      setError("Unable to load latest dashboard data. Please check your connection and retry.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived statistics (Memoized)
  const tripStats = useMemo(() => {
    return {
      total: trips.length,
      planning: trips.filter((t) => t.status === "PLANNING").length,
      upcoming: trips.filter((t) => t.status === "UPCOMING").length,
      completed: trips.filter((t) => t.status === "COMPLETED").length,
      cancelled: trips.filter((t) => t.status === "CANCELLED").length,
    };
  }, [trips]);

  const totalBudget = useMemo(
    () => trips.reduce((sum, trip) => sum + (Number(trip.budget) || 0), 0),
    [trips]
  );

  const totalExpenses = useMemo(
    () => expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0),
    [expenses]
  );

  const remainingBudget = useMemo(
    () => Math.max(0, totalBudget - totalExpenses),
    [totalBudget, totalExpenses]
  );

  const averageTripCost = useMemo(
    () => (trips.length > 0 ? Math.round(totalBudget / trips.length) : 0),
    [trips, totalBudget]
  );

  const mostVisitedDestination = useMemo(() => {
    if (!trips.length) return "None yet";
    const counts = trips.reduce((acc, trip) => {
      if (trip.destination) {
        acc[trip.destination] = (acc[trip.destination] || 0) + 1;
      }
      return acc;
    }, {});
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || "None yet";
  }, [trips]);

  // Next Upcoming or Active Trip for the Spotlight Hero
  const upcomingTrip = useMemo(() => {
    if (!trips.length) return null;
    const upcomingList = trips.filter((t) => t.status === "UPCOMING" || t.status === "PLANNING");
    if (!upcomingList.length) return trips[0];
    return (
      upcomingList.find((t) => t.status === "UPCOMING") ||
      upcomingList[0]
    );
  }, [trips]);

  const daysUntilUpcoming = useMemo(() => {
    if (!upcomingTrip?.startDate) return null;
    const tripDate = new Date(upcomingTrip.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = tripDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [upcomingTrip]);

  // Expense category aggregation
  const categoryData = useMemo(() => {
    return expenses.reduce((acc, exp) => {
      const category = exp.category || "MISCELLANEOUS";
      acc[category] = (acc[category] || 0) + (Number(exp.amount) || 0);
      return acc;
    }, {});
  }, [expenses]);

  // Chart datasets
  const budgetUsageData = useMemo(() => {
    const isBudgetSet = totalBudget > 0;
    return {
      labels: ["Spent", isBudgetSet ? "Remaining Budget" : "No Budget Set"],
      datasets: [
        {
          data: isBudgetSet
            ? [totalExpenses, remainingBudget]
            : [totalExpenses || 1, 0],
          backgroundColor: ["#f43f5e", "#10b981"],
          hoverBackgroundColor: ["#e11d48", "#059669"],
          borderWidth: 0,
        },
      ],
    };
  }, [totalExpenses, remainingBudget, totalBudget]);

  const categoryDistributionData = useMemo(() => {
    const keys = Object.keys(categoryData);
    const values = Object.values(categoryData);
    return {
      labels: keys.length > 0 ? keys : ["No Expenses"],
      datasets: [
        {
          data: values.length > 0 ? values : [1],
          backgroundColor: [
            "#7c3aed",
            "#06b6d4",
            "#10b981",
            "#f59e0b",
            "#ec4899",
            "#6366f1",
            "#64748b",
          ],
          borderWidth: 0,
        },
      ],
    };
  }, [categoryData]);

  const tripsByStatusData = useMemo(() => {
    return {
      labels: ["Planning", "Upcoming", "Completed", "Cancelled"],
      datasets: [
        {
          data: [
            tripStats.planning,
            tripStats.upcoming,
            tripStats.completed,
            tripStats.cancelled,
          ],
          backgroundColor: ["#3b82f6", "#06b6d4", "#10b981", "#ef4444"],
          borderWidth: 0,
        },
      ],
    };
  }, [tripStats]);

  const recentExpenseTrendData = useMemo(() => {
    const recent = expenses.slice(-7);
    return {
      labels: recent.map((exp) => {
        if (exp.date) {
          const date = new Date(exp.date);
          return date.toLocaleDateString("en-US", { day: "2-digit", month: "short" });
        }
        return "Expense";
      }),
      datasets: [
        {
          label: "Amount (₹)",
          data: recent.map((exp) => exp.amount || 0),
          borderColor: "#7c3aed",
          backgroundColor: "rgba(124, 58, 237, 0.12)",
          fill: true,
          tension: 0.35,
          pointBackgroundColor: "#a78bfa",
          pointRadius: 4,
        },
      ],
    };
  }, [expenses]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#94a3b8",
          font: { size: 12, family: "'Space Grotesk', sans-serif" },
          padding: 12,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: "rgba(10, 15, 30, 0.95)",
        titleColor: "#f1f5f9",
        bodyColor: "#94a3b8",
        borderColor: "rgba(124, 58, 237, 0.35)",
        borderWidth: 1,
        padding: 10,
      },
    },
    cutout: "70%",
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(10, 15, 30, 0.95)",
        titleColor: "#f1f5f9",
        bodyColor: "#94a3b8",
        borderColor: "rgba(124, 58, 237, 0.35)",
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "rgba(255, 255, 255, 0.05)" },
        ticks: { color: "#94a3b8", font: { size: 11 } },
      },
      x: {
        grid: { display: false },
        ticks: { color: "#94a3b8", font: { size: 11 } },
      },
    },
  };

  const unreadNotifCount = notifications.filter((n) => !n.read).length;
  const displayName = profile?.firstName || user?.username || "Traveler";

  return (
    <div className="tn-user-layout-container">
      <Sidebar />
      <main className="tn-user-main">
        <div className="tn-dashboard">
          {/* 1. Header Section */}
          <header className="tn-dashboard-header">
            <div className="tn-dashboard-greeting-group">
              <h1 className="tn-dashboard-greeting">
                Welcome back, {displayName}! 👋
              </h1>
              <p className="tn-dashboard-subgreeting">
                {tripStats.total === 0
                  ? "Let's plan your very first journey with TripNest."
                  : `${tripStats.total} ${tripStats.total === 1 ? "trip" : "trips"} planned • ${tripStats.upcoming} upcoming • ${unreadNotifCount} unread ${unreadNotifCount === 1 ? "notification" : "notifications"}`}
              </p>
            </div>

            <div className="tn-dashboard-header-actions">
              <button
                type="button"
                className="btn-aurora"
                onClick={() => navigate("/trips/new")}
                aria-label="Create a new trip"
              >
                + New Trip
              </button>
            </div>
          </header>

          {/* Inline Error State with Safe Retry Handler */}
          {error && (
            <div className="tn-dashboard-error" role="alert">
              <div className="tn-dashboard-error-text">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
              <button
                type="button"
                className="tn-dashboard-retry-btn"
                onClick={fetchData}
              >
                ↻ Retry Loading
              </button>
            </div>
          )}

          {/* Loading Skeleton Placeholders */}
          {loading && !error && (
            <>
              {/* Skeleton KPI Row */}
              <div className="tn-dashboard-kpi-grid" aria-busy="true">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="tn-dashboard-kpi-card">
                    <div className="tn-skeleton" style={{ width: "48px", height: "48px", borderRadius: "12px" }} />
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div className="tn-skeleton" style={{ width: "60%", height: "22px" }} />
                      <div className="tn-skeleton" style={{ width: "40%", height: "14px" }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Skeleton Spotlight */}
              <div className="tn-skeleton" style={{ height: "140px", borderRadius: "20px" }} />

              {/* Skeleton Trips Grid */}
              <div className="tn-dashboard-trips-grid">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="tn-skeleton" style={{ height: "180px", borderRadius: "16px" }} />
                ))}
              </div>
            </>
          )}

          {/* Main Production Content when Loaded */}
          {!loading && (
            <>
              {/* 2. Essential KPI Metric Row */}
              <section aria-label="Travel Overview KPIs">
                <div className="tn-dashboard-kpi-grid">
                  {/* Total Trips */}
                  <div className="tn-dashboard-kpi-card">
                    <div className="tn-dashboard-kpi-icon" style={{ background: "rgba(124, 58, 237, 0.15)", color: "#a78bfa" }}>
                      ✈️
                    </div>
                    <div className="tn-dashboard-kpi-content">
                      <p className="tn-dashboard-kpi-value">{tripStats.total}</p>
                      <p className="tn-dashboard-kpi-label">Total Trips</p>
                      <span className="tn-dashboard-kpi-sub">
                        {tripStats.planning} planning • {tripStats.completed} completed
                      </span>
                    </div>
                  </div>

                  {/* Upcoming Trips */}
                  <div className="tn-dashboard-kpi-card">
                    <div className="tn-dashboard-kpi-icon" style={{ background: "rgba(6, 182, 212, 0.15)", color: "#22d3ee" }}>
                      🗓️
                    </div>
                    <div className="tn-dashboard-kpi-content">
                      <p className="tn-dashboard-kpi-value">{tripStats.upcoming}</p>
                      <p className="tn-dashboard-kpi-label">Upcoming</p>
                      <span className="tn-dashboard-kpi-sub">
                        {tripStats.upcoming > 0 ? "Ready to explore" : "No active countdown"}
                      </span>
                    </div>
                  </div>

                  {/* Total Budget */}
                  <div className="tn-dashboard-kpi-card">
                    <div className="tn-dashboard-kpi-icon" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399" }}>
                      💰
                    </div>
                    <div className="tn-dashboard-kpi-content">
                      <p className="tn-dashboard-kpi-value">₹{totalBudget.toLocaleString()}</p>
                      <p className="tn-dashboard-kpi-label">Total Budget</p>
                      <span className="tn-dashboard-kpi-sub">
                        Avg ₹{averageTripCost.toLocaleString()} / trip
                      </span>
                    </div>
                  </div>

                  {/* Total Expenses */}
                  <div className="tn-dashboard-kpi-card">
                    <div className="tn-dashboard-kpi-icon" style={{ background: "rgba(244, 63, 94, 0.15)", color: "#fb7185" }}>
                      💳
                    </div>
                    <div className="tn-dashboard-kpi-content">
                      <p className="tn-dashboard-kpi-value">₹{totalExpenses.toLocaleString()}</p>
                      <p className="tn-dashboard-kpi-label">Total Spent</p>
                      <span className="tn-dashboard-kpi-sub">
                        ₹{remainingBudget.toLocaleString()} remaining
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* 3. Upcoming Trip Spotlight Hero */}
              {upcomingTrip ? (
                <section aria-label="Upcoming Trip Spotlight">
                  <div className="tn-dashboard-spotlight">
                    <div className="tn-dashboard-spotlight-left">
                      <span className="tn-dashboard-spotlight-tag">
                        🌟 Next Adventure
                      </span>
                      <h2 className="tn-dashboard-spotlight-title">{upcomingTrip.title}</h2>
                      <p className="tn-dashboard-spotlight-dest">
                        📍 {upcomingTrip.destination}
                      </p>
                      <div className="tn-dashboard-spotlight-meta">
                        <span className="tn-dashboard-spotlight-meta-item">
                          📅 {upcomingTrip.startDate ? new Date(upcomingTrip.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Dates TBD"}
                          {upcomingTrip.endDate ? ` - ${new Date(upcomingTrip.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` : ""}
                        </span>
                        <span className="tn-dashboard-spotlight-meta-item">
                          👥 {upcomingTrip.numberOfTravelers || 1} {upcomingTrip.numberOfTravelers === 1 ? "Traveler" : "Travelers"}
                        </span>
                        {upcomingTrip.budget && (
                          <span className="tn-dashboard-spotlight-meta-item">
                            💰 ₹{Number(upcomingTrip.budget).toLocaleString()} Budget
                          </span>
                        )}
                        {daysUntilUpcoming !== null && (
                          <span
                            className="tn-dashboard-spotlight-meta-item"
                            style={{
                              color: daysUntilUpcoming <= 7 ? "#f59e0b" : "#34d399",
                              fontWeight: 600,
                            }}
                          >
                            {daysUntilUpcoming > 0
                              ? `⏰ In ${daysUntilUpcoming} days`
                              : daysUntilUpcoming === 0
                              ? "🚀 Departing today!"
                              : `✅ ${Math.abs(daysUntilUpcoming)} days ago`}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="tn-dashboard-spotlight-right">
                      <Link
                        to={`/itineraries/${upcomingTrip.id}`}
                        className="btn-aurora"
                        aria-label={`View itinerary for ${upcomingTrip.title}`}
                      >
                        View Itinerary →
                      </Link>
                    </div>
                  </div>
                </section>
              ) : (
                <div className="tn-dashboard-empty-card">
                  <span className="tn-dashboard-empty-icon">🌍</span>
                  <h3 className="tn-dashboard-empty-title">No trips planned yet</h3>
                  <p className="tn-dashboard-empty-desc">
                    Start designing your first custom itinerary with live budget tracking and destination guides.
                  </p>
                  <button
                    type="button"
                    className="btn-aurora"
                    onClick={() => navigate("/trips/new")}
                  >
                    + Plan Your First Trip
                  </button>
                </div>
              )}

              {/* 4. Recent Trips Section */}
              <section className="tn-dashboard-section" aria-label="Recent Trips">
                <div className="tn-dashboard-section-header">
                  <h2 className="tn-dashboard-section-title">Recent Trips</h2>
                  {trips.length > 0 && (
                    <Link
                      to="/trips"
                      className="btn-ghost"
                      style={{ fontSize: "13px", padding: "6px 14px" }}
                      aria-label="View all trips"
                    >
                      View All ({trips.length}) →
                    </Link>
                  )}
                </div>

                {trips.length === 0 ? (
                  <div className="tn-dashboard-empty-card">
                    <span className="tn-dashboard-empty-icon">✈️</span>
                    <h3 className="tn-dashboard-empty-title">Your travel catalog is empty</h3>
                    <p className="tn-dashboard-empty-desc">
                      Create trips, add activities, organize group travelers, and store flight tickets all in one place.
                    </p>
                    <button
                      type="button"
                      className="btn-aurora"
                      onClick={() => navigate("/trips/new")}
                    >
                      + Create Trip
                    </button>
                  </div>
                ) : (
                  <div className="tn-dashboard-trips-grid">
                    {trips.slice(0, 6).map((trip) => (
                      <Link
                        key={trip.id}
                        to={`/itineraries/${trip.id}`}
                        className="tn-dashboard-trip-card"
                        aria-label={`Trip to ${trip.destination}: ${trip.title}, Status ${trip.status}`}
                      >
                        <div className="tn-dashboard-trip-header">
                          <span style={{ fontSize: "20px" }}>✈️</span>
                          <span className={`badge badge-${(trip.status || "planning").toLowerCase()}`}>
                            {trip.status || "PLANNING"}
                          </span>
                        </div>

                        <div>
                          <h3 className="tn-dashboard-trip-title">{trip.title}</h3>
                          <p className="tn-dashboard-trip-dest">📍 {trip.destination}</p>
                        </div>

                        <div className="tn-dashboard-trip-footer">
                          <span>
                            📅 {trip.startDate ? new Date(trip.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "TBD"}
                          </span>
                          <span>
                            {trip.budget ? `₹${Number(trip.budget).toLocaleString()}` : "No budget"}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>

              {/* 5. Travel Insights & Analytics Section */}
              <section className="tn-dashboard-section" aria-label="Travel Insights & Analytics">
                <div className="tn-dashboard-section-header">
                  <h2 className="tn-dashboard-section-title">Travel Insights & Analytics</h2>
                  {/* Analytics Tab Switcher */}
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      className={`btn-compact ${activeAnalyticsTab === "categories" ? "btn-aurora" : "btn-ghost"}`}
                      style={{ fontSize: "12px", padding: "4px 12px" }}
                      onClick={() => setActiveAnalyticsTab("categories")}
                    >
                      Categories
                    </button>
                    <button
                      type="button"
                      className={`btn-compact ${activeAnalyticsTab === "status" ? "btn-aurora" : "btn-ghost"}`}
                      style={{ fontSize: "12px", padding: "4px 12px" }}
                      onClick={() => setActiveAnalyticsTab("status")}
                    >
                      Trip Status
                    </button>
                    <button
                      type="button"
                      className={`btn-compact ${activeAnalyticsTab === "trend" ? "btn-aurora" : "btn-ghost"}`}
                      style={{ fontSize: "12px", padding: "4px 12px" }}
                      onClick={() => setActiveAnalyticsTab("trend")}
                    >
                      Expense Trend
                    </button>
                  </div>
                </div>

                <div className="tn-dashboard-analytics-grid">
                  {/* Card 1: Budget Health & Overall Statistics */}
                  <div className="tn-dashboard-insight-card">
                    <div className="tn-dashboard-insight-header">
                      <h3 className="tn-dashboard-insight-title">Budget Health</h3>
                      <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                        {totalBudget > 0 ? `${Math.round((totalExpenses / totalBudget) * 100)}% utilized` : "No budget defined"}
                      </span>
                    </div>

                    <div className="tn-dashboard-chart-wrapper">
                      {totalBudget > 0 || totalExpenses > 0 ? (
                        <Doughnut data={budgetUsageData} options={chartOptions} />
                      ) : (
                        <div style={{ textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                          <span style={{ fontSize: "28px", display: "block", marginBottom: "6px" }}>📊</span>
                          Add trips with budgets to see budget utilization
                        </div>
                      )}
                    </div>

                    {/* Integrated 3-Tile Travel Statistics Strip */}
                    <div className="tn-dashboard-stats-strip">
                      <div className="tn-dashboard-strip-item">
                        <span className="tn-dashboard-strip-label">Avg Trip Cost</span>
                        <span className="tn-dashboard-strip-value">₹{averageTripCost.toLocaleString()}</span>
                      </div>
                      <div className="tn-dashboard-strip-item">
                        <span className="tn-dashboard-strip-label">Remaining</span>
                        <span className="tn-dashboard-strip-value" style={{ color: "#34d399" }}>
                          ₹{remainingBudget.toLocaleString()}
                        </span>
                      </div>
                      <div className="tn-dashboard-strip-item">
                        <span className="tn-dashboard-strip-label">Top Destination</span>
                        <span className="tn-dashboard-strip-value" style={{ color: "#a78bfa" }}>
                          {mostVisitedDestination}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Interactive Dynamic Analytics (Categories / Status / Trend) */}
                  <div className="tn-dashboard-insight-card">
                    <div className="tn-dashboard-insight-header">
                      <h3 className="tn-dashboard-insight-title">
                        {activeAnalyticsTab === "categories" && "Expense Breakdown by Category"}
                        {activeAnalyticsTab === "status" && "Trips by Status"}
                        {activeAnalyticsTab === "trend" && "Recent Expense Activity Trend"}
                      </h3>
                      <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                        {activeAnalyticsTab === "categories" && `${Object.keys(categoryData).length} categories`}
                        {activeAnalyticsTab === "status" && `${tripStats.total} total`}
                        {activeAnalyticsTab === "trend" && `${expenses.length} records`}
                      </span>
                    </div>

                    <div className="tn-dashboard-chart-wrapper">
                      {activeAnalyticsTab === "categories" && (
                        expenses.length > 0 ? (
                          <Doughnut data={categoryDistributionData} options={chartOptions} />
                        ) : (
                          <div style={{ textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                            <span style={{ fontSize: "28px", display: "block", marginBottom: "6px" }}>🛍️</span>
                            No expense records recorded yet
                          </div>
                        )
                      )}

                      {activeAnalyticsTab === "status" && (
                        trips.length > 0 ? (
                          <Doughnut data={tripsByStatusData} options={chartOptions} />
                        ) : (
                          <div style={{ textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                            <span style={{ fontSize: "28px", display: "block", marginBottom: "6px" }}>🗺️</span>
                            No trip records to visualize
                          </div>
                        )
                      )}

                      {activeAnalyticsTab === "trend" && (
                        expenses.length > 0 ? (
                          <Line data={recentExpenseTrendData} options={lineChartOptions} />
                        ) : (
                          <div style={{ textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                            <span style={{ fontSize: "28px", display: "block", marginBottom: "6px" }}>📈</span>
                            No recent expense logs recorded
                          </div>
                        )
                      )}
                    </div>

                    {/* Supporting Detail Strip */}
                    <div className="tn-dashboard-stats-strip">
                      <div className="tn-dashboard-strip-item">
                        <span className="tn-dashboard-strip-label">Planning</span>
                        <span className="tn-dashboard-strip-value" style={{ color: "#3b82f6" }}>
                          {tripStats.planning}
                        </span>
                      </div>
                      <div className="tn-dashboard-strip-item">
                        <span className="tn-dashboard-strip-label">Upcoming</span>
                        <span className="tn-dashboard-strip-value" style={{ color: "#06b6d4" }}>
                          {tripStats.upcoming}
                        </span>
                      </div>
                      <div className="tn-dashboard-strip-item">
                        <span className="tn-dashboard-strip-label">Completed</span>
                        <span className="tn-dashboard-strip-value" style={{ color: "#10b981" }}>
                          {tripStats.completed}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* 6. Compact Account & Profile Summary Strip */}
              <section aria-label="Account Summary">
                <div className="tn-dashboard-profile-bar">
                  <div className="tn-dashboard-profile-info">
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "18px",
                        fontWeight: "700",
                        color: "white",
                        flexShrink: 0,
                        textTransform: "uppercase",
                      }}
                    >
                      {displayName.charAt(0)}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "#f1f5f9" }}>
                        {profile?.firstName ? `${profile.firstName} ${profile.lastName || ""}` : displayName}
                        {profile?.username && <span style={{ color: "#a78bfa", marginLeft: "6px", fontSize: "12px" }}>@{profile.username}</span>}
                      </p>
                      <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#94a3b8" }}>
                        {profile?.email || user?.email || "Account verified"}
                        {profile?.phone && ` • 📱 ${profile.phone}`}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ fontSize: "13px", padding: "6px 14px" }}
                    onClick={() => navigate("/profile")}
                    aria-label="Edit Profile"
                  >
                    Edit Profile 👤
                  </button>
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;