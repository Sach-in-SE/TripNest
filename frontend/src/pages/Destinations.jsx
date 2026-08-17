import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PublicLayout from "../components/layout/PublicLayout";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const Destinations = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes("ROLE_ADMIN") || user?.roles?.includes("ADMIN");

  const [destinations, setDestinations] = useState([]);
  const [wikiImages, setWikiImages] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favoriteSet, setFavoriteSet] = useState(new Set());
  const [togglingFavId, setTogglingFavId] = useState(null);

  // Admin Modal & Form state
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [editingDest, setEditingDest] = useState(null);
  const [formError, setFormError] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    state: "",
    country: "India",
    category: "Beach",
    imageUrl: "",
    latitude: "",
    longitude: "",
    estimatedBudget: "",
    recommendedDays: 3,
    bestSeason: "",
    rating: 4.5,
    description: "",
  });

  const categories = ["Beach", "Mountains", "Historical", "Adventure", "Spiritual", "Wildlife", "City"];

  const fetchUserFavorites = async () => {
    if (!localStorage.getItem("token")) return;
    try {
      const res = await api.get("/favorites");
      const favIds = new Set((res.data || []).map((f) => f.destinationId));
      setFavoriteSet(favIds);
    } catch {
      // Non-blocking fallback for favorites
    }
  };

  useEffect(() => {
    fetchDestinations();
    fetchUserFavorites();
  }, []);

  useEffect(() => {
    // Pre-fetch Wikipedia fallback images for destinations missing valid admin images
    destinations.forEach((dest) => {
      if (!isValidImageUrl(dest.imageUrl) && !wikiImages[dest.id]) {
        fetchWikipediaImage(dest);
      }
    });
  }, [destinations]);

  const isValidImageUrl = (url) => {
    if (!url || typeof url !== "string") return false;
    const trimmed = url.trim();
    return trimmed.startsWith("http://") || trimmed.startsWith("https://");
  };

  const fetchWikipediaImage = async (dest) => {
    try {
      const res = await api.get(`/destinations/${dest.id}`);
      if (res.data?.wikipedia?.imageUrl) {
        setWikiImages((prev) => ({ ...prev, [dest.id]: res.data.wikipedia.imageUrl }));
      }
    } catch (err) {
      // Ignore image fallback failures
    }
  };

  const fetchDestinations = async () => {
    setLoading(true);
    try {
      let res;
      if (sortBy && !searchQuery && !selectedCategory) {
        res = await api.get(`/destinations/sort?sortBy=${encodeURIComponent(sortBy)}`);
      } else {
        res = await api.get("/destinations");
      }
      setDestinations(applySort(res.data, sortBy));
      setError(null);
    } catch (err) {
      setError("Failed to load destinations");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applySort = (list, sortKey) => {
    if (!list) return [];
    const copy = [...list];
    if (sortKey === "name") {
      return copy.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }
    if (sortKey === "rating") {
      return copy.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    if (sortKey === "budget") {
      return copy.sort((a, b) => (a.estimatedBudget || 0) - (b.estimatedBudget || 0));
    }
    return copy;
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchDestinations();
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/destinations/search?query=${encodeURIComponent(searchQuery)}`);
      setDestinations(applySort(res.data, sortBy));
      setError(null);
    } catch (err) {
      setError("Search failed");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = async (category) => {
    setLoading(true);
    if (selectedCategory === category) {
      setSelectedCategory("");
      try {
        const res = await api.get("/destinations");
        setDestinations(applySort(res.data, sortBy));
        setError(null);
      } catch (err) {
        setError("Failed to reset filter");
      } finally {
        setLoading(false);
      }
    } else {
      setSelectedCategory(category);
      try {
        const res = await api.get(`/destinations/filter?category=${encodeURIComponent(category)}`);
        setDestinations(applySort(res.data, sortBy));
        setError(null);
      } catch (err) {
        setError("Filter failed");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSortChange = async (newSort) => {
    setSortBy(newSort);
    if (!searchQuery && !selectedCategory) {
      if (!newSort) {
        fetchDestinations();
      } else {
        setLoading(true);
        try {
          const res = await api.get(`/destinations/sort?sortBy=${encodeURIComponent(newSort)}`);
          setDestinations(res.data);
          setError(null);
        } catch (err) {
          setError("Sort failed");
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    } else {
      setDestinations(applySort(destinations, newSort));
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSortBy("");
    fetchDestinations();
  };

  const handleExplore = (destination) => {
    navigate(`/destinations/${destination.id}`);
  };

  const handleToggleFavorite = async (dest, e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!localStorage.getItem("token") || !user) {
      navigate("/login");
      return;
    }
    if (togglingFavId === dest.id) return;

    setTogglingFavId(dest.id);
    const isFav = favoriteSet.has(dest.id);
    try {
      if (isFav) {
        await api.delete(`/favorites/${dest.id}`);
        setFavoriteSet((prev) => {
          const next = new Set(prev);
          next.delete(dest.id);
          return next;
        });
      } else {
        await api.post("/favorites", { destinationId: dest.id });
        setFavoriteSet((prev) => new Set(prev).add(dest.id));
      }
    } catch (err) {
      console.error("Failed to update favorites:", err);
      alert(err.response?.data?.message || "Failed to update favorites.");
    } finally {
      setTogglingFavId(null);
    }
  };

  // Admin Modal Handlers
  const handleOpenAddModal = () => {
    setEditingDest(null);
    setFormData({
      name: "",
      state: "",
      country: "India",
      category: "Beach",
      imageUrl: "",
      latitude: "",
      longitude: "",
      estimatedBudget: "",
      recommendedDays: 3,
      bestSeason: "October to March",
      rating: 4.5,
      description: "",
    });
    setFormError(null);
    setShowAdminModal(true);
  };

  const handleOpenEditModal = (dest, e) => {
    e.stopPropagation();
    setEditingDest(dest);
    setFormData({
      name: dest.name || "",
      state: dest.state || "",
      country: dest.country || "India",
      category: dest.category || "Beach",
      imageUrl: dest.imageUrl || "",
      latitude: dest.latitude != null ? dest.latitude : "",
      longitude: dest.longitude != null ? dest.longitude : "",
      estimatedBudget: dest.estimatedBudget != null ? dest.estimatedBudget : "",
      recommendedDays: dest.recommendedDays != null ? dest.recommendedDays : 3,
      bestSeason: dest.bestSeason || "",
      rating: dest.rating != null ? dest.rating : 4.5,
      description: dest.description || "",
    });
    setFormError(null);
    setShowAdminModal(true);
  };

  const handleDeleteDestination = async (id, name, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete destination "${name}"?`)) return;
    try {
      await api.delete(`/destinations/${id}`);
      fetchDestinations();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete destination");
    }
  };

  const handleSaveDestination = async (e) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!formData.name.trim()) {
      setFormError("Destination Name is required");
      return;
    }
    const latNum = parseFloat(formData.latitude);
    const lonNum = parseFloat(formData.longitude);
    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      setFormError("Latitude must be a valid number between -90 and 90");
      return;
    }
    if (isNaN(lonNum) || lonNum < -180 || lonNum > 180) {
      setFormError("Longitude must be a valid number between -180 and 180");
      return;
    }
    const budgetNum = parseFloat(formData.estimatedBudget);
    if (isNaN(budgetNum) || budgetNum < 0) {
      setFormError("Estimated Budget must be a non-negative number");
      return;
    }
    const ratingNum = parseFloat(formData.rating);
    if (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 5) {
      setFormError("Rating must be between 0.0 and 5.0");
      return;
    }

    const payload = {
      name: formData.name.trim(),
      state: formData.state.trim(),
      country: formData.country.trim(),
      category: formData.category,
      imageUrl: formData.imageUrl.trim(),
      latitude: latNum,
      longitude: lonNum,
      estimatedBudget: budgetNum,
      recommendedDays: parseInt(formData.recommendedDays) || 3,
      bestSeason: formData.bestSeason.trim(),
      rating: ratingNum,
      description: formData.description.trim(),
    };

    try {
      if (editingDest) {
        await api.put(`/destinations/${editingDest.id}`, payload);
      } else {
        await api.post("/destinations", payload);
      }
      setShowAdminModal(false);
      fetchDestinations();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to save destination");
    }
  };

  const getDisplayImage = (dest) => {
    if (isValidImageUrl(dest.imageUrl)) {
      return dest.imageUrl;
    }
    if (wikiImages[dest.id]) {
      return wikiImages[dest.id];
    }
    return null;
  };

  const renderSkeleton = () => (
    <div style={styles.grid}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} style={styles.card} className="glass-card">
          <div style={styles.skeletonImage} />
          <div style={styles.skeletonTitle} />
          <div style={styles.skeletonText} />
          <div style={styles.skeletonButton} />
        </div>
      ))}
    </div>
  );

  const pageContent = (
    <>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Destinations 🌍</h1>
          <p style={styles.subtitle}>Discover your next adventure</p>
        </div>
        {isAdmin && (
          <button className="btn-aurora" onClick={handleOpenAddModal} style={styles.adminAddBtn}>
            + Add Destination (Admin)
          </button>
        )}
      </div>

        {/* Search & Sort Controls */}
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

          <div style={styles.sortWrapper}>
            <span style={styles.sortLabel}>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              style={styles.sortSelect}
              className="aurora-input"
            >
              <option value="">Default</option>
              <option value="name">Name (A-Z)</option>
              <option value="rating">Rating (High to Low)</option>
              <option value="budget">Budget (Low to High)</option>
            </select>
          </div>

          {(searchQuery || selectedCategory || sortBy) && (
            <button className="btn-ghost" onClick={clearFilters}>Clear</button>
          )}
        </div>

        {/* Category Filters */}
        <div style={styles.filterSection}>
          <span style={styles.filterLabel}>Categories:</span>
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

        {/* Content Grid */}
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
            {destinations.map((dest) => {
              const displayImg = getDisplayImage(dest);
              return (
                <div key={dest.id} style={styles.card} className="glass-card">
                  <div style={styles.imageContainer}>
                    {displayImg ? (
                      <img src={displayImg} alt={dest.name} style={styles.cardImage} />
                    ) : (
                      <div style={styles.cardImagePlaceholder}>
                        <span style={{ fontSize: "40px" }}>🏖️</span>
                        <span style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>{dest.name}</span>
                      </div>
                    )}
                    <span style={styles.cardCategoryBadge}>{dest.category}</span>
                    <span style={styles.cardRatingBadge}>⭐ {dest.rating?.toFixed(1) || "4.0"}</span>
                    <button
                      type="button"
                      style={{
                        ...styles.favoriteBtn,
                        ...(favoriteSet.has(dest.id) ? styles.favoriteBtnActive : {}),
                      }}
                      onClick={(e) => handleToggleFavorite(dest, e)}
                      disabled={togglingFavId === dest.id}
                      aria-label={favoriteSet.has(dest.id) ? `Remove ${dest.name} from favorites` : `Add ${dest.name} to favorites`}
                      aria-pressed={favoriteSet.has(dest.id)}
                      title={favoriteSet.has(dest.id) ? "Remove from favorites" : "Add to favorites"}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill={favoriteSet.has(dest.id) ? "#ef4444" : "none"}
                        stroke={favoriteSet.has(dest.id) ? "#ef4444" : "#ffffff"}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ width: "17px", height: "17px" }}
                        aria-hidden="true"
                      >
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                      </svg>
                    </button>
                  </div>

                  <div style={styles.cardContent}>
                    <h3 style={styles.destName}>{dest.name}</h3>
                    <p style={styles.destLocation}>📍 {dest.state}, {dest.country}</p>
                    
                    {dest.description && (
                      <p style={styles.destDesc}>{dest.description.substring(0, 110)}...</p>
                    )}

                    <div style={styles.destMetaRow}>
                      <span style={styles.budgetValue}>
                        💰 ₹{dest.estimatedBudget ? dest.estimatedBudget.toLocaleString() : "N/A"}
                      </span>
                      {dest.bestSeason && (
                        <span style={styles.seasonTag}>📅 {dest.bestSeason}</span>
                      )}
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
                        className="btn-ghost"
                        onClick={() => {
                          if (!user) {
                            navigate("/login");
                          } else {
                            navigate("/trips/new", { state: { destination: dest } });
                          }
                        }}
                        style={styles.planTripButton}
                      >
                        Plan Trip
                      </button>
                    </div>

                    {isAdmin && (
                      <div style={styles.adminActionRow}>
                        <button
                          className="btn-ghost"
                          onClick={(e) => handleOpenEditModal(dest, e)}
                          style={{ fontSize: "12px", padding: "4px 8px", color: "#38bdf8" }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="btn-ghost"
                          onClick={(e) => handleDeleteDestination(dest.id, dest.name, e)}
                          style={{ fontSize: "12px", padding: "4px 8px", color: "#f87171" }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </>
  );

  const adminModal = showAdminModal && (
    <div style={styles.modalBackdrop}>
      <div style={styles.modalContent} className="glass-card">
        <div style={styles.modalHeader}>
          <h2 style={{ fontSize: "20px", color: "#f1f5f9" }}>
            {editingDest ? `Edit Destination: ${editingDest.name}` : "Add New Destination"}
          </h2>
          <button
            className="btn-ghost"
            onClick={() => setShowAdminModal(false)}
            style={{ fontSize: "18px" }}
          >
            ✕
          </button>
        </div>

        {formError && (
          <div style={styles.formErrorBanner}>
            <span>⚠️ {formError}</span>
          </div>
        )}

        <form onSubmit={handleSaveDestination} style={styles.adminForm}>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Destination Name *</label>
              <input
                className="aurora-input"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Goa"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>State *</label>
              <input
                className="aurora-input"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="e.g. Goa"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Country</label>
              <input
                className="aurora-input"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="India"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Category</label>
              <select
                className="aurora-input"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                style={{ background: "#0f172a" }}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Direct Image URL</label>
              <input
                className="aurora-input"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://images.unsplash.com/..."
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Latitude * (-90 to 90)</label>
              <input
                className="aurora-input"
                type="number"
                step="any"
                required
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                placeholder="e.g. 15.2993"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Longitude * (-180 to 180)</label>
              <input
                className="aurora-input"
                type="number"
                step="any"
                required
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                placeholder="e.g. 74.1240"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Estimated Budget (₹/person)</label>
              <input
                className="aurora-input"
                type="number"
                value={formData.estimatedBudget}
                onChange={(e) => setFormData({ ...formData, estimatedBudget: e.target.value })}
                placeholder="15000"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Recommended Days</label>
              <input
                className="aurora-input"
                type="number"
                value={formData.recommendedDays}
                onChange={(e) => setFormData({ ...formData, recommendedDays: e.target.value })}
                placeholder="4"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Best Season to Visit</label>
              <input
                className="aurora-input"
                value={formData.bestSeason}
                onChange={(e) => setFormData({ ...formData, bestSeason: e.target.value })}
                placeholder="e.g. Oct - Mar"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Rating (0 - 5)</label>
              <input
                className="aurora-input"
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                placeholder="4.5"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Description</label>
              <textarea
                className="aurora-input"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Destination details..."
              />
            </div>
          </div>

          <div style={styles.modalActions}>
            <button type="button" className="btn-ghost" onClick={() => setShowAdminModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-aurora">
              {editingDest ? "Save Changes" : "Create Destination"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (user) {
    return (
      <div className="tn-user-layout-container">
        <Sidebar />
        <main className="tn-user-main">
          {pageContent}
        </main>
        {adminModal}
      </div>
    );
  }

  return (
    <PublicLayout>
      <div style={styles.contentWrapper}>
        {pageContent}
      </div>
      {adminModal}
    </PublicLayout>
  );
};

const styles = {
  contentWrapper: { maxWidth: "1280px", margin: "0 auto", padding: "32px 24px", width: "100%", boxSizing: "border-box" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" },
  title: { fontSize: "28px", fontWeight: "700", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif" },
  subtitle: { color: "#94a3b8", fontSize: "14px", marginTop: "4px" },
  adminAddBtn: { fontSize: "13px", padding: "10px 18px" },
  searchRow: { display: "flex", gap: "12px", alignItems: "center", marginBottom: "20px", flexWrap: "wrap" },
  searchInput: { flex: 1, minWidth: "240px", maxWidth: "380px" },
  sortWrapper: { display: "flex", alignItems: "center", gap: "8px" },
  sortLabel: { color: "#94a3b8", fontSize: "13px", fontWeight: "600" },
  sortSelect: { padding: "8px 12px", background: "rgba(15, 23, 42, 0.8)", color: "#f1f5f9", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", cursor: "pointer", fontSize: "13px" },
  filterSection: { marginBottom: "24px" },
  filterLabel: { color: "#94a3b8", fontSize: "13px", fontWeight: "600", marginRight: "12px" },
  filterButtons: { display: "flex", flexWrap: "wrap", gap: "8px" },
  filterButton: { fontSize: "13px", padding: "6px 14px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "24px" },
  card: { overflow: "hidden", display: "flex", flexDirection: "column", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.08)", transition: "transform 0.2s ease" },
  imageContainer: { position: "relative", width: "100%", height: "190px", overflow: "hidden" },
  cardImage: { width: "100%", height: "100%", objectFit: "cover" },
  cardImagePlaceholder: { width: "100%", height: "100%", background: "linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(6,182,212,0.15) 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" },
  cardCategoryBadge: { position: "absolute", top: "12px", left: "12px", background: "rgba(15, 23, 42, 0.85)", backdropFilter: "blur(6px)", color: "#38bdf8", fontSize: "11px", fontWeight: "600", padding: "4px 10px", borderRadius: "20px", border: "1px solid rgba(56, 189, 248, 0.2)" },
  cardRatingBadge: { position: "absolute", top: "12px", right: "52px", background: "rgba(15, 23, 42, 0.85)", backdropFilter: "blur(6px)", color: "#fcd34d", fontSize: "11px", fontWeight: "600", padding: "4px 10px", borderRadius: "20px", border: "1px solid rgba(252, 211, 77, 0.2)" },
  favoriteBtn: { position: "absolute", top: "10px", right: "10px", width: "34px", height: "34px", borderRadius: "50%", background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: "1px solid rgba(255, 255, 255, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 5, padding: 0, outline: "none" },
  favoriteBtnActive: { background: "rgba(239, 68, 68, 0.22)", borderColor: "rgba(239, 68, 68, 0.6)" },
  cardContent: { padding: "18px", flex: 1, display: "flex", flexDirection: "column" },
  destName: { fontSize: "18px", fontWeight: "700", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "4px" },
  destLocation: { color: "#94a3b8", fontSize: "13px", marginBottom: "10px" },
  destDesc: { color: "#cbd5e1", fontSize: "13px", lineHeight: "1.5", marginBottom: "14px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" },
  destMetaRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" },
  budgetValue: { color: "#38bdf8", fontSize: "14px", fontWeight: "600" },
  seasonTag: { color: "#a78bfa", fontSize: "11px", background: "rgba(124,58,237,0.12)", padding: "3px 8px", borderRadius: "6px" },
  cardActions: { display: "flex", gap: "8px", marginTop: "auto" },
  exploreButton: { flex: 1, fontSize: "13px", padding: "8px" },
  planTripButton: { flex: 1, fontSize: "13px", padding: "8px" },
  adminActionRow: { display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px", paddingTop: "8px", borderTop: "1px dashed rgba(255,255,255,0.1)" },
  emptyState: { padding: "48px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" },
  errorState: { padding: "48px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" },
  skeletonImage: { width: "100%", height: "190px", background: "rgba(255,255,255,0.05)", borderRadius: "12px", marginBottom: "16px" },
  skeletonTitle: { width: "70%", height: "20px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", marginBottom: "8px" },
  skeletonText: { width: "90%", height: "14px", background: "rgba(255,255,255,0.03)", borderRadius: "4px", marginBottom: "8px" },
  skeletonButton: { width: "100%", height: "40px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", marginTop: "16px" },
  modalBackdrop: { position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" },
  modalContent: { width: "100%", maxWidth: "700px", maxHeight: "90vh", overflowY: "auto", padding: "24px", borderRadius: "16px" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  formErrorBanner: { padding: "10px 14px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", color: "#fca5a5", fontSize: "13px", marginBottom: "16px" },
  adminForm: { display: "flex", flexDirection: "column", gap: "16px" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" },
  formGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  formLabel: { color: "#94a3b8", fontSize: "12px", fontWeight: "600" },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" },
};

export default Destinations;