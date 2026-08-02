import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../services/api";

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: "", description: "", tripId: "",
  });
  const navigate = useNavigate();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setError(null);
      const [groupsRes, tripsRes] = await Promise.all([
        api.get("/groups"),
        api.get("/trips"),
      ]);
      setGroups(groupsRes.data);
      setTrips(tripsRes.data);
      const invitationsRes = await api.get("/groups/invitations");
      setInvitations(invitationsRes.data);
      if (tripsRes.data.length > 0) {
        setFormData(prev => ({ ...prev, tripId: tripsRes.data[0].id }));
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load data");
      console.error(err);
    }
    finally { setLoading(false); }
  };

  const handleInvitationResponse = async (invitationId, action, groupId) => {
    try {
      setError(null);
      await api.post(`/groups/invitations/${invitationId}/respond`, { action });
      if (action === "ACCEPT" && groupId) {
        navigate(`/groups/${groupId}`);
      } else {
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to respond to invitation");
      console.error(err);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || formData.name.trim() === "") {
      setError("Group name is required");
      return;
    }
    try {
      setError(null);
      await api.post("/groups", { ...formData, tripId: parseInt(formData.tripId), memberIds: [] });
      setShowForm(false);
      setFormData({ name: "", description: "", tripId: trips[0]?.id || "" });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create group");
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this group?")) {
      try {
        setError(null);
        await api.delete(`/groups/${id}`);
        fetchData();
      } catch (err) {
        setError(err.response?.data?.message || "Failed to delete group");
        console.error(err);
      }
    }
  };

  return (
    <div style={styles.container}>
      <Sidebar />
      <main style={styles.main}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Group Collaboration 👥</h1>
            <p style={styles.subtitle}>{groups.length} travel groups</p>
          </div>
          <button className="btn-aurora" onClick={() => setShowForm(true)}>
            + Create Group
          </button>
        </div>

        {error && (
          <div style={styles.errorBanner}>
            <p>{error}</p>
            <button onClick={() => setError(null)} style={styles.closeError}>×</button>
          </div>
        )}

        {showForm && (
          <div style={styles.modal}>
            <div style={styles.modalCard} className="glass-card">
              <h3 style={styles.modalTitle}>Create Travel Group</h3>
              <div style={styles.formGroup}>
                <label style={styles.label}>Group Name</label>
                <input className="aurora-input" placeholder="e.g. Goa Gang"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <input className="aurora-input" placeholder="Group description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Trip</label>
                <select className="aurora-input" value={formData.tripId}
                  onChange={(e) => setFormData({ ...formData, tripId: e.target.value })}>
                  {trips.map(trip => (
                    <option key={trip.id} value={trip.id} style={{ background: "#0d1529" }}>
                      {trip.title}
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.modalActions}>
                <button className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn-aurora" onClick={handleSubmit}>Create Group</button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <p style={{ color: "#94a3b8" }}>Loading groups...</p>
        ) : groups.length === 0 ? (
          <div style={styles.emptyState} className="glass-card">
            <span style={{ fontSize: "48px" }}>👥</span>
            <h3 style={{ color: "#f1f5f9" }}>No groups yet!</h3>
            <p style={{ color: "#94a3b8" }}>Create a group to collaborate with fellow travelers</p>
            <button className="btn-aurora" onClick={() => setShowForm(true)} style={{ marginTop: "16px" }}>
              Create Group
            </button>
          </div>
        ) : (
          <div style={styles.grid}>
            {groups.map((group) => (
              <div key={group.id} style={styles.card} className="glass-card">
                <div style={styles.cardHeader}>
                  <div style={styles.groupAvatar}>
                    {group.name?.charAt(0).toUpperCase()}
                  </div>
                  <div style={styles.cardHeaderRight}>
                    <span style={styles.memberCount}>
                      👥 {group.memberCount}
                    </span>
                    {group.currentUserRole === "OWNER" && (
                      <span style={styles.ownerBadge}>👑 Owner</span>
                    )}
                    {group.currentUserRole && group.currentUserRole !== "OWNER" && (
                      <span style={styles.memberBadge}>{group.currentUserRole}</span>
                    )}
                  </div>
                </div>
                <h3 style={styles.groupName}>{group.name}</h3>
                {group.description && (
                  <p style={styles.groupDesc}>{group.description}</p>
                )}
                <div style={styles.groupMeta}>
                  <span style={styles.metaItem}>✈️ {group.tripTitle}</span>
                  <span style={styles.metaItem}>👤 {group.createdByUsername}</span>
                </div>
                <div style={styles.cardActions}>
                  <button className="btn-compact" onClick={() => navigate(`/groups/${group.id}`)}>
                    👁 View
                  </button>
                  {group.currentUserRole === "OWNER" && (
                    <>
                      <button className="btn-compact" onClick={() => navigate(`/groups/${group.id}`)}>
                        ✏️ Edit
                      </button>
                      <button className="btn-compact danger" onClick={() => handleDelete(group.id)}>
                        🗑️ Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && invitations.length > 0 && (
          <div style={{ marginTop: "32px" }}>
            <h2 style={styles.sectionTitle}>Pending Invitations</h2>
            <div style={styles.grid}>
              {invitations.map((invitation) => (
                <div key={invitation.id} style={styles.card} className="glass-card">
                  <h3 style={styles.groupName}>{invitation.groupName}</h3>
                  <p style={styles.groupDesc}>{invitation.email}</p>
                  <div style={styles.cardActions}>
                    <button className="btn-aurora" onClick={() => handleInvitationResponse(invitation.id, "ACCEPT", invitation.groupId)}>
                      Accept
                    </button>
                    <button className="btn-ghost" onClick={() => handleInvitationResponse(invitation.id, "DECLINE")}>
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
  modalCard: { width: "480px", maxWidth: "90vw", padding: "32px" },
  modalTitle: { fontSize: "18px", fontWeight: "600", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "20px" },
  formGroup: { display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" },
  label: { color: "#94a3b8", fontSize: "13px", fontWeight: "500" },
  modalActions: { display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "8px" },
  emptyState: { padding: "48px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" },
  card: { padding: "20px", display: "flex", flexDirection: "column", gap: "12px" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" },
  groupAvatar: { width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg, #7c3aed, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: "700", color: "white" },
  cardHeaderRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" },
  memberCount: { color: "#94a3b8", fontSize: "12px", fontWeight: "500" },
  ownerBadge: { color: "#fbbf24", fontSize: "11px", fontWeight: "600", letterSpacing: "0.05em" },
  memberBadge: { color: "#7dd3fc", fontSize: "11px", fontWeight: "600", letterSpacing: "0.05em" },
  groupName: { fontSize: "16px", fontWeight: "600", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "4px" },
  groupDesc: { color: "#64748b", fontSize: "13px", lineHeight: "1.4", marginBottom: "8px" },
  groupMeta: { display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "8px" },
  metaItem: { color: "#64748b", fontSize: "12px", background: "rgba(255,255,255,0.05)", padding: "4px 8px", borderRadius: "6px" },
  cardActions: { display: "flex", gap: "8px", marginTop: "auto" },
  sectionTitle: { fontSize: "18px", fontWeight: "600", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "16px" },
  errorBanner: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "12px 16px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  closeError: { background: "none", border: "none", color: "#ef4444", fontSize: "20px", cursor: "pointer", padding: "0 8px" },
};

export default Groups;