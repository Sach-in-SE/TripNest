import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import { getDestinationCoverImage, INDIAN_LANDSCAPE_PRESETS, DEFAULT_INDIAN_COVER } from "../utils/tripCoverImage";

const TripForm = ({ isEdit = false, initialData = null, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    destination: "",
    startDate: "",
    endDate: "",
    numberOfTravelers: 1,
    budget: "",
    status: "PLANNING",
    coverImageUrl: "",
  });
  const [prefilledDestination, setPrefilledDestination] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        destination: initialData.destination || "",
        startDate: initialData.startDate || "",
        endDate: initialData.endDate || "",
        numberOfTravelers: initialData.numberOfTravelers || 1,
        budget: initialData.budget || "",
        status: initialData.status || "PLANNING",
        coverImageUrl: initialData.coverImageUrl || "",
      });
    }
  }, [initialData]);

  useEffect(() => {
    if (location.state?.destination && !isEdit) {
      const dest = location.state.destination;
      setPrefilledDestination(dest);
      setFormData(prev => ({
        ...prev,
        destination: dest.name || dest,
        budget: dest.estimatedBudget || "",
        coverImageUrl: prev.coverImageUrl || dest.imageUrl || "",
      }));
    }
  }, [location.state, isEdit]);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPEG, PNG, WebP, SVG).");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Image size exceeds 2MB limit. Please choose an image smaller than 2MB.");
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({ ...prev, coverImageUrl: reader.result }));
    };
    reader.onerror = () => {
      setError("Failed to read image file. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (presetUrl) => {
    setError(null);
    setFormData(prev => ({ ...prev, coverImageUrl: presetUrl }));
  };

  const handleClearImage = () => {
    setFormData(prev => ({ ...prev, coverImageUrl: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      if (isEdit && initialData?.id) {
        await api.put(`/trips/${initialData.id}`, formData);
      } else {
        await api.post("/trips", formData);
      }
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/trips");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save trip. Please try again.");
      console.error(err);
    }
  };

  const handleCancel = () => {
    navigate("/trips");
  };

  // Live preview image resolution
  const resolvedCoverImage = getDestinationCoverImage(formData.destination, formData.coverImageUrl);
  const hasCustomCover = Boolean(formData.coverImageUrl && formData.coverImageUrl.trim().length > 0);

  return (
    <div style={styles.container}>
      <div style={styles.formCard} className="glass-card">
        <h2 style={styles.formTitle}>{isEdit ? "Edit Trip" : "Plan New Trip"}</h2>
        
        {error && (
          <div style={styles.errorBanner}>
            <span style={styles.errorIcon}>⚠️</span>
            <span style={styles.errorText}>{error}</span>
          </div>
        )}

        <div style={styles.formGrid}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Trip Title</label>
            <input 
              className="aurora-input" 
              placeholder="e.g. Goa Adventure, Kashmir Odyssey"
              value={formData.title} 
              onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Destination</label>
            {prefilledDestination ? (
              <input
                className="aurora-input"
                value={formData.destination}
                readOnly
                style={{ cursor: "not-allowed", opacity: 0.85 }}
              />
            ) : (
              <input
                className="aurora-input"
                placeholder="Enter destination (e.g. Srinagar, Goa, Jaipur)"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              />
            )}
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Start Date</label>
            <input 
              className="aurora-input" 
              type="date" 
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} 
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>End Date</label>
            <input 
              className="aurora-input" 
              type="date" 
              value={formData.endDate}
              min={formData.startDate || ""}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} 
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Travelers</label>
            <input 
              className="aurora-input" 
              type="number" 
              min="1" 
              value={formData.numberOfTravelers}
              onChange={(e) => setFormData({ ...formData, numberOfTravelers: e.target.value })} 
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Budget (₹ INR)</label>
            <input 
              className="aurora-input" 
              type="number" 
              placeholder="e.g. 45000" 
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })} 
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Trip Status</label>
            <select 
              className="aurora-input" 
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              {["PLANNING", "UPCOMING", "ONGOING", "COMPLETED", "CANCELLED"].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* 🖼️ Custom Cover Image Upload & Indian Landscape Fallback */}
          <div style={{ ...styles.inputGroup, gridColumn: "1 / -1" }}>
            <label style={styles.label}>🖼️ Custom Cover Image (Upload or Indian Landscape Preset)</label>
            
            <div style={styles.coverUploadRow}>
              {/* File upload button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: "none" }}
                id="trip-cover-file-input"
              />
              <label htmlFor="trip-cover-file-input" className="btn-compact" style={styles.uploadBtn}>
                📁 Choose File...
              </label>

              {/* URL input */}
              <input
                className="aurora-input"
                style={{ flex: 1 }}
                placeholder="Or paste direct image URL (https://...)"
                value={formData.coverImageUrl}
                onChange={(e) => setFormData({ ...formData, coverImageUrl: e.target.value })}
              />

              {hasCustomCover && (
                <button
                  type="button"
                  className="btn-compact danger"
                  onClick={handleClearImage}
                  title="Clear custom cover image and use auto-assigned landscape"
                >
                  ✕ Reset to Auto
                </button>
              )}
            </div>

            {/* Quick Presets for Indian Landscapes */}
            <div style={styles.presetsContainer}>
              <span style={styles.presetsLabel}>Popular Indian Landscapes:</span>
              <div style={styles.presetsPills}>
                {INDIAN_LANDSCAPE_PRESETS.slice(0, 6).map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className="btn-compact"
                    style={{
                      fontSize: "11px",
                      padding: "4px 8px",
                      background: formData.coverImageUrl === preset.url ? "var(--tn-brand-primary)" : undefined,
                      color: formData.coverImageUrl === preset.url ? "#ffffff" : undefined,
                    }}
                    onClick={() => handleSelectPreset(preset.url)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Cover Image Preview Box */}
            <div style={styles.previewBox}>
              <img
                src={resolvedCoverImage}
                alt="Trip Cover Preview"
                style={styles.previewImg}
                onError={(e) => { e.target.src = DEFAULT_INDIAN_COVER; }}
              />
              <div style={styles.previewBadge}>
                {hasCustomCover ? "✨ Custom Cover Selected" : "🇮🇳 Auto-Assigned Indian Landscape"}
              </div>
            </div>
          </div>
          
          <div style={{ ...styles.inputGroup, gridColumn: "1 / -1" }}>
            <label style={styles.label}>Description</label>
            <textarea 
              className="aurora-input" 
              placeholder="Trip highlights, notes, and goals..." 
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{ resize: "vertical" }} 
            />
          </div>
        </div>
        
        <div style={styles.formActions}>
          <button className="btn-ghost" onClick={handleCancel}>Cancel</button>
          <button className="btn-aurora" onClick={handleSubmit}>
            {isEdit ? "Update Trip" : "Create Trip"}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    minHeight: "calc(100vh - 64px)",
    padding: "32px",
  },
  formCard: {
    width: "100%",
    maxWidth: "800px",
    padding: "32px",
  },
  formTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "var(--tn-text-primary)",
    fontFamily: "var(--tn-font-display)",
    marginBottom: "24px",
  },
  errorBanner: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    background: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: "8px",
    marginBottom: "20px",
  },
  errorIcon: { fontSize: "18px" },
  errorText: { color: "#fca5a5", fontSize: "14px" },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "20px",
    marginBottom: "24px",
  },
  inputGroup: { display: "flex", flexDirection: "column", gap: "8px" },
  label: {
    color: "var(--tn-text-secondary)",
    fontSize: "13px",
    fontWeight: "600",
  },
  coverUploadRow: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  uploadBtn: {
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    margin: 0,
    whiteSpace: "nowrap",
  },
  presetsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    marginTop: "4px",
  },
  presetsLabel: {
    fontSize: "11px",
    color: "var(--tn-text-muted)",
  },
  presetsPills: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },
  previewBox: {
    position: "relative",
    width: "100%",
    height: "140px",
    borderRadius: "10px",
    overflow: "hidden",
    marginTop: "8px",
    border: "1px solid var(--tn-border-subtle)",
    backgroundColor: "#0d1529",
  },
  previewImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  previewBadge: {
    position: "absolute",
    bottom: "8px",
    right: "8px",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "600",
    background: "rgba(15, 23, 42, 0.8)",
    backdropFilter: "blur(6px)",
    color: "#f8fafc",
    border: "1px solid rgba(255, 255, 255, 0.15)",
  },
  formActions: {
    display: "flex",
    gap: "12px",
    justifyContent: "flex-end",
  },
};

export default TripForm;
