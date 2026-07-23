import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import api from "../services/api";

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({ firstName: "", lastName: "", phone: "" });
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  // Travel Preferences
  const [preferences, setPreferences] = useState(null);
  const [prefForm, setPrefForm] = useState({ preferredTripTypes: [], preferredBudgetRange: "", preferredTravelStyle: "" });

  // Favorite Destinations
  const [favorites, setFavorites] = useState([]);

  // Travel History
  const [travelHistory, setTravelHistory] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/user/profile");
        setProfile(res.data);
        setFormData({ firstName: res.data.firstName || "", lastName: res.data.lastName || "", phone: res.data.phone || "" });
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    if (activeTab === "preferences") fetchPreferences();
    if (activeTab === "favorites") fetchFavorites();
    if (activeTab === "history") fetchTravelHistory();
  }, [activeTab]);

  const fetchPreferences = async () => {
    try {
      const res = await api.get("/preferences");
      setPreferences(res.data);
      setPrefForm({
        preferredTripTypes: res.data.preferredTripTypes || [],
        preferredBudgetRange: res.data.preferredBudgetRange || "",
        preferredTravelStyle: res.data.preferredTravelStyle || ""
      });
    } catch (err) { console.error(err); }
  };

  const fetchFavorites = async () => {
    try {
      const res = await api.get("/favorites");
      setFavorites(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchTravelHistory = async () => {
    try {
      const res = await api.get("/trips/history");
      setTravelHistory(res.data);
    } catch (err) { console.error(err); }
  };

  const handleSavePreferences = async () => {
    try {
      await api.put("/preferences", prefForm);
      setMessage("Preferences saved successfully!");
      setTimeout(() => setMessage(""), 3000);
      fetchPreferences();
    } catch (err) { console.error(err); }
  };

  const handleRemoveFavorite = async (destinationId) => {
    try {
      await api.delete(`/favorites/${destinationId}`);
      fetchFavorites();
    } catch (err) { console.error(err); }
  };

  const handleTripTypeToggle = (type) => {
    const updated = prefForm.preferredTripTypes.includes(type)
      ? prefForm.preferredTripTypes.filter(t => t !== type)
      : [...prefForm.preferredTripTypes, type];
    setPrefForm({ ...prefForm, preferredTripTypes: updated });
  };

  const handleUpdate = async () => {
    try {
      await api.put("/user/profile", formData);
      setMessage("Profile updated successfully!");
      setEditing(false);
      const res = await api.get("/user/profile");
      setProfile(res.data);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) { console.error(err); }
  };

  if (loading) return <div style={{ display: "flex", minHeight: "100vh" }}><Sidebar /><main style={{ marginLeft: "260px", padding: "32px", color: "#94a3b8" }}>Loading...</main></div>;

  return (
    <div style={styles.container}>
      <Sidebar />
      <main style={styles.main}>
        <h1 style={styles.title}>My Profile 👤</h1>

        {message && (
          <div style={styles.successBox}>✅ {message}</div>
        )}

        {/* Tabs */}
        <div style={styles.tabs}>
          {["profile", "preferences", "favorites", "history"].map((tab) => (
            <button
              key={tab}
              className={activeTab === tab ? "btn-aurora" : "btn-ghost"}
              onClick={() => setActiveTab(tab)}
              style={styles.tabButton}
            >
              {tab === "profile" && "👤 Profile"}
              {tab === "preferences" && "⚙️ Preferences"}
              {tab === "favorites" && "❤️ Favorites"}
              {tab === "history" && "📜 History"}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div style={styles.profileCard} className="glass-card">
          {/* Avatar */}
          <div style={styles.avatarSection}>
            <div style={styles.avatar}>
              {profile?.firstName?.charAt(0) || profile?.username?.charAt(0)}
            </div>
            <div>
              <h2 style={styles.profileName}>{profile?.firstName} {profile?.lastName}</h2>
              <p style={styles.profileUsername}>@{profile?.username}</p>
              <span className={`badge badge-upcoming`} style={{ marginTop: "8px", display: "inline-flex" }}>
                {profile?.roles?.[0]?.replace("ROLE_", "") || "TRAVELER"}
              </span>
            </div>
          </div>

          <div className="divider" />

          {/* Info */}
          {!editing ? (
            <div style={styles.infoGrid}>
              {[
                { label: "First Name", value: profile?.firstName || "Not set", icon: "👤" },
                { label: "Last Name", value: profile?.lastName || "Not set", icon: "👤" },
                { label: "Email", value: profile?.email, icon: "✉️" },
                { label: "Phone", value: profile?.phone || "Not set", icon: "📱" },
                { label: "Username", value: profile?.username, icon: "🔑" },
                { label: "Role", value: profile?.roles?.[0]?.replace("ROLE_", ""), icon: "🎭" },
              ].map((item, i) => (
                <div key={i} style={styles.infoItem}>
                  <p style={styles.infoLabel}>{item.icon} {item.label}</p>
                  <p style={styles.infoValue}>{item.value}</p>
                </div>
              ))}
              <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
                <button className="btn-aurora" onClick={() => setEditing(true)}>Edit Profile</button>
              </div>
            </div>
          ) : (
            <div style={styles.editForm}>
              {[
                { key: "firstName", label: "First Name", placeholder: "Enter first name" },
                { key: "lastName", label: "Last Name", placeholder: "Enter last name" },
                { key: "phone", label: "Phone", placeholder: "Enter phone number" },
              ].map(({ key, label, placeholder }) => (
                <div key={key} style={styles.inputGroup}>
                  <label style={styles.label}>{label}</label>
                  <input className="aurora-input" placeholder={placeholder}
                    value={formData[key]} onChange={(e) => setFormData({ ...formData, [key]: e.target.value })} />
                </div>
              ))}
              <div style={styles.editActions}>
                <button className="btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
                <button className="btn-aurora" onClick={handleUpdate}>Save Changes</button>
              </div>
            </div>
          )}
          </div>
        )}

        {/* Travel Preferences Tab */}
        {activeTab === "preferences" && (
          <div style={styles.sectionCard} className="glass-card">
            <h2 style={styles.sectionTitle}>Travel Preferences ⚙️</h2>
            <div style={styles.prefForm}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Trip Types</label>
                <div style={styles.checkboxGroup}>
                  {["ADVENTURE", "RELAXATION", "CULTURAL", "BUSINESS", "FAMILY", "SOLO"].map((type) => (
                    <label key={type} style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={prefForm.preferredTripTypes.includes(type)}
                        onChange={() => handleTripTypeToggle(type)}
                        style={{ marginRight: "8px" }}
                      />
                      {type}
                    </label>
                  ))}
                </div>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Budget Range</label>
                <select
                  className="aurora-input"
                  value={prefForm.preferredBudgetRange}
                  onChange={(e) => setPrefForm({ ...prefForm, preferredBudgetRange: e.target.value })}
                >
                  <option value="">Select budget range</option>
                  <option value="BUDGET">Budget</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="LUXURY">Luxury</option>
                </select>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Travel Style</label>
                <select
                  className="aurora-input"
                  value={prefForm.preferredTravelStyle}
                  onChange={(e) => setPrefForm({ ...prefForm, preferredTravelStyle: e.target.value })}
                >
                  <option value="">Select travel style</option>
                  <option value="FAST_PACED">Fast-paced</option>
                  <option value="RELAXED">Relaxed</option>
                  <option value="MIXED">Mixed</option>
                </select>
              </div>
              <button className="btn-aurora" onClick={handleSavePreferences}>Save Preferences</button>
            </div>
          </div>
        )}

        {/* Favorite Destinations Tab */}
        {activeTab === "favorites" && (
          <div style={styles.sectionCard} className="glass-card">
            <h2 style={styles.sectionTitle}>Favorite Destinations ❤️</h2>
            {favorites.length === 0 ? (
              <div style={styles.emptyState}>
                <span style={{ fontSize: "48px" }}>❤️</span>
                <h3 style={{ color: "#f1f5f9" }}>No favorites yet</h3>
                <p style={{ color: "#94a3b8" }}>Start adding destinations you love</p>
              </div>
            ) : (
              <div style={styles.favoritesGrid}>
                {favorites.map((fav) => (
                  <div key={fav.id} style={styles.favCard} className="glass-card">
                    <div style={styles.favHeader}>
                      <span style={{ fontSize: "32px" }}>🏖️</span>
                      <button className="btn-ghost" onClick={() => handleRemoveFavorite(fav.destinationId)} style={{ padding: "4px 8px", fontSize: "12px" }}>Remove</button>
                    </div>
                    <h3 style={styles.favName}>{fav.destinationName}</h3>
                    <p style={styles.favLocation}>📍 {fav.city}, {fav.country}</p>
                    {fav.description && <p style={styles.favDesc}>{fav.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Travel History Tab */}
        {activeTab === "history" && (
          <div style={styles.sectionCard} className="glass-card">
            <h2 style={styles.sectionTitle}>Travel History 📜</h2>
            {travelHistory ? (
              <>
                <div style={styles.statsGrid}>
                  <div style={styles.statCard} className="glass-card">
                    <span style={styles.statValue} className="gradient-text">{travelHistory.totalCompletedTrips}</span>
                    <span style={styles.statLabel}>Completed Trips</span>
                  </div>
                  <div style={styles.statCard} className="glass-card">
                    <span style={styles.statValue} className="gradient-text">₹{travelHistory.totalAmountSpent?.toLocaleString() || 0}</span>
                    <span style={styles.statLabel}>Total Spent</span>
                  </div>
                  <div style={styles.statCard} className="glass-card">
                    <span style={styles.statValue} className="gradient-text">{travelHistory.destinationsVisited?.length || 0}</span>
                    <span style={styles.statLabel}>Destinations</span>
                  </div>
                </div>
                <h3 style={styles.subsectionTitle}>Past Trips</h3>
                {travelHistory.completedTrips?.length === 0 ? (
                  <div style={styles.emptyState}>
                    <span style={{ fontSize: "48px" }}>📜</span>
                    <h3 style={{ color: "#f1f5f9" }}>No completed trips yet</h3>
                    <p style={{ color: "#94a3b8" }}>Your travel history will appear here</p>
                  </div>
                ) : (
                  <div style={styles.historyList}>
                    {travelHistory.completedTrips.map((trip) => (
                      <div key={trip.id} style={styles.historyItem} className="glass-card">
                        <div style={styles.historyHeader}>
                          <h4 style={styles.historyTitle}>{trip.title}</h4>
                          <span className="badge badge-upcoming">{trip.status}</span>
                        </div>
                        <p style={styles.historyDest}>📍 {trip.destination}</p>
                        <p style={styles.historyDates}>📅 {trip.startDate} - {trip.endDate}</p>
                        {trip.budget && <p style={styles.historyBudget}>💰 ₹{trip.budget.toLocaleString()}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p style={{ color: "#94a3b8" }}>Loading travel history...</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

const styles = {
  container: { display: "flex", minHeight: "100vh", background: "#0a0f1e" },
  main: { marginLeft: "260px", flex: 1, padding: "32px" },
  title: { fontSize: "28px", fontWeight: "700", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "24px" },
  successBox: { background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "8px", padding: "12px 16px", color: "#6ee7b7", fontSize: "14px", marginBottom: "20px" },
  profileCard: { padding: "32px" },
  avatarSection: { display: "flex", alignItems: "center", gap: "24px", marginBottom: "24px" },
  avatar: { width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, #7c3aed, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", fontWeight: "700", color: "white", textTransform: "uppercase", flexShrink: 0 },
  profileName: { fontSize: "22px", fontWeight: "700", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif" },
  profileUsername: { color: "#7c3aed", fontSize: "14px", marginTop: "4px" },
  infoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },
  infoItem: { padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)" },
  infoLabel: { color: "#64748b", fontSize: "12px", marginBottom: "6px" },
  infoValue: { color: "#f1f5f9", fontSize: "15px", fontWeight: "500" },
  editForm: { display: "flex", flexDirection: "column", gap: "16px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { color: "#94a3b8", fontSize: "13px", fontWeight: "500" },
  editActions: { display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "8px" },
  tabs: { display: "flex", gap: "8px", marginBottom: "24px" },
  tabButton: { padding: "8px 16px", fontSize: "14px" },
  sectionCard: { padding: "32px" },
  sectionTitle: { fontSize: "22px", fontWeight: "700", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "20px" },
  prefForm: { display: "flex", flexDirection: "column", gap: "16px" },
  checkboxGroup: { display: "flex", flexWrap: "wrap", gap: "12px" },
  checkboxLabel: { display: "flex", alignItems: "center", color: "#94a3b8", fontSize: "14px", cursor: "pointer" },
  emptyState: { padding: "48px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" },
  favoritesGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" },
  favCard: { padding: "20px" },
  favHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" },
  favName: { fontSize: "18px", fontWeight: "600", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "4px" },
  favLocation: { color: "#94a3b8", fontSize: "13px", marginBottom: "10px" },
  favDesc: { color: "#64748b", fontSize: "12px", lineHeight: "1.6" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" },
  statCard: { padding: "24px", textAlign: "center" },
  statValue: { fontSize: "32px", fontWeight: "700", fontFamily: "'Space Grotesk', sans-serif" },
  statLabel: { color: "#94a3b8", fontSize: "14px", marginTop: "8px" },
  subsectionTitle: { fontSize: "18px", fontWeight: "600", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "16px" },
  historyList: { display: "flex", flexDirection: "column", gap: "12px" },
  historyItem: { padding: "16px" },
  historyHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" },
  historyTitle: { fontSize: "16px", fontWeight: "600", color: "#f1f5f9" },
  historyDest: { color: "#94a3b8", fontSize: "13px", marginBottom: "4px" },
  historyDates: { color: "#94a3b8", fontSize: "13px", marginBottom: "4px" },
  historyBudget: { color: "#a78bfa", fontSize: "13px" },
};

export default Profile;