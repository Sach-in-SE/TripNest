import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import api from "../services/api";
import { Doughnut, Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
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
  BarElement,
  PointElement,
  LineElement,
  Title
);

const Dashboard = () => {
  const [profile, setProfile] = useState(null);
  const [trips, setTrips] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, tripsRes] = await Promise.all([
          api.get("/user/profile"),
          api.get("/trips"),
        ]);
        setProfile(profileRes.data);
        setTrips(tripsRes.data);
        
        // Fetch expenses for all trips
        if (tripsRes.data.length > 0) {
          const allExpenses = await Promise.all(
            tripsRes.data.map(trip => 
              api.get(`/expenses/trip/${trip.id}`).catch(() => ({ data: [] }))
            )
          );
          setExpenses(allExpenses.flatMap(res => res.data));
        }
      } catch (err) {
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const tripStats = {
    total: trips.length,
    planning: trips.filter((t) => t.status === "PLANNING").length,
    upcoming: trips.filter((t) => t.status === "UPCOMING").length,
    completed: trips.filter((t) => t.status === "COMPLETED").length,
    cancelled: trips.filter((t) => t.status === "CANCELLED").length,
  };

  const totalBudget = trips.reduce((sum, trip) => sum + (trip.budget || 0), 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const averageTripCost = trips.length > 0 ? totalBudget / trips.length : 0;

  // Get most visited destination
  const destinationCounts = trips.reduce((acc, trip) => {
    acc[trip.destination] = (acc[trip.destination] || 0) + 1;
    return acc;
  }, {});
  const mostVisitedDestination = Object.entries(destinationCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

  // Expense category distribution
  const categoryData = expenses.reduce((acc, exp) => {
    const category = exp.category || "MISCELLANEOUS";
    acc[category] = (acc[category] || 0) + (exp.amount || 0);
    return acc;
  }, {});

  // Chart configurations
  const tripsByStatusData = {
    labels: ["Planning", "Upcoming", "Completed", "Cancelled"],
    datasets: [{
      data: [tripStats.planning, tripStats.upcoming, tripStats.completed, tripStats.cancelled],
      backgroundColor: ["#2563eb", "#06b6d4", "#10b981", "#ef4444"],
      borderWidth: 0,
    }],
  };

  const budgetUsageData = {
    labels: ["Spent", "Remaining"],
    datasets: [{
      data: [totalExpenses, Math.max(0, totalBudget - totalExpenses)],
      backgroundColor: ["#ef4444", "#10b981"],
      borderWidth: 0,
    }],
  };

  const categoryDistributionData = {
    labels: Object.keys(categoryData),
    datasets: [{
      data: Object.values(categoryData),
      backgroundColor: ["#7c3aed", "#2563eb", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"],
      borderWidth: 0,
    }],
  };

  const recentExpenseTrendData = {
    labels: expenses.slice(-7).map(exp => {
      if (exp.date) {
        const date = new Date(exp.date);
        return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
      }
      return 'No Date';
    }),
    datasets: [{
      label: "Amount (₹)",
      data: expenses.slice(-7).map(exp => exp.amount || 0),
      borderColor: "#7c3aed",
      backgroundColor: "rgba(124, 58, 237, 0.1)",
      fill: true,
      tension: 0.4,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { 
          color: "#94a3b8", 
          font: { size: 12 },
          padding: 15,
        },
      },
      tooltip: {
        backgroundColor: "rgba(10, 15, 30, 0.9)",
        titleColor: "#f1f5f9",
        bodyColor: "#94a3b8",
        borderColor: "rgba(124, 58, 237, 0.3)",
        borderWidth: 1,
      },
    },
  };

  const barChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "rgba(255,255,255,0.05)" },
        ticks: { color: "#94a3b8" },
      },
      x: {
        grid: { display: false },
        ticks: { color: "#94a3b8" },
      },
    },
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner} className="gradient-text">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebar />
      <main style={styles.main}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.greeting}>
              Good day, {profile?.firstName || user?.username}! 👋
            </h1>
            <p style={styles.subGreeting}>
              Here's an overview of your travel plans
            </p>
          </div>
          <button
            className="btn-aurora"
            onClick={() => navigate("/trips/new")}
            style={styles.newTripBtn}
          >
            + New Trip
          </button>
        </div>

        {/* Stats Row */}
        <div style={styles.statsGrid}>
          {[
            { label: "Total Trips", value: tripStats.total, icon: "✈️", color: "#7c3aed" },
            { label: "Planning", value: tripStats.planning, icon: "📋", color: "#2563eb" },
            { label: "Upcoming", value: tripStats.upcoming, icon: "🗓️", color: "#06b6d4" },
            { label: "Completed", value: tripStats.completed, icon: "✅", color: "#10b981" },
          ].map((stat, i) => (
            <div key={i} style={styles.statCard} className="glass-card">
              <div style={{ ...styles.statIcon, background: `${stat.color}22` }}>
                <span style={{ fontSize: "24px" }}>{stat.icon}</span>
              </div>
              <div>
                <p style={styles.statValue}>{stat.value}</p>
                <p style={styles.statLabel}>{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Analytics Charts */}
        <div style={styles.chartsGrid}>
          {/* Trips by Status */}
          <div style={styles.chartCard} className="glass-card">
            <h3 style={styles.chartTitle}>Trips by Status</h3>
            {trips.length > 0 ? (
              <div style={styles.chartContainer}>
                <Doughnut data={tripsByStatusData} options={chartOptions} />
              </div>
            ) : (
              <div style={styles.chartEmptyState}>
                <span style={{ fontSize: "32px" }}>📊</span>
                <p style={{ color: "#94a3b8", fontSize: "14px" }}>No trip data yet</p>
              </div>
            )}
          </div>

          {/* Budget Usage */}
          <div style={styles.chartCard} className="glass-card">
            <h3 style={styles.chartTitle}>Budget Usage</h3>
            {totalBudget > 0 ? (
              <div style={styles.chartContainer}>
                <Doughnut data={budgetUsageData} options={chartOptions} />
              </div>
            ) : (
              <div style={styles.chartEmptyState}>
                <span style={{ fontSize: "32px" }}>💰</span>
                <p style={{ color: "#94a3b8", fontSize: "14px" }}>No budget data yet</p>
              </div>
            )}
          </div>

          {/* Expense Category Distribution */}
          <div style={styles.chartCard} className="glass-card">
            <h3 style={styles.chartTitle}>Expense Categories</h3>
            {expenses.length > 0 ? (
              <div style={styles.chartContainer}>
                <Doughnut data={categoryDistributionData} options={chartOptions} />
              </div>
            ) : (
              <div style={styles.chartEmptyState}>
                <span style={{ fontSize: "32px" }}>📈</span>
                <p style={{ color: "#94a3b8", fontSize: "14px" }}>No expense data yet</p>
              </div>
            )}
          </div>

          {/* Recent Expense Trend */}
          <div style={styles.chartCard} className="glass-card">
            <h3 style={styles.chartTitle}>Recent Expense Trend</h3>
            {expenses.length > 0 ? (
              <div style={styles.chartContainer}>
                <Line data={recentExpenseTrendData} options={barChartOptions} />
              </div>
            ) : (
              <div style={styles.chartEmptyState}>
                <span style={{ fontSize: "32px" }}>📉</span>
                <p style={{ color: "#94a3b8", fontSize: "14px" }}>No expense data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Travel Statistics */}
        <div style={styles.travelStatsCard} className="glass-card">
          <h3 style={styles.chartTitle}>Travel Statistics</h3>
          <div style={styles.travelStatsGrid}>
            <div style={styles.travelStatItem}>
              <p style={styles.travelStatLabel}>Total Trips</p>
              <p style={styles.travelStatValue}>{tripStats.total}</p>
            </div>
            <div style={styles.travelStatItem}>
              <p style={styles.travelStatLabel}>Total Budget</p>
              <p style={styles.travelStatValue}>₹{totalBudget.toLocaleString()}</p>
            </div>
            <div style={styles.travelStatItem}>
              <p style={styles.travelStatLabel}>Total Expenses</p>
              <p style={styles.travelStatValue}>₹{totalExpenses.toLocaleString()}</p>
            </div>
            <div style={styles.travelStatItem}>
              <p style={styles.travelStatLabel}>Average Trip Cost</p>
              <p style={styles.travelStatValue}>₹{Math.round(averageTripCost).toLocaleString()}</p>
            </div>
            <div style={styles.travelStatItem}>
              <p style={styles.travelStatLabel}>Most Visited</p>
              <p style={styles.travelStatValue}>{mostVisitedDestination}</p>
            </div>
          </div>
        </div>

        {/* Recent Trips */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Recent Trips</h2>
            <button
              className="btn-ghost"
              onClick={() => navigate("/trips")}
              style={{ fontSize: "13px", padding: "8px 16px" }}
            >
              View All →
            </button>
          </div>

          {trips.length === 0 ? (
            <div style={styles.emptyState} className="glass-card">
              <span style={{ fontSize: "48px" }}>✈️</span>
              <h3 style={styles.emptyTitle}>No trips yet!</h3>
              <p style={styles.emptyText}>Start planning your first adventure</p>
              <button
                className="btn-aurora"
                onClick={() => navigate("/trips/new")}
                style={{ marginTop: "16px" }}
              >
                Plan a Trip
              </button>
            </div>
          ) : (
            <div style={styles.tripsGrid}>
              {trips.slice(0, 6).map((trip) => (
                <div
                  key={trip.id}
                  style={styles.tripCard}
                  className="glass-card"
                  onClick={() => navigate(`/itineraries/${trip.id}`)}
                >
                  <div style={styles.tripCardHeader}>
                    <span style={styles.tripDestIcon}>🌍</span>
                    <span
                      className={`badge badge-${trip.status.toLowerCase()}`}
                    >
                      {trip.status}
                    </span>
                  </div>
                  <h3 style={styles.tripTitle}>{trip.title}</h3>
                  <p style={styles.tripDestination}>📍 {trip.destination}</p>
                  <div style={styles.tripMeta}>
                    <span style={styles.tripMetaItem}>
                      📅 {trip.startDate || "TBD"}
                    </span>
                    <span style={styles.tripMetaItem}>
                      👥 {trip.numberOfTravelers || 1}
                    </span>
                  </div>
                  {trip.budget && (
                    <div style={styles.tripBudget}>
                      💰 ₹{trip.budget.toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Profile Summary */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Profile Summary</h2>
          <div style={styles.profileCard} className="glass-card">
            <div style={styles.profileAvatar}>
              {profile?.firstName?.charAt(0) || user?.username?.charAt(0)}
            </div>
            <div style={styles.profileInfo}>
              <h3 style={styles.profileName}>
                {profile?.firstName} {profile?.lastName}
              </h3>
              <p style={styles.profileUsername}>@{profile?.username}</p>
              <p style={styles.profileEmail}>✉️ {profile?.email}</p>
              {profile?.phone && (
                <p style={styles.profilePhone}>📱 {profile?.phone}</p>
              )}
            </div>
            <button
              className="btn-ghost"
              onClick={() => navigate("/profile")}
              style={{ alignSelf: "center" }}
            >
              Edit Profile
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    background: "#0a0f1e",
  },
  main: {
    marginLeft: "260px",
    flex: 1,
    padding: "32px",
    minHeight: "100vh",
  },
  loadingContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    fontSize: "24px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "32px",
  },
  greeting: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#f1f5f9",
    fontFamily: "'Space Grotesk', sans-serif",
    marginBottom: "4px",
  },
  subGreeting: { color: "#94a3b8", fontSize: "14px" },
  newTripBtn: { padding: "12px 24px", fontSize: "14px", fontWeight: "600" },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
    marginBottom: "32px",
  },
  statCard: {
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    cursor: "default",
  },
  statIcon: {
    width: "52px",
    height: "52px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  statValue: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#f1f5f9",
    fontFamily: "'Space Grotesk', sans-serif",
  },
  statLabel: { color: "#94a3b8", fontSize: "13px", marginTop: "2px" },
  chartsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
    gap: "20px",
    marginBottom: "32px",
  },
  chartCard: {
    padding: "24px",
    minHeight: "280px",
  },
  chartTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#f1f5f9",
    fontFamily: "'Space Grotesk', sans-serif",
    marginBottom: "16px",
  },
  chartContainer: {
    height: "200px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  chartEmptyState: {
    height: "200px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  travelStatsCard: {
    padding: "24px",
    marginBottom: "32px",
  },
  travelStatsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "20px",
  },
  travelStatItem: {
    padding: "16px",
    background: "rgba(255,255,255,0.03)",
    borderRadius: "12px",
    textAlign: "center",
  },
  travelStatLabel: {
    color: "#94a3b8",
    fontSize: "12px",
    marginBottom: "8px",
  },
  travelStatValue: {
    color: "#f1f5f9",
    fontSize: "20px",
    fontWeight: "700",
    fontFamily: "'Space Grotesk', sans-serif",
  },
  section: { marginBottom: "32px" },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#f1f5f9",
    fontFamily: "'Space Grotesk', sans-serif",
  },
  emptyState: {
    padding: "48px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
  },
  emptyTitle: { color: "#f1f5f9", fontSize: "20px", fontWeight: "600" },
  emptyText: { color: "#94a3b8", fontSize: "14px" },
  tripsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px",
  },
  tripCard: {
    padding: "20px",
    cursor: "pointer",
  },
  tripCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  tripDestIcon: { fontSize: "24px" },
  tripTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#f1f5f9",
    marginBottom: "6px",
    fontFamily: "'Space Grotesk', sans-serif",
  },
  tripDestination: { color: "#94a3b8", fontSize: "13px", marginBottom: "12px" },
  tripMeta: { display: "flex", gap: "16px", marginBottom: "8px" },
  tripMetaItem: { color: "#64748b", fontSize: "12px" },
  tripBudget: {
    color: "#a78bfa",
    fontSize: "13px",
    fontWeight: "500",
    marginTop: "8px",
  },
  profileCard: {
    padding: "24px",
    display: "flex",
    alignItems: "center",
    gap: "24px",
  },
  profileAvatar: {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: "700",
    color: "white",
    flexShrink: 0,
    textTransform: "uppercase",
  },
  profileInfo: { flex: 1 },
  profileName: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#f1f5f9",
    marginBottom: "4px",
  },
  profileUsername: { color: "#7c3aed", fontSize: "13px", marginBottom: "8px" },
  profileEmail: { color: "#94a3b8", fontSize: "13px", marginBottom: "4px" },
  profilePhone: { color: "#94a3b8", fontSize: "13px" },
};

export default Dashboard;