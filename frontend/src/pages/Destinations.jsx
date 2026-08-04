import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../services/api";

const Destinations = () => {
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const categories = ["Beach", "Mountains", "Historical", "Adventure", "Spiritual", "Wildlife", "City"];

  useEffect(() => {
    fetchDestinations();
  }, []);

  const fetchDestinations = async () => {
    try {
      const res = await api.get("/destinations");
      setDestinations(res.data);
      setError(null);
    } catch (err) {
      setError("Failed to load destinations");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchDestinations();
      return;
    }
    try {
      const res = await api.get(`/destinations/search?query=${encodeURIComponent(searchQuery)}`);
      setDestinations(res.data);
      setError(null);
    } catch (err) {
      setError("Search failed");
      console.error(err);
    }
  };

  const handleFilter = async (category) => {
    if (selectedCategory === category) {
      setSelectedCategory("");
      fetchDestinations();
    } else {
      setSelectedCategory(category);
      try {
        const res = await api.get(`/destinations/filter?category=${encodeURIComponent(category)}`);
        setDestinations(res.data);
        setError(null);
      } catch (err) {
        setError("Filter failed");
        console.error(err);
      }
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    fetchDestinations();
  };

  const handleExplore = (destination) => {
    navigate(`/destinations/${destination.id}`);
  };

  const renderSkeleton = () => (
    <div style={styles.grid}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} style={styles.card} className="glass-card">
          <div style={styles.skeletonImage} />
          <div style={styles.skeletonTitle} />
          <div style={styles.skeletonText} />
          <div style={styles.skeletonText} />
          <div style={styles.skeletonButton} />
        </div>
      ))}
    </div>
  );

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

        {/* Search Bar */}
        <div style={styles.searchRow}>
          <input
            className="aurora-input"
            placeholder="Search by name, state, or country..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            style={styles.searchInput}
          />
          <button className="btn-aurora" onClick={handleSearch}>Search</button>
          {(searchQuery || selectedCategory) && (
            <button className="btn-ghost" onClick={clearFilters}>Clear</button>
          )}
        </div>

        {/* Filters */}
        <div style={styles.filterSection}>
          <span style={styles.filterLabel}>Filter by Category:</span>
          <div style={styles.filterButtons}>
            {categories.map((category) => (
              <button
                key={category}
                className={selectedCategory === category ? "btn-aurora" : "btn-ghost"}
                onClick={() => handleFilter(category)}
                style={styles.filterButton}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          renderSkeleton()
        ) : error ? (
          <div style={styles.errorState} className="glass-card">
            <span style={{ fontSize: "48px" }}>⚠️</span>
            <h3 style={{ color: "#f1f5f9" }}>{error}</h3>
            <button className="btn-aurora" onClick={fetchDestinations} style={{ marginTop: "16px" }}>
              Try Again
            </button>
          </div>
        ) : destinations.length === 0 ? (
          <div style={styles.emptyState} className="glass-card">
            <span style={{ fontSize: "48px" }}>🌍</span>
            <h3 style={{ color: "#f1f5f9" }}>No destinations found</h3>
            <p style={{ color: "#94a3b8" }}>Try adjusting your search or filters</p>
            <button className="btn-aurora" onClick={clearFilters} style={{ marginTop: "16px" }}>
              Clear Filters
            </button>
          </div>
        ) : (
          <div style={styles.grid}>
            {destinations.map((dest) => (
              <div key={dest.id} style={styles.card} className="glass-card">
                {dest.imageUrl ? (
                  <img src={dest.imageUrl} alt={dest.name} style={styles.cardImage} />
                ) : (
                  <div style={styles.cardImagePlaceholder}>🌍</div>
                )}
                <div style={styles.cardContent}>
                  <h3 style={styles.destName}>{dest.name}</h3>
                  <p style={styles.destLocation}>📍 {dest.state}, {dest.country}</p>
                  {dest.description && (
                    <p style={styles.destDesc}>{dest.description.substring(0, 120)}...</p>
                  )}
                  <div style={styles.destMeta}>
                    <span style={styles.metaItem}>📅 {dest.bestSeason}</span>
                    <span style={styles.metaItem}>₹{dest.estimatedBudget?.toLocaleString() || "N/A"}</span>
                    <span style={styles.metaItem}>⭐ {dest.rating?.toFixed(1) || "4.0"}</span>
                  </div>
                  <div style={styles.cardActions}>
                    <button
                      className="btn-aurora"
                      onClick={() => handleExplore(dest)}
                      style={styles.exploreButton}
                    >
                      Explore
                    </button>
                    <button
                      className="btn-aurora"
                      onClick={() => navigate("/trips/new", { state: { destination: dest } })}
                      style={styles.planTripButton}
                    >
                      Plan Trip
                    </button>
                  </div>
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
  searchInput: { flex: 1, maxWidth: "400px" },
  filterSection: { marginBottom: "20px" },
  filterLabel: { color: "#94a3b8", fontSize: "14px", fontWeight: "600", marginRight: "12px" },
  filterButtons: { display: "flex", flexWrap: "wrap", gap: "8px" },
  filterButton: { fontSize: "13px", padding: "8px 16px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" },
  card: { overflow: "hidden", transition: "transform 0.2s ease, box-shadow 0.2s ease" },
  cardImage: { width: "100%", height: "180px", objectFit: "cover" },
  cardImagePlaceholder: { width: "100%", height: "180px", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "48px" },
  cardContent: { padding: "20px" },
  destName: { fontSize: "18px", fontWeight: "600", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "4px" },
  destLocation: { color: "#94a3b8", fontSize: "13px", marginBottom: "12px" },
  destDesc: { color: "#64748b", fontSize: "13px", lineHeight: "1.5", marginBottom: "12px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" },
  destMeta: { display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" },
  metaItem: { color: "#a78bfa", fontSize: "12px", background: "rgba(124,58,237,0.1)", padding: "4px 8px", borderRadius: "6px" },
  cardActions: { display: "flex", gap: "8px" },
  exploreButton: { flex: 1, fontSize: "14px", padding: "10px" },
  planTripButton: { flex: 1, fontSize: "14px", padding: "10px" },
  emptyState: { padding: "48px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" },
  errorState: { padding: "48px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" },
  skeletonImage: { width: "100%", height: "180px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", marginBottom: "16px" },
  skeletonTitle: { width: "70%", height: "20px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", marginBottom: "8px" },
  skeletonText: { width: "90%", height: "14px", background: "rgba(255,255,255,0.03)", borderRadius: "4px", marginBottom: "8px" },
  skeletonButton: { width: "100%", height: "40px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", marginTop: "16px" },
};

export default Destinations;