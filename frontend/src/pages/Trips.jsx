import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../services/api";

const Trips = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "", description: "", destination: "",
    startDate: "", endDate: "", numberOfTravelers: 1,
    budget: "", status: "PLANNING",
  });
  const [editId, setEditId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { fetchTrips(); }, []);

  const fetchTrips = async () => {
    try {
      const res = await api.get("/trips");
      setTrips(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editId) {
        await api.put(`/trips/${editId}`, formData);
      } else {
        await api.post("/trips", formData);
      }
      setShowForm(false);
      setEditId(null);
      resetForm();
      fetchTrips();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (trip) => {
    setFormData({
      title: trip.title, description: trip.description || "",
      destination: trip.destination, startDate: trip.startDate || "",
      endDate: trip.endDate || "", numberOfTravelers: trip.numberOfTravelers || 1,
      budget: trip.budget || "", status: trip.status,
    });
    setEditId(trip.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this trip?")) {
      await api.delete(`/trips/${id}`);
      fetchTrips();
    }
  };

  const resetForm = () => {
    setFormData({
      title: "", description: "", destination: "",
      startDate: "", endDate: "", numberOfTravelers: 1,
      budget: "", status: "PLANNING",
    });
  };

  return (
    <div style={styles.container}>
      <Sidebar />
      <main style={styles.main}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>My Trips ✈️</h1>
            <p style={styles.subtitle}>{trips.length} trips planned</p>
          </div>
          <button className="btn-aurora" onClick={() => { resetForm(); setEditId(null); setShowForm(true); }}>
            + New Trip
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div style={styles.modal}>
            <div style={styles.modalCard} className="glass-card">
              <h2 style={styles.modalTitle}>{editId ? "Edit Trip" : "Plan New Trip"}</h2>
              <div style={styles.formGrid}>
                {[
                  { key: "title", label: "Trip Title", placeholder: "e.g. Goa Adventure" },
                  { key: "destination", label: "Destination", placeholder: "e.g. Goa, India" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key} style={styles.inputGroup}>
                    <label style={styles.label}>{label}</label>
                    <input className="aurora-input" placeholder={placeholder}
                      value={formData[key]} onChange={(e) => setFormData({ ...formData, [key]: e.target.value })} />
                  </div>
                ))}
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Start Date</label>
                  <input className="aurora-input" type="date" value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>End Date</label>
                  <input className="aurora-input" type="date" value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Travelers</label>
                  <input className="aurora-input" type="number" min="1" value={formData.numberOfTravelers}
                    onChange={(e) => setFormData({ ...formData, numberOfTravelers: e.target.value })} />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Budget (₹)</label>
                  <input className="aurora-input" type="number" placeholder="e.g. 25000" value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })} />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Status</label>
                  <select className="aurora-input" value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                    {["PLANNING", "UPCOMING", "ONGOING", "COMPLETED", "CANCELLED"].map(s => (
                      <option key={s} value={s} style={{ background: "#0d1529" }}>{s}</option>
                    ))}
                  </select>
                </div>
                <div style={{ ...styles.inputGroup, gridColumn: "1 / -1" }}>
                  <label style={styles.label}>Description</label>
                  <textarea className="aurora-input" placeholder="Trip description..." rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    style={{ resize: "vertical" }} />
                </div>
              </div>
              <div style={styles.modalActions}>
                <button className="btn-ghost" onClick={() => { setShowForm(false); setEditId(null); }}>Cancel</button>
                <button className="btn-aurora" onClick={handleSubmit}>{editId ? "Update Trip" : "Create Trip"}</button>
              </div>
            </div>
          </div>
        )}

        {/* Trips Grid */}
        {loading ? (
          <p style={{ color: "#94a3b8" }}>Loading trips...</p>
        ) : trips.length === 0 ? (
          <div style={styles.emptyState} className="glass-card">
            <span style={{ fontSize: "48px" }}>✈️</span>
            <h3 style={{ color: "#f1f5f9" }}>No trips yet!</h3>
            <p style={{ color: "#94a3b8" }}>Start planning your first adventure</p>
            <button className="btn-aurora" onClick={() => setShowForm(true)} style={{ marginTop: "16px" }}>
              Plan a Trip
            </button>
          </div>
        ) : (
          <div style={styles.tripsGrid}>
            {trips.map((trip) => (
              <div key={trip.id} style={styles.tripCard} className="glass-card">
                <div style={styles.tripCardHeader}>
                  <span style={{ fontSize: "28px" }}>🌍</span>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {trip.permission && trip.permission !== "OWNER" && (
                      <span className="badge" style={{ background: "rgba(167, 139, 250, 0.15)", color: "#a78bfa" }}>
                        🤝 Shared ({trip.permission})
                      </span>
                    )}
                    <span className={`badge badge-${trip.status.toLowerCase()}`}>{trip.status}</span>
                  </div>
                </div>
                <h3 style={styles.tripTitle}>{trip.title}</h3>
                <p style={styles.tripDest}>📍 {trip.destination}</p>
                {trip.description && <p style={styles.tripDesc}>{trip.description}</p>}
                <div style={styles.tripMeta}>
                  {trip.startDate && <span style={styles.metaItem}>📅 {trip.startDate}</span>}
                  <span style={styles.metaItem}>👥 {trip.numberOfTravelers}</span>
                  {trip.budget && <span style={styles.metaItem}>💰 ₹{trip.budget.toLocaleString()}</span>}
                </div>
                <div style={styles.tripActions}>
                  <button className="btn-ghost" onClick={() => navigate(`/trips/${trip.id}`)}
                    style={{ flex: 1, fontSize: "13px", padding: "8px" }}>
                    View
                  </button>
                  {(!trip.permission || trip.permission === "OWNER" || trip.permission === "EDIT") && (
                    <button className="btn-ghost" onClick={() => handleEdit(trip)}
                      style={{ flex: 1, fontSize: "13px", padding: "8px" }}>
                      Edit
                    </button>
                  )}
                  {(!trip.permission || trip.permission === "OWNER") && (
                    <button onClick={() => handleDelete(trip.id)}
                      style={{ ...styles.deleteBtn, flex: 1 }}>
                      Delete
                    </button>
                  )}
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
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" },
  title: { fontSize: "28px", fontWeight: "700", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif" },
  subtitle: { color: "#94a3b8", fontSize: "14px", marginTop: "4px" },
  modal: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" },
  modalCard: { width: "600px", maxWidth: "90vw", padding: "32px", maxHeight: "90vh", overflowY: "auto" },
  modalTitle: { fontSize: "22px", fontWeight: "700", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "24px" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { color: "#94a3b8", fontSize: "13px", fontWeight: "500" },
  modalActions: { display: "flex", gap: "12px", justifyContent: "flex-end" },
  tripsGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" },
  tripCard: { padding: "20px" },
  tripCardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" },
  tripTitle: { fontSize: "16px", fontWeight: "600", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "6px" },
  tripDest: { color: "#94a3b8", fontSize: "13px", marginBottom: "8px" },
  tripDesc: { color: "#64748b", fontSize: "12px", marginBottom: "12px", lineHeight: "1.5" },
  tripMeta: { display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" },
  metaItem: { color: "#64748b", fontSize: "12px", background: "rgba(255,255,255,0.05)", padding: "4px 8px", borderRadius: "6px" },
  tripActions: { display: "flex", gap: "8px" },
  deleteBtn: {
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.3)",
    color: "#fca5a5",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    padding: "8px",
    transition: "all 0.2s",
  },
  emptyState: { padding: "48px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" },
};

export default Trips;