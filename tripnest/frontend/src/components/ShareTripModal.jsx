import { useState, useEffect } from "react";
import api from "../services/api";

const ShareTripModal = ({ tripId, canManageShares = false, onClose }) => {
  const [shares, setShares] = useState([]);
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState("VIEW");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { fetchShares(); }, []);

  const fetchShares = async () => {
    try {
      const res = await api.get(`/trip-shares/trip/${tripId}`);
      setShares(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleShare = async () => {
    if (!email.trim()) return;
    setError("");
    setSubmitting(true);
    try {
      await api.post("/trip-shares/invite", { tripId, email, permission });
      setEmail("");
      setPermission("VIEW");
      fetchShares();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to share trip. Check the email.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (userId) => {
    if (!window.confirm("Remove this person's access?")) return;

    setError("");
    try {
      await api.delete(`/trip-shares/trip/${tripId}/user/${userId}`);
      await fetchShares();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove share access.");
    }
  };

  return (
    <div style={styles.modal}>
      <div style={styles.modalCard} className="glass-card">
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>Share Trip 🤝</h3>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Invite by Email</label>
          <div style={styles.inviteRow}>
            <input
              className="aurora-input"
              placeholder="friend@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ flex: 1 }}
            />
            <select
              className="aurora-input"
              value={permission}
              onChange={(e) => setPermission(e.target.value)}
              style={{ width: "110px" }}
            >
              <option value="VIEW" style={{ background: "#0d1529" }}>View</option>
              <option value="EDIT" style={{ background: "#0d1529" }}>Edit</option>
            </select>
          </div>
          {error && <p style={styles.errorText}>{error}</p>}
          <button className="btn-aurora" onClick={handleShare} disabled={submitting} style={{ marginTop: "10px" }}>
            {submitting ? "Inviting..." : "✉️ Send Invite"}
          </button>
        </div>

        <div style={styles.divider} />

        <h4 style={styles.sectionTitle}>People with access</h4>
        {loading ? (
          <p style={{ color: "#94a3b8", fontSize: "13px" }}>Loading...</p>
        ) : shares.length === 0 ? (
          <p style={{ color: "#64748b", fontSize: "13px" }}>Not shared with anyone yet.</p>
        ) : (
          <div style={styles.shareList}>
            {shares.map((share) => (
              <div key={share.id} style={styles.shareItem}>
                <div style={styles.shareAvatar}>
                  {share.sharedWithUsername?.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={styles.shareName}>{share.sharedWithUsername}</p>
                  <p style={styles.shareEmail}>{share.sharedWithEmail}</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                  <span className="badge badge-upcoming" style={{ fontSize: "11px" }}>
                    {share.permission}
                  </span>
                  <span style={statusBadgeStyle(share.status)}>
                    {share.status === "ACCEPTED" ? "✓ Accepted" : share.status === "DECLINED" ? "✗ Declined" : "⏳ Pending"}
                  </span>
                </div>
                {canManageShares && (
                  <button onClick={() => handleRemove(share.sharedWithUserId)} style={styles.removeBtn}>
                    🗑️
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  modal: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" },
  modalCard: { width: "480px", maxWidth: "90vw", padding: "28px", maxHeight: "80vh", overflowY: "auto" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  modalTitle: { fontSize: "18px", fontWeight: "600", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif" },
  closeBtn: { background: "none", border: "none", color: "#94a3b8", fontSize: "18px", cursor: "pointer" },
  formGroup: { marginBottom: "20px" },
  label: { color: "#94a3b8", fontSize: "13px", fontWeight: "500", marginBottom: "8px", display: "block" },
  inviteRow: { display: "flex", gap: "8px" },
  errorText: { color: "#fca5a5", fontSize: "12px", marginTop: "8px" },
  divider: { height: "1px", background: "rgba(255,255,255,0.1)", margin: "16px 0" },
  sectionTitle: { color: "#f1f5f9", fontSize: "14px", fontWeight: "600", marginBottom: "12px" },
  shareList: { display: "flex", flexDirection: "column", gap: "10px" },
  shareItem: { display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: "10px" },
  shareAvatar: { width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #2563eb, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "600", color: "white", flexShrink: 0 },
  shareName: { color: "#f1f5f9", fontSize: "13px", fontWeight: "500" },
  shareEmail: { color: "#64748b", fontSize: "11px" },
  removeBtn: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5", borderRadius: "6px", cursor: "pointer", padding: "6px 8px", fontSize: "12px" },
};

const statusBadgeStyle = (status) => ({
  fontSize: "10px",
  fontWeight: "600",
  padding: "2px 8px",
  borderRadius: "999px",
  letterSpacing: "0.04em",
  ...(status === "ACCEPTED"
    ? { background: "rgba(16,185,129,0.15)", color: "#6ee7b7", border: "1px solid rgba(16,185,129,0.3)" }
    : status === "DECLINED"
    ? { background: "rgba(239,68,68,0.12)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.3)" }
    : { background: "rgba(245,158,11,0.12)", color: "#fcd34d", border: "1px solid rgba(245,158,11,0.3)" }),
});

export default ShareTripModal;