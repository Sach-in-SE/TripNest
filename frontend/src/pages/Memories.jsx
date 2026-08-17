import { useState, useEffect, useCallback, useMemo } from "react";
import Sidebar from "../components/Sidebar";
import api from "../services/api";
import "./Memories.css";

// In-memory cache for memory photo Object URLs
// Key: canonical endpoint string (e.g. /memories/photo/memory_uuid.jpg)
// Value: { status: 'loaded' | 'loading' | 'error', objectUrl?: string, error?: any, promise?: Promise<string> }
const memoryBlobCache = new Map();

/**
 * Fetch a memory photo blob via Axios with the Authorization header and return an object URL.
 */
const fetchMemoryPhotoBlobUrl = async (rawUrl, storedFileName) => {
  if (!rawUrl && !storedFileName) return null;

  // If already a local blob URL or inline data URL, return directly
  if (rawUrl && (rawUrl.startsWith("blob:") || rawUrl.startsWith("data:"))) {
    return rawUrl;
  }

  // If external non-API URL (e.g. Unsplash), return directly
  if (rawUrl && (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) && !rawUrl.includes("/api/memories/photo/")) {
    return rawUrl;
  }

  // Derive the relative endpoint for Axios (which has baseURL: http://localhost:8080/api)
  let endpoint = "";
  if (storedFileName) {
    endpoint = `/memories/photo/${encodeURIComponent(storedFileName)}`;
  } else if (rawUrl) {
    if (rawUrl.includes("/api/memories/photo/")) {
      const parts = rawUrl.split("/api/memories/photo/");
      endpoint = `/memories/photo/${parts[1]}`;
    } else if (rawUrl.startsWith("/api/")) {
      endpoint = rawUrl.substring(4);
    } else {
      endpoint = rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`;
    }
  }

  const cacheKey = endpoint;
  if (memoryBlobCache.has(cacheKey)) {
    const entry = memoryBlobCache.get(cacheKey);
    if (entry.status === "loaded") {
      return entry.objectUrl;
    }
    if (entry.status === "error") {
      throw entry.error || new Error("Failed to load photo");
    }
    if (entry.status === "loading" && entry.promise) {
      return await entry.promise;
    }
  }

  const loadPromise = (async () => {
    try {
      const response = await api.get(endpoint, { responseType: "blob" });
      const blob = response.data;
      const objectUrl = URL.createObjectURL(blob);
      memoryBlobCache.set(cacheKey, { status: "loaded", objectUrl });
      return objectUrl;
    } catch (err) {
      memoryBlobCache.set(cacheKey, { status: "error", error: err });
      throw err;
    }
  })();

  memoryBlobCache.set(cacheKey, { status: "loading", promise: loadPromise });
  return await loadPromise;
};

/**
 * Reusable React hook for loading authenticated memory photos
 */
const useMemoryImage = (src, storedFileName) => {
  const getInitialUrl = () => {
    if (src && (src.startsWith("blob:") || src.startsWith("data:"))) {
      return src;
    }
    const cacheKey = storedFileName
      ? `/memories/photo/${encodeURIComponent(storedFileName)}`
      : src?.startsWith("/api/")
      ? src.substring(4)
      : src;
    const cached = cacheKey ? memoryBlobCache.get(cacheKey) : null;
    return cached?.status === "loaded" ? cached.objectUrl : null;
  };

  const [objectUrl, setObjectUrl] = useState(getInitialUrl);
  const [loading, setLoading] = useState(() => !getInitialUrl() && Boolean(src || storedFileName));
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src && !storedFileName) {
      setObjectUrl(null);
      setLoading(false);
      setError(false);
      return;
    }

    if (src && (src.startsWith("blob:") || src.startsWith("data:"))) {
      setObjectUrl(src);
      setLoading(false);
      setError(false);
      return;
    }

    let isMounted = true;

    const cacheKey = storedFileName
      ? `/memories/photo/${encodeURIComponent(storedFileName)}`
      : src?.startsWith("/api/")
      ? src.substring(4)
      : src;
    const cached = cacheKey ? memoryBlobCache.get(cacheKey) : null;

    if (cached?.status === "loaded") {
      setObjectUrl(cached.objectUrl);
      setLoading(false);
      setError(false);
      return;
    }

    setLoading(true);
    setError(false);

    fetchMemoryPhotoBlobUrl(src, storedFileName)
      .then((url) => {
        if (isMounted) {
          setObjectUrl(url);
          setLoading(false);
          setError(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn("Failed to load memory photo:", err);
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [src, storedFileName]);

  return { objectUrl, loading, error };
};

/**
 * Reusable Authenticated Image component for Travel Memories
 */
const MemoryImage = ({
  src,
  storedFileName,
  alt = "Travel memory",
  className = "",
  loading = "lazy",
  fallbackIcon = "📷",
}) => {
  const { objectUrl, loading: imgLoading, error: imgError } = useMemoryImage(src, storedFileName);

  if (imgLoading) {
    return (
      <div className={`tn-memory-img-loading ${className}`} aria-label="Loading image">
        <div className="tn-memory-spinner" />
      </div>
    );
  }

  if (imgError || !objectUrl) {
    return (
      <div className={`tn-memory-img-fallback ${className}`} role="img" aria-label={`Photo unavailable: ${alt}`}>
        <span className="tn-fallback-icon" aria-hidden="true">{fallbackIcon}</span>
        <span className="tn-fallback-text">Photo Unavailable</span>
      </div>
    );
  }

  return (
    <img
      src={objectUrl}
      alt={alt}
      className={className}
      loading={loading}
    />
  );
};

const Memories = () => {
  const [activeTab, setActiveTab] = useState("my"); // "my" | "public"
  const [userMemories, setUserMemories] = useState([]);
  const [publicMemories, setPublicMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("ALL"); // "ALL" | "PRIVATE" | "PUBLIC"

  // User trips & destinations for optional association dropdowns
  const [userTrips, setUserTrips] = useState([]);
  const [destinations, setDestinations] = useState([]);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMemory, setEditingMemory] = useState(null);
  const [previewMemory, setPreviewMemory] = useState(null);
  const [deletingMemory, setDeletingMemory] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    caption: "",
    locationName: "",
    tripId: "",
    destinationId: "",
    visibility: "PRIVATE",
  });
  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch memories based on active tab
  const fetchMemories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === "my") {
        const res = await api.get("/memories");
        setUserMemories(res.data || []);
      } else {
        const res = await api.get("/memories/public");
        setPublicMemories(res.data || []);
      }
    } catch (err) {
      console.error("Failed to load travel memories:", err);
      setError(err.response?.data?.message || "Failed to load travel memories.");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  // Fetch trips and destinations once for upload associations
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [tripsRes, destsRes] = await Promise.all([
          api.get("/trips").catch(() => ({ data: [] })),
          api.get("/destinations").catch(() => ({ data: [] })),
        ]);
        setUserTrips(tripsRes.data || []);
        setDestinations(destsRes.data || []);
      } catch {
        // Non-blocking metadata fetch
      }
    };
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  // Cleanup object URLs for local photo previews
  useEffect(() => {
    return () => {
      if (photoPreviewUrl && photoPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
    };
  }, [photoPreviewUrl]);

  // Cleanup cached blob URLs on unmount of Memories page to prevent memory leaks
  useEffect(() => {
    return () => {
      memoryBlobCache.forEach((entry) => {
        if (entry?.objectUrl && entry.objectUrl.startsWith("blob:")) {
          URL.revokeObjectURL(entry.objectUrl);
        }
      });
      memoryBlobCache.clear();
    };
  }, []);

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (< 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setFormError("Photo exceeds maximum size of 10MB.");
      e.target.value = "";
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setFormError("Only JPEG, PNG, and WEBP image formats are supported.");
      e.target.value = "";
      return;
    }

    // Revoke previous local object URL if replacing
    if (photoPreviewUrl && photoPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreviewUrl);
    }

    setFormError(null);
    setSelectedPhotoFile(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));

    // Reset native input value so selecting the exact same file again reliably fires onChange
    e.target.value = "";
  };

  const handleRemoveSelectedPhoto = () => {
    setSelectedPhotoFile(null);
    if (photoPreviewUrl && photoPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreviewUrl);
    }
    setPhotoPreviewUrl(null);
  };

  const handleOpenAddModal = () => {
    setEditingMemory(null);
    setFormData({
      title: "",
      caption: "",
      locationName: "",
      tripId: "",
      destinationId: "",
      visibility: "PRIVATE",
    });
    setSelectedPhotoFile(null);
    if (photoPreviewUrl && photoPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreviewUrl);
    }
    setPhotoPreviewUrl(null);
    setFormError(null);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (mem) => {
    setEditingMemory(mem);
    setFormData({
      title: mem.title || "",
      caption: mem.caption || "",
      locationName: mem.locationName || "",
      tripId: mem.tripId ? String(mem.tripId) : "",
      destinationId: mem.destinationId ? String(mem.destinationId) : "",
      visibility: mem.visibility || "PRIVATE",
    });
    setSelectedPhotoFile(null);
    if (photoPreviewUrl && photoPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreviewUrl);
    }
    setPhotoPreviewUrl(null);
    setFormError(null);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingMemory(null);
    setSelectedPhotoFile(null);
    if (photoPreviewUrl && photoPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreviewUrl);
    }
    setPhotoPreviewUrl(null);
    setFormError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFormError("Please provide a title for your memory.");
      return;
    }

    if (!editingMemory && !selectedPhotoFile) {
      setFormError("Please select a photo to upload.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      if (editingMemory) {
        // Update existing memory
        const payload = {
          title: formData.title.trim(),
          caption: formData.caption?.trim() || null,
          locationName: formData.locationName?.trim() || null,
          tripId: formData.tripId ? Number(formData.tripId) : null,
          destinationId: formData.destinationId ? Number(formData.destinationId) : null,
          visibility: formData.visibility,
        };
        const res = await api.put(`/memories/${editingMemory.id}`, payload);
        setUserMemories((prev) =>
          prev.map((m) => (m.id === editingMemory.id ? res.data : m))
        );
        if (activeTab === "public") {
          fetchMemories();
        }
      } else {
        // Upload new memory
        const data = new FormData();
        data.append("photo", selectedPhotoFile);
        data.append("title", formData.title.trim());
        if (formData.caption?.trim()) data.append("caption", formData.caption.trim());
        if (formData.locationName?.trim()) data.append("locationName", formData.locationName.trim());
        if (formData.tripId) data.append("tripId", formData.tripId);
        if (formData.destinationId) data.append("destinationId", formData.destinationId);
        data.append("visibility", formData.visibility);

        const res = await api.post("/memories", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        setUserMemories((prev) => [res.data, ...prev]);
      }

      handleCloseModal();
    } catch (err) {
      console.error("Save memory failed:", err);
      setFormError(err.response?.data?.message || "Failed to save travel memory.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingMemory) return;
    setSubmitting(true);
    try {
      await api.delete(`/memories/${deletingMemory.id}`);

      // Clean up cached blob URL for this memory
      const cacheKey = deletingMemory.storedFileName
        ? `/memories/photo/${encodeURIComponent(deletingMemory.storedFileName)}`
        : deletingMemory.imageUrl?.startsWith("/api/")
        ? deletingMemory.imageUrl.substring(4)
        : deletingMemory.imageUrl;
      if (cacheKey && memoryBlobCache.has(cacheKey)) {
        const entry = memoryBlobCache.get(cacheKey);
        if (entry?.objectUrl && entry.objectUrl.startsWith("blob:")) {
          URL.revokeObjectURL(entry.objectUrl);
        }
        memoryBlobCache.delete(cacheKey);
      }

      setUserMemories((prev) => prev.filter((m) => m.id !== deletingMemory.id));
      setPublicMemories((prev) => prev.filter((m) => m.id !== deletingMemory.id));
      setDeletingMemory(null);
    } catch (err) {
      console.error("Delete memory failed:", err);
      alert(err.response?.data?.message || "Failed to delete travel memory.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter current displayed memories
  const displayedMemories = useMemo(() => {
    const source = activeTab === "my" ? userMemories : publicMemories;
    return source.filter((mem) => {
      const matchesSearch =
        searchQuery === "" ||
        mem.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mem.locationName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mem.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mem.tripTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mem.destinationName?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesVisibility =
        activeTab !== "my" ||
        visibilityFilter === "ALL" ||
        mem.visibility === visibilityFilter;

      return matchesSearch && matchesVisibility;
    });
  }, [activeTab, userMemories, publicMemories, searchQuery, visibilityFilter]);

  const formatDate = (isoString) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="tn-user-layout-container">
      <Sidebar />
      <main className="tn-user-main">
        <div className="tn-memories-container">
          {/* Header */}
          <div className="tn-memories-header">
            <div>
              <div className="tn-memories-title-row">
                <h1 className="tn-memories-title">Travel Memories</h1>
                <span className="tn-memories-count-badge">
                  📸 {activeTab === "my" ? userMemories.length : publicMemories.length} {activeTab === "my" ? "Personal" : "Public"}
                </span>
              </div>
              <p className="tn-memories-subtitle">
                Capture, preserve, and share unforgettable moments from your journeys.
              </p>
            </div>

            <button
              type="button"
              className="tn-memories-add-btn"
              onClick={handleOpenAddModal}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Add Memory</span>
            </button>
          </div>

          {/* Navigation Tabs & Filters */}
          <div className="tn-memories-toolbar">
            <div className="tn-memories-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "my"}
                className={`tn-memories-tab ${activeTab === "my" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("my");
                  setSearchQuery("");
                }}
              >
                <span>My Memories</span>
                <span className="tn-memories-tab-badge">{userMemories.length}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "public"}
                className={`tn-memories-tab ${activeTab === "public" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("public");
                  setSearchQuery("");
                }}
              >
                <span>🌐 Community Gallery</span>
              </button>
            </div>

            <div className="tn-memories-filters-row">
              {/* Search */}
              <div className="tn-memories-search-box">
                <svg className="tn-memories-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  className="tn-memories-search-input"
                  placeholder="Search memories, locations, trips..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search travel memories"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="tn-memories-search-clear"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Visibility Filter (Only for My Memories tab) */}
              {activeTab === "my" && (
                <div className="tn-memories-visibility-chips">
                  <button
                    type="button"
                    className={`tn-memories-chip ${visibilityFilter === "ALL" ? "active" : ""}`}
                    onClick={() => setVisibilityFilter("ALL")}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className={`tn-memories-chip ${visibilityFilter === "PRIVATE" ? "active" : ""}`}
                    onClick={() => setVisibilityFilter("PRIVATE")}
                  >
                    🔒 Private
                  </button>
                  <button
                    type="button"
                    className={`tn-memories-chip ${visibilityFilter === "PUBLIC" ? "active" : ""}`}
                    onClick={() => setVisibilityFilter("PUBLIC")}
                  >
                    🌐 Public
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="tn-memories-error-banner" role="alert">
              <span>⚠️ {error}</span>
              <button type="button" onClick={fetchMemories} className="tn-memories-retry-btn">
                Retry
              </button>
            </div>
          )}

          {/* Loading Skeletons */}
          {loading ? (
            <div className="tn-memories-grid">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="tn-memories-skeleton-card">
                  <div className="tn-skeleton-img" />
                  <div className="tn-skeleton-body">
                    <div className="tn-skeleton-title" />
                    <div className="tn-skeleton-text" />
                    <div className="tn-skeleton-meta" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayedMemories.length === 0 ? (
            /* Empty State */
            <div className="tn-memories-empty-box">
              <div className="tn-memories-empty-icon" aria-hidden="true">
                📷
              </div>
              <h2 className="tn-memories-empty-title">
                {searchQuery || visibilityFilter !== "ALL"
                  ? "No memories matching your filters"
                  : activeTab === "my"
                  ? "No travel memories yet"
                  : "No public memories found"}
              </h2>
              <p className="tn-memories-empty-desc">
                {searchQuery || visibilityFilter !== "ALL"
                  ? "Try clearing your search query or selecting a different visibility filter."
                  : activeTab === "my"
                  ? "Preserve your vacation highlights, scenic vistas, and travel moments in your private photo diary."
                  : "Be the first to share a public travel photo with the TripNest community!"}
              </p>
              {activeTab === "my" && !searchQuery && visibilityFilter === "ALL" && (
                <button
                  type="button"
                  className="tn-memories-empty-cta"
                  onClick={handleOpenAddModal}
                >
                  <span>Add Your First Memory</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              )}
            </div>
          ) : (
            /* Memory Grid */
            <div className="tn-memories-grid">
              {displayedMemories.map((mem) => {
                const isOwner = mem.owner || activeTab === "my";

                return (
                  <div key={mem.id} className="tn-memory-card">
                    {/* Image Box */}
                    <div
                      className="tn-memory-img-box"
                      onClick={() => setPreviewMemory(mem)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") setPreviewMemory(mem);
                      }}
                      aria-label={`Preview photo for ${mem.title}`}
                    >
                      <MemoryImage
                        src={mem.imageUrl}
                        storedFileName={mem.storedFileName}
                        alt={mem.title}
                        className="tn-memory-img"
                        loading="lazy"
                      />

                      {/* Visibility Badge */}
                      <span className={`tn-memory-badge-vis ${mem.visibility?.toLowerCase()}`}>
                        {mem.visibility === "PUBLIC" ? "🌐 Public" : "🔒 Private"}
                      </span>

                      {/* Owner Quick Actions */}
                      {isOwner && (
                        <div
                          className="tn-memory-actions-overlay"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="tn-memory-action-icon-btn edit"
                            onClick={() => handleOpenEditModal(mem)}
                            aria-label={`Edit ${mem.title}`}
                            title="Edit memory"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="tn-memory-action-icon-btn delete"
                            onClick={() => setDeletingMemory(mem)}
                            aria-label={`Delete ${mem.title}`}
                            title="Delete memory"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Content Body */}
                    <div className="tn-memory-body">
                      <div className="tn-memory-meta-header">
                        <span className="tn-memory-date">{formatDate(mem.createdAt)}</span>
                        {mem.locationName && (
                          <span className="tn-memory-location">📍 {mem.locationName}</span>
                        )}
                      </div>

                      <h3 className="tn-memory-card-title">{mem.title}</h3>

                      {mem.caption && (
                        <p className="tn-memory-caption">{mem.caption}</p>
                      )}

                      {/* Association Tags */}
                      {(mem.tripTitle || mem.destinationName) && (
                        <div className="tn-memory-tags-row">
                          {mem.tripTitle && (
                            <span className="tn-memory-tag trip">
                              ✈️ {mem.tripTitle}
                            </span>
                          )}
                          {mem.destinationName && (
                            <span className="tn-memory-tag dest">
                              🌍 {mem.destinationName}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Author attribution for community tab */}
                      {activeTab === "public" && (
                        <div className="tn-memory-author-footer">
                          <div className="tn-memory-author-avatar">
                            {mem.userAvatarInitial || "T"}
                          </div>
                          <span className="tn-memory-author-name">
                            {mem.userName || "Traveler"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* =======================================================
              PHOTO PREVIEW / LIGHTBOX MODAL
             ======================================================= */}
          {previewMemory && (
            <div
              className="tn-memories-modal-backdrop"
              onClick={() => setPreviewMemory(null)}
              role="dialog"
              aria-modal="true"
              aria-label="Photo Preview"
            >
              <div
                className="tn-memory-preview-container"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="tn-memory-preview-close"
                  onClick={() => setPreviewMemory(null)}
                  aria-label="Close preview"
                >
                  ✕
                </button>

                <div className="tn-memory-preview-img-wrap">
                  <MemoryImage
                    src={previewMemory.imageUrl}
                    storedFileName={previewMemory.storedFileName}
                    alt={previewMemory.title}
                    className="tn-memory-preview-img"
                  />
                </div>

                <div className="tn-memory-preview-info">
                  <div className="tn-memory-preview-header">
                    <div>
                      <h2 className="tn-memory-preview-title">{previewMemory.title}</h2>
                      <div className="tn-memory-preview-meta">
                        {previewMemory.locationName && (
                          <span>📍 {previewMemory.locationName}</span>
                        )}
                        <span>📅 {formatDate(previewMemory.createdAt)}</span>
                        <span className={`tn-memory-badge-vis ${previewMemory.visibility?.toLowerCase()}`}>
                          {previewMemory.visibility === "PUBLIC" ? "🌐 Public" : "🔒 Private"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {previewMemory.caption && (
                    <p className="tn-memory-preview-caption">{previewMemory.caption}</p>
                  )}

                  {(previewMemory.tripTitle || previewMemory.destinationName) && (
                    <div className="tn-memory-tags-row" style={{ marginTop: "1rem" }}>
                      {previewMemory.tripTitle && (
                        <span className="tn-memory-tag trip">
                          ✈️ Trip: {previewMemory.tripTitle}
                        </span>
                      )}
                      {previewMemory.destinationName && (
                        <span className="tn-memory-tag dest">
                          🌍 Destination: {previewMemory.destinationName}
                        </span>
                      )}
                    </div>
                  )}

                  {activeTab === "public" && (
                    <div className="tn-memory-author-footer" style={{ marginTop: "1.25rem", paddingTop: "0.85rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                      <div className="tn-memory-author-avatar">
                        {previewMemory.userAvatarInitial || "T"}
                      </div>
                      <span className="tn-memory-author-name">
                        Captured by {previewMemory.userName || "Traveler"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* =======================================================
              ADD / EDIT MEMORY MODAL
             ======================================================= */}
          {showAddModal && (
            <div
              className="tn-memories-modal-backdrop"
              onClick={handleCloseModal}
              role="dialog"
              aria-modal="true"
              aria-label={editingMemory ? "Edit Travel Memory" : "Add Travel Memory"}
            >
              <div
                className="tn-memories-modal-card"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="tn-memories-modal-header">
                  <div>
                    <h2 className="tn-memories-modal-title">
                      {editingMemory ? "Edit Travel Memory" : "Add Travel Memory"}
                    </h2>
                    <p className="tn-memories-modal-subtitle">
                      {editingMemory
                        ? "Update details, location, or visibility of this memory."
                        : "Upload a travel photo and save your favorite journey moment."}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="tn-memories-modal-close-btn"
                    onClick={handleCloseModal}
                    aria-label="Close modal"
                  >
                    ✕
                  </button>
                </div>

                {formError && (
                  <div className="tn-memories-form-error" role="alert">
                    <span>⚠️ {formError}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="tn-memories-form">
                  {/* Photo Dropzone / Selector (Only in Create Mode) */}
                  {!editingMemory ? (
                    <div className="tn-memories-upload-zone">
                      {photoPreviewUrl ? (
                        <div className="tn-memories-photo-preview-box">
                          <img
                            src={photoPreviewUrl}
                            alt="Selected upload preview"
                            className="tn-memories-photo-preview-img"
                          />
                          <button
                            type="button"
                            className="tn-memories-remove-photo-btn"
                            onClick={handleRemoveSelectedPhoto}
                            aria-label="Remove selected photo"
                          >
                            ✕ Change Photo
                          </button>
                        </div>
                      ) : (
                        <label className="tn-memories-file-label">
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/jpg"
                            onChange={handlePhotoSelect}
                            className="tn-memories-file-input"
                            required
                          />
                          <div className="tn-memories-upload-content">
                            <div className="tn-memories-upload-icon">📷</div>
                            <span className="tn-memories-upload-text">
                              Click or drag a travel photo here
                            </span>
                            <span className="tn-memories-upload-hint">
                              JPEG, PNG, WEBP up to 10MB
                            </span>
                          </div>
                        </label>
                      )}
                    </div>
                  ) : (
                    <div className="tn-memories-edit-img-preview">
                      <MemoryImage
                        src={editingMemory.imageUrl}
                        storedFileName={editingMemory.storedFileName}
                        alt={editingMemory.title}
                        className="tn-memories-photo-preview-img"
                      />
                    </div>
                  )}

                  {/* Title Field */}
                  <div className="tn-memories-form-group">
                    <label className="tn-memories-label" htmlFor="mem-title">
                      Title *
                    </label>
                    <input
                      id="mem-title"
                      type="text"
                      className="tn-memories-input"
                      placeholder="e.g. Sunset over Baga Beach"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      maxLength={150}
                      required
                    />
                  </div>

                  {/* Caption / Thoughts Field */}
                  <div className="tn-memories-form-group">
                    <label className="tn-memories-label" htmlFor="mem-caption">
                      Caption / Thoughts / Review
                    </label>
                    <textarea
                      id="mem-caption"
                      className="tn-memories-textarea"
                      rows={3}
                      placeholder="Write your story, favorite memory, or recommendation..."
                      value={formData.caption}
                      onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                      maxLength={2000}
                    />
                  </div>

                  {/* Location Field */}
                  <div className="tn-memories-form-group">
                    <label className="tn-memories-label" htmlFor="mem-location">
                      Location
                    </label>
                    <input
                      id="mem-location"
                      type="text"
                      className="tn-memories-input"
                      placeholder="e.g. North Goa, India"
                      value={formData.locationName}
                      onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                      maxLength={200}
                    />
                  </div>

                  {/* Trip & Destination Association Selectors */}
                  <div className="tn-memories-form-grid">
                    <div className="tn-memories-form-group">
                      <label className="tn-memories-label" htmlFor="mem-trip">
                        Associate with Trip (Optional)
                      </label>
                      <select
                        id="mem-trip"
                        className="tn-memories-select"
                        value={formData.tripId}
                        onChange={(e) => setFormData({ ...formData, tripId: e.target.value })}
                      >
                        <option value="">-- No specific trip --</option>
                        {userTrips.map((t) => (
                          <option key={t.id} value={t.id}>
                            ✈️ {t.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="tn-memories-form-group">
                      <label className="tn-memories-label" htmlFor="mem-dest">
                        Associate Destination (Optional)
                      </label>
                      <select
                        id="mem-dest"
                        className="tn-memories-select"
                        value={formData.destinationId}
                        onChange={(e) => setFormData({ ...formData, destinationId: e.target.value })}
                      >
                        <option value="">-- No specific destination --</option>
                        {destinations.map((d) => (
                          <option key={d.id} value={d.id}>
                            🌍 {d.name} ({d.state})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Visibility Radio Options */}
                  <div className="tn-memories-form-group">
                    <label className="tn-memories-label">Visibility</label>
                    <div className="tn-memories-vis-options">
                      <label className={`tn-memories-vis-card ${formData.visibility === "PRIVATE" ? "selected" : ""}`}>
                        <input
                          type="radio"
                          name="visibility"
                          value="PRIVATE"
                          checked={formData.visibility === "PRIVATE"}
                          onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                        />
                        <div className="tn-memories-vis-content">
                          <span className="tn-memories-vis-title">🔒 Private</span>
                          <span className="tn-memories-vis-desc">
                            Only visible to you in your personal gallery.
                          </span>
                        </div>
                      </label>

                      <label className={`tn-memories-vis-card ${formData.visibility === "PUBLIC" ? "selected" : ""}`}>
                        <input
                          type="radio"
                          name="visibility"
                          value="PUBLIC"
                          checked={formData.visibility === "PUBLIC"}
                          onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                        />
                        <div className="tn-memories-vis-content">
                          <span className="tn-memories-vis-title">🌐 Public</span>
                          <span className="tn-memories-vis-desc">
                            Share with the community in the public gallery.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Modal Actions */}
                  <div className="tn-memories-modal-actions">
                    <button
                      type="button"
                      className="tn-memories-cancel-btn"
                      onClick={handleCloseModal}
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="tn-memories-submit-btn"
                      disabled={submitting}
                    >
                      {submitting
                        ? "Saving..."
                        : editingMemory
                        ? "Save Changes"
                        : "Upload Memory"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* =======================================================
              DELETE CONFIRMATION MODAL
             ======================================================= */}
          {deletingMemory && (
            <div
              className="tn-memories-modal-backdrop"
              onClick={() => setDeletingMemory(null)}
              role="dialog"
              aria-modal="true"
              aria-label="Confirm Deletion"
            >
              <div
                className="tn-memories-delete-card"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="tn-memories-delete-icon">🗑️</div>
                <h3 className="tn-memories-delete-title">Delete Travel Memory</h3>
                <p className="tn-memories-delete-desc">
                  Are you sure you want to delete <strong>"{deletingMemory.title}"</strong>?
                  This action will permanently remove the photo and caption from your account.
                </p>
                <div className="tn-memories-modal-actions" style={{ justifyContent: "center" }}>
                  <button
                    type="button"
                    className="tn-memories-cancel-btn"
                    onClick={() => setDeletingMemory(null)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="tn-memories-delete-btn"
                    onClick={handleDelete}
                    disabled={submitting}
                  >
                    {submitting ? "Deleting..." : "Yes, Delete Memory"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Memories;
