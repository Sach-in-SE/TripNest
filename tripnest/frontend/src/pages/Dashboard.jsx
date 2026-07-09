import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import api from "../services/api";

const Dashboard = () => {
  const [profile, setProfile] = useState(null);
  const [trips, setTrips] = useState([]);
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
                  onClick={() => navigate(`/trips/${trip.id}`)}
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