import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import "./AdminLayout.css";

const CATEGORIES = [
  "Beach",
  "Mountains",
  "Historical",
  "Adventure",
  "Spiritual",
  "Wildlife",
  "City",
];

const INITIAL_FORM_STATE = {
  name: "",
  state: "",
  country: "",
  description: "",
  category: "Beach",
  imageUrl: "",
  bestSeason: "",
  estimatedBudget: "",
  recommendedDays: "",
  latitude: "",
  longitude: "",
  rating: "4.5",
};

function AdminDestinationManagement() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Modals & Form
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [deletingDestination, setDeletingDestination] = useState(null);
  const [viewingDestination, setViewingDestination] = useState(null);

  // Feedback
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchDestinations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let res;
      if (searchTerm.trim()) {
        res = await api.get(`/destinations/search?query=${encodeURIComponent(searchTerm.trim())}`);
      } else if (selectedCategory) {
        res = await api.get(`/destinations/filter?category=${encodeURIComponent(selectedCategory)}`);
      } else {
        res = await api.get("/destinations");
      }
      setDestinations(res.data);
    } catch (err) {
      console.error("Failed to fetch destinations:", err);
      setError(err.response?.data?.message || "Failed to load destinations catalog.");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory]);

  useEffect(() => {
    fetchDestinations();
  }, [fetchDestinations]);

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const showToast = (type, text) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData(INITIAL_FORM_STATE);
    setShowModal(true);
  };

  const openEditModal = (dest) => {
    setEditingId(dest.id);
    setFormData({
      name: dest.name || "",
      state: dest.state || "",
      country: dest.country || "",
      description: dest.description || "",
      category: dest.category || "Beach",
      imageUrl: dest.imageUrl || "",
      bestSeason: dest.bestSeason || "",
      estimatedBudget: dest.estimatedBudget != null ? String(dest.estimatedBudget) : "",
      recommendedDays: dest.recommendedDays != null ? String(dest.recommendedDays) : "",
      latitude: dest.latitude != null ? String(dest.latitude) : "",
      longitude: dest.longitude != null ? String(dest.longitude) : "",
      rating: dest.rating != null ? String(dest.rating) : "4.5",
    });
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Destination Name is required.");
      return;
    }

    setActionLoading(true);
    const payload = {
      name: formData.name.trim(),
      state: formData.state.trim() || null,
      country: formData.country.trim() || null,
      description: formData.description.trim() || null,
      category: formData.category || null,
      imageUrl: formData.imageUrl.trim() || null,
      bestSeason: formData.bestSeason.trim() || null,
      estimatedBudget: formData.estimatedBudget !== "" ? parseFloat(formData.estimatedBudget) : null,
      recommendedDays: formData.recommendedDays !== "" ? parseInt(formData.recommendedDays, 10) : null,
      latitude: formData.latitude !== "" ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude !== "" ? parseFloat(formData.longitude) : null,
      rating: formData.rating !== "" ? parseFloat(formData.rating) : null,
    };

    try {
      if (editingId) {
        await api.put(`/destinations/${editingId}`, payload);
        showToast("success", `Destination "${payload.name}" updated successfully.`);
      } else {
        await api.post("/destinations", payload);
        showToast("success", `New destination "${payload.name}" created successfully.`);
      }
      setShowModal(false);
      fetchDestinations();
    } catch (err) {
      console.error("Failed to save destination:", err);
      showToast("error", err.response?.data?.message || "Failed to save destination.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDestination = async () => {
    if (!deletingDestination) return;

    setActionLoading(true);
    try {
      await api.delete(`/destinations/${deletingDestination.id}`);
      showToast("success", `Destination "${deletingDestination.name}" deleted successfully.`);
      setDeletingDestination(null);
      fetchDestinations();
    } catch (err) {
      console.error("Failed to delete destination:", err);
      showToast("error", err.response?.data?.message || "Failed to delete destination.");
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (val) => {
    if (val == null) return "—";
    return `$${Number(val).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="admin-portal-layout">
      {/* Admin Sidebar Navigation */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-brand">
            <span>🛡️ TripNest</span>
            <span className="admin-brand-tag">ADMIN</span>
          </div>
        </div>

        <nav className="admin-nav">
          <Link to="/admin/dashboard" className="admin-nav-item">
            📊 Overview
          </Link>
          <Link to="/admin/users" className="admin-nav-item">
            👥 User Management
          </Link>
          <Link to="/admin/destinations" className="admin-nav-item active">
            📍 Destinations
          </Link>
          <Link to="/admin/reports" className="admin-nav-item">
            📈 Analytics & Reports
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="admin-main-wrapper">
        {/* Top Header */}
        <header className="admin-topbar">
          <div className="admin-page-title">Destination Catalog Management</div>

          <div className="admin-user-profile">
            <div className="admin-user-info">
              <div className="admin-username">{user?.username || "Admin"}</div>
              <div className="admin-role-badge">System Administrator</div>
            </div>
            <button onClick={handleLogout} className="admin-logout-btn">
              Sign Out
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="admin-content-area">
          <div className="admin-dashboard-header">
            <div>
              <h2>Destination Catalog</h2>
              <p>Manage public travel destinations, categories, imagery, and recommendations</p>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={fetchDestinations} disabled={loading} className="admin-refresh-btn">
                🔄 Refresh Catalog
              </button>
              <button onClick={openCreateModal} className="admin-btn-add">
                ➕ Add Destination
              </button>
            </div>
          </div>

          {/* Toast Notification Banner */}
          {toastMessage && (
            <div className={`admin-toast-banner ${toastMessage.type}`}>
              <span>{toastMessage.text}</span>
              <button
                style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}
                onClick={() => setToastMessage(null)}
              >
                ✕
              </button>
            </div>
          )}

          {/* Search & Filter Bar */}
          <div className="admin-filter-bar">
            <div className="admin-search-wrapper">
              <span className="admin-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search destinations by name, state, country..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="admin-search-input"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="admin-select"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="admin-loading-container">
              <div className="admin-spinner"></div>
              <p style={{ color: "#94a3b8" }}>Loading destination catalog...</p>
            </div>
          ) : error ? (
            <div className="admin-error-container">
              <div className="admin-error-icon">⚠️</div>
              <div className="admin-error-msg">{error}</div>
              <button onClick={fetchDestinations} className="admin-retry-btn">
                Retry Loading
              </button>
            </div>
          ) : destinations.length === 0 ? (
            <div className="admin-loading-container">
              <p style={{ color: "#cbd5e1", fontSize: "1.05rem" }}>
                No destinations found matching your query.
              </p>
            </div>
          ) : (
            <div className="admin-table-card">
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Destination</th>
                      <th>Location</th>
                      <th>Category</th>
                      <th>Est. Budget</th>
                      <th>Rec. Days</th>
                      <th>Rating</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {destinations.map((d) => (
                      <tr key={d.id}>
                        <td>
                          <div className="admin-user-cell">
                            {d.imageUrl ? (
                              <img
                                src={d.imageUrl}
                                alt={d.name}
                                className="admin-dest-img-thumb"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="admin-avatar-placeholder">📍</div>
                            )}
                            <div>
                              <div className="admin-user-name">{d.name}</div>
                              {d.bestSeason && (
                                <div className="admin-user-sub">Best: {d.bestSeason}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          {[d.state, d.country].filter(Boolean).join(", ") || "—"}
                        </td>
                        <td>
                          <span className="admin-badge admin-badge-admin">
                            {d.category || "General"}
                          </span>
                        </td>
                        <td>{formatCurrency(d.estimatedBudget)}</td>
                        <td>{d.recommendedDays ? `${d.recommendedDays} days` : "—"}</td>
                        <td>
                          <span className="admin-badge admin-badge-warning">
                            ⭐ {d.rating != null ? d.rating.toFixed(1) : "N/A"}
                          </span>
                        </td>
                        <td>
                          <div className="admin-action-group">
                            <button
                              onClick={() => setViewingDestination(d)}
                              className="admin-action-btn view"
                              title="View Details"
                            >
                              👁️ Details
                            </button>
                            <button
                              onClick={() => openEditModal(d)}
                              className="admin-action-btn edit"
                              title="Edit Destination"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => setDeletingDestination(d)}
                              className="admin-action-btn delete"
                              title="Delete Destination"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* --- MODAL 1: CREATE / EDIT DESTINATION --- */}
      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: "640px" }}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">
                {editingId ? "✏️ Edit Destination" : "➕ Create Destination"}
              </h3>
              <button onClick={() => setShowModal(false)} className="admin-modal-close">
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmitForm}>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label className="admin-form-label">Destination Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="e.g. Manali, Paris, Goa"
                    className="admin-form-input"
                    required
                  />
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-form-label">State / Province</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleFormChange}
                      placeholder="e.g. Himachal Pradesh"
                      className="admin-form-input"
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleFormChange}
                      placeholder="e.g. India, France"
                      className="admin-form-input"
                    />
                  </div>
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Category</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleFormChange}
                      className="admin-form-select"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Best Season to Visit</label>
                    <input
                      type="text"
                      name="bestSeason"
                      value={formData.bestSeason}
                      onChange={handleFormChange}
                      placeholder="e.g. October to March"
                      className="admin-form-input"
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Image URL</label>
                  <input
                    type="url"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleFormChange}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="admin-form-input"
                  />
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Estimated Budget ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="estimatedBudget"
                      value={formData.estimatedBudget}
                      onChange={handleFormChange}
                      placeholder="e.g. 500"
                      className="admin-form-input"
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Recommended Days</label>
                    <input
                      type="number"
                      name="recommendedDays"
                      value={formData.recommendedDays}
                      onChange={handleFormChange}
                      placeholder="e.g. 5"
                      className="admin-form-input"
                    />
                  </div>
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Rating (0.0 - 5.0)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      name="rating"
                      value={formData.rating}
                      onChange={handleFormChange}
                      placeholder="4.5"
                      className="admin-form-input"
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Coordinates (Lat, Long)</label>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <input
                        type="number"
                        step="any"
                        name="latitude"
                        value={formData.latitude}
                        onChange={handleFormChange}
                        placeholder="Lat"
                        className="admin-form-input"
                      />
                      <input
                        type="number"
                        step="any"
                        name="longitude"
                        value={formData.longitude}
                        onChange={handleFormChange}
                        placeholder="Long"
                        className="admin-form-input"
                      />
                    </div>
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    placeholder="Enter detailed description of the destination..."
                    className="admin-form-textarea"
                  ></textarea>
                </div>
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="admin-btn-secondary"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? "Saving..." : editingId ? "Save Changes" : "Create Destination"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: DELETE CONFIRMATION --- */}
      {deletingDestination && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">🗑️ Confirm Deletion</h3>
              <button onClick={() => setDeletingDestination(null)} className="admin-modal-close">
                ✕
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-warning-box" style={{ background: "rgba(239, 68, 68, 0.1)", borderColor: "rgba(239, 68, 68, 0.3)", color: "#fca5a5" }}>
                ⚠️ <strong>WARNING:</strong> Are you sure you want to permanently delete destination{" "}
                <strong>"{deletingDestination.name}"</strong>? This action cannot be undone.
              </div>
            </div>
            <div className="admin-modal-actions">
              <button
                onClick={() => setDeletingDestination(null)}
                className="admin-btn-secondary"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteDestination}
                className="admin-retry-btn"
                disabled={actionLoading}
              >
                {actionLoading ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3: VIEW DESTINATION DETAILS --- */}
      {viewingDestination && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: "600px" }}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">📍 Destination Details</h3>
              <button onClick={() => setViewingDestination(null)} className="admin-modal-close">
                ✕
              </button>
            </div>
            <div className="admin-modal-body">
              {viewingDestination.imageUrl && (
                <img
                  src={viewingDestination.imageUrl}
                  alt={viewingDestination.name}
                  style={{
                    width: "100%",
                    height: "180px",
                    objectFit: "cover",
                    borderRadius: "10px",
                    marginBottom: "1.25rem",
                  }}
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              )}

              <div className="admin-detail-grid">
                <div className="admin-detail-item">
                  <div className="admin-detail-label">Destination ID</div>
                  <div className="admin-detail-val">#{viewingDestination.id}</div>
                </div>
                <div className="admin-detail-item">
                  <div className="admin-detail-label">Name</div>
                  <div className="admin-detail-val">{viewingDestination.name}</div>
                </div>
                <div className="admin-detail-item">
                  <div className="admin-detail-label">Location</div>
                  <div className="admin-detail-val">
                    {[viewingDestination.state, viewingDestination.country].filter(Boolean).join(", ") || "—"}
                  </div>
                </div>
                <div className="admin-detail-item">
                  <div className="admin-detail-label">Category</div>
                  <div className="admin-detail-val">{viewingDestination.category || "General"}</div>
                </div>
                <div className="admin-detail-item">
                  <div className="admin-detail-label">Estimated Budget</div>
                  <div className="admin-detail-val">{formatCurrency(viewingDestination.estimatedBudget)}</div>
                </div>
                <div className="admin-detail-item">
                  <div className="admin-detail-label">Recommended Stay</div>
                  <div className="admin-detail-val">
                    {viewingDestination.recommendedDays ? `${viewingDestination.recommendedDays} Days` : "—"}
                  </div>
                </div>
                <div className="admin-detail-item">
                  <div className="admin-detail-label">Best Season</div>
                  <div className="admin-detail-val">{viewingDestination.bestSeason || "—"}</div>
                </div>
                <div className="admin-detail-item">
                  <div className="admin-detail-label">Rating</div>
                  <div className="admin-detail-val">⭐ {viewingDestination.rating ?? "N/A"}</div>
                </div>
              </div>

              {viewingDestination.description && (
                <div className="admin-detail-item" style={{ marginTop: "1rem" }}>
                  <div className="admin-detail-label">Description</div>
                  <div className="admin-detail-val" style={{ fontWeight: "normal", lineHeight: "1.5" }}>
                    {viewingDestination.description}
                  </div>
                </div>
              )}
            </div>
            <div className="admin-modal-actions">
              <button onClick={() => setViewingDestination(null)} className="admin-btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDestinationManagement;
