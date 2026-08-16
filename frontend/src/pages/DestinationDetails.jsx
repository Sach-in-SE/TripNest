import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PublicLayout from "../components/layout/PublicLayout";
import DestinationMap from "../components/DestinationMap";
import api from "../services/api";

const DestinationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    fetchDestinationDetails();
  }, [id]);

  const fetchDestinationDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/destinations/${id}`);
      setDetails(res.data);
      setError(null);
      checkFavoriteStatus(res.data?.destination?.id || id);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load destination details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkFavoriteStatus = async (destId) => {
    if (!localStorage.getItem("token")) return;
    try {
      const res = await api.get("/favorites");
      const isFav = res.data.some((f) => String(f.destinationId) === String(destId));
      setIsFavorite(isFav);
    } catch (err) {
      // Ignore auth/favorites check errors
    }
  };

  const handleToggleFavorite = async () => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }
    const destId = destination?.id || id;
    try {
      if (isFavorite) {
        await api.delete(`/favorites/${destId}`);
        setIsFavorite(false);
      } else {
        await api.post("/favorites", { destinationId: destId });
        setIsFavorite(true);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update favorites");
    }
  };

  const isValidImageUrl = (url) => {
    if (!url || typeof url !== "string") return false;
    const trimmed = url.trim();
    return trimmed.startsWith("http://") || trimmed.startsWith("https://");
  };

  if (loading) return (
    <PublicLayout>
      <div style={styles.loadingState}>
        <p style={{ color: "#94a3b8" }}>Loading destination details...</p>
      </div>
    </PublicLayout>
  );

  if (error) return (
    <PublicLayout>
      <div style={styles.loadingState}>
        <div style={{ color: "#ef4444", marginBottom: "16px" }}>{error}</div>
        <button className="btn-ghost" onClick={() => navigate("/destinations")}>← Back to Destinations</button>
      </div>
    </PublicLayout>
  );

  const destination = details?.destination || details;
  const weather = details?.weather;
  const wikipedia = details?.wikipedia;
  const nearbyDestinations = details?.nearbyDestinations || [];

  if (!destination) return (
    <PublicLayout>
      <div style={styles.loadingState}>
        <div style={{ color: "#94a3b8", marginBottom: "16px" }}>Destination not found</div>
        <button className="btn-ghost" onClick={() => navigate("/destinations")}>← Back to Destinations</button>
      </div>
    </PublicLayout>
  );

  // Image resolution priority: Admin imageUrl -> Wikipedia imageUrl -> Fallback
  const heroImage = isValidImageUrl(destination.imageUrl)
    ? destination.imageUrl
    : isValidImageUrl(wikipedia?.imageUrl)
    ? wikipedia.imageUrl
    : null;

  return (
    <PublicLayout>
      <div style={styles.contentWrapper}>
        {/* Top Back Navigation */}
        <button
          className="btn-ghost"
          onClick={() => navigate("/destinations")}
          style={{ marginBottom: "20px", fontSize: "13px" }}
        >
          ← Back to Destinations
        </button>

        {/* Two-Column Responsive Layout */}
        <div style={styles.layoutColumns}>
          {/* LEFT COLUMN (~60%) */}
          <div style={styles.leftColumn}>
            {/* A. Hero Image Banner */}
            <div style={styles.heroBanner} className="glass-card">
              {heroImage ? (
                <img src={heroImage} alt={destination.name} style={styles.heroImg} />
              ) : (
                <div style={styles.heroImgPlaceholder}>
                  <span style={{ fontSize: "64px" }}>🏖️</span>
                </div>
              )}
              <div style={styles.heroOverlay}>
                <h1 style={styles.heroTitle}>{destination.name}</h1>
                <p style={styles.heroLocation}>📍 {destination.state}, {destination.country}</p>
                <div style={styles.heroMetaRow}>
                  <span style={styles.categoryBadge}>{destination.category}</span>
                  <span style={styles.ratingBadge}>⭐ {destination.rating?.toFixed(1) || "4.0"}</span>
                </div>
              </div>
            </div>

            {/* B. About Destination */}
            <div style={styles.sectionCard} className="glass-card">
              <h2 style={styles.sectionTitle}>About {destination.name}</h2>
              {wikipedia && wikipedia.available && wikipedia.extract ? (
                <div style={styles.wikiContent}>
                  <p style={styles.descriptionText}>{wikipedia.extract}</p>
                  <div style={styles.wikiMetaRow}>
                    <span style={styles.attributionBadge}>{wikipedia.attribution}</span>
                    {wikipedia.pageUrl && (
                      <a
                        href={wikipedia.pageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.wikiLink}
                      >
                        Read full article on Wikipedia ↗
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <p style={styles.descriptionText}>{destination.description || "No description available."}</p>
              )}
            </div>

            {/* C. Interactive Map */}
            <div style={styles.sectionCard} className="glass-card">
              <div style={styles.sectionHeaderRow}>
                <h2 style={styles.sectionTitle}>🗺️ Location & Interactive Map</h2>
                <span style={styles.attributionBadge}>© OpenStreetMap contributors</span>
              </div>
              <DestinationMap
                latitude={destination.latitude}
                longitude={destination.longitude}
                name={destination.name}
              />
            </div>

            {/* D. Nearby Destinations */}
            {nearbyDestinations.length > 0 && (
              <div style={styles.sectionCard} className="glass-card">
                <h2 style={styles.sectionTitle}>📍 Nearby Destinations</h2>
                <p style={styles.sectionSubtitle}>Explore places geographically close to {destination.name}</p>
                <div style={styles.nearbyGrid}>
                  {nearbyDestinations.map((nearby) => {
                    const nearbyImg = isValidImageUrl(nearby.imageUrl) ? nearby.imageUrl : null;
                    return (
                      <div
                        key={nearby.id}
                        style={styles.nearbyCard}
                        onClick={() => navigate(`/destinations/${nearby.id}`)}
                      >
                        {nearbyImg ? (
                          <img src={nearbyImg} alt={nearby.name} style={styles.nearbyImg} />
                        ) : (
                          <div style={styles.nearbyPlaceholder}>🌍</div>
                        )}
                        <div style={styles.nearbyInfo}>
                          <h4 style={styles.nearbyName}>{nearby.name}</h4>
                          <p style={styles.nearbyLoc}>📍 {nearby.state}, {nearby.country}</p>
                          <div style={styles.nearbyMetaRow}>
                            <span style={styles.distanceBadge}>🚗 {nearby.distanceKm} km away</span>
                            <span style={styles.nearbyRating}>⭐ {nearby.rating?.toFixed(1) || "4.0"}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN (~40%) */}
          <div style={styles.rightColumn}>
            {/* A. Live Weather Widget */}
            <div style={styles.sectionCard} className="glass-card">
              <div style={styles.sectionHeaderRow}>
                <h3 style={styles.cardHeaderTitle}>🌤️ Live Weather</h3>
                <span style={styles.attributionBadge}>Open-Meteo</span>
              </div>
              {weather && weather.available ? (
                <div>
                  <div style={styles.weatherMainRow}>
                    <span style={{ fontSize: "36px" }}>
                      {weather.weatherCode === 0 ? "☀️" : weather.weatherCode < 3 ? "🌤️" : weather.weatherCode < 60 ? "🌧️" : "⛈️"}
                    </span>
                    <div>
                      <div style={styles.tempLarge}>
                        {weather.temperature != null ? `${weather.temperature.toFixed(1)}°C` : "N/A"}
                      </div>
                      <div style={styles.conditionText}>{weather.weatherCondition}</div>
                    </div>
                  </div>

                  <div style={styles.weatherDetailsGrid}>
                    {weather.apparentTemperature != null && (
                      <div style={styles.weatherMiniStat}>
                        <span style={styles.miniLabel}>Feels Like</span>
                        <span style={styles.miniVal}>{weather.apparentTemperature.toFixed(1)}°C</span>
                      </div>
                    )}
                    <div style={styles.weatherMiniStat}>
                      <span style={styles.miniLabel}>Humidity</span>
                      <span style={styles.miniVal}>{weather.humidity != null ? `${weather.humidity}%` : "N/A"}</span>
                    </div>
                    <div style={styles.weatherMiniStat}>
                      <span style={styles.miniLabel}>Wind Speed</span>
                      <span style={styles.miniVal}>{weather.windSpeed != null ? `${weather.windSpeed} km/h` : "N/A"}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p style={{ color: "#94a3b8", fontSize: "14px" }}>Live weather data currently unavailable</p>
              )}
            </div>

            {/* B. 5-Day Weather Forecast */}
            {weather && weather.available && weather.forecast && weather.forecast.length > 0 && (
              <div style={styles.sectionCard} className="glass-card">
                <h3 style={styles.cardHeaderTitle}>📅 5-Day Forecast</h3>
                <div style={styles.forecastRow}>
                  {weather.forecast.map((day, idx) => {
                    const dateObj = new Date(day.date);
                    const dayName = isNaN(dateObj.getTime())
                      ? day.date
                      : dateObj.toLocaleDateString("en-US", { weekday: "short" });
                    return (
                      <div key={idx} style={styles.forecastCard}>
                        <span style={styles.forecastDay}>{dayName}</span>
                        <span style={{ fontSize: "20px", margin: "4px 0" }}>
                          {day.weatherCode === 0 ? "☀️" : day.weatherCode < 3 ? "🌤️" : "🌧️"}
                        </span>
                        <span style={styles.forecastHigh}>{day.tempMax != null ? `${Math.round(day.tempMax)}°` : "-"}</span>
                        <span style={styles.forecastLow}>{day.tempMin != null ? `${Math.round(day.tempMin)}°` : "-"}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* C. Trip Information Card */}
            <div style={styles.sectionCard} className="glass-card">
              <h3 style={styles.cardHeaderTitle}>🧳 Trip Context</h3>
              <div style={styles.tripInfoList}>
                <div style={styles.tripInfoItem}>
                  <span style={styles.tripInfoLabel}>Best Season</span>
                  <span style={styles.tripInfoVal}>{destination.bestSeason || "N/A"}</span>
                </div>
                <div style={styles.tripInfoItem}>
                  <span style={styles.tripInfoLabel}>Recommended Stay</span>
                  <span style={styles.tripInfoVal}>
                    {destination.recommendedDays ? `${destination.recommendedDays} days` : "N/A"}
                  </span>
                </div>
                <div style={styles.tripInfoItem}>
                  <span style={styles.tripInfoLabel}>Estimated Budget</span>
                  <span style={styles.tripInfoVal}>
                    ₹{destination.estimatedBudget ? destination.estimatedBudget.toLocaleString() : "N/A"}
                  </span>
                </div>
                <div style={styles.tripInfoItem}>
                  <span style={styles.tripInfoLabel}>Category</span>
                  <span style={styles.tripInfoVal}>{destination.category || "Travel"}</span>
                </div>
              </div>
            </div>

            {/* D. Quick Actions Card */}
            <div style={styles.sectionCard} className="glass-card">
              <h3 style={styles.cardHeaderTitle}>⚡ Quick Actions</h3>
              <div style={styles.actionButtonsCol}>
                <button
                  className="btn-aurora"
                  onClick={() => {
                    if (!localStorage.getItem("token")) {
                      navigate("/login");
                    } else {
                      navigate("/trips/new", { state: { destination: destination } });
                    }
                  }}
                  style={{ width: "100%", padding: "12px", fontSize: "14px" }}
                >
                  🚀 Plan Trip to {destination.name}
                </button>
                <button
                  className="btn-ghost"
                  onClick={handleToggleFavorite}
                  style={{
                    width: "100%",
                    padding: "12px",
                    fontSize: "14px",
                    color: isFavorite ? "#f43f5e" : "#f1f5f9",
                    borderColor: isFavorite ? "rgba(244, 63, 94, 0.4)" : "rgba(255,255,255,0.1)",
                    background: isFavorite ? "rgba(244, 63, 94, 0.1)" : "transparent",
                  }}
                >
                  {isFavorite ? "❤️ Favorited" : "🤍 Add to Favorites"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

const styles = {
  contentWrapper: { maxWidth: "1280px", margin: "0 auto", padding: "32px 24px", width: "100%", boxSizing: "border-box" },
  loadingState: { maxWidth: "1280px", margin: "0 auto", padding: "48px 24px", textAlign: "center" },
  layoutColumns: { display: "flex", gap: "24px", flexWrap: "wrap", alignItems: "flex-start" },
  leftColumn: { flex: "1 1 58%", minWidth: "320px", display: "flex", flexDirection: "column", gap: "20px" },
  rightColumn: { flex: "1 1 36%", minWidth: "300px", display: "flex", flexDirection: "column", gap: "20px" },
  heroBanner: { position: "relative", width: "100%", height: "320px", borderRadius: "16px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" },
  heroImg: { width: "100%", height: "100%", objectFit: "cover" },
  heroImgPlaceholder: { width: "100%", height: "100%", background: "linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(6,182,212,0.2) 100%)", display: "flex", alignItems: "center", justifyContent: "center" },
  heroOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, padding: "24px", background: "linear-gradient(to top, rgba(10, 15, 30, 0.95) 0%, rgba(10, 15, 30, 0) 100%)" },
  heroTitle: { fontSize: "32px", fontWeight: "700", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "4px" },
  heroLocation: { color: "#cbd5e1", fontSize: "15px", marginBottom: "10px" },
  heroMetaRow: { display: "flex", gap: "10px" },
  categoryBadge: { background: "rgba(6,182,212,0.2)", color: "#7dd3fc", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", backdropFilter: "blur(4px)" },
  ratingBadge: { background: "rgba(245,158,11,0.2)", color: "#fcd34d", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", backdropFilter: "blur(4px)" },
  sectionCard: { padding: "24px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.08)" },
  sectionTitle: { fontSize: "18px", fontWeight: "600", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "12px" },
  sectionSubtitle: { color: "#94a3b8", fontSize: "13px", marginBottom: "16px" },
  cardHeaderTitle: { fontSize: "16px", fontWeight: "600", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "12px" },
  sectionHeaderRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" },
  descriptionText: { color: "#cbd5e1", fontSize: "14px", lineHeight: "1.6" },
  wikiContent: { display: "flex", flexDirection: "column", gap: "12px" },
  wikiMetaRow: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px", borderTop: "1px dashed rgba(255,255,255,0.08)" },
  attributionBadge: { fontSize: "11px", color: "#64748b", background: "rgba(255,255,255,0.04)", padding: "3px 8px", borderRadius: "4px" },
  wikiLink: { color: "#38bdf8", fontSize: "13px", textDecoration: "none", fontWeight: "500" },
  weatherMainRow: { display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" },
  tempLarge: { fontSize: "28px", fontWeight: "700", color: "#f1f5f9" },
  conditionText: { color: "#38bdf8", fontSize: "14px", fontWeight: "500" },
  weatherDetailsGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" },
  weatherMiniStat: { background: "rgba(255,255,255,0.03)", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.04)", display: "flex", flexDirection: "column", gap: "2px" },
  miniLabel: { color: "#94a3b8", fontSize: "11px" },
  miniVal: { color: "#f1f5f9", fontSize: "13px", fontWeight: "600" },
  forecastRow: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px" },
  forecastCard: { background: "rgba(255,255,255,0.03)", padding: "10px 6px", borderRadius: "10px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", border: "1px solid rgba(255,255,255,0.04)" },
  forecastDay: { color: "#94a3b8", fontSize: "11px", fontWeight: "600" },
  forecastHigh: { color: "#f1f5f9", fontSize: "13px", fontWeight: "600" },
  forecastLow: { color: "#64748b", fontSize: "11px" },
  tripInfoList: { display: "flex", flexDirection: "column", gap: "12px" },
  tripInfoItem: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "8px", borderBottom: "1px dashed rgba(255,255,255,0.06)" },
  tripInfoLabel: { color: "#94a3b8", fontSize: "13px" },
  tripInfoVal: { color: "#f1f5f9", fontSize: "14px", fontWeight: "600" },
  actionButtonsCol: { display: "flex", flexDirection: "column", gap: "10px" },
  nearbyGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "14px" },
  nearbyCard: { background: "rgba(255,255,255,0.03)", borderRadius: "10px", overflow: "hidden", cursor: "pointer", border: "1px solid rgba(255,255,255,0.05)", transition: "transform 0.2s ease" },
  nearbyImg: { width: "100%", height: "110px", objectFit: "cover" },
  nearbyPlaceholder: { width: "100%", height: "110px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", background: "rgba(255,255,255,0.02)" },
  nearbyInfo: { padding: "10px" },
  nearbyName: { color: "#f1f5f9", fontSize: "14px", fontWeight: "600", marginBottom: "2px" },
  nearbyLoc: { color: "#94a3b8", fontSize: "11px", marginBottom: "6px" },
  nearbyMetaRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  distanceBadge: { fontSize: "10px", color: "#a78bfa", background: "rgba(124,58,237,0.12)", padding: "2px 6px", borderRadius: "4px" },
  nearbyRating: { fontSize: "11px", color: "#fcd34d" },
};

export default DestinationDetails;