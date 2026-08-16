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
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [transferOwnershipOpen, setTransferOwnershipOpen] = useState(false);
  const [newOwnerId, setNewOwnerId] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmTransfer, setConfirmTransfer] = useState(null);

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

  const handleRemoveMember = (memberId) => {
    setConfirmRemove(memberId);
  };

  const confirmRemoveMember = async () => {
    try {
      setError(null);
      await api.delete(`/groups/${id}/members/${confirmRemove}`);
      setConfirmRemove(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove member");
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

  const handleDeleteGroup = () => {
    setConfirmDelete(true);
  };

  const confirmDeleteGroup = async () => {
    try {
      setError(null);
      await api.delete(`/groups/${id}`);
      setConfirmDelete(false);
      navigate("/groups");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete group");
      console.error(err);
    }
  };

  const handleLeaveGroup = () => {
    setConfirmLeave(true);
  };

  const confirmLeaveGroup = async () => {
    try {
      setError(null);
      await api.post(`/groups/${id}/leave`);
      setConfirmLeave(false);
      navigate("/groups");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to leave group");
      console.error(err);
    }
  };

  const startEditGroup = () => {
    setEditName(group.name);
    setEditDescription(group.description || "");
    setEditMode(true);
  };

  const saveEditGroup = async () => {
    if (!editName || editName.trim() === "") {
      setError("Group name is required");
      return;
    }
    try {
      setError(null);
      await api.put(`/groups/${id}`, { name: editName, description: editDescription });
      setEditMode(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update group");
      console.error(err);
    }
  };

  const handleTransferOwnership = (memberId) => {
    setNewOwnerId(memberId);
    setConfirmTransfer(memberId);
  };

  const confirmTransferOwnership = async () => {
    try {
      setError(null);
      await api.post(`/groups/${id}/transfer-ownership`, { newOwnerId: confirmTransfer });
      setConfirmTransfer(null);
      setTransferOwnershipOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to transfer ownership");
      console.error(err);
    }
  };

  const updateMemberPermission = async (memberId, permission) => {
    try {
      setError(null);
      await api.put(`/groups/${id}/members/${memberId}/permission`, { tripPermission: permission });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update permission");
      console.error(err);
    }
  };

  const removeTripShare = async (memberId) => {
    try {
      setError(null);
      await api.delete(`/groups/${id}/members/${memberId}/trip-share`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove trip share");
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

  const handleCancelInvitation = async (invitationId) => {
    try {
      setError(null);
      await api.delete(`/groups/${id}/invitations/${invitationId}`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel invitation");
      console.error(err);
    }
  };

  const handleResendInvitation = async (invitationId) => {
    try {
      setError(null);
      await api.post(`/groups/${id}/invitations/${invitationId}/resend`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend invitation");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="tn-user-layout-container">
        <Sidebar />
        <main className="tn-user-main">
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>Loading group details...</p>
          </div>
        </main>
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
    <div className="tn-user-layout-container">
      <Sidebar />
      <main className="tn-user-main">
        <div style={styles.header}>
          <div>
            {editMode ? (
              <div style={styles.editForm}>
                <input
                  className="aurora-input"
                  placeholder="Group Name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={styles.editInput}
                />
                <input
                  className="aurora-input"
                  placeholder="Description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  style={styles.editInput}
                />
                <div style={styles.editActions}>
                  <button className="btn-ghost" onClick={() => setEditMode(false)}>Cancel</button>
                  <button className="btn-aurora" onClick={saveEditGroup}>Save</button>
                </div>
              </div>
            ) : (
              <>
                <h1 style={styles.title}>{group.name}</h1>
                <p style={styles.subtitle}>{group.description || "Group collaboration"}</p>
              </>
            )}
          </div>
          <div style={styles.headerActions}>
            <button className="btn-compact" onClick={() => navigate("/groups")}>← Back</button>
            <button className="btn-compact" onClick={() => navigate(`/groups/${id}/discussion`)}>💬 Discussion</button>
            {isOwner && !editMode && <button className="btn-compact" onClick={startEditGroup}>✏️ Edit</button>}
            {canInvite && <button className="btn-compact primary" onClick={() => setInviteOpen(true)}>+ Invite</button>}
            {canLeave && <button className="btn-compact primary" onClick={handleLeaveGroup}>🚪 Leave</button>}
            {canDelete && (
              <button className="btn-compact danger" onClick={handleDeleteGroup}>
                🗑️ Delete
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
          {canInvite && (
            <section style={styles.card} className="glass-card">
              <h2 style={styles.sectionTitle}>Pending Invitations</h2>
              {pendingInvitations.length === 0 ? (
                <p style={styles.emptyText}>No pending invitations.</p>
              ) : (
                <div style={styles.list}>
                  {pendingInvitations.map((invitation) => (
                    <div key={invitation.id} style={styles.invitationCard}>
                      <div style={styles.invitationInfo}>
                        <div style={styles.invitationHeader}>
                          <p style={styles.memberName}>{invitation.name}</p>
                          <span style={styles.pendingBadge}>PENDING</span>
                        </div>
                        <p style={styles.memberMeta}>{invitation.email}</p>
                        <p style={styles.memberMeta}>Invited: {new Date(invitation.invitedAt).toLocaleDateString()}</p>
                        <p style={styles.memberMeta}>Trip Shared: {invitation.tripPermission ? "Yes" : "No"}</p>
                        {invitation.tripPermission && (
                          <p style={styles.memberMeta}>Permission: {invitation.tripPermission === "EDIT" ? "Editor" : "Viewer"}</p>
                        )}
                      </div>
                      <div style={styles.invitationActions}>
                        <button 
                          className="btn-ghost" 
                          style={styles.resendBtn}
                          onClick={() => handleResendInvitation(invitation.id)}
                        >
                          📧 Resend
                        </button>
                        <button 
                          className="btn-ghost" 
                          style={styles.cancelBtn}
                          onClick={() => handleCancelInvitation(invitation.id)}
                        >
                          ✕ Cancel
                        </button>
                      </div>
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
              <div key={member.id} style={styles.memberCard}>
                <div style={styles.memberInfo}>
                  <div style={styles.memberHeader}>
                    <p style={styles.memberName}>{member.name}</p>
                    <span style={styles.roleBadge(member.role)}>
                      {member.role === "OWNER" ? "OWNER" : member.tripPermission === "EDIT" ? "EDITOR" : "VIEWER"}
                    </span>
                  </div>
                  <p style={styles.memberMeta}>{member.email}</p>
                  <p style={styles.memberMeta}>Joined: {member.joinedAt || member.invitedAt || "Pending"}</p>
                  <p style={styles.memberMeta}>Trip Access: {member.tripPermission || "VIEW"}</p>
                </div>
                <div style={styles.memberActions}>
                  {isOwner && member.role !== "OWNER" && (
                    <div style={styles.permissionDropdown}>
                      <select 
                        className="aurora-input" 
                        style={styles.permissionSelect}
                        value={member.tripPermission || "VIEW"}
                        onChange={(e) => updateMemberPermission(member.userId, e.target.value)}
                      >
                        <option value="VIEW">👁️ View</option>
                        <option value="EDIT">✏️ Edit</option>
                      </select>
                      <button 
                        className="btn-ghost" 
                        style={styles.removeTripBtn}
                        onClick={() => removeTripShare(member.userId)}
                        title="Remove Trip Share"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  {isOwner && member.role !== "OWNER" && (
                    <button className="btn-ghost" style={styles.removeBtn} onClick={() => handleRemoveMember(member.userId)}>
                      Remove
                    </button>
                  )}
                  {isOwner && member.role !== "OWNER" && (
                    <button className="btn-ghost" style={styles.transferBtn} onClick={() => handleTransferOwnership(member.userId)}>
                      👑 Transfer
                    </button>
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

        {confirmDelete && (
          <div style={styles.modal}>
            <div style={styles.modalCard} className="glass-card">
              <h3 style={styles.sectionTitle}>Delete Group</h3>
              <p style={styles.confirmText}>Are you sure you want to delete this group? This action cannot be undone.</p>
              <div style={styles.modalActions}>
                <button className="btn-ghost" onClick={() => setConfirmDelete(false)}>Cancel</button>
                <button className="btn-aurora" style={{ background: "rgba(239,68,68,0.2)", borderColor: "rgba(239,68,68,0.4)" }} onClick={confirmDeleteGroup}>Delete</button>
              </div>
            </div>
          </div>
        )}

        {confirmRemove && (
          <div style={styles.modal}>
            <div style={styles.modalCard} className="glass-card">
              <h3 style={styles.sectionTitle}>Remove Member</h3>
              <p style={styles.confirmText}>Are you sure you want to remove this member from the group?</p>
              <div style={styles.modalActions}>
                <button className="btn-ghost" onClick={() => setConfirmRemove(null)}>Cancel</button>
                <button className="btn-aurora" style={{ background: "rgba(239,68,68,0.2)", borderColor: "rgba(239,68,68,0.4)" }} onClick={confirmRemoveMember}>Remove</button>
              </div>
            </div>
          </div>
        )}

        {confirmLeave && (
          <div style={styles.modal}>
            <div style={styles.modalCard} className="glass-card">
              <h3 style={styles.sectionTitle}>Leave Group</h3>
              <p style={styles.confirmText}>Are you sure you want to leave this group?</p>
              <div style={styles.modalActions}>
                <button className="btn-ghost" onClick={() => setConfirmLeave(false)}>Cancel</button>
                <button className="btn-aurora" style={{ background: "rgba(239,68,68,0.2)", borderColor: "rgba(239,68,68,0.4)" }} onClick={confirmLeaveGroup}>Leave</button>
              </div>
            </div>
          </div>
        )}

        {confirmTransfer && (
          <div style={styles.modal}>
            <div style={styles.modalCard} className="glass-card">
              <h3 style={styles.sectionTitle}>Transfer Ownership</h3>
              <p style={styles.confirmText}>Are you sure you want to transfer ownership to this member? You will become a regular member.</p>
              <div style={styles.modalActions}>
                <button className="btn-ghost" onClick={() => setConfirmTransfer(null)}>Cancel</button>
                <button className="btn-aurora" style={{ background: "rgba(239,68,68,0.2)", borderColor: "rgba(239,68,68,0.4)" }} onClick={confirmTransferOwnership}>Transfer</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const styles = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" },
  headerActions: { display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" },
  title: { fontSize: "28px", fontWeight: "700", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif" },
  subtitle: { color: "#94a3b8", fontSize: "14px", marginTop: "4px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "16px", marginBottom: "16px" },
  card: { padding: "20px", marginBottom: "16px" },
  sectionTitle: { fontSize: "18px", fontWeight: "600", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "16px" },
  infoLine: { color: "#cbd5e1", fontSize: "14px", marginBottom: "8px" },
  list: { display: "flex", flexDirection: "column", gap: "12px" },
  listItem: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", padding: "16px", borderRadius: "12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", transition: "all 0.2s ease" },
  memberName: { color: "#f1f5f9", fontSize: "15px", fontWeight: "600" },
  memberMeta: { color: "#94a3b8", fontSize: "12px", marginTop: "4px" },
  memberActions: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end" },
  roleBadge: { color: "#7dd3fc", border: "1px solid rgba(125,211,252,0.2)", background: "rgba(125,211,252,0.08)", padding: "4px 10px", borderRadius: "999px", fontSize: "11px", letterSpacing: "0.08em" },
  pendingBadge: { color: "#fbbf24", border: "1px solid rgba(251, 191, 36, 0.3)", background: "rgba(251, 191, 36, 0.1)", padding: "4px 10px", borderRadius: "999px", fontSize: "11px", letterSpacing: "0.08em" },
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
  editForm: { display: "flex", flexDirection: "column", gap: "12px" },
  editInput: { marginBottom: "8px" },
  editActions: { display: "flex", gap: "8px", justifyContent: "flex-end" },
  memberCard: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", padding: "16px", borderRadius: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" },
  memberInfo: { flex: 1 },
  memberHeader: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" },
  roleBadge: (role) => {
    const colors = {
      "OWNER": "rgba(250, 204, 21, 0.15)",
      "MEMBER": "rgba(125, 211, 252, 0.08)",
      "EDITOR": "rgba(168, 85, 247, 0.15)",
      "VIEWER": "rgba(251, 146, 60, 0.15)"
    };
    const borderColors = {
      "OWNER": "rgba(250, 204, 21, 0.3)",
      "MEMBER": "rgba(125, 211, 252, 0.2)",
      "EDITOR": "rgba(168, 85, 247, 0.3)",
      "VIEWER": "rgba(251, 146, 60, 0.3)"
    };
    return {
      color: role === "OWNER" ? "#facc15" : role === "EDITOR" ? "#a855f7" : "#fb923c",
      border: `1px solid ${borderColors[role] || borderColors.MEMBER}`,
      background: colors[role] || colors.MEMBER,
      padding: "4px 10px",
      borderRadius: "999px",
      fontSize: "10px",
      fontWeight: "600",
      letterSpacing: "0.05em"
    };
  },
  permissionDropdown: { display: "flex", alignItems: "center", gap: "8px" },
  permissionSelect: { padding: "6px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#cbd5e1", fontSize: "12px" },
  removeTripBtn: { background: "none", border: "none", color: "#94a3b8", fontSize: "16px", cursor: "pointer", padding: "4px 8px", transition: "all 0.2s" },
  removeBtn: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5", borderRadius: "6px", cursor: "pointer", fontSize: "12px", padding: "6px 12px", transition: "all 0.2s" },
  transferBtn: { background: "rgba(250, 204, 21, 0.1)", border: "1px solid rgba(250, 204, 21, 0.3)", color: "#facc15", borderRadius: "6px", cursor: "pointer", fontSize: "12px", padding: "6px 12px", transition: "all 0.2s" },
  confirmText: { color: "#cbd5e1", fontSize: "14px", marginBottom: "16px" },
  invitationCard: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", padding: "16px", borderRadius: "12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", transition: "all 0.2s ease" },
  invitationInfo: { flex: 1 },
  invitationHeader: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" },
  invitationActions: { display: "flex", gap: "8px" },
  resendBtn: { background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.3)", color: "#7dd3fc", borderRadius: "6px", cursor: "pointer", fontSize: "12px", padding: "6px 12px", transition: "all 0.2s" },
  cancelBtn: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5", borderRadius: "6px", cursor: "pointer", fontSize: "12px", padding: "6px 12px", transition: "all 0.2s" },
  loadingContainer: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: "16px" },
  spinner: { width: "40px", height: "40px", border: "3px solid rgba(125,211,252,0.2)", borderTop: "3px solid #7dd3fc", borderRadius: "50%" },
  loadingText: { color: "#94a3b8", fontSize: "14px" },
};

export default GroupDetails;