import { useState, useEffect, lazy, Suspense } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import PublicLayout from "../components/layout/PublicLayout";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const DestinationMap = lazy(() => import("../components/DestinationMap"));

const CATEGORY_FALLBACK_IMAGES = {
  Beach: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
  Mountains: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
  Historical: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=800&q=80",
  Adventure: "https://images.unsplash.com/photo-1533240332313-0db49b459ad6?auto=format&fit=crop&w=800&q=80",
  Spiritual: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=80",
  Wildlife: "https://images.unsplash.com/photo-1534177616072-ef7dc120449d?auto=format&fit=crop&w=800&q=80",
  City: "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=800&q=80",
  Default: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80",
};

const resolveImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  const apiBase = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "")
    : (import.meta.env.PROD ? "" : "http://localhost:8080");
  return `${apiBase}${url.startsWith("/") ? "" : "/"}${url}`;
};

const DestinationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const initialDest = location.state?.destination || null;
  const [details, setDetails] = useState(initialDest ? { destination: initialDest } : null);
  const [loading, setLoading] = useState(!initialDest);
  const [guideLoading, setGuideLoading] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState("attractions");
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  useEffect(() => {
    fetchDestinationDetails();
  }, [id]);

  const fetchDestinationDetails = async () => {
    if (!initialDest) {
      setLoading(true);
    }
    setHeroImgFailed(false);
    try {
      const res = await api.get(`/destinations/${id}`);
      setDetails(res.data);
      setError(null);
      checkFavoriteStatus(res.data?.destination?.id || id);

      // Progressively enrich weather & travel guide if not already available
      if (!res.data?.travelGuide?.available) {
        fetchGuideProgressive();
      }
      if (!res.data?.weather?.available) {
        fetchWeatherProgressive();
      }
      fetchExperiencesProgressive(res.data?.destination?.id || id);
    } catch (err) {
      if (!initialDest) {
        setError(err.response?.data?.message || "Destination not found or failed to load");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExperiencesProgressive = async (destId) => {
    const targetId = destId || id;
    if (!targetId) return;
    try {
      const res = await api.get("/memories/public", {
        params: { destinationId: targetId, isPublic: true },
      });
      const memories = Array.isArray(res.data) ? res.data : (res.data?.content || []);
      if (memories && memories.length > 0) {
        setDetails((prev) => (prev ? { ...prev, travelerExperiences: memories } : prev));
      } else {
        const fallbackRes = await api.get(`/destinations/${targetId}/experiences`);
        const fallbackMemories = fallbackRes.data?.content || (Array.isArray(fallbackRes.data) ? fallbackRes.data : []);
        if (fallbackMemories.length > 0) {
          setDetails((prev) => (prev ? { ...prev, travelerExperiences: fallbackMemories } : prev));
        }
      }
    } catch {
      try {
        const fallbackRes = await api.get(`/destinations/${targetId}/experiences`);
        const fallbackMemories = fallbackRes.data?.content || (Array.isArray(fallbackRes.data) ? fallbackRes.data : []);
        if (fallbackMemories.length > 0) {
          setDetails((prev) => (prev ? { ...prev, travelerExperiences: fallbackMemories } : prev));
        }
      } catch {
        // Non-blocking
      }
    }
  };

  const fetchGuideProgressive = async () => {
    try {
      setGuideLoading(true);
      const guideRes = await api.get(`/destinations/${id}/guide`);
      if (guideRes.data?.available) {
        setDetails((prev) => (prev ? { ...prev, travelGuide: guideRes.data } : prev));
      }
    } catch {
      // Non-blocking
    } finally {
      setGuideLoading(false);
    }
  };

  const fetchWeatherProgressive = async () => {
    try {
      setWeatherLoading(true);
      const weatherRes = await api.get(`/destinations/${id}/weather`);
      if (weatherRes.data?.available) {
        setDetails((prev) => (prev ? { ...prev, weather: weatherRes.data } : prev));
      }
    } catch {
      // Non-blocking
    } finally {
      setWeatherLoading(false);
    }
  };

  const checkFavoriteStatus = async (destId) => {
    if (!localStorage.getItem("token")) return;
    try {
      const res = await api.get("/favorites");
      const isFav = res.data.some((f) => String(f.destinationId) === String(destId));
      setIsFavorite(isFav);
    } catch {
      // Non-blocking fallback for favorites
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

  if (loading) {
    const loadingView = (
      <div style={styles.loadingState}>
        <div style={styles.spinner}></div>
        <p style={{ color: "#94a3b8", marginTop: "16px" }}>Loading travel guide details...</p>
      </div>
    );
    if (user) {
      return (
        <div className="tn-user-layout-container">
          <Sidebar />
          <main className="tn-user-main">{loadingView}</main>
        </div>
      );
    }
    return <PublicLayout>{loadingView}</PublicLayout>;
  }

  if (error || !details) {
    const errorView = (
      <div style={styles.errorState} className="glass-card">
        <span style={{ fontSize: "56px" }}>🧭</span>
        <h2 style={{ color: "var(--text-primary, #ffffff)", marginTop: "12px", marginBottom: "8px" }}>Destination Not Found</h2>
        <p style={{ color: "var(--text-secondary, #cbd5e1)", marginBottom: "20px", maxWidth: "420px" }}>
          {error || "The destination you are looking for does not exist in the database or may have been removed."}
        </p>
        <button className="btn-aurora" onClick={() => navigate("/destinations")}>
          ← Back to Destinations
        </button>
      </div>
    );
    if (user) {
      return (
        <div className="tn-user-layout-container">
          <Sidebar />
          <main className="tn-user-main">{errorView}</main>
        </div>
      );
    }
    return <PublicLayout>{errorView}</PublicLayout>;
  }

  const destination = details?.destination || details;
  const weather = details?.weather;
  const wikipedia = details?.wikipedia;
  const travelGuide = details?.travelGuide;

  // Resolve hero image with fallback chain: Valid Admin URL -> Wikipedia URL -> Category Fallback -> Fallback placeholder
  let heroImage = null;
  if (!heroImgFailed && isValidImageUrl(destination.imageUrl)) {
    heroImage = destination.imageUrl;
  } else if (isValidImageUrl(wikipedia?.imageUrl)) {
    heroImage = wikipedia.imageUrl;
  } else if (destination?.category && CATEGORY_FALLBACK_IMAGES[destination.category]) {
    heroImage = CATEGORY_FALLBACK_IMAGES[destination.category];
  } else {
    heroImage = CATEGORY_FALLBACK_IMAGES.Default;
  }

  const guideTabs = [
    { id: "attractions", label: "🏛️ Places to Visit", items: travelGuide?.attractions || [] },
    { id: "hotels", label: "🏨 Places to Stay", items: travelGuide?.hotels || [] },
    { id: "food", label: "🍲 Food & Cuisine", items: travelGuide?.food || [] },
    { id: "shopping", label: "🛍️ Markets & Shopping", items: travelGuide?.shopping || [] },
  ];

  const currentTabObj = guideTabs.find((t) => t.id === activeGuideTab) || guideTabs[0];

  const mainContent = (
    <div style={user ? styles.userContentWrapper : styles.contentWrapper}>
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
        {/* LEFT COLUMN (~62%) */}
        <div style={styles.leftColumn}>
          {/* 1. Hero Image Banner */}
          <div style={styles.heroBanner} className="glass-card">
            {heroImage ? (
              <img
                src={heroImage}
                alt={destination.name}
                style={styles.heroImg}
                onError={() => setHeroImgFailed(true)}
              />
            ) : (
              <div style={styles.heroImgPlaceholder}>
                <span style={{ fontSize: "64px" }}>🏝️</span>
              </div>
            )}
            <div style={styles.heroOverlay}>
              <h1 style={styles.heroTitle}>{destination.name}</h1>
              <p style={styles.heroLocation}>
                📍 {[destination.state, destination.country].filter(Boolean).join(", ")}
              </p>
              <div style={styles.heroMetaRow}>
                <span style={styles.categoryBadge}>{destination.category || "Travel"}</span>
                <span style={styles.ratingBadge}>⭐ {destination.rating?.toFixed(1) || "4.0"}</span>
                {destination.estimatedBudget != null && (
                  <span style={styles.budgetBadge}>
                    ₹{Number(destination.estimatedBudget).toLocaleString("en-IN")}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 2. About This Destination */}
          <div style={styles.sectionCard} className="glass-card">
            <h2 style={styles.sectionTitle}>About {destination.name}</h2>
            <p style={styles.descriptionText}>
              {destination.description || "No description provided by the administrator."}
            </p>

            {/* Supplementary Wikipedia Insight */}
            {wikipedia && wikipedia.available && wikipedia.extract && (
              <div style={styles.wikiSection}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "14px", fontWeight: "600", color: "#a78bfa" }}>📚 Regional Insight</span>
                </div>
                <p style={{ ...styles.descriptionText, fontStyle: "italic", fontSize: "14px", color: "#cbd5e1" }}>
                  {wikipedia.extract}
                </p>
                <div style={styles.wikiMetaRow}>
                  <span style={styles.attributionBadge}>{wikipedia.attribution || "Source: Wikipedia"}</span>
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
            )}
          </div>

          {/* 3. Explore This Destination - Rich Travel Discovery */}
          <div style={styles.sectionCard} className="glass-card">
            <div style={styles.sectionHeaderRow}>
              <div>
                <h2 style={styles.sectionTitle}>🧭 Explore {destination.name}</h2>
                <p style={styles.sectionSubtitle}>
                  Verified local attractions, places to stay, dining, and shopping nearby
                </p>
              </div>
            </div>

            {/* Category Navigation Tabs */}
            <div style={styles.tabBar}>
              {guideTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveGuideTab(tab.id)}
                  style={{
                    ...styles.tabBtn,
                    ...(activeGuideTab === tab.id ? styles.tabBtnActive : {}),
                  }}
                >
                  {tab.label}
                  <span style={styles.tabBadge}>{tab.items.length}</span>
                </button>
              ))}
            </div>

            {/* Tab Content Cards */}
            {guideLoading && currentTabObj.items.length === 0 ? (
              <div style={styles.tabEmptyState}>
                <div style={styles.spinner}></div>
                <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "12px" }}>
                  Discovering verified local places nearby...
                </p>
              </div>
            ) : currentTabObj.items.length === 0 ? (
              <div style={styles.tabEmptyState}>
                <span style={{ fontSize: "32px", marginBottom: "8px" }}>🔍</span>
                <h4 style={{ color: "var(--text-primary, #ffffff)", margin: "4px 0", fontSize: "15px" }}>No Places Found</h4>
                <p style={{ color: "var(--text-secondary, #cbd5e1)", fontSize: "13px", maxWidth: "360px", textAlign: "center" }}>
                  No verified places found for {currentTabObj.label.toLowerCase()} within the immediate area of {destination.name}.
                </p>
              </div>
            ) : (
              <div style={styles.guideGrid}>
                {currentTabObj.items.map((place, idx) => (
                  <div key={idx} style={styles.guideCard}>
                    {place.imageUrl && (
                      <div style={styles.guideCardImgWrapper}>
                        <img
                          src={place.imageUrl}
                          alt={place.title}
                          style={styles.guideCardImg}
                          onError={(e) => {
                            e.target.parentElement.style.display = "none";
                          }}
                        />
                      </div>
                    )}
                    <div style={styles.guideCardHeader}>
                      <h4 style={styles.guideCardTitle}>{place.title}</h4>
                    </div>
                    
                    <div style={styles.guideMetaRow}>
                      {place.distanceKm != null && (
                        <span style={styles.distanceBadge}>📍 {place.distanceKm} km away</span>
                      )}
                      {place.phone && (
                        <span style={styles.phoneBadge}>📞 {place.phone}</span>
                      )}
                    </div>

                    {place.snippet && (
                      <p style={styles.guideCardSnippet}>{place.snippet}</p>
                    )}

                    {place.address && (
                      <p style={styles.guideCardAddress} title={place.address}>
                        🏢 {place.address}
                      </p>
                    )}

                    {place.pageUrl && (
                      <div style={{ marginTop: "auto", paddingTop: "8px" }}>
                        <a
                          href={place.pageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.guideCardLink}
                        >
                          Learn more ↗
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {travelGuide?.attribution && (
              <div style={{ marginTop: "16px", paddingTop: "10px", borderTop: "1px dashed rgba(255,255,255,0.06)", display: "flex", justifyContent: "flex-end" }}>
                <span style={styles.attributionBadge}>{travelGuide.attribution}</span>
              </div>
            )}
          </div>

          {/* 4. Traveler Experiences Section */}
          <div style={styles.sectionCard} className="glass-card">
            <div style={styles.sectionHeaderRow}>
              <div>
                <h2 style={styles.sectionTitle}>📸 Traveler Experiences</h2>
                <p style={styles.sectionSubtitle}>
                  Authentic stories and photos shared by fellow travelers who visited {destination.name}
                </p>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                <button
                  className="btn-ghost"
                  style={{ fontSize: "12px", padding: "6px 12px" }}
                  onClick={() => {
                    if (!localStorage.getItem("token")) {
                      navigate("/login");
                    } else {
                      navigate(`/memories?destinationId=${destination.id}`);
                    }
                  }}
                >
                  ➕ Share Experience
                </button>
                {(() => {
                  const publicExperiences = (details?.travelerExperiences || []).filter(
                    (exp) => exp && exp.isPublic !== false && (!exp.visibility || exp.visibility === "PUBLIC")
                  );
                  return publicExperiences.length > 0 && (
                    <button
                      className="btn-ghost"
                      style={{ fontSize: "12px", padding: "6px 12px", color: "#38bdf8" }}
                      onClick={() => navigate(`/destinations/${destination.id}/experiences`)}
                    >
                      View All →
                    </button>
                  );
                })()}
              </div>
            </div>

            {(() => {
              const publicExperiences = (details?.travelerExperiences || []).filter(
                (exp) => exp && exp.isPublic !== false && (!exp.visibility || exp.visibility === "PUBLIC")
              );

              if (publicExperiences.length === 0) {
                return (
                  <div style={styles.tabEmptyState}>
                    <span style={{ fontSize: "36px", marginBottom: "8px" }}>📸</span>
                    <h4 style={{ color: "var(--text-primary, #ffffff)", margin: "4px 0", fontSize: "15px" }}>No Traveler Stories Yet</h4>
                    <p style={{ color: "var(--text-secondary, #cbd5e1)", fontSize: "13px", maxWidth: "380px", textAlign: "center", marginBottom: "14px" }}>
                      Be the first to share your journey and inspire others visiting {destination.name}.
                    </p>
                    <button
                      className="btn-aurora"
                      style={{ fontSize: "12px", padding: "8px 16px" }}
                      onClick={() => {
                        if (!localStorage.getItem("token")) {
                          navigate("/login");
                        } else {
                          navigate(`/memories?destinationId=${destination.id}`);
                        }
                      }}
                    >
                      Share Your Experience
                    </button>
                  </div>
                );
              }

              return (
                <div style={styles.experiencesGrid}>
                  {publicExperiences.map((exp) => {
                    const authorName = exp.userName || exp.authorName || "Traveler";
                    const avatarInitial = exp.userAvatarInitial || authorName.charAt(0).toUpperCase() || "T";
                    const rawImgUrl = exp.imageUrl || (exp.images && exp.images.length > 0 ? (exp.images[0].fileUrl || exp.images[0].imageUrl) : null);
                    const displayImg = resolveImageUrl(rawImgUrl);

                    return (
                      <div key={exp.id} style={styles.experienceCard}>
                        {/* Author Header */}
                        <div style={styles.expAuthorRow}>
                          <div style={styles.expAvatar}>
                            {avatarInitial}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={styles.expAuthorName} title={authorName}>
                              {authorName.toLowerCase().startsWith("by ") ? authorName : `by ${authorName}`}
                            </div>
                            <div style={styles.expDate}>
                              {exp.createdAt
                                ? new Date(exp.createdAt).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })
                                : "Recent"}
                            </div>
                          </div>
                          {exp.locationName && (
                            <span style={styles.expLocationBadge} title={exp.locationName}>
                              📍 {exp.locationName}
                            </span>
                          )}
                        </div>

                        {/* Image Preview */}
                        {displayImg && (
                          <div style={styles.expImgWrapper}>
                            <img
                              src={displayImg}
                              alt={exp.title || "Travel experience"}
                              style={styles.expImg}
                              loading="lazy"
                              onError={(e) => {
                                e.target.parentElement.style.display = "none";
                              }}
                            />
                          </div>
                        )}

                        {/* Content */}
                        <h4 style={styles.expTitle}>{exp.title}</h4>
                        {exp.caption && (
                          <p style={styles.expCaption} title={exp.caption}>
                            {exp.caption}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* 5. Interactive Location Map */}
          <div style={styles.sectionCard} className="glass-card">
            <div style={styles.sectionHeaderRow}>
              <h2 style={styles.sectionTitle}>🗺️ Location & Map</h2>
              <span style={styles.attributionBadge}>© OpenStreetMap contributors</span>
            </div>
            <Suspense
              fallback={
                <div
                  style={{
                    height: "350px",
                    borderRadius: "12px",
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px dashed rgba(255, 255, 255, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#94a3b8",
                    fontSize: "14px",
                  }}
                >
                  <span>🗺️ Loading interactive map...</span>
                </div>
              }
            >
              <DestinationMap
                latitude={destination.latitude}
                longitude={destination.longitude}
                name={destination.name}
              />
            </Suspense>
          </div>
        </div>

        {/* RIGHT COLUMN (~38%) */}
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
                  <span style={{ fontSize: "38px" }}>
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
                    <span style={styles.miniLabel}>Wind</span>
                    <span style={styles.miniVal}>{weather.windSpeed != null ? `${weather.windSpeed} km/h` : "N/A"}</span>
                  </div>
                </div>
              </div>
            ) : weatherLoading ? (
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "16px 0" }}>
                <div style={{ ...styles.spinner, width: "20px", height: "20px" }}></div>
                <span style={{ color: "#94a3b8", fontSize: "13px" }}>Loading live weather...</span>
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

          {/* C. Trip Quick Facts Card */}
          <div style={styles.sectionCard} className="glass-card">
            <h3 style={styles.cardHeaderTitle}>🧳 Trip Summary</h3>
            <div style={styles.tripInfoList}>
              <div style={styles.tripInfoItem}>
                <span style={styles.tripInfoLabel}>Best Season</span>
                <span style={styles.tripInfoVal}>{destination.bestSeason || "Year-round"}</span>
              </div>
              <div style={styles.tripInfoItem}>
                <span style={styles.tripInfoLabel}>Recommended Stay</span>
                <span style={styles.tripInfoVal}>
                  {destination.recommendedDays ? `${destination.recommendedDays} Days` : "3-5 Days"}
                </span>
              </div>
              <div style={styles.tripInfoItem}>
                <span style={styles.tripInfoLabel}>Estimated Budget</span>
                <span style={styles.tripInfoVal}>
                  ₹{destination.estimatedBudget ? Number(destination.estimatedBudget).toLocaleString("en-IN") : "N/A"}
                </span>
              </div>
              <div style={styles.tripInfoItem}>
                <span style={styles.tripInfoLabel}>Category</span>
                <span style={styles.tripInfoVal}>{destination.category || "General"}</span>
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
                {isFavorite ? "❤️ In Favorites" : "🤍 Add to Favorites"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (user) {
    return (
      <div className="tn-user-layout-container">
        <Sidebar />
        <main className="tn-user-main">{mainContent}</main>
      </div>
    );
  }

  return <PublicLayout>{mainContent}</PublicLayout>;
};

const styles = {
  userContentWrapper: { width: "100%", maxWidth: "1280px", margin: "0 auto", boxSizing: "border-box" },
  contentWrapper: { maxWidth: "1280px", margin: "0 auto", padding: "32px 24px", width: "100%", boxSizing: "border-box" },
  loadingState: { maxWidth: "1280px", margin: "0 auto", padding: "60px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" },
  errorState: { maxWidth: "600px", margin: "60px auto", padding: "40px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", borderRadius: "16px" },
  spinner: { width: "40px", height: "40px", border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "#38bdf8", borderRadius: "50%", animation: "spin 1s linear infinite" },
  layoutColumns: { display: "flex", gap: "24px", flexWrap: "wrap", alignItems: "flex-start" },
  leftColumn: { flex: "1 1 58%", minWidth: "320px", display: "flex", flexDirection: "column", gap: "20px" },
  rightColumn: { flex: "1 1 36%", minWidth: "300px", display: "flex", flexDirection: "column", gap: "20px" },
  heroBanner: { position: "relative", width: "100%", height: "320px", borderRadius: "16px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" },
  heroImg: { width: "100%", height: "100%", objectFit: "cover" },
  heroImgPlaceholder: { width: "100%", height: "100%", background: "linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(6,182,212,0.2) 100%)", display: "flex", alignItems: "center", justifyContent: "center" },
  heroOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, padding: "24px", background: "linear-gradient(to top, rgba(10, 15, 30, 0.95) 0%, rgba(10, 15, 30, 0) 100%)" },
  heroTitle: { fontSize: "32px", fontWeight: "700", color: "var(--text-primary, #ffffff)", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "4px" },
  heroLocation: { color: "var(--text-secondary, #cbd5e1)", fontSize: "15px", marginBottom: "10px" },
  heroMetaRow: { display: "flex", gap: "10px", flexWrap: "wrap" },
  categoryBadge: { background: "rgba(6,182,212,0.2)", color: "#7dd3fc", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", backdropFilter: "blur(4px)" },
  ratingBadge: { background: "rgba(245,158,11,0.2)", color: "#fcd34d", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", backdropFilter: "blur(4px)" },
  budgetBadge: { background: "rgba(16,185,129,0.2)", color: "#6ee7b7", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", backdropFilter: "blur(4px)" },
  sectionCard: { padding: "24px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.08)" },
  sectionTitle: { fontSize: "18px", fontWeight: "600", color: "var(--text-primary, #ffffff)", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "6px" },
  sectionSubtitle: { color: "var(--text-secondary, #94a3b8)", fontSize: "13px", marginBottom: "16px" },
  cardHeaderTitle: { fontSize: "16px", fontWeight: "600", color: "var(--text-primary, #ffffff)", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "12px" },
  sectionHeaderRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" },
  descriptionText: { color: "var(--text-secondary, #cbd5e1)", fontSize: "14px", lineHeight: "1.6" },
  wikiSection: { marginTop: "20px", paddingTop: "16px", borderTop: "1px solid rgba(148, 163, 184, 0.15)" },
  wikiMetaRow: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px", marginTop: "8px", borderTop: "1px dashed rgba(255,255,255,0.08)" },
  attributionBadge: { fontSize: "11px", color: "#64748b", background: "rgba(255,255,255,0.04)", padding: "3px 8px", borderRadius: "4px" },
  wikiLink: { color: "#38bdf8", fontSize: "13px", textDecoration: "none", fontWeight: "500" },
  tabBar: { display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "12px", marginBottom: "16px", borderBottom: "1px solid rgba(255,255,255,0.08)" },
  tabBtn: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", padding: "8px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: "500", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap", transition: "all 0.2s ease" },
  tabBtnActive: { background: "rgba(56, 189, 248, 0.15)", borderColor: "rgba(56, 189, 248, 0.4)", color: "#38bdf8" },
  tabBadge: { background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: "10px", fontSize: "10px", color: "#cbd5e1" },
  tabEmptyState: { padding: "32px 16px", textAlign: "center", background: "rgba(255,255,255,0.02)", borderRadius: "10px", border: "1px dashed rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", alignItems: "center" },
  guideGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" },
  guideCard: { background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", gap: "8px", transition: "transform 0.2s ease, border-color 0.2s ease" },
  guideCardImgWrapper: { width: "100%", height: "140px", borderRadius: "8px", overflow: "hidden", background: "rgba(255,255,255,0.02)", marginBottom: "4px" },
  guideCardImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  guideCardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" },
  guideCardTitle: { color: "var(--text-primary, #ffffff)", fontSize: "15px", fontWeight: "600", lineHeight: "1.3", margin: 0 },
  guideMetaRow: { display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" },
  guideCardSnippet: { color: "var(--text-secondary, #94a3b8)", fontSize: "12px", lineHeight: "1.5", margin: "2px 0" },
  guideCardAddress: { color: "#64748b", fontSize: "11px", lineHeight: "1.4", margin: 0, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" },
  guideCardLink: { color: "#38bdf8", fontSize: "12px", textDecoration: "none", fontWeight: "500" },
  distanceBadge: { fontSize: "11px", color: "#a78bfa", background: "rgba(124,58,237,0.15)", padding: "2px 8px", borderRadius: "6px", fontWeight: "500", whiteSpace: "nowrap" },
  phoneBadge: { fontSize: "11px", color: "#34d399", background: "rgba(16,185,129,0.12)", padding: "2px 8px", borderRadius: "6px", fontWeight: "500", whiteSpace: "nowrap" },
  weatherMainRow: { display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" },
  tempLarge: { fontSize: "28px", fontWeight: "700", color: "var(--text-primary, #ffffff)" },
  conditionText: { color: "#38bdf8", fontSize: "14px", fontWeight: "500" },
  weatherDetailsGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" },
  weatherMiniStat: { background: "rgba(255,255,255,0.03)", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.04)", display: "flex", flexDirection: "column", gap: "2px" },
  miniLabel: { color: "#94a3b8", fontSize: "11px" },
  miniVal: { color: "var(--text-primary, #ffffff)", fontSize: "13px", fontWeight: "600" },
  forecastRow: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px" },
  forecastCard: { background: "rgba(255,255,255,0.03)", padding: "10px 6px", borderRadius: "10px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", border: "1px solid rgba(255,255,255,0.04)" },
  forecastDay: { color: "#94a3b8", fontSize: "11px", fontWeight: "600" },
  forecastHigh: { color: "var(--text-primary, #ffffff)", fontSize: "13px", fontWeight: "600" },
  forecastLow: { color: "#64748b", fontSize: "11px" },
  tripInfoList: { display: "flex", flexDirection: "column", gap: "12px" },
  tripInfoItem: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "8px", borderBottom: "1px dashed rgba(255,255,255,0.06)" },
  tripInfoLabel: { color: "#94a3b8", fontSize: "13px" },
  tripInfoVal: { color: "var(--text-primary, #ffffff)", fontSize: "14px", fontWeight: "600" },
  actionButtonsCol: { display: "flex", flexDirection: "column", gap: "10px" },
  experiencesGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" },
  experienceCard: { background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", gap: "10px" },
  expAuthorRow: { display: "flex", alignItems: "center", gap: "10px" },
  expAvatar: { width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #7c3aed, #06b6d4)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "700" },
  expAuthorName: { color: "var(--text-primary, #ffffff)", fontSize: "13px", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  expDate: { color: "#64748b", fontSize: "11px" },
  expLocationBadge: { fontSize: "11px", color: "#38bdf8", background: "rgba(56,189,248,0.1)", padding: "2px 6px", borderRadius: "4px", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  expImgWrapper: { width: "100%", height: "160px", borderRadius: "8px", overflow: "hidden", background: "rgba(255,255,255,0.02)" },
  expImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  expTitle: { color: "var(--text-primary, #ffffff)", fontSize: "14px", fontWeight: "600", margin: 0, lineHeight: "1.4" },
  expCaption: { color: "var(--text-secondary, #cbd5e1)", fontSize: "12px", lineHeight: "1.5", margin: 0, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" },
};

export default DestinationDetails;