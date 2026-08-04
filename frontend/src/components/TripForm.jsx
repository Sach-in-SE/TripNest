import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";

const TripForm = ({ isEdit = false, initialData = null, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: "", description: "", destination: "",
    startDate: "", endDate: "", numberOfTravelers: 1,
    budget: "", status: "PLANNING",
  });
  const [prefilledDestination, setPrefilledDestination] = useState(null);
  const [error, setError] = useState(null);
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
        budget: dest.estimatedBudget || ""
      }));
    }
  }, [location.state, isEdit]);

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
    if (isEdit) {
      navigate("/trips");
    } else {
      navigate("/trips");
    }
  };

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
              placeholder="e.g. Goa Adventure"
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
                style={{ background: "#1a2332", cursor: "not-allowed" }}
              />
            ) : (
              <input
                className="aurora-input"
                placeholder="Enter destination"
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
            <label style={styles.label}>Budget (₹)</label>
            <input 
              className="aurora-input" 
              type="number" 
              placeholder="e.g. 25000" 
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })} 
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Status</label>
            <select 
              className="aurora-input" 
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              {["PLANNING", "UPCOMING", "ONGOING", "COMPLETED", "CANCELLED"].map(s => (
                <option key={s} value={s} style={{ background: "#0d1529" }}>{s}</option>
              ))}
            </select>
          </div>
          
          <div style={{ ...styles.inputGroup, gridColumn: "1 / -1" }}>
            <label style={styles.label}>Description</label>
            <textarea 
              className="aurora-input" 
              placeholder="Trip description..." 
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
    color: "#f1f5f9",
    fontFamily: "'Space Grotesk', sans-serif",
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
    color: "#94a3b8",
    fontSize: "13px",
    fontWeight: "600",
  },
  formActions: {
    display: "flex",
    gap: "12px",
    justifyContent: "flex-end",
  },
};

export default TripForm;
