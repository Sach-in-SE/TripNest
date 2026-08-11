import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import api from "../services/api";

const Budget = () => {
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [budget, setBudget] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [budgetForm, setBudgetForm] = useState({ totalAmount: "", currency: "INR" });
  const [expenseForm, setExpenseForm] = useState({
    title: "", amount: "", category: "FOOD",
    description: "", date: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTrips(); }, []);

  const fetchTrips = async () => {
    try {
      const res = await api.get("/trips");
      setTrips(res.data);
      if (res.data.length > 0) {
        setSelectedTrip(res.data[0]);
        fetchBudgetData(res.data[0].id);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchBudgetData = async (tripId) => {
    try {
      const [expRes, tripRes] = await Promise.all([
        api.get(`/expenses/trip/${tripId}`),
        api.get(`/trips/${tripId}`),
      ]);
      setExpenses(expRes.data);
      setSelectedTrip(tripRes.data);
      try {
        const budRes = await api.get(`/budget/trip/${tripId}`);
        setBudget(budRes.data);
      } catch { setBudget(null); }
    } catch (err) { console.error(err); }
  };

  const handleTripSelect = (trip) => {
    setSelectedTrip(trip);
    setBudget(null);
    setExpenses([]);
    // Don't call fetchBudgetData here since we already have the trip object
    // Just fetch expenses and budget
    api.get(`/expenses/trip/${trip.id}`).then(res => setExpenses(res.data)).catch(console.error);
    api.get(`/budget/trip/${trip.id}`).then(res => setBudget(res.data)).catch(() => setBudget(null));
  };

  const handleBudgetSubmit = async () => {
    try {
      await api.post("/budget", { ...budgetForm, totalAmount: parseFloat(budgetForm.totalAmount), tripId: selectedTrip.id });
      setShowBudgetForm(false);
      fetchBudgetData(selectedTrip.id);
    } catch (err) { console.error(err); }
  };

  const handleExpenseSubmit = async () => {
    // Validate expense date is within trip timeline
    if (selectedTrip && expenseForm.date) {
      const expenseDate = new Date(expenseForm.date);
      const startDate = selectedTrip.startDate ? new Date(selectedTrip.startDate) : null;
      const endDate = selectedTrip.endDate ? new Date(selectedTrip.endDate) : null;
      
      if (startDate && expenseDate < startDate) {
        alert("Expense date cannot be before trip start date (" + selectedTrip.startDate + ")");
        return;
      }
      if (endDate && expenseDate > endDate) {
        alert("Expense date cannot be after trip end date (" + selectedTrip.endDate + ")");
        return;
      }
    }

    try {
      if (editingExpense) {
        await api.put(`/expenses/${editingExpense.id}`, { ...expenseForm, amount: parseFloat(expenseForm.amount), tripId: selectedTrip.id });
      } else {
        await api.post("/expenses", { ...expenseForm, amount: parseFloat(expenseForm.amount), tripId: selectedTrip.id });
      }
      setShowExpenseForm(false);
      setEditingExpense(null);
      setExpenseForm({ title: "", amount: "", category: "FOOD", description: "", date: "" });
      fetchBudgetData(selectedTrip.id);
    } catch (err) {
      console.error(err);
      if (err.response?.data?.message) {
        alert(err.response.data.message);
      } else {
        alert("Failed to save expense. Please try again.");
      }
    }
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      description: expense.description || "",
      date: expense.date || "",
    });
    setShowExpenseForm(true);
  };

  const handleDeleteExpense = async (id) => {
    if (window.confirm("Delete this expense?")) {
      await api.delete(`/expenses/${id}`);
      fetchBudgetData(selectedTrip.id);
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const categoryIcons = { TRANSPORTATION: "🚗", HOTEL: "🏨", FOOD: "🍽️", SHOPPING: "🛍️", ENTERTAINMENT: "🎭", MISCELLANEOUS: "📦" };

  return (
    <div style={styles.container}>
      <Sidebar />
      <main style={styles.main}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Budget & Expenses 💰</h1>
            <p style={styles.subtitle}>Track your travel spending</p>
          </div>
        </div>

        <div style={styles.tripSelector}>
          {trips.map((trip) => (
            <button key={trip.id}
              onClick={() => handleTripSelect(trip)}
              className={selectedTrip?.id === trip.id ? "btn-aurora" : "btn-ghost"}
              style={{ fontSize: "13px", padding: "8px 16px" }}>
              ✈️ {trip.title}
            </button>
          ))}
        </div>

        {selectedTrip && (
          <>
            <div style={styles.budgetOverview} className="glass-card">
              <div style={styles.budgetLeft}>
                <h2 style={styles.budgetTitle}>Budget Overview</h2>
                <p style={styles.budgetTrip}>✈️ {selectedTrip.title}</p>
                {budget ? (
                  <div style={styles.budgetStats}>
                    <div style={styles.budgetStat}>
                      <p style={styles.statLabel}>Total Budget</p>
                      <p style={styles.statValue}>₹{budget.totalAmount?.toLocaleString()}</p>
                    </div>
                    <div style={styles.budgetStat}>
                      <p style={styles.statLabel}>Spent</p>
                      <p style={{ ...styles.statValue, color: "#ef4444" }}>₹{totalExpenses.toLocaleString()}</p>
                    </div>
                    <div style={styles.budgetStat}>
                      <p style={styles.statLabel}>Remaining</p>
                      <p style={{ ...styles.statValue, color: "#10b981" }}>
                        ₹{Math.max(0, (budget.totalAmount || 0) - totalExpenses).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: "#94a3b8", marginTop: "8px" }}>No budget set for this trip</p>
                )}
              </div>
              <div style={styles.budgetRight}>
                {budget && (
                  <div style={styles.progressSection}>
                    <p style={styles.progressLabel}>
                      {Math.min(100, Math.round((totalExpenses / budget.totalAmount) * 100))}% used
                    </p>
                    <div style={styles.progressBar}>
                      <div style={{
                        ...styles.progressFill,
                        width: `${Math.min(100, (totalExpenses / budget.totalAmount) * 100)}%`,
                        background: totalExpenses > budget.totalAmount
                          ? "#ef4444"
                          : totalExpenses > budget.totalAmount * 0.8
                          ? "#f59e0b"
                          : "linear-gradient(135deg, #7c3aed, #06b6d4)",
                      }} />
                    </div>
                  </div>
                )}
                <div style={styles.budgetActions}>
                  <button className="btn-aurora" onClick={() => {
                    setBudgetForm(budget ? { totalAmount: budget.totalAmount, currency: budget.currency || "INR" } : { totalAmount: "", currency: "INR" });
                    setShowBudgetForm(true);
                  }}
                    style={{ fontSize: "13px", padding: "8px 16px" }}>
                    {budget ? "Update Budget" : "Set Budget"}
                  </button>
                  <button className="btn-aurora" onClick={() => {
                    setEditingExpense(null);
                    setExpenseForm({ title: "", amount: "", category: "FOOD", description: "", date: "" });
                    setShowExpenseForm(true);
                  }}
                    style={{ fontSize: "13px", padding: "8px 16px" }}>
                    + Add Expense
                  </button>
                </div>
              </div>
            </div>

            {showBudgetForm && (
              <div style={styles.modal}>
                <div style={styles.modalCard} className="glass-card">
                  <h3 style={styles.modalTitle}>Set Budget</h3>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Total Amount (₹)</label>
                    <input className="aurora-input" type="number" placeholder="e.g. 25000"
                      value={budgetForm.totalAmount}
                      onChange={(e) => setBudgetForm({ ...budgetForm, totalAmount: e.target.value })} />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Currency</label>
                    <select className="aurora-input" value={budgetForm.currency}
                      onChange={(e) => setBudgetForm({ ...budgetForm, currency: e.target.value })}>
                      {["INR", "USD", "EUR", "GBP"].map(c => (
                        <option key={c} value={c} style={{ background: "#0d1529" }}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div style={styles.modalActions}>
                    <button className="btn-ghost" onClick={() => setShowBudgetForm(false)}>Cancel</button>
                    <button className="btn-aurora" onClick={handleBudgetSubmit}>Save Budget</button>
                  </div>
                </div>
              </div>
            )}

            {showExpenseForm && (
              <div style={styles.modal}>
                <div style={styles.modalCard} className="glass-card">
                  <h3 style={styles.modalTitle}>{editingExpense ? "Edit Expense" : "Add Expense"}</h3>
                  <div style={styles.formGrid}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Title</label>
                      <input className="aurora-input" placeholder="Expense title"
                        value={expenseForm.title}
                        onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })} />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Amount (₹)</label>
                      <input className="aurora-input" type="number" placeholder="0"
                        value={expenseForm.amount}
                        onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Category</label>
                      <select className="aurora-input" value={expenseForm.category}
                        onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}>
                        {["TRANSPORTATION", "HOTEL", "FOOD", "SHOPPING", "ENTERTAINMENT", "MISCELLANEOUS"].map(c => (
                          <option key={c} value={c} style={{ background: "#0d1529" }}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Date</label>
                      <input 
                        className="aurora-input" 
                        type="date" 
                        value={expenseForm.date}
                        min={selectedTrip?.startDate || ""}
                        max={selectedTrip?.endDate || ""}
                        onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })} 
                      />
                      {selectedTrip && (
                        <small style={{ color: "#64748b", fontSize: "11px", marginTop: "4px" }}>
                          Trip dates: {selectedTrip.startDate} to {selectedTrip.endDate}
                        </small>
                      )}
                    </div>
                    <div style={{ ...styles.formGroup, gridColumn: "1 / -1" }}>
                      <label style={styles.label}>Description</label>
                      <input className="aurora-input" placeholder="Description"
                        value={expenseForm.description}
                        onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} />
                    </div>
                  </div>
                  <div style={styles.modalActions}>
                    <button className="btn-ghost" onClick={() => {
                      setShowExpenseForm(false);
                      setEditingExpense(null);
                      setExpenseForm({ title: "", amount: "", category: "FOOD", description: "", date: "" });
                    }}>Cancel</button>
                    <button className="btn-aurora" onClick={handleExpenseSubmit}>{editingExpense ? "Update Expense" : "Add Expense"}</button>
                  </div>
                </div>
              </div>
            )}

            <div style={styles.expensesSection}>
              <h2 style={styles.sectionTitle}>Expenses ({expenses.length})</h2>
              {expenses.length === 0 ? (
                <div style={styles.emptyState} className="glass-card">
                  <span style={{ fontSize: "40px" }}>💸</span>
                  <p style={{ color: "#f1f5f9", fontWeight: "600" }}>No expenses yet</p>
                  <p style={{ color: "#94a3b8", fontSize: "14px" }}>Add your first expense</p>
                </div>
              ) : (
                <div style={styles.expensesList}>
                  {expenses.map((expense) => (
                    <div key={expense.id} style={styles.expenseItem} className="glass-card"
                      onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                      onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>
                      <div style={styles.expenseLeft}>
                        <span style={styles.expenseIcon}>
                          {categoryIcons[expense.category] || "📦"}
                        </span>
                        <div>
                          <p style={styles.expenseTitle}>{expense.title}</p>
                          <p style={styles.expenseMeta}>
                            {expense.category} {expense.date ? `• ${expense.date}` : ""} {expense.username ? `• Added by ${expense.username}` : ""}
                          </p>
                          {expense.description && (
                            <p style={styles.expenseDesc}>{expense.description}</p>
                          )}
                        </div>
                      </div>
                      <div style={styles.expenseRight}>
                        <p style={styles.expenseAmount}>₹{expense.amount?.toLocaleString()}</p>
                        <div style={styles.expenseActions}>
                          <button onClick={() => handleEditExpense(expense)}
                            style={styles.editBtn}>✏️</button>
                          <button onClick={() => handleDeleteExpense(expense.id)}
                            style={styles.deleteBtn}>🗑️</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div style={styles.totalRow}>
                    <span style={styles.totalLabel}>Total Spent</span>
                    <span style={styles.totalAmount}>₹{totalExpenses.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

const styles = {
  container: { display: "flex", minHeight: "100vh", background: "#0a0f1e" },
  main: { marginLeft: "260px", flex: 1, padding: "32px" },
  header: { marginBottom: "24px" },
  title: { fontSize: "28px", fontWeight: "700", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif" },
  subtitle: { color: "#94a3b8", fontSize: "14px", marginTop: "4px" },
  tripSelector: { display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "24px" },
  budgetOverview: { padding: "28px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", gap: "24px" },
  budgetLeft: { flex: 1 },
  budgetTitle: { fontSize: "18px", fontWeight: "600", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "4px" },
  budgetTrip: { color: "#94a3b8", fontSize: "13px", marginBottom: "16px" },
  budgetStats: { display: "flex", gap: "24px" },
  budgetStat: { padding: "12px 16px", background: "rgba(255,255,255,0.05)", borderRadius: "10px", minWidth: "100px" },
  statLabel: { color: "#64748b", fontSize: "12px", marginBottom: "4px" },
  statValue: { color: "#f1f5f9", fontSize: "20px", fontWeight: "700", fontFamily: "'Space Grotesk', sans-serif" },
  budgetRight: { display: "flex", flexDirection: "column", gap: "16px", alignItems: "flex-end" },
  progressSection: { width: "200px" },
  progressLabel: { color: "#94a3b8", fontSize: "13px", marginBottom: "8px", textAlign: "right" },
  progressBar: { width: "100%", height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: "4px", transition: "width 0.3s ease" },
  budgetActions: { display: "flex", gap: "8px" },
  modal: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" },
  modalCard: { width: "480px", maxWidth: "90vw", padding: "32px" },
  modalTitle: { fontSize: "18px", fontWeight: "600", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "20px" },
  formGroup: { display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" },
  label: { color: "#94a3b8", fontSize: "13px", fontWeight: "500" },
  modalActions: { display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "8px" },
  expensesSection: { marginTop: "8px" },
  sectionTitle: { fontSize: "18px", fontWeight: "600", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "16px" },
  emptyState: { padding: "40px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" },
  expensesList: { display: "flex", flexDirection: "column", gap: "12px" },
  expenseItem: { padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "transform 0.2s ease, box-shadow 0.2s ease" },
  expenseLeft: { display: "flex", alignItems: "center", gap: "16px" },
  expenseIcon: { fontSize: "28px" },
  expenseTitle: { color: "#f1f5f9", fontSize: "15px", fontWeight: "500", marginBottom: "2px" },
  expenseMeta: { color: "#64748b", fontSize: "12px" },
  expenseDesc: { color: "#94a3b8", fontSize: "12px", marginTop: "2px" },
  expenseRight: { display: "flex", alignItems: "center", gap: "16px" },
  expenseAmount: { color: "#a78bfa", fontSize: "18px", fontWeight: "700", fontFamily: "'Space Grotesk', sans-serif" },
  expenseActions: { display: "flex", gap: "8px" },
  editBtn: { background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", color: "#93c5fd", borderRadius: "6px", cursor: "pointer", padding: "6px 10px", transition: "background 0.2s ease" },
  deleteBtn: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5", borderRadius: "6px", cursor: "pointer", padding: "6px 10px", transition: "background 0.2s ease" },
  totalRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: "rgba(124,58,237,0.1)", borderRadius: "12px", border: "1px solid rgba(124,58,237,0.3)", marginTop: "4px" },
  totalLabel: { color: "#a78bfa", fontSize: "15px", fontWeight: "600" },
  totalAmount: { color: "#a78bfa", fontSize: "22px", fontWeight: "700", fontFamily: "'Space Grotesk', sans-serif" },
};

export default Budget;