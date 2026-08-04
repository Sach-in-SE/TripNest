import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../services/api";

const Trips = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const res = await api.get("/trips");
      setTrips(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (trip) => {
    navigate(`/trips/${trip.id}/edit`);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this trip?")) {
      await api.delete(`/trips/${id}`);
      fetchTrips();
    }
  };

  return (
    <div style={styles.container}>
      <Sidebar />
      <main style={styles.main}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>My Trips ✈️</h1>
            <p style={styles.subtitle}>{trips.length} trips planned</p>
          </div>
          <button className="btn-aurora" onClick={() => navigate("/trips/new")}>
            + New Trip
          </button>
        </div>

        {/* Trips Grid */}
        {loading ? (
          <p style={{ color: "#94a3b8" }}>Loading trips...</p>
        ) : trips.length === 0 ? (
          <div style={styles.emptyState} className="glass-card">
            <span style={{ fontSize: "48px" }}>✈️</span>
            <h3 style={{ color: "#f1f5f9" }}>No trips yet!</h3>
            <p style={{ color: "#94a3b8" }}>Start planning your first adventure</p>
            <button className="btn-aurora" onClick={() => navigate("/trips/new")} style={{ marginTop: "16px" }}>
              Plan a Trip
            </button>
          </div>
        ) : (
          <div style={styles.tripsGrid}>
            {trips.map((trip) => (
              <div key={trip.id} style={styles.tripCard} className="glass-card">
                <div style={styles.tripCardHeader}>
                  <span style={{ fontSize: "28px" }}>🌍</span>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {trip.permission && trip.permission !== "OWNER" && (
                      <span className="badge" style={{ background: "rgba(167, 139, 250, 0.15)", color: "#a78bfa" }}>
                        🤝 Shared ({trip.permission})
                      </span>
                    )}
                    <span className={`badge badge-${trip.status.toLowerCase()}`}>{trip.status}</span>
                  </div>
                </div>
                <h3 style={styles.tripTitle}>{trip.title}</h3>
                <p style={styles.tripDest}>📍 {trip.destination}</p>
                {trip.description && <p style={styles.tripDesc}>{trip.description}</p>}
                <div style={styles.tripMeta}>
                  {trip.startDate && trip.endDate && (
                    <span style={styles.metaItem}>📅 {trip.startDate} → {trip.endDate}</span>
                  )}
                  {trip.startDate && !trip.endDate && (
                    <span style={styles.metaItem}>📅 {trip.startDate}</span>
                  )}
                  <span style={styles.metaItem}>👥 {trip.numberOfTravelers}</span>
                  {trip.budget && <span style={styles.metaItem}>💰 ₹{trip.budget.toLocaleString()}</span>}
                </div>
                <div style={styles.tripActions}>
                  <button className="btn-compact" onClick={() => navigate(`/itineraries/${trip.id}`)}>
                    👁 View
                  </button>
                  {(!trip.permission || trip.permission === "OWNER" || trip.permission === "EDIT") && (
                    <button className="btn-compact" onClick={() => handleEdit(trip)}>
                      ✏️ Edit
                    </button>
                  )}
                  {(!trip.permission || trip.permission === "OWNER") && (
                    <button className="btn-compact danger" onClick={() => handleDelete(trip.id)}>
                      🗑️ Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

const styles = {
  container: { display: "flex", minHeight: "100vh", background: "#0a0f1e" },
  main: { marginLeft: "260px", flex: 1, padding: "32px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" },
  title: { fontSize: "28px", fontWeight: "700", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif" },
  subtitle: { color: "#94a3b8", fontSize: "14px", marginTop: "4px" },
  tripsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" },
  tripCard: { padding: "20px", transition: "transform 0.2s ease, box-shadow 0.2s ease" },
  tripCardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" },
  tripTitle: { fontSize: "18px", fontWeight: "600", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "4px" },
  tripDest: { color: "#94a3b8", fontSize: "14px", marginBottom: "8px" },
  tripDesc: { color: "#64748b", fontSize: "13px", lineHeight: "1.5", marginBottom: "12px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" },
  tripMeta: { display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" },
  metaItem: { color: "#a78bfa", fontSize: "12px", background: "rgba(124,58,237,0.1)", padding: "4px 8px", borderRadius: "6px" },
  tripActions: { display: "flex", gap: "8px", flexWrap: "wrap" },
  emptyState: { padding: "48px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" },
};

export default Trips;
