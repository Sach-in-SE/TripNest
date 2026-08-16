import { useState, useEffect, useCallback } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import api from "../../services/api";
import "./AdminLayout.css";

const ALL_ROLES = [
  { key: "ROLE_ADMIN", label: "Administrator" },
  { key: "ROLE_TRAVELER", label: "Traveler" },
  { key: "ROLE_GROUP_ADMIN", label: "Group Admin" },
];

function AdminUserManagement() {

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // Modals
  const [viewingUser, setViewingUser] = useState(null);
  const [editingRoleUser, setEditingRoleUser] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [resetPasswordResult, setResetPasswordResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // Action state & Feedback
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (statusFilter !== "") params.enabled = statusFilter === "true";
      if (roleFilter) params.role = roleFilter;

      const response = await api.get("/admin/users", { params });
      setUsers(response.data);
    } catch (err) {
      console.error("Failed to fetch admin users:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load user directory from server."
      );
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const showToast = (type, text) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Toggle user status (Enable / Disable)
  const handleToggleStatus = async (targetUser) => {
    const newStatus = !targetUser.enabled;
    const actionText = newStatus ? "enable" : "disable";

    if (!window.confirm(`Are you sure you want to ${actionText} user "${targetUser.username}"?`)) {
      return;
    }

    setActionLoading(true);
    try {
      await api.put(`/admin/users/${targetUser.id}/status`, { enabled: newStatus });
      showToast("success", `User "${targetUser.username}" successfully ${newStatus ? "enabled" : "disabled"}.`);
      fetchUsers();
    } catch (err) {
      console.error("Failed to toggle status:", err);
      showToast("error", err.response?.data?.message || `Failed to ${actionText} user.`);
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit Roles Modal
  const openEditRolesModal = (targetUser) => {
    setEditingRoleUser(targetUser);
    setSelectedRoles(targetUser.roles || []);
  };

  const handleRoleCheckboxChange = (roleKey) => {
    if (selectedRoles.includes(roleKey)) {
      setSelectedRoles(selectedRoles.filter((r) => r !== roleKey));
    } else {
      setSelectedRoles([...selectedRoles, roleKey]);
    }
  };

  // Submit Role Changes
  const handleSaveRoles = async () => {
    if (!editingRoleUser) return;
    if (selectedRoles.length === 0) {
      alert("At least one role must be assigned to the user.");
      return;
    }

    setActionLoading(true);
    try {
      await api.put(`/admin/users/${editingRoleUser.id}/roles`, { roles: selectedRoles });
      showToast("success", `Roles updated for user "${editingRoleUser.username}".`);
      setEditingRoleUser(null);
      fetchUsers();
    } catch (err) {
      console.error("Failed to update roles:", err);
      showToast("error", err.response?.data?.message || "Failed to update user roles.");
    } finally {
      setActionLoading(false);
    }
  };

  // Reset Password Action
  const handleResetPassword = async (targetUser) => {
    if (
      !window.confirm(
        `Are you sure you want to reset password for "${targetUser.username}"?\nThis will generate a temporary 24-hour password.`
      )
    ) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await api.post(`/admin/users/${targetUser.id}/reset-password`);
      setResetPasswordResult(response.data);
      setCopied(false);
      showToast("success", `Temporary password generated for ${targetUser.username}.`);
      fetchUsers();
    } catch (err) {
      console.error("Failed to reset password:", err);
      showToast("error", err.response?.data?.message || "Failed to reset password.");
    } finally {
      setActionLoading(false);
    }
  };

  // View Details Modal
  const handleViewUser = async (userId) => {
    setActionLoading(true);
    try {
      const response = await api.get(`/admin/users/${userId}`);
      setViewingUser(response.data);
    } catch (err) {
      console.error("Failed to fetch user details:", err);
      showToast("error", err.response?.data?.message || "Failed to fetch user details.");
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const renderRoleBadge = (roleName) => {
    switch (roleName) {
      case "ROLE_ADMIN":
        return <span key={roleName} className="admin-badge admin-badge-admin">🛡️ Admin</span>;
      case "ROLE_GROUP_ADMIN":
        return <span key={roleName} className="admin-badge admin-badge-group-admin">👑 Group Admin</span>;
      case "ROLE_TRAVELER":
      default:
        return <span key={roleName} className="admin-badge admin-badge-traveler">✈️ Traveler</span>;
    }
  };

  return (
    <AdminLayout pageTitle="User Management">
      <div className="admin-dashboard-header">
        <div>
          <h2>User Directory & Access Control</h2>
          <p>Search, manage roles, toggle statuses, and handle security credentials</p>
        </div>
            <button
              onClick={fetchUsers}
              disabled={loading || actionLoading}
              className="admin-refresh-btn"
            >
              🔄 Refresh List
            </button>
          </div>

          {/* Toast Notification Banner */}
          {toastMessage && (
            <div className={`admin-toast-banner ${toastMessage.type}`}>
              <span>{toastMessage.text}</span>
              <button
                style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}
                onClick={() => setToastMessage(null)}
              >
                ✕
              </button>
            </div>
          )}

          {/* Search & Filter Bar */}
          <div className="admin-filter-bar">
            <div className="admin-search-wrapper">
              <span className="admin-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search by username, email, or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="admin-search-input"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="admin-select"
            >
              <option value="">All Statuses</option>
              <option value="true">Active (Enabled)</option>
              <option value="false">Disabled</option>
            </select>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="admin-select"
            >
              <option value="">All Roles</option>
              <option value="ROLE_ADMIN">Administrator</option>
              <option value="ROLE_TRAVELER">Traveler</option>
              <option value="ROLE_GROUP_ADMIN">Group Admin</option>
            </select>
          </div>

          {/* User Table */}
          {loading ? (
            <div className="admin-loading-container">
              <div className="admin-spinner"></div>
              <p style={{ color: "#94a3b8" }}>Loading user accounts...</p>
            </div>
          ) : error ? (
            <div className="admin-error-container">
              <div className="admin-error-icon">⚠️</div>
              <div className="admin-error-msg">{error}</div>
              <button onClick={fetchUsers} className="admin-retry-btn">
                Retry Loading
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="admin-loading-container">
              <p style={{ color: "#cbd5e1", fontSize: "1.05rem" }}>
                No user accounts found matching your filters.
              </p>
            </div>
          ) : (
            <div className="admin-table-card">
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Roles</th>
                      <th>Status</th>
                      <th>Security Flags</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const fullName = [u.firstName, u.lastName].filter(Boolean).join(" ");
                      return (
                        <tr key={u.id}>
                          <td>
                            <div className="admin-user-cell">
                              <div className="admin-avatar-placeholder">
                                {(u.username || "U").charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="admin-user-name">{u.username}</div>
                                {fullName && <div className="admin-user-sub">{fullName}</div>}
                              </div>
                            </div>
                          </td>
                          <td>{u.email}</td>
                          <td>
                            <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                              {u.roles && u.roles.length > 0
                                ? u.roles.map((r) => renderRoleBadge(r))
                                : <span className="admin-badge admin-badge-traveler">Traveler</span>}
                            </div>
                          </td>
                          <td>
                            {u.enabled ? (
                              <span className="admin-badge admin-badge-active">● Active</span>
                            ) : (
                              <span className="admin-badge admin-badge-disabled">● Disabled</span>
                            )}
                          </td>
                          <td>
                            {u.passwordChangeRequired ? (
                              <span className="admin-badge admin-badge-warning" title="User must change password on next login">
                                🔑 Reset Required
                              </span>
                            ) : (
                              <span style={{ color: "#64748b", fontSize: "0.8rem" }}>Normal</span>
                            )}
                          </td>
                          <td>
                            <div className="admin-action-group">
                              <button
                                onClick={() => handleViewUser(u.id)}
                                className="admin-action-btn view"
                                title="View Details"
                              >
                                👁️ Details
                              </button>
                              <button
                                onClick={() => openEditRolesModal(u)}
                                className="admin-action-btn roles"
                                title="Edit Roles"
                              >
                                🛡️ Roles
                              </button>
                              <button
                                onClick={() => handleToggleStatus(u)}
                                className={`admin-action-btn ${u.enabled ? "disable" : "enable"}`}
                                title={u.enabled ? "Disable Account" : "Enable Account"}
                              >
                                {u.enabled ? "🚫 Disable" : "✅ Enable"}
                              </button>
                              <button
                                onClick={() => handleResetPassword(u)}
                                className="admin-action-btn reset"
                                title="Generate Temporary Password"
                              >
                                🔑 Reset Pwd
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

      {/* --- MODAL 1: VIEW USER DETAILS --- */}
      {viewingUser && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">👤 User Account Details</h3>
              <button onClick={() => setViewingUser(null)} className="admin-modal-close">
                ✕
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-detail-grid">
                <div className="admin-detail-item">
                  <div className="admin-detail-label">User ID</div>
                  <div className="admin-detail-val">#{viewingUser.id}</div>
                </div>
                <div className="admin-detail-item">
                  <div className="admin-detail-label">Username</div>
                  <div className="admin-detail-val">{viewingUser.username}</div>
                </div>
                <div className="admin-detail-item">
                  <div className="admin-detail-label">Email</div>
                  <div className="admin-detail-val">{viewingUser.email}</div>
                </div>
                <div className="admin-detail-item">
                  <div className="admin-detail-label">Full Name</div>
                  <div className="admin-detail-val">
                    {[viewingUser.firstName, viewingUser.lastName].filter(Boolean).join(" ") || "—"}
                  </div>
                </div>
                <div className="admin-detail-item">
                  <div className="admin-detail-label">Phone</div>
                  <div className="admin-detail-val">{viewingUser.phone || "—"}</div>
                </div>
                <div className="admin-detail-item">
                  <div className="admin-detail-label">Provider</div>
                  <div className="admin-detail-val">{viewingUser.provider || "LOCAL"}</div>
                </div>
                <div className="admin-detail-item">
                  <div className="admin-detail-label">Location</div>
                  <div className="admin-detail-val">
                    {[viewingUser.city, viewingUser.state, viewingUser.country].filter(Boolean).join(", ") || "—"}
                  </div>
                </div>
                <div className="admin-detail-item">
                  <div className="admin-detail-label">Account Status</div>
                  <div className="admin-detail-val">
                    {viewingUser.enabled ? "Active (Enabled)" : "Disabled"}
                  </div>
                </div>
                <div className="admin-detail-item">
                  <div className="admin-detail-label">Email Verified</div>
                  <div className="admin-detail-val">{viewingUser.emailVerified ? "Yes" : "No"}</div>
                </div>
                <div className="admin-detail-item">
                  <div className="admin-detail-label">Password Reset Required</div>
                  <div className="admin-detail-val">{viewingUser.passwordChangeRequired ? "Yes" : "No"}</div>
                </div>
              </div>
              {viewingUser.bio && (
                <div className="admin-detail-item" style={{ marginTop: "1rem" }}>
                  <div className="admin-detail-label">Bio</div>
                  <div className="admin-detail-val">{viewingUser.bio}</div>
                </div>
              )}
            </div>
            <div className="admin-modal-actions">
              <button onClick={() => setViewingUser(null)} className="admin-btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: EDIT USER ROLES --- */}
      {editingRoleUser && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">🛡️ Update Roles for "{editingRoleUser.username}"</h3>
              <button onClick={() => setEditingRoleUser(null)} className="admin-modal-close">
                ✕
              </button>
            </div>
            <div className="admin-modal-body">
              <p style={{ color: "#94a3b8", fontSize: "0.875rem", marginBottom: "1rem" }}>
                Select the access roles assigned to this account:
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {ALL_ROLES.map((r) => (
                  <label
                    key={r.key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      background: "#0f172a",
                      padding: "0.75rem 1rem",
                      borderRadius: "8px",
                      cursor: "pointer",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(r.key)}
                      onChange={() => handleRoleCheckboxChange(r.key)}
                      style={{ width: "18px", height: "18px", accentColor: "#6366f1" }}
                    />
                    <div>
                      <div style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.9rem" }}>
                        {r.label}
                      </div>
                      <div style={{ color: "#64748b", fontSize: "0.75rem" }}>{r.key}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="admin-modal-actions">
              <button
                onClick={() => setEditingRoleUser(null)}
                className="admin-btn-secondary"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRoles}
                className="admin-btn-primary"
                disabled={actionLoading}
              >
                {actionLoading ? "Saving..." : "Save Roles"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3: TEMPORARY PASSWORD RESET CONFIRMATION --- */}
      {resetPasswordResult && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">🔑 Temporary Password Generated</h3>
              <button onClick={() => setResetPasswordResult(null)} className="admin-modal-close">
                ✕
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-warning-box">
                ⚠️ <strong>IMPORTANT:</strong> Copy this temporary password now. It will only be shown
                once and expires in <strong>24 hours</strong>. The user must change password upon next login.
              </div>

              <div style={{ fontSize: "0.875rem", color: "#cbd5e1", marginBottom: "0.5rem" }}>
                Target Account: <strong>{resetPasswordResult.username}</strong>
              </div>

              <div className="admin-temp-pwd-box">
                <span className="admin-temp-pwd-code">{resetPasswordResult.temporaryPassword}</span>
                <button
                  onClick={() => copyToClipboard(resetPasswordResult.temporaryPassword)}
                  className="admin-copy-btn"
                >
                  {copied ? "✓ Copied!" : "📋 Copy"}
                </button>
              </div>
            </div>
            <div className="admin-modal-actions">
              <button
                onClick={() => setResetPasswordResult(null)}
                className="admin-btn-primary"
              >
                I Have Copied The Password
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminUserManagement;
