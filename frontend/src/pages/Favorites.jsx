import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../services/api";
import "./Favorites.css";

const Favorites = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [wikiImages, setWikiImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [togglingId, setTogglingId] = useState(null);

  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/favorites");
      setFavorites(res.data || []);
    } catch (err) {
      console.error("Failed to load favorites:", err);
      setError(err.response?.data?.message || "Failed to load your favorite destinations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Pre-fetch Wikipedia fallback images for favorited destinations missing images
  useEffect(() => {
    favorites.forEach((fav) => {
      if (!isValidImageUrl(fav.imageUrl) && !wikiImages[fav.destinationId]) {
        fetchWikipediaImage(fav.destinationId);
      }
    });
  }, [favorites, wikiImages]);

  const isValidImageUrl = (url) => {
    if (!url || typeof url !== "string") return false;
    const trimmed = url.trim();
    return trimmed.startsWith("http://") || trimmed.startsWith("https://");
  };

  const fetchWikipediaImage = async (destId) => {
    try {
      const res = await api.get(`/destinations/${destId}`);
      if (res.data?.wikipedia?.imageUrl) {
        setWikiImages((prev) => ({ ...prev, [destId]: res.data.wikipedia.imageUrl }));
      }
    } catch {
      // Ignore image fallback failures
    }
  };

  const handleToggleFavorite = async (fav, e) => {
    e.stopPropagation();
    e.preventDefault();
    if (togglingId === fav.destinationId) return;

    setTogglingId(fav.destinationId);
    try {
      await api.delete(`/favorites/${fav.destinationId}`);
      // Optimistically remove from state
      setFavorites((prev) => prev.filter((item) => item.destinationId !== fav.destinationId));
    } catch (err) {
      console.error("Failed to remove favorite:", err);
      alert(err.response?.data?.message || "Failed to remove destination from favorites.");
      fetchFavorites();
    } finally {
      setTogglingId(null);
    }
  };

  const handleExplore = (fav) => {
    navigate(`/destinations/${fav.destinationId}`);
  };

  const handlePlanTrip = (fav) => {
    navigate("/trips/new", {
      state: {
        destination: {
          id: fav.destinationId,
          name: fav.destinationName,
          state: fav.state,
          country: fav.country,
          estimatedBudget: fav.estimatedBudget,
          category: fav.category,
        },
      },
    });
  };

  const getDisplayImage = (fav) => {
    if (isValidImageUrl(fav.imageUrl)) {
      return fav.imageUrl;
    }
    if (wikiImages[fav.destinationId]) {
      return wikiImages[fav.destinationId];
    }
    return null;
  };

  // Derive unique categories from user's favorites
  const categories = useMemo(() => {
    const set = new Set();
    favorites.forEach((f) => {
      if (f.category) set.add(f.category);
    });
    return Array.from(set);
  }, [favorites]);

  // Filtered favorites list
  const filteredFavorites = useMemo(() => {
    return favorites.filter((fav) => {
      const matchesSearch =
        searchQuery === "" ||
        fav.destinationName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fav.state?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fav.country?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fav.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "" ||
        fav.category?.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [favorites, searchQuery, selectedCategory]);

  return (
    <div className="tn-user-layout-container">
      <Sidebar />
      <main className="tn-user-main">
        <div className="tn-favorites-container">
          {/* Header */}
          <div className="tn-favorites-header">
            <div>
              <div className="tn-favorites-title-row">
                <h1 className="tn-favorites-title">Favorite Destinations</h1>
                <span className="tn-favorites-count-badge">
                  {favorites.length} {favorites.length === 1 ? "Saved" : "Saved"}
                </span>
              </div>
              <p className="tn-favorites-subtitle">
                Your saved destinations in one place. Explore guides or quickly plan your next getaway.
              </p>
            </div>

            <Link to="/destinations" className="tn-favorites-explore-cta">
              <span>Explore Catalog</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>

          {/* Search & Filter Bar (Shown if user has favorites) */}
          {favorites.length > 0 && (
            <div className="tn-favorites-controls">
              <div className="tn-favorites-search-wrapper">
                <svg className="tn-favorites-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  className="tn-favorites-search-input"
                  placeholder="Search your saved destinations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search saved destinations"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="tn-favorites-search-clear"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>

              {categories.length > 1 && (
                <div className="tn-favorites-category-chips">
                  <button
                    type="button"
                    className={`tn-favorites-chip ${selectedCategory === "" ? "active" : ""}`}
                    onClick={() => setSelectedCategory("")}
                  >
                    All ({favorites.length})
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`tn-favorites-chip ${selectedCategory === cat ? "active" : ""}`}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="tn-favorites-error-banner" role="alert">
              <span className="tn-favorites-error-icon">⚠️</span>
              <div className="tn-favorites-error-content">
                <p className="tn-favorites-error-msg">{error}</p>
                <button type="button" onClick={fetchFavorites} className="tn-favorites-retry-btn">
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Loading Skeletons */}
          {loading ? (
            <div className="tn-favorites-grid">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="tn-favorites-card-skeleton">
                  <div className="tn-skeleton-img" />
                  <div className="tn-skeleton-body">
                    <div className="tn-skeleton-title" />
                    <div className="tn-skeleton-text" />
                    <div className="tn-skeleton-meta" />
                    <div className="tn-skeleton-actions" />
                  </div>
                </div>
              ))}
            </div>
          ) : favorites.length === 0 ? (
            /* Empty State */
            <div className="tn-favorites-empty-card">
              <div className="tn-favorites-empty-icon-wrap" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
              </div>
              <h2 className="tn-favorites-empty-title">No favorite destinations yet</h2>
              <p className="tn-favorites-empty-desc">
                Save destinations you love by clicking the heart icon while exploring our catalog.
                They'll appear here for quick trip planning and reference.
              </p>
              <Link to="/destinations" className="tn-favorites-empty-btn">
                <span>Explore Destinations</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </div>
          ) : filteredFavorites.length === 0 ? (
            /* Search yielded no matches */
            <div className="tn-favorites-no-results">
              <p className="tn-favorites-no-results-text">
                No saved destinations found matching <strong>"{searchQuery || selectedCategory}"</strong>
              </p>
              <button
                type="button"
                className="tn-favorites-clear-filter-btn"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("");
                }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            /* Favorites Grid */
            <div className="tn-favorites-grid">
              {filteredFavorites.map((fav) => {
                const displayImg = getDisplayImage(fav);
                const isToggling = togglingId === fav.destinationId;

                return (
                  <div key={fav.id || fav.destinationId} className="tn-favorites-card">
                    {/* Image Container */}
                    <div className="tn-favorites-card-img-wrap">
                      {displayImg ? (
                        <img
                          src={displayImg}
                          alt={fav.destinationName}
                          className="tn-favorites-card-img"
                          loading="lazy"
                        />
                      ) : (
                        <div className="tn-favorites-card-img-placeholder">
                          <span className="tn-favorites-placeholder-icon">🏖️</span>
                          <span className="tn-favorites-placeholder-name">{fav.destinationName}</span>
                        </div>
                      )}

                      {/* Category Badge */}
                      {fav.category && (
                        <span className="tn-favorites-badge-category">
                          {fav.category}
                        </span>
                      )}

                      {/* Rating Badge */}
                      <span className="tn-favorites-badge-rating">
                        ⭐ {fav.rating ? fav.rating.toFixed(1) : "4.5"}
                      </span>

                      {/* Favorite Heart Button */}
                      <button
                        type="button"
                        className="tn-favorites-heart-btn favorited"
                        onClick={(e) => handleToggleFavorite(fav, e)}
                        disabled={isToggling}
                        aria-label={`Remove ${fav.destinationName} from favorites`}
                        aria-pressed="true"
                        title="Remove from favorites"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="#ef4444"
                          stroke="#ef4444"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                          className="tn-favorites-heart-icon"
                        >
                          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                        </svg>
                      </button>
                    </div>

                    {/* Card Content */}
                    <div className="tn-favorites-card-body">
                      <h3 className="tn-favorites-dest-title">{fav.destinationName}</h3>
                      <p className="tn-favorites-dest-location">
                        📍 {fav.state ? `${fav.state}, ` : ""}{fav.country || "India"}
                      </p>

                      {fav.description && (
                        <p className="tn-favorites-dest-desc">
                          {fav.description.substring(0, 110)}
                          {fav.description.length > 110 ? "..." : ""}
                        </p>
                      )}

                      {/* Meta Details */}
                      <div className="tn-favorites-dest-meta">
                        <span className="tn-favorites-meta-budget">
                          💰 ₹{fav.estimatedBudget ? Number(fav.estimatedBudget).toLocaleString("en-IN") : "N/A"}
                        </span>
                        {fav.bestSeason && (
                          <span className="tn-favorites-meta-season">
                            📅 {fav.bestSeason}
                          </span>
                        )}
                        {fav.recommendedDays && (
                          <span className="tn-favorites-meta-days">
                            ⏱️ {fav.recommendedDays} {fav.recommendedDays === 1 ? "Day" : "Days"}
                          </span>
                        )}
                      </div>

                      {/* Card Actions */}
                      <div className="tn-favorites-card-actions">
                        <button
                          type="button"
                          className="tn-favorites-action-explore"
                          onClick={() => handleExplore(fav)}
                        >
                          Explore Guide
                        </button>
                        <button
                          type="button"
                          className="tn-favorites-action-plan"
                          onClick={() => handlePlanTrip(fav)}
                        >
                          Plan Trip
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Favorites;
