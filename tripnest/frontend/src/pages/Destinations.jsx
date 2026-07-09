import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import api from "../services/api";

const Destinations = () => {
  const [destinations, setDestinations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showPopular, setShowPopular] = useState(false);

  useEffect(() => { fetchDestinations(); }, []);

  const fetchDestinations = async () => {
    try {
      const res = await api.get("/destinations");
      setDestinations(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) { fetchDestinations(); return; }
    try {
      const res = await api.get(`/destinations/search?name=${searchQuery}`);
      setDestinations(res.data);
    } catch (err) { console.error(err); }
  };

  const handlePopular = async () => {
    try {
      if (showPopular) { fetchDestinations(); setShowPopular(false); return; }
      const res = await api.get("/destinations/popular");
      setDestinations(res.data);
      setShowPopular(true);
    } catch (err) { console.error(err); }
  };

  return (
    <div style={styles.container}>
      <Sidebar />
      <main style={styles.main}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Destinations 🌍</h1>
            <p style={styles.subtitle}>Discover your next adventure</p>
          </div>
        </div>

        {/* Search & Filter */}
        <div style={styles.searchRow}>
          <input className="aurora-input" placeholder="Search destinations..."
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            style={{ maxWidth: "400px" }} />
          <button className="btn-aurora" onClick={handleSearch}>Search</button>
          <button className={showPopular ? "btn-aurora" : "btn-ghost"} onClick={handlePopular}>
            🔥 Popular
          </button>
        </div>

        {loading ? (
          <p style={{ color: "#94a3b8" }}>Loading destinations...</p>
        ) : destinations.length === 0 ? (
          <div style={styles.emptyState} className="glass-card">
            <span style={{ fontSize: "48px" }}>🌍</span>
            <h3 style={{ color: "#f1f5f9" }}>No destinations found</h3>
            <p style={{ color: "#94a3b8" }}>Try a different search</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {destinations.map((dest) => (
              <div key={dest.id} style={styles.card} className="glass-card">
                <div style={styles.cardHeader}>
                  <span style={{ fontSize: "32px" }}>🏖️</span>
                  {dest.popular && <span className="badge badge-upcoming">🔥 Popular</span>}
                </div>
                <h3 style={styles.destName}>{dest.name}</h3>
                <p style={styles.destLocation}>📍 {dest.city}, {dest.country}</p>
                {dest.description && <p style={styles.destDesc}>{dest.description}</p>}
                <div style={styles.destMeta}>
                  {dest.climate && <span style={styles.metaItem}>🌤️ {dest.climate}</span>}
                  {dest.bestTimeToVisit && <span style={styles.metaItem}>📅 {dest.bestTimeToVisit}</span>}
                  {dest.averageCost && <span style={styles.metaItem}>💰 ₹{dest.averageCost.toLocaleString()}</span>}
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
  searchRow: { display: "flex", gap: "12px", alignItems: "center", marginBottom: "24px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" },
  card: { padding: "20px" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" },
  destName: { fontSize: "18px", fontWeight: "600", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "4px" },
  destLocation: { color: "#94a3b8", fontSize: "13px", marginBottom: "10px" },
  destDesc: { color: "#64748b", fontSize: "12px", lineHeight: "1.6", marginBottom: "12px" },
  destMeta: { display: "flex", flexWrap: "wrap", gap: "8px" },
  metaItem: { color: "#a78bfa", fontSize: "12px", background: "rgba(124,58,237,0.1)", padding: "4px 8px", borderRadius: "6px" },
  emptyState: { padding: "48px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" },
};

export default Destinations;