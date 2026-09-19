import { useState, useEffect, useMemo } from "react";
import api from "../services/api";

const CATEGORIES = [
  { value: "FOOD", label: "🍽️ Food & Dining" },
  { value: "TRANSPORTATION", label: "🚗 Transportation" },
  { value: "HOTEL", label: "🏨 Accommodation" },
  { value: "SHOPPING", label: "🛍️ Shopping" },
  { value: "ENTERTAINMENT", label: "🎭 Entertainment" },
  { value: "MISCELLANEOUS", label: "📦 Miscellaneous" },
];

const CreateExpenseModal = ({
  isOpen,
  onClose,
  tripId,
  trip,
  editingExpense = null,
  onExpenseSaved,
}) => {
  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "FOOD",
    date: "",
    description: "",
  });

  const [members, setMembers] = useState([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Load members when modal opens or tripId changes
  useEffect(() => {
    if (!isOpen || !tripId) return;

    let isMounted = true;
    const fetchTripMembers = async () => {
      setLoadingMembers(true);
      try {
        const res = await api.get(`/trips/${tripId}/members`);
        if (isMounted) {
          const fetchedMembers = res.data || [];
          setMembers(fetchedMembers);

          // If editing an existing expense with splits
          if (editingExpense && editingExpense.splitUserIds && editingExpense.splitUserIds.length > 0) {
            setSelectedMemberIds(editingExpense.splitUserIds);
          } else {
            // Default pre-select all active trip members
            setSelectedMemberIds(fetchedMembers.map((m) => m.userId));
          }
        }
      } catch (err) {
        console.error("Failed to load trip members for expense splitting:", err);
        // Fallback: If members API fails, pre-select trip owner if present
        if (isMounted && trip?.user?.id) {
          setMembers([{
            userId: trip.user.id,
            username: trip.user.username || "Trip Owner",
            email: trip.user.email || "",
            role: "OWNER",
          }]);
          setSelectedMemberIds([trip.user.id]);
        }
      } finally {
        if (isMounted) setLoadingMembers(false);
      }
    };

    fetchTripMembers();

    return () => {
      isMounted = false;
    };
  }, [isOpen, tripId, editingExpense, trip]);

  // Sync form values with editingExpense
  useEffect(() => {
    if (editingExpense) {
      setForm({
        title: editingExpense.title || "",
        amount: editingExpense.amount != null ? String(editingExpense.amount) : "",
        category: editingExpense.category || "FOOD",
        date: editingExpense.date || "",
        description: editingExpense.description || "",
      });
    } else {
      const today = new Date().toISOString().split("T")[0];
      let initialDate = today;
      if (trip?.startDate && today < trip.startDate) {
        initialDate = trip.startDate;
      } else if (trip?.endDate && today > trip.endDate) {
        initialDate = trip.startDate || trip.endDate;
      }
      setForm({
        title: "",
        amount: "",
        category: "FOOD",
        date: initialDate,
        description: "",
      });
    }
    setError("");
  }, [editingExpense, isOpen, trip?.startDate, trip?.endDate]);

  // Handle escape key to dismiss
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Calculate dynamic per-head split amount
  const splitCalculation = useMemo(() => {
    const numAmount = parseFloat(form.amount);
    const count = selectedMemberIds.length;

    if (isNaN(numAmount) || numAmount <= 0 || count === 0) {
      return { perPerson: 0, isValid: false, count };
    }

    const perPerson = (numAmount / count).toFixed(2);
    return { perPerson, isValid: true, count };
  }, [form.amount, selectedMemberIds]);

  const handleMemberToggle = (userId) => {
    setSelectedMemberIds((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSelectAll = () => {
    setSelectedMemberIds(members.map((m) => m.userId));
  };

  const handleDeselectAll = () => {
    setSelectedMemberIds([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.title.trim()) {
      setError("Please provide an expense title.");
      return;
    }

    const parsedAmount = parseFloat(form.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid positive expense amount.");
      return;
    }

    if (!form.date) {
      setError("Please select an expense date.");
      return;
    }

    if (trip?.startDate && form.date < trip.startDate) {
      setError(`Expense date cannot be before trip start date (${trip.startDate}).`);
      return;
    }

    if (trip?.endDate && form.date > trip.endDate) {
      setError(`Expense date cannot be after trip end date (${trip.endDate}).`);
      return;
    }

    if (selectedMemberIds.length === 0) {
      setError("Please select at least one member to split this expense with.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        amount: parsedAmount,
        category: form.category,
        date: form.date,
        description: form.description.trim(),
        tripId: Number(tripId),
        splitUserIds: selectedMemberIds,
      };

      if (editingExpense) {
        await api.put(`/expenses/${editingExpense.id}`, payload);
      } else {
        await api.post("/expenses", payload);
      }

      onExpenseSaved?.();
      onClose();
    } catch (err) {
      console.error("Error saving expense:", err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Failed to save expense. Please verify the inputs and try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalCard} className="glass-card">
        <div style={styles.modalHeader}>
          <div>
            <h3 style={styles.modalTitle}>
              {editingExpense ? "✏️ Edit Expense" : "➕ Add New Expense"}
            </h3>
            <p style={styles.modalSubtitle}>
              {trip?.title ? `For trip: ${trip.title}` : "Record and split group spending"}
            </p>
          </div>
          <button
            onClick={onClose}
            style={styles.closeBtn}
            className="btn-ghost"
            title="Close"
          >
            ✕
          </button>
        </div>

        {error && <div style={styles.errorAlert}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Title *</label>
              <input
                className="aurora-input"
                type="text"
                placeholder="e.g. Dinner at Olive Garden, Train tickets"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Total Amount (₹) *</label>
              <input
                className="aurora-input"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Category *</label>
              <select
                className="aurora-input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((cat) => (
                  <option
                    key={cat.value}
                    value={cat.value}
                    style={{ background: "#0d1529", color: "#f1f5f9" }}
                  >
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Date *</label>
              <input
                className="aurora-input"
                type="date"
                value={form.date}
                min={trip?.startDate || ""}
                max={trip?.endDate || ""}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
              {trip?.startDate && trip?.endDate && (
                <small style={styles.dateHelper}>
                  Trip dates: {trip.startDate} to {trip.endDate}
                </small>
              )}
            </div>

            <div style={{ ...styles.formGroup, gridColumn: "1 / -1" }}>
              <label style={styles.label}>Description (Optional)</label>
              <input
                className="aurora-input"
                type="text"
                placeholder="Add notes, split details, or location"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>

          {/* Expense Splitting Section */}
          <div style={styles.splitSection}>
            <div style={styles.splitHeader}>
              <div>
                <h4 style={styles.splitTitle}>⚖️ Split Among Members</h4>
                <p style={styles.splitSubtitle}>
                  Choose who shares the cost of this expense equally
                </p>
              </div>
              <div style={styles.splitActions}>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  style={styles.quickSelectBtn}
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  style={styles.quickSelectBtn}
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Dynamic Real-time Per-Head Preview Banner */}
            <div
              style={{
                ...styles.previewBanner,
                borderColor: splitCalculation.isValid
                  ? "rgba(16, 185, 129, 0.4)"
                  : "rgba(245, 158, 11, 0.3)",
                background: splitCalculation.isValid
                  ? "rgba(16, 185, 129, 0.08)"
                  : "rgba(245, 158, 11, 0.08)",
              }}
            >
              <div style={styles.previewLeft}>
                <span style={{ fontSize: "20px" }}>
                  {splitCalculation.isValid ? "💰" : "⚠️"}
                </span>
                <div>
                  <p
                    style={{
                      ...styles.previewText,
                      color: splitCalculation.isValid ? "#34d399" : "#fbbf24",
                    }}
                  >
                    {splitCalculation.isValid
                      ? `₹${splitCalculation.perPerson} per person`
                      : "Enter an amount and select members to see per-head split"}
                  </p>
                  <p style={styles.previewSubtext}>
                    {splitCalculation.count === 0
                      ? "No members selected (At least 1 required)"
                      : `Split equally among ${splitCalculation.count} ${
                          splitCalculation.count === 1 ? "member" : "members"
                        }`}
                  </p>
                </div>
              </div>
              {splitCalculation.isValid && (
                <div style={styles.previewTag}>
                  Total: ₹{parseFloat(form.amount).toLocaleString()}
                </div>
              )}
            </div>

            {/* Member Checkbox List */}
            {loadingMembers ? (
              <p style={{ color: "#94a3b8", fontSize: "13px", padding: "12px 0" }}>
                Loading trip members...
              </p>
            ) : members.length === 0 ? (
              <div style={styles.noMembersNotice}>
                <p style={{ color: "#94a3b8", fontSize: "13px" }}>
                  No additional collaborators found. This expense will be assigned to you.
                </p>
              </div>
            ) : (
              <div style={styles.memberGrid}>
                {members.map((member) => {
                  const isChecked = selectedMemberIds.includes(member.userId);
                  return (
                    <label
                      key={member.userId}
                      style={{
                        ...styles.memberCard,
                        borderColor: isChecked
                          ? "rgba(124, 58, 237, 0.6)"
                          : "rgba(255, 255, 255, 0.08)",
                        background: isChecked
                          ? "rgba(124, 58, 237, 0.12)"
                          : "rgba(255, 255, 255, 0.03)",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleMemberToggle(member.userId)}
                        style={styles.checkbox}
                      />
                      <div style={styles.memberInfo}>
                        <div style={styles.memberRow}>
                          <span style={styles.memberName}>
                            {member.username || member.email}
                          </span>
                          <span
                            style={{
                              ...styles.roleBadge,
                              ...(member.role === "OWNER"
                                ? styles.ownerBadge
                                : styles.collaboratorBadge),
                            }}
                          >
                            {member.role === "OWNER" ? "👑 Owner" : "🤝 Collaborator"}
                          </span>
                        </div>
                        {member.email && (
                          <span style={styles.memberEmail}>{member.email}</span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div style={styles.modalActions}>
            <button
              type="button"
              className="btn-ghost"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-aurora"
              disabled={submitting || selectedMemberIds.length === 0}
            >
              {submitting
                ? "Saving..."
                : editingExpense
                ? "Update Expense"
                : "Add Expense"}
            </button>
          </div>
        </form>
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
    background: "rgba(3, 7, 18, 0.75)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px",
  },
  modalCard: {
    width: "600px",
    maxWidth: "94vw",
    maxHeight: "90vh",
    overflowY: "auto",
    padding: "32px",
    borderRadius: "16px",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    background: "rgba(15, 23, 42, 0.88)",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "20px",
  },
  modalTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#f1f5f9",
    fontFamily: "'Space Grotesk', sans-serif",
    margin: 0,
  },
  modalSubtitle: {
    color: "#94a3b8",
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
  errorAlert: {
    padding: "12px 16px",
    background: "rgba(239, 68, 68, 0.15)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: "8px",
    color: "#fca5a5",
    fontSize: "13px",
    marginBottom: "16px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    color: "#94a3b8",
    fontSize: "13px",
    fontWeight: "500",
  },
  dateHelper: {
    color: "#64748b",
    fontSize: "11px",
    marginTop: "2px",
  },
  splitSection: {
    padding: "16px",
    background: "rgba(255, 255, 255, 0.02)",
    borderRadius: "12px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
  },
  splitHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px",
  },
  splitTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#f1f5f9",
    margin: 0,
    fontFamily: "'Space Grotesk', sans-serif",
  },
  splitSubtitle: {
    color: "#64748b",
    fontSize: "12px",
    margin: "2px 0 0 0",
  },
  splitActions: {
    display: "flex",
    gap: "8px",
  },
  quickSelectBtn: {
    background: "rgba(255, 255, 255, 0.06)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    color: "#cbd5e1",
    fontSize: "11px",
    fontWeight: "500",
    padding: "4px 8px",
    borderRadius: "6px",
    cursor: "pointer",
  },
  previewBanner: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    borderRadius: "10px",
    border: "1px solid",
    marginBottom: "16px",
  },
  previewLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  previewText: {
    fontSize: "14px",
    fontWeight: "600",
    margin: 0,
    fontFamily: "'Space Grotesk', sans-serif",
  },
  previewSubtext: {
    color: "#94a3b8",
    fontSize: "11px",
    margin: "2px 0 0 0",
  },
  previewTag: {
    background: "rgba(16, 185, 129, 0.15)",
    border: "1px solid rgba(16, 185, 129, 0.3)",
    color: "#34d399",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
  },
  memberGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    maxHeight: "180px",
    overflowY: "auto",
    paddingRight: "4px",
  },
  memberCard: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  checkbox: {
    width: "16px",
    height: "16px",
    cursor: "pointer",
    accentColor: "#7c3aed",
  },
  memberInfo: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    overflow: "hidden",
  },
  memberRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "6px",
  },
  memberName: {
    color: "#f1f5f9",
    fontSize: "13px",
    fontWeight: "500",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  memberEmail: {
    color: "#64748b",
    fontSize: "11px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  roleBadge: {
    fontSize: "10px",
    fontWeight: "600",
    padding: "2px 6px",
    borderRadius: "4px",
  },
  ownerBadge: {
    background: "rgba(245, 158, 11, 0.15)",
    color: "#fbbf24",
    border: "1px solid rgba(245, 158, 11, 0.3)",
  },
  collaboratorBadge: {
    background: "rgba(124, 58, 237, 0.15)",
    color: "#c084fc",
    border: "1px solid rgba(124, 58, 237, 0.3)",
  },
  noMembersNotice: {
    padding: "16px",
    textAlign: "center",
    background: "rgba(255, 255, 255, 0.02)",
    borderRadius: "8px",
  },
  modalActions: {
    display: "flex",
    gap: "12px",
    justifyContent: "flex-end",
    marginTop: "8px",
  },
};

export default CreateExpenseModal;
