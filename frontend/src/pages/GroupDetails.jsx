import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../services/api";

const GroupDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [shareTrip, setShareTrip] = useState(false);
  const [tripPermission, setTripPermission] = useState("VIEW");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setError(null);
      const [groupRes, membersRes] = await Promise.all([
        api.get(`/groups/${id}`),
        api.get(`/groups/${id}/members`),
      ]);
      setGroup(groupRes.data);
      setMembers(membersRes.data);
      
      // Only fetch pending invitations if user is owner
      if (groupRes.data.canInviteMembers) {
        try {
          const pendingRes = await api.get(`/groups/${id}/pending-invitations`);
          setPendingInvitations(pendingRes.data);
        } catch (err) {
          console.error("Failed to load pending invitations:", err);
          setPendingInvitations([]);
        }
      } else {
        setPendingInvitations([]);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load group details");
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate("/groups");
      }
    } finally {
      setLoading(false);
    }
  };

  const sendInvite = async () => {
    try {
      setError(null);
      await api.post(`/groups/${id}/invite`, { 
        email: inviteEmail,
        shareTrip: shareTrip,
        tripPermission: tripPermission
      });
      setInviteEmail("");
      setShareTrip(false);
      setTripPermission("VIEW");
      setInviteOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send invitation");
      console.error(err);
    }
  };

  const removeMember = async (memberId) => {
    try {
      setError(null);
      await api.delete(`/groups/${id}/members/${memberId}`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove member");
      console.error(err);
    }
  };

  const leaveGroup = async () => {
    try {
      setError(null);
      await api.post(`/groups/${id}/leave`);
      navigate("/groups");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to leave group");
      console.error(err);
    }
  };

  const deleteGroup = async () => {
    if (!window.confirm("Delete this group?")) return;
    try {
      setError(null);
      await api.delete(`/groups/${id}`);
      navigate("/groups");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete group");
      console.error(err);
    }
  };

  const respondToInvitation = async (invitationId, action) => {
    try {
      await api.post(`/groups/invitations/${invitationId}/respond`, { action });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Sidebar />
        <main style={styles.main}>Loading...</main>
      </div>
    );
  }

  if (!group) {
    return null;
  }

  const isOwner = group.currentUserRole === "OWNER";
  const canInvite = group.canInviteMembers || false;
  const canRemove = group.canRemoveMembers || false;
  const canDelete = group.canDeleteGroup || false;
  const canLeave = group.canLeaveGroup || false;

  return (
    <div style={styles.container}>
      <Sidebar />
      <main style={styles.main}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>{group.name}</h1>
            <p style={styles.subtitle}>{group.description || "Group collaboration"}</p>
          </div>
          <div style={styles.headerActions}>
            <button className="btn-ghost" onClick={() => navigate("/groups")}>Back</button>
            {canInvite && <button className="btn-aurora" onClick={() => setInviteOpen(true)}>Invite Member</button>}
            {canLeave && <button className="btn-aurora" onClick={leaveGroup}>Leave Group</button>}
            {canDelete && (
              <button className="btn-ghost" style={{ color: "#ef4444" }} onClick={() => deleteGroup()}>
                Delete Group
              </button>
            )}
          </div>
        </div>

        {error && (
          <div style={styles.errorBanner}>
            <p>{error}</p>
            <button onClick={() => setError(null)} style={styles.closeError}>×</button>
          </div>
        )}

        <div style={styles.grid}>
          <section style={styles.card} className="glass-card">
            <h2 style={styles.sectionTitle}>Group Information</h2>
            <p style={styles.infoLine}>Owner: {group.createdByUsername}</p>
            <p style={styles.infoLine}>Your Role: {group.currentUserRole || "MEMBER"}</p>
            <p style={styles.infoLine}>Members: {members.length}</p>
          </section>

          <section style={styles.card} className="glass-card">
            <h2 style={styles.sectionTitle}>Trip Information</h2>
            <p style={styles.infoLine}>Trip: {group.tripTitle}</p>
            <p style={styles.infoLine}>Destination: {group.tripDestination}</p>
            <p style={styles.infoLine}>Dates: {group.tripStartDate || "TBD"} - {group.tripEndDate || "TBD"}</p>
          </section>
        </div>

        <div style={styles.grid}>
          {isOwner ? (
            <section style={styles.card} className="glass-card">
              <h2 style={styles.sectionTitle}>Owner Actions</h2>
              <div style={styles.actionStack}>
                {canInvite && <button className="btn-aurora" onClick={() => setInviteOpen(true)}>Invite Member</button>}
                <p style={styles.helperText}>Owners can invite or remove members and delete the group.</p>
              </div>
            </section>
          ) : (
            <section style={styles.card} className="glass-card">
              <h2 style={styles.sectionTitle}>Member Actions</h2>
              <div style={styles.actionStack}>
                {canLeave && <button className="btn-aurora" onClick={leaveGroup}>Leave Group</button>}
                <p style={styles.helperText}>Members can always add expenses and upload documents.</p>
              </div>
            </section>
          )}

          {canInvite && (
            <section style={styles.card} className="glass-card">
              <h2 style={styles.sectionTitle}>Pending Invitations</h2>
              {pendingInvitations.length === 0 ? (
                <p style={styles.emptyText}>No pending invitations.</p>
              ) : (
                <div style={styles.list}>
                  {pendingInvitations.map((invitation) => (
                    <div key={invitation.id} style={styles.listItem}>
                      <div>
                        <p style={styles.memberName}>{invitation.name}</p>
                        <p style={styles.memberMeta}>{invitation.email}</p>
                        <p style={styles.memberMeta}>Invited by: {invitation.invitedByUsername || group.createdByUsername}</p>
                      </div>
                      <span style={styles.roleBadge}>PENDING</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        <section style={styles.card} className="glass-card">
          <h2 style={styles.sectionTitle}>Member List</h2>
          <div style={styles.list}>
            {members.map((member) => (
              <div key={member.id} style={styles.listItem}>
                <div>
                  <p style={styles.memberName}>{member.name}</p>
                  <p style={styles.memberMeta}>{member.email}</p>
                  <p style={styles.memberMeta}>Joined: {member.joinedAt || member.invitedAt || "Pending"}</p>
                </div>
                <div style={styles.memberActions}>
                  <span style={styles.roleBadge}>{member.role}</span>
                  {canRemove && member.role !== "OWNER" && (
                    <button className="btn-ghost" onClick={() => removeMember(member.userId)}>Remove</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {inviteOpen && (
          <div style={styles.modal}>
            <div style={styles.modalCard} className="glass-card">
              <h3 style={styles.sectionTitle}>Invite Member</h3>
              <input
                className="aurora-input"
                placeholder="registered user email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              
              <div style={styles.shareTripSection}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={shareTrip}
                    onChange={(e) => setShareTrip(e.target.checked)}
                    style={styles.checkbox}
                  />
                  Share Trip with this member?
                </label>
              </div>

              {shareTrip && (
                <div style={styles.tripPermissionSection}>
                  <p style={styles.permissionLabel}>Trip Permissions:</p>
                  <div style={styles.permissionOptions}>
                    <label style={styles.radioLabel}>
                      <input
                        type="radio"
                        name="tripPermission"
                        value="VIEW"
                        checked={tripPermission === "VIEW"}
                        onChange={(e) => setTripPermission(e.target.value)}
                        style={styles.radio}
                      />
                      View Trip
                    </label>
                    <label style={styles.radioLabel}>
                      <input
                        type="radio"
                        name="tripPermission"
                        value="EDIT"
                        checked={tripPermission === "EDIT"}
                        onChange={(e) => setTripPermission(e.target.value)}
                        style={styles.radio}
                      />
                      Edit Trip
                    </label>
                  </div>
                </div>
              )}

              <div style={styles.modalActions}>
                <button className="btn-ghost" onClick={() => {
                  setInviteOpen(false);
                  setShareTrip(false);
                  setTripPermission("VIEW");
                }}>Cancel</button>
                <button className="btn-aurora" onClick={sendInvite}>Send Invite</button>
              </div>
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
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" },
  headerActions: { display: "flex", gap: "12px", flexWrap: "wrap" },
  title: { fontSize: "28px", fontWeight: "700", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif" },
  subtitle: { color: "#94a3b8", fontSize: "14px", marginTop: "4px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", marginBottom: "16px" },
  card: { padding: "24px", marginBottom: "16px" },
  sectionTitle: { fontSize: "18px", fontWeight: "600", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "16px" },
  infoLine: { color: "#cbd5e1", fontSize: "14px", marginBottom: "8px" },
  list: { display: "flex", flexDirection: "column", gap: "12px" },
  listItem: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", padding: "14px", borderRadius: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" },
  memberName: { color: "#f1f5f9", fontSize: "15px", fontWeight: "600" },
  memberMeta: { color: "#94a3b8", fontSize: "12px", marginTop: "4px" },
  memberActions: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end" },
  roleBadge: { color: "#7dd3fc", border: "1px solid rgba(125,211,252,0.2)", background: "rgba(125,211,252,0.08)", padding: "4px 10px", borderRadius: "999px", fontSize: "11px", letterSpacing: "0.08em" },
  actionStack: { display: "flex", flexDirection: "column", gap: "12px" },
  helperText: { color: "#94a3b8", fontSize: "13px", lineHeight: "1.5" },
  modal: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" },
  modalCard: { width: "420px", maxWidth: "90vw", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: "12px" },
  emptyText: { color: "#94a3b8", fontSize: "14px" },
  errorBanner: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "12px 16px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  closeError: { background: "none", border: "none", color: "#ef4444", fontSize: "20px", cursor: "pointer", padding: "0 8px" },
  shareTripSection: { marginTop: "16px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.1)" },
  checkboxLabel: { color: "#cbd5e1", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" },
  checkbox: { width: "16px", height: "16px", cursor: "pointer" },
  tripPermissionSection: { marginTop: "16px", padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "8px" },
  permissionLabel: { color: "#94a3b8", fontSize: "13px", marginBottom: "8px" },
  permissionOptions: { display: "flex", flexDirection: "column", gap: "8px" },
  radioLabel: { color: "#cbd5e1", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" },
  radio: { width: "16px", height: "16px", cursor: "pointer" },
};

export default GroupDetails;