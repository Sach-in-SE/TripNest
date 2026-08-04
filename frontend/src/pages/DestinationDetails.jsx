import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../services/api";

const DestinationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [destination, setDestination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDestination();
  }, [id]);

  const fetchDestination = async () => {
    try {
      const res = await api.get(`/destinations/${id}`);
      setDestination(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load destination");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0f1e" }}>
      <Sidebar />
      <main style={{ marginLeft: "260px", padding: "32px", color: "#94a3b8" }}>Loading...</main>
    </div>
  );

  if (error) return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0f1e" }}>
      <Sidebar />
      <main style={{ marginLeft: "260px", padding: "32px" }}>
        <div style={{ color: "#ef4444", marginBottom: "16px" }}>{error}</div>
        <button className="btn-ghost" onClick={() => navigate("/destinations")}>← Back to Destinations</button>
      </main>
    </div>
  );

  if (!destination) return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0f1e" }}>
      <Sidebar />
      <main style={{ marginLeft: "260px", padding: "32px", color: "#94a3b8" }}>
        <div>Destination not found</div>
        <button className="btn-ghost" onClick={() => navigate("/destinations")} style={{ marginTop: "16px" }}>← Back to Destinations</button>
      </main>
    </div>
  );

  return (
    <div style={styles.container}>
      <Sidebar />
      <main style={styles.main}>
        {/* Back Button */}
        <button className="btn-ghost" onClick={() => navigate("/destinations")}
          style={{ marginBottom: "24px", fontSize: "13px" }}>
          ← Back to Destinations
        </button>

        {/* Hero Section */}
        <div style={styles.hero} className="glass-card">
          <div style={styles.heroContent}>
            <h1 style={styles.heroTitle}>{destination.name}</h1>
            <p style={styles.heroLocation}>📍 {destination.state}, {destination.country}</p>
            <div style={styles.heroMeta}>
              <span style={styles.categoryBadge}>{destination.category}</span>
              <span style={styles.ratingBadge}>⭐ {destination.rating?.toFixed(1) || "4.0"}</span>
            </div>
          </div>
          {destination.imageUrl && (
            <img src={destination.imageUrl} alt={destination.name} style={styles.heroImage} />
          )}
        </div>

        {/* Info Grid */}
        <div style={styles.infoGrid}>
          <div style={styles.infoCard} className="glass-card">
            <h3 style={styles.infoTitle}>📅 Best Season</h3>
            <p style={styles.infoContent}>{destination.bestSeason}</p>
          </div>
          <div style={styles.infoCard} className="glass-card">
            <h3 style={styles.infoTitle}>💰 Estimated Budget</h3>
            <p style={styles.infoContent}>₹{destination.estimatedBudget?.toLocaleString() || "N/A"}</p>
          </div>
          <div style={styles.infoCard} className="glass-card">
            <h3 style={styles.infoTitle}>⏱️ Recommended Days</h3>
            <p style={styles.infoContent}>{destination.recommendedDays} days</p>
          </div>
          <div style={styles.infoCard} className="glass-card">
            <h3 style={styles.infoTitle}>🌡️ Weather</h3>
            <p style={styles.infoContent}>Pleasant throughout the year</p>
          </div>
        </div>

        {/* Description */}
        <div style={styles.section} className="glass-card">
          <h2 style={styles.sectionTitle}>About {destination.name}</h2>
          <p style={styles.description}>{destination.description}</p>
        </div>

        {/* Popular Attractions */}
        <div style={styles.section} className="glass-card">
          <h2 style={styles.sectionTitle}>🏛️ Popular Attractions</h2>
          <div style={styles.attractionsList}>
            <div style={styles.attractionItem}>
              <span style={styles.attractionIcon}>🏰</span>
              <p style={styles.attractionName}>Historic Monuments</p>
            </div>
            <div style={styles.attractionItem}>
              <span style={styles.attractionIcon}>🍽️</span>
              <p style={styles.attractionName}>Local Cuisine</p>
            </div>
            <div style={styles.attractionItem}>
              <span style={styles.attractionIcon}>🎭</span>
              <p style={styles.attractionName}>Cultural Events</p>
            </div>
            <div style={styles.attractionItem}>
              <span style={styles.attractionIcon}>🛍️</span>
              <p style={styles.attractionName}>Shopping</p>
            </div>
          </div>
        </div>

        {/* Travel Tips */}
        <div style={styles.section} className="glass-card">
          <h2 style={styles.sectionTitle}>✈️ Travel Tips</h2>
          <ul style={styles.tipsList}>
            <li style={styles.tipItem}>Best time to visit: {destination.bestSeason}</li>
            <li style={styles.tipItem}>Plan for {destination.recommendedDays} days to explore major attractions</li>
            <li style={styles.tipItem}>Budget range: ₹{destination.estimatedBudget?.toLocaleString() || "N/A"}</li>
            <li style={styles.tipItem}>Book accommodations in advance during peak season</li>
            <li style={styles.tipItem}>Pack appropriate clothing based on season</li>
          </ul>
        </div>

        {/* Map Section */}
        <div style={styles.section} className="glass-card">
          <h2 style={styles.sectionTitle}>🗺️ Location</h2>
          <div style={styles.mapPlaceholder}>
            <p style={styles.mapText}>Map integration coming soon</p>
            {destination.latitude && destination.longitude && (
              <p style={styles.mapCoords}>
                Coordinates: {destination.latitude.toFixed(4)}, {destination.longitude.toFixed(4)}
              </p>
            )}
          </div>
        </div>

        {/* Nearby Places */}
        <div style={styles.section} className="glass-card">
          <h2 style={styles.sectionTitle}>📍 Nearby Places</h2>
          <p style={styles.nearbyText}>Explore other destinations in {destination.state}</p>
          <button className="btn-aurora" onClick={() => navigate("/destinations")}
            style={{ marginTop: "16px" }}>
            View All Destinations
          </button>
        </div>

        {/* Action Button */}
        <div style={styles.actionSection}>
          <button className="btn-aurora" onClick={() => navigate("/trips/new", { state: { destination: destination } })}
            style={{ fontSize: "14px", padding: "12px 24px" }}>
            Plan Trip to {destination.name}
          </button>
        </div>
      </main>
    </div>
  );
};

const styles = {
  container: { display: "flex", minHeight: "100vh", background: "#0a0f1e" },
  main: { marginLeft: "260px", flex: 1, padding: "32px" },
  hero: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "32px", marginBottom: "24px", gap: "24px" },
  heroContent: { flex: 1 },
  heroTitle: { fontSize: "32px", fontWeight: "700", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "8px" },
  heroLocation: { color: "#94a3b8", fontSize: "16px", marginBottom: "12px" },
  heroMeta: { display: "flex", gap: "12px" },
  categoryBadge: { background: "rgba(6,182,212,0.15)", color: "#7dd3fc", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: "600" },
  ratingBadge: { background: "rgba(245,158,11,0.15)", color: "#fcd34d", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: "600" },
  heroImage: { width: "300px", height: "200px", objectFit: "cover", borderRadius: "12px" },
  infoGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" },
  infoCard: { padding: "20px" },
  infoTitle: { fontSize: "14px", fontWeight: "600", color: "#94a3b8", marginBottom: "8px" },
  infoContent: { color: "#f1f5f9", fontSize: "16px", fontWeight: "500" },
  section: { padding: "24px", marginBottom: "16px" },
  sectionTitle: { fontSize: "18px", fontWeight: "600", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "16px" },
  description: { color: "#cbd5e1", fontSize: "15px", lineHeight: "1.6" },
  attractionsList: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" },
  attractionItem: { display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "8px" },
  attractionIcon: { fontSize: "24px" },
  attractionName: { color: "#f1f5f9", fontSize: "14px", fontWeight: "500" },
  tipsList: { color: "#cbd5e1", fontSize: "14px", lineHeight: "1.8", paddingLeft: "20px" },
  tipItem: { marginBottom: "8px" },
  mapPlaceholder: { padding: "32px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", textAlign: "center", border: "1px dashed rgba(255,255,255,0.1)" },
  mapText: { color: "#64748b", fontSize: "14px", marginBottom: "8px" },
  mapCoords: { color: "#94a3b8", fontSize: "12px" },
  nearbyText: { color: "#94a3b8", fontSize: "14px", marginBottom: "16px" },
  actionSection: { textAlign: "center", padding: "24px" },
};

export default DestinationDetails;