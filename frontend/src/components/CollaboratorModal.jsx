import { useState, useEffect } from "react";
import api from "../services/api";

const CollaboratorModal = ({
  tripId,
  tripTitle,
  tripName,
  canManageShares = true,
  defaultAddToGroup = false,
  onClose,
  onSuccess,
  onShare,
}) => {
  const [shares, setShares] = useState([]);
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState("VIEW");
  const [addToGroup, setAddToGroup] = useState(defaultAddToGroup);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const resolvedTripName = tripTitle || tripName || "";

  useEffect(() => {
    if (tripId) {
      fetchShares();
    }
  }, [tripId]);

  // Handle escape key to dismiss
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const fetchShares = async () => {
    try {
      const res = await api.get(`/trip-shares/trip/${tripId}`);
      setShares(res.data);
    } catch (err) {
      console.error("Failed to load collaborators:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e?.preventDefault();
    if (!email.trim()) return;

    setError("");
    setSuccessMsg("");
    setSubmitting(true);

    try {
      await api.post("/trip-shares/invite", {
        tripId: Number(tripId),
        email: email.trim(),
        permission,
        addToGroup,
      });

      setSuccessMsg(`Invitation sent to ${email.trim()}!`);
      setEmail("");
      setPermission("VIEW");
      setAddToGroup(defaultAddToGroup);
      await fetchShares();
      onSuccess?.();
      onShare?.();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to invite collaborator. Please verify the email address."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePermission = async (targetUserId, newPermission) => {
    setError("");
    try {
      await api.put(`/trip-shares/trip/${tripId}/user/${targetUserId}/permission`, {
        tripPermission: newPermission,
      });
      await fetchShares();
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update permission.");
    }
  };

  const handleRemove = async (userId, targetName) => {
    if (!window.confirm(`Remove ${targetName || "this collaborator"}'s access?`)) {
      return;
    }

    setError("");
    try {
      await api.delete(`/trip-shares/trip/${tripId}/user/${userId}`);
      await fetchShares();
      onSuccess?.();
      onShare?.();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove collaborator.");
    }
  };

  return (
    <div
      style={styles.modalOverlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="collaborator-modal-title"
    >
      <div style={styles.modalCard} className="glass-card">
        {/* Header */}
        <div style={styles.modalHeader}>
          <div>
            <h3 id="collaborator-modal-title" style={styles.modalTitle}>
              Share & Collaborate 🤝
            </h3>
            {resolvedTripName ? (
              <p style={styles.tripBadge}>
                Trip: <span style={{ color: "#f1f5f9" }}>{resolvedTripName}</span>
              </p>
            ) : null}
          </div>
          <button
            onClick={onClose}
            style={styles.closeBtn}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Invite Form */}
        <form onSubmit={handleInvite} style={styles.formContainer}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Collaborator's Email</label>
            <input
              type="email"
              className="aurora-input"
              placeholder="friend@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Access Level Cards */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Access Level</label>
            <div style={styles.permissionGrid}>
              <div
                style={{
                  ...styles.permOption,
                  borderColor:
                    permission === "VIEW"
                      ? "#a78bfa"
                      : "rgba(255, 255, 255, 0.08)",
                  background:
                    permission === "VIEW"
                      ? "rgba(167, 139, 250, 0.12)"
                      : "rgba(255, 255, 255, 0.02)",
                }}
                onClick={() => setPermission("VIEW")}
                role="button"
                tabIndex={0}
              >
                <div style={styles.permHeader}>
                  <span style={styles.permIcon}>👁️</span>
                  <strong style={styles.permName}>Viewer</strong>
                </div>
                <p style={styles.permDesc}>
                  Can view itinerary, budget, expenses, docs, and memories.
                </p>
              </div>

              <div
                style={{
                  ...styles.permOption,
                  borderColor:
                    permission === "EDIT"
                      ? "#38bdf8"
                      : "rgba(255, 255, 255, 0.08)",
                  background:
                    permission === "EDIT"
                      ? "rgba(56, 189, 248, 0.12)"
                      : "rgba(255, 255, 255, 0.02)",
                }}
                onClick={() => setPermission("EDIT")}
                role="button"
                tabIndex={0}
              >
                <div style={styles.permHeader}>
                  <span style={styles.permIcon}>✏️</span>
                  <strong style={styles.permName}>Editor</strong>
                </div>
                <p style={styles.permDesc}>
                  Can create & edit itineraries, activities, expenses, and notes.
                </p>
              </div>
            </div>
          </div>

          {/* Group Discussion Toggle */}
          <div style={styles.toggleRow}>
            <label style={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={addToGroup}
                onChange={(e) => setAddToGroup(e.target.checked)}
                style={styles.checkbox}
              />
              <span style={styles.toggleText}>
                💬 Add to Group Discussion / Chat?
              </span>
            </label>
            <p style={styles.toggleDesc}>
              Invites collaborator into the trip's Travel Group discussion with
              Member role.
            </p>
          </div>

          {/* Error / Success Feedback */}
          {error && <div style={styles.errorBanner}>{error}</div>}
          {successMsg && <div style={styles.successBanner}>{successMsg}</div>}

          <button
            type="submit"
            className="btn-aurora"
            disabled={submitting || !email.trim()}
            style={{ width: "100%", marginTop: "6px" }}
          >
            {submitting ? "Sending Invite..." : "✉️ Send Invitation"}
          </button>
        </form>

        <div style={styles.divider} />

        {/* Existing Collaborators Section */}
        <div>
          <h4 style={styles.sectionTitle}>People with access</h4>
          {loading ? (
            <p style={{ color: "#94a3b8", fontSize: "13px" }}>Loading collaborators...</p>
          ) : shares.length === 0 ? (
            <p style={{ color: "#64748b", fontSize: "13px" }}>
              No collaborators invited yet. Share above to collaborate!
            </p>
          ) : (
            <div style={styles.shareList}>
              {shares.map((share) => (
                <div key={share.id} style={styles.shareItem}>
                  <div style={styles.shareAvatar}>
                    {share.sharedWithUsername?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={styles.shareName}>{share.sharedWithUsername}</p>
                    <p style={styles.shareEmail}>{share.sharedWithEmail}</p>
                  </div>

                  {/* Status and Permission Controls */}
                  <div style={styles.shareControls}>
                    {canManageShares ? (
                      <select
                        className="aurora-input"
                        value={share.permission}
                        onChange={(e) =>
                          handleUpdatePermission(share.sharedWithUserId, e.target.value)
                        }
                        style={styles.permSelect}
                      >
                        <option value="VIEW" style={{ background: "#0d1529" }}>
                          View
                        </option>
                        <option value="EDIT" style={{ background: "#0d1529" }}>
                          Edit
                        </option>
                      </select>
                    ) : (
                      <span
                        className="badge"
                        style={{
                          fontSize: "11px",
                          background: "rgba(167, 139, 250, 0.15)",
                          color: "#a78bfa",
                        }}
                      >
                        {share.permission}
                      </span>
                    )}

                    <span style={statusBadgeStyle(share.status)}>
                      {share.status === "ACCEPTED"
                        ? "✓ Accepted"
                        : share.status === "DECLINED"
                        ? "✗ Declined"
                        : "⏳ Pending"}
                    </span>

                    {canManageShares && (
                      <button
                        onClick={() =>
                          handleRemove(share.sharedWithUserId, share.sharedWithUsername)
                        }
                        style={styles.removeBtn}
                        title="Remove access"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.75)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    backdropFilter: "blur(6px)",
    padding: "16px",
  },
  modalCard: {
    width: "520px",
    maxWidth: "96vw",
    padding: "24px 28px",
    maxHeight: "85vh",
    overflowY: "auto",
    borderRadius: "16px",
    border: "1px solid rgba(167, 139, 250, 0.25)",
    boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "18px",
  },
  modalTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#f1f5f9",
    fontFamily: "'Space Grotesk', sans-serif",
    margin: 0,
  },
  tripBadge: {
    color: "#a78bfa",
    fontSize: "13px",
    marginTop: "4px",
    margin: 0,
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#94a3b8",
    fontSize: "18px",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: "6px",
  },
  formContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    color: "#94a3b8",
    fontSize: "13px",
    fontWeight: "600",
  },
  permissionGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },
  permOption: {
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1.5px solid",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  permHeader: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "4px",
  },
  permIcon: {
    fontSize: "14px",
  },
  permName: {
    fontSize: "13px",
    color: "#f1f5f9",
  },
  permDesc: {
    fontSize: "11px",
    color: "#94a3b8",
    lineHeight: "1.35",
    margin: 0,
  },
  toggleRow: {
    background: "rgba(255, 255, 255, 0.03)",
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid rgba(255, 255, 255, 0.06)",
  },
  toggleLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
  },
  checkbox: {
    width: "16px",
    height: "16px",
    accentColor: "#7c3aed",
    cursor: "pointer",
  },
  toggleText: {
    color: "#f1f5f9",
    fontSize: "13px",
    fontWeight: "600",
  },
  toggleDesc: {
    color: "#94a3b8",
    fontSize: "11px",
    margin: "4px 0 0 24px",
    lineHeight: "1.3",
  },
  errorBanner: {
    background: "rgba(239, 68, 68, 0.15)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    color: "#fca5a5",
    padding: "8px 12px",
    borderRadius: "8px",
    fontSize: "12px",
  },
  successBanner: {
    background: "rgba(16, 185, 129, 0.15)",
    border: "1px solid rgba(16, 185, 129, 0.3)",
    color: "#6ee7b7",
    padding: "8px 12px",
    borderRadius: "8px",
    fontSize: "12px",
  },
  divider: {
    height: "1px",
    background: "rgba(255, 255, 255, 0.08)",
    margin: "18px 0 14px 0",
  },
  sectionTitle: {
    color: "#f1f5f9",
    fontSize: "14px",
    fontWeight: "600",
    marginBottom: "12px",
  },
  shareList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  shareItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 12px",
    background: "rgba(255, 255, 255, 0.03)",
    borderRadius: "10px",
    border: "1px solid rgba(255, 255, 255, 0.05)",
  },
  shareAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #2563eb, #7c3aed)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "700",
    color: "white",
    flexShrink: 0,
  },
  shareName: {
    color: "#f1f5f9",
    fontSize: "13px",
    fontWeight: "600",
    margin: 0,
  },
  shareEmail: {
    color: "#64748b",
    fontSize: "11px",
    margin: 0,
  },
  shareControls: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  permSelect: {
    padding: "4px 8px",
    fontSize: "12px",
    width: "82px",
    borderRadius: "6px",
  },
  removeBtn: {
    background: "rgba(239, 68, 68, 0.12)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    color: "#fca5a5",
    borderRadius: "6px",
    cursor: "pointer",
    padding: "5px 8px",
    fontSize: "12px",
  },
};

const statusBadgeStyle = (status) => ({
  fontSize: "10px",
  fontWeight: "600",
  padding: "3px 8px",
  borderRadius: "999px",
  letterSpacing: "0.03em",
  whiteSpace: "nowrap",
  ...(status === "ACCEPTED"
    ? {
        background: "rgba(16, 185, 129, 0.15)",
        color: "#6ee7b7",
        border: "1px solid rgba(16, 185, 129, 0.3)",
      }
    : status === "DECLINED"
    ? {
        background: "rgba(239, 68, 68, 0.12)",
        color: "#fca5a5",
        border: "1px solid rgba(239, 68, 68, 0.3)",
      }
    : {
        background: "rgba(245, 158, 11, 0.12)",
        color: "#fcd34d",
        border: "1px solid rgba(245, 158, 11, 0.3)",
      }),
});

export default CollaboratorModal;
