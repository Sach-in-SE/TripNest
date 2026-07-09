import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import api from "../services/api";

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({ firstName: "", lastName: "", phone: "" });
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

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
};

export default Profile;