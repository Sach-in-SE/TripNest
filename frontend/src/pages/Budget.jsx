import { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import CreateExpenseModal from "../components/CreateExpenseModal";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const Budget = () => {
  const { user: currentUser } = useAuth();
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [budget, setBudget] = useState(null);
  const [expenses, setExpenses] = useState([]);

  // Tab State
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "balances"

  // Budget modal state
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ totalAmount: "", currency: "INR" });

  // Expense modal state
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  // Group Balances & Debt state
  const [balancesData, setBalancesData] = useState(null);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [settlingDebtId, setSettlingDebtId] = useState(null);
  const [settleMsg, setSettleMsg] = useState("");
  const [settleError, setSettleError] = useState("");

  const [_loading, setLoading] = useState(true);

  const fetchGroupBalances = useCallback(async (tripId) => {
    if (!tripId) return;
    setLoadingBalances(true);
    setSettleError("");
    try {
      const res = await api.get(`/trips/${tripId}/balances`);
      setBalancesData(res.data);
    } catch (err) {
      console.error("Failed to load group balances:", err);
    } finally {
      setLoadingBalances(false);
    }
  }, []);

  const fetchBudgetData = useCallback(async (tripId) => {
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
      } catch {
        setBudget(null);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchTrips = useCallback(async () => {
    try {
      const res = await api.get("/trips");
      setTrips(res.data);
      if (res.data.length > 0) {
        setSelectedTrip(res.data[0]);
        fetchBudgetData(res.data[0].id);
        fetchGroupBalances(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [fetchBudgetData, fetchGroupBalances]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const handleTripSelect = (trip) => {
    setSelectedTrip(trip);
    setBudget(null);
    setExpenses([]);
    setBalancesData(null);
    api.get(`/expenses/trip/${trip.id}`).then((res) => setExpenses(res.data)).catch(console.error);
    api.get(`/budget/trip/${trip.id}`).then((res) => setBudget(res.data)).catch(() => setBudget(null));
    fetchGroupBalances(trip.id);
  };

  const handleBudgetSubmit = async () => {
    try {
      await api.post("/budget", {
        ...budgetForm,
        currency: "INR",
        totalAmount: parseFloat(budgetForm.totalAmount),
        tripId: selectedTrip.id,
      });
      setShowBudgetForm(false);
      fetchBudgetData(selectedTrip.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setShowExpenseModal(true);
  };

  const handleDeleteExpense = async (id) => {
    if (window.confirm("Are you sure you want to delete this expense? All corresponding splits will also be removed.")) {
      try {
        await api.delete(`/expenses/${id}`);
        fetchBudgetData(selectedTrip.id);
        fetchGroupBalances(selectedTrip.id);
      } catch (err) {
        console.error("Failed to delete expense:", err);
      }
    }
  };

  const handleSettleDebt = async (settlementId, payerName, payeeName, amount) => {
    if (!settlementId) return;
    const confirmText = `Confirm manual settlement: Mark ₹${amount} from ${payerName} to ${payeeName} as settled?`;
    if (!window.confirm(confirmText)) return;

    setSettlingDebtId(settlementId);
    setSettleMsg("");
    setSettleError("");

    try {
      const res = await api.post(`/settlements/${settlementId}/settle`);
      setSettleMsg(`Payment of ₹${res.data?.amount || amount} between ${payerName} and ${payeeName} successfully settled!`);
      await Promise.all([
        fetchGroupBalances(selectedTrip.id),
        fetchBudgetData(selectedTrip.id),
      ]);
      setTimeout(() => setSettleMsg(""), 5000);
    } catch (err) {
      console.error("Failed to settle debt:", err);
      setSettleError(err.response?.data?.message || "Failed to settle debt. Please try again.");
      setTimeout(() => setSettleError(""), 5000);
    } finally {
      setSettlingDebtId(null);
    }
  };

  // Safe currency arithmetic helper avoiding IEEE 754 floating point artifacts
  const safeRound = (val) => Math.round((Number(val) || 0) * 100) / 100;
  const safeAdd = (acc, curr) => Math.round(((Number(acc) || 0) + (Number(curr) || 0)) * 100) / 100;
  const formatAmount = (val) => {
    const num = safeRound(val);
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Safe category expense summation and total calculations avoiding IEEE 754 precision drift
  const totalExpenses = safeRound(
    expenses.reduce((acc, curr) => safeAdd(acc, curr?.amount), 0)
  );

  const categoryExpenses = expenses.reduce((acc, curr) => {
    const category = curr?.category || "MISCELLANEOUS";
    acc[category] = safeAdd(acc[category] || 0, curr?.amount);
    return acc;
  }, {});

  const remainingBudget = budget
    ? Math.max(0, safeRound((budget.totalAmount || 0) - totalExpenses))
    : 0;

  const categoryIcons = {
    TRANSPORTATION: "🚗",
    HOTEL: "🏨",
    FOOD: "🍽️",
    SHOPPING: "🛍️",
    ENTERTAINMENT: "🎭",
    MISCELLANEOUS: "📦",
  };

  // Find current user's net balance if available
  const myBalance = balancesData?.userBalances?.find(
    (b) => b.userId === currentUser?.id || b.username === currentUser?.username
  );

  return (
    <div className="tn-user-layout-container">
      <Sidebar />
      <main className="tn-user-main">
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Budget & Expenses 💰</h1>
            <p style={styles.subtitle}>Track spending, split expenses, and settle debts easily</p>
          </div>
        </div>

        {/* Trip Selector Buttons */}
        <div style={styles.tripSelector}>
          {trips.map((trip) => (
            <button
              key={trip.id}
              onClick={() => handleTripSelect(trip)}
              className={selectedTrip?.id === trip.id ? "btn-aurora" : "btn-ghost"}
              style={{ fontSize: "13px", padding: "8px 16px" }}
            >
              ✈️ {trip.title}
            </button>
          ))}
        </div>

        {selectedTrip && (
          <>
            {/* Tab Navigation System */}
            <div style={styles.tabsContainer}>
              <button
                onClick={() => setActiveTab("overview")}
                style={{
                  ...styles.tabBtn,
                  ...(activeTab === "overview" ? styles.activeTabBtn : styles.inactiveTabBtn),
                }}
              >
                📊 Overview & Expenses
              </button>
              <button
                onClick={() => {
                  setActiveTab("balances");
                  fetchGroupBalances(selectedTrip.id);
                }}
                style={{
                  ...styles.tabBtn,
                  ...(activeTab === "balances" ? styles.activeTabBtn : styles.inactiveTabBtn),
                }}
              >
                ⚖️ Group Balances & Debt Summary
                {balancesData?.debts?.length > 0 && (
                  <span style={styles.debtCountBadge}>
                    {balancesData.debts.length}
                  </span>
                )}
              </button>
            </div>

            {/* TAB 1: OVERVIEW & EXPENSES */}
            {activeTab === "overview" && (
              <>
                <div style={styles.budgetOverview} className="glass-card">
                  <div style={styles.budgetLeft}>
                    <h2 style={styles.budgetTitle}>Budget Overview</h2>
                    <p style={styles.budgetTrip}>✈️ {selectedTrip.title}</p>
                    {budget ? (
                      <>
                        <div style={styles.budgetStats}>
                          <div style={styles.budgetStat}>
                            <p style={styles.statLabel}>Total Budget</p>
                            <p style={styles.statValue}>₹{formatAmount(budget.totalAmount)}</p>
                          </div>
                          <div style={styles.budgetStat}>
                            <p style={styles.statLabel}>Spent</p>
                            <p style={{ ...styles.statValue, color: "#ef4444" }}>
                              ₹{formatAmount(totalExpenses)}
                            </p>
                          </div>
                          <div style={styles.budgetStat}>
                            <p style={styles.statLabel}>Remaining</p>
                            <p style={{ ...styles.statValue, color: "#10b981" }}>
                              ₹{formatAmount(remainingBudget)}
                            </p>
                          </div>
                        </div>
                        {Object.keys(categoryExpenses).length > 0 && (
                          <div style={styles.categorySummaryRow}>
                            {Object.entries(categoryExpenses).map(([cat, amt]) => (
                              <div key={cat} style={styles.categoryPill} className="glass-card">
                                <span>{categoryIcons[cat] || "📦"} {cat}:</span>
                                <span style={{ fontWeight: "600", color: "#a78bfa" }}>₹{Number(amt).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
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
                          <div
                            style={{
                              ...styles.progressFill,
                              width: `${Math.min(100, (totalExpenses / budget.totalAmount) * 100)}%`,
                              background:
                                totalExpenses > budget.totalAmount
                                  ? "#ef4444"
                                  : totalExpenses > budget.totalAmount * 0.8
                                  ? "#f59e0b"
                                  : "linear-gradient(135deg, #7c3aed, #06b6d4)",
                            }}
                          />
                        </div>
                      </div>
                    )}
                    <div style={styles.budgetActions}>
                      <button
                        className="btn-aurora"
                        onClick={() => {
                          setBudgetForm(
                            budget
                              ? { totalAmount: budget.totalAmount, currency: "INR" }
                              : { totalAmount: "", currency: "INR" }
                          );
                          setShowBudgetForm(true);
                        }}
                        style={{ fontSize: "13px", padding: "8px 16px" }}
                      >
                        {budget ? "Update Budget" : "Set Budget"}
                      </button>
                      <button
                        className="btn-aurora"
                        onClick={() => {
                          setEditingExpense(null);
                          setShowExpenseModal(true);
                        }}
                        style={{ fontSize: "13px", padding: "8px 16px" }}
                      >
                        + Add Expense
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expenses List */}
                <div style={styles.expensesSection}>
                  <div style={styles.expensesSectionHeader}>
                    <h2 style={styles.sectionTitle}>Expenses ({expenses.length})</h2>
                    <button
                      className="btn-aurora"
                      onClick={() => {
                        setEditingExpense(null);
                        setShowExpenseModal(true);
                      }}
                      style={{ fontSize: "12px", padding: "6px 12px" }}
                    >
                      + Add New Expense
                    </button>
                  </div>

                  {expenses.length === 0 ? (
                    <div style={styles.emptyState} className="glass-card">
                      <span style={{ fontSize: "40px" }}>💸</span>
                      <p style={{ color: "#f1f5f9", fontWeight: "600" }}>No expenses yet</p>
                      <p style={{ color: "#94a3b8", fontSize: "14px" }}>
                        Click &quot;+ Add Expense&quot; above to log your first expenditure and split it.
                      </p>
                    </div>
                  ) : (
                    <div style={styles.expensesList}>
                      {expenses.map((expense) => (
                        <div
                          key={expense.id}
                          style={styles.expenseItem}
                          className="glass-card"
                          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                        >
                          <div style={styles.expenseLeft}>
                            <span style={styles.expenseIcon}>
                              {categoryIcons[expense.category] || "📦"}
                            </span>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <p style={styles.expenseTitle}>{expense.title}</p>
                                {expense.splitUserIds && expense.splitUserIds.length > 1 && (
                                  <span style={styles.splitBadge}>
                                    ⚖️ Split ({expense.splitUserIds.length})
                                  </span>
                                )}
                              </div>
                              <p style={styles.expenseMeta}>
                                {expense.category} {expense.date ? `• ${expense.date}` : ""}{" "}
                                {expense.username ? `• Paid by ${expense.username}` : ""}
                              </p>
                              {expense.description && (
                                <p style={styles.expenseDesc}>{expense.description}</p>
                              )}
                            </div>
                          </div>
                          <div style={styles.expenseRight}>
                            <p style={styles.expenseAmount}>₹{formatAmount(expense.amount)}</p>
                            <div style={styles.expenseActions}>
                              <button
                                onClick={() => handleEditExpense(expense)}
                                style={styles.editBtn}
                                title="Edit Expense"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(expense.id)}
                                style={styles.deleteBtn}
                                title="Delete Expense"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div style={styles.totalRow}>
                        <span style={styles.totalLabel}>Total Spent</span>
                        <span style={styles.totalAmount}>₹{formatAmount(totalExpenses)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* TAB 2: GROUP BALANCES & DEBT SUMMARY */}
            {activeTab === "balances" && (
              <div style={styles.balancesContainer}>
                {/* Alerts */}
                {settleMsg && <div style={styles.successBanner}>✅ {settleMsg}</div>}
                {settleError && <div style={styles.errorBanner}>❌ {settleError}</div>}

                {/* Summary Top Cards */}
                <div style={styles.summaryGrid}>
                  <div style={styles.summaryCard} className="glass-card">
                    <span style={styles.summaryCardIcon}>💰</span>
                    <div>
                      <p style={styles.summaryCardLabel}>Total Trip Expenses</p>
                      <p style={styles.summaryCardValue}>
                        ₹{balancesData ? Number(balancesData.totalExpenses).toLocaleString() : "0"}
                      </p>
                    </div>
                  </div>

                  <div style={styles.summaryCard} className="glass-card">
                    <span style={styles.summaryCardIcon}>👥</span>
                    <div>
                      <p style={styles.summaryCardLabel}>Active Members</p>
                      <p style={styles.summaryCardValue}>
                        {balancesData?.userBalances?.length || 0}
                      </p>
                    </div>
                  </div>

                  <div style={styles.summaryCard} className="glass-card">
                    <span style={styles.summaryCardIcon}>⚖️</span>
                    <div>
                      <p style={styles.summaryCardLabel}>Pending Settlements</p>
                      <p
                        style={{
                          ...styles.summaryCardValue,
                          color: (balancesData?.debts?.length || 0) > 0 ? "#f59e0b" : "#10b981",
                        }}
                      >
                        {balancesData?.debts?.length || 0}
                      </p>
                    </div>
                  </div>

                  {myBalance && (
                    <div
                      style={{
                        ...styles.summaryCard,
                        border:
                          Number(myBalance.netBalance) > 0
                            ? "1px solid rgba(16, 185, 129, 0.4)"
                            : Number(myBalance.netBalance) < 0
                            ? "1px solid rgba(239, 68, 68, 0.4)"
                            : "1px solid rgba(255, 255, 255, 0.1)",
                      }}
                      className="glass-card"
                    >
                      <span style={styles.summaryCardIcon}>
                        {Number(myBalance.netBalance) > 0
                          ? "💚"
                          : Number(myBalance.netBalance) < 0
                          ? "🔴"
                          : "🎉"}
                      </span>
                      <div>
                        <p style={styles.summaryCardLabel}>Your Net Position</p>
                        <p
                          style={{
                            ...styles.summaryCardValue,
                            color:
                              Number(myBalance.netBalance) > 0
                                ? "#34d399"
                                : Number(myBalance.netBalance) < 0
                                ? "#f87171"
                                : "#a78bfa",
                          }}
                        >
                          {Number(myBalance.netBalance) > 0
                            ? `+₹${Number(myBalance.netBalance).toLocaleString()}`
                            : Number(myBalance.netBalance) < 0
                            ? `-₹${Math.abs(Number(myBalance.netBalance)).toLocaleString()}`
                            : "Settled Up (₹0)"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section 1: Simplified Debt Settlements */}
                <div style={styles.sectionBlock}>
                  <div style={styles.sectionTitleRow}>
                    <div>
                      <h3 style={styles.sectionHeading}>🤝 Simplified Debt Graph</h3>
                      <p style={styles.sectionSubheading}>
                        Optimized bilateral settlements minimizing transaction counts (&quot;Who owes whom how much&quot;)
                      </p>
                    </div>
                    <button
                      className="btn-ghost"
                      onClick={() => fetchGroupBalances(selectedTrip.id)}
                      style={{ fontSize: "12px", padding: "6px 12px" }}
                      disabled={loadingBalances}
                    >
                      🔄 {loadingBalances ? "Refreshing..." : "Refresh Balances"}
                    </button>
                  </div>

                  {loadingBalances ? (
                    <div style={styles.loadingBox} className="glass-card">
                      <p style={{ color: "#94a3b8" }}>Calculating balances and simplifying debts...</p>
                    </div>
                  ) : !balancesData?.debts || balancesData.debts.length === 0 ? (
                    <div style={styles.emptyState} className="glass-card">
                      <span style={{ fontSize: "36px" }}>🎉</span>
                      <p style={{ color: "#f1f5f9", fontWeight: "600" }}>All settled up!</p>
                      <p style={{ color: "#94a3b8", fontSize: "13px" }}>
                        There are no outstanding debts among members for this trip.
                      </p>
                    </div>
                  ) : (
                    <div style={styles.debtsGrid}>
                      {balancesData.debts.map((debt) => {
                        const isSettling = settlingDebtId === debt.settlementId;
                        return (
                          <div key={debt.settlementId} style={styles.debtCard} className="glass-card">
                            <div style={styles.debtVisual}>
                              <div style={styles.debtParticipant}>
                                <div style={styles.debtAvatar}>{debt.payerName?.charAt(0).toUpperCase() || "P"}</div>
                                <span style={styles.debtPayerName}>{debt.payerName}</span>
                                <span style={styles.debtRoleOwer}>Owes</span>
                              </div>

                              <div style={styles.debtFlow}>
                                <span style={styles.debtAmountHighlight}>₹{Number(debt.amount).toLocaleString()}</span>
                                <span style={styles.debtArrow}>➔</span>
                              </div>

                              <div style={styles.debtParticipant}>
                                <div style={styles.debtAvatarReceiver}>{debt.payeeName?.charAt(0).toUpperCase() || "R"}</div>
                                <span style={styles.debtPayeeName}>{debt.payeeName}</span>
                                <span style={styles.debtRoleReceiver}>Receives</span>
                              </div>
                            </div>

                            <div style={styles.debtCardFooter}>
                              <span style={styles.pendingStatusBadge}>● PENDING OFFLINE</span>
                              <button
                                className="btn-aurora"
                                onClick={() => handleSettleDebt(debt.settlementId, debt.payerName, debt.payeeName, debt.amount)}
                                disabled={isSettling}
                                style={{ fontSize: "12px", padding: "8px 16px" }}
                              >
                                {isSettling ? "Settling..." : "✓ Settle Up / Mark Settled"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Section 2: Individual Member Net Balances */}
                <div style={styles.sectionBlock}>
                  <h3 style={styles.sectionHeading}>👥 Member Net Balances</h3>
                  <p style={styles.sectionSubheading}>
                    Net = Total Paid - Total Share Owed + Settlements Paid - Settlements Received
                  </p>

                  <div style={styles.memberBalancesGrid}>
                    {balancesData?.userBalances?.map((ub) => {
                      const net = Number(ub.netBalance);
                      const isPositive = net > 0.005;
                      const isNegative = net < -0.005;

                      return (
                        <div key={ub.userId} style={styles.memberBalanceCard} className="glass-card">
                          <div style={styles.memberBalanceHeader}>
                            <div style={styles.userIconCircle}>
                              {ub.username?.charAt(0).toUpperCase() || "U"}
                            </div>
                            <div>
                              <p style={styles.balanceUsername}>{ub.username}</p>
                              <p style={styles.balanceEmail}>{ub.email}</p>
                            </div>
                          </div>

                          <div style={styles.balanceBreakdown}>
                            <div style={styles.breakdownRow}>
                              <span style={styles.breakdownLabel}>Paid for Expenses:</span>
                              <span style={styles.breakdownVal}>₹{Number(ub.totalPaid).toLocaleString()}</span>
                            </div>
                            <div style={styles.breakdownRow}>
                              <span style={styles.breakdownLabel}>Share of Costs:</span>
                              <span style={styles.breakdownVal}>₹{Number(ub.totalShareOwed).toLocaleString()}</span>
                            </div>
                            {Number(ub.settlementsPaid) > 0 && (
                              <div style={styles.breakdownRow}>
                                <span style={styles.breakdownLabel}>Settled by user:</span>
                                <span style={{ ...styles.breakdownVal, color: "#34d399" }}>
                                  +₹{Number(ub.settlementsPaid).toLocaleString()}
                                </span>
                              </div>
                            )}
                            {Number(ub.settlementsReceived) > 0 && (
                              <div style={styles.breakdownRow}>
                                <span style={styles.breakdownLabel}>Received from settlements:</span>
                                <span style={{ ...styles.breakdownVal, color: "#f87171" }}>
                                  -₹{Number(ub.settlementsReceived).toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>

                          <div
                            style={{
                              ...styles.balanceFooter,
                              borderTop: isPositive
                                ? "1px solid rgba(16, 185, 129, 0.3)"
                                : isNegative
                                ? "1px solid rgba(239, 68, 68, 0.3)"
                                : "1px solid rgba(255, 255, 255, 0.08)",
                            }}
                          >
                            <span style={styles.netLabel}>Net Balance:</span>
                            <span
                              style={{
                                ...styles.netValue,
                                color: isPositive ? "#34d399" : isNegative ? "#f87171" : "#94a3b8",
                              }}
                            >
                              {isPositive
                                ? `+₹${net.toLocaleString()}`
                                : isNegative
                                ? `-₹${Math.abs(net).toLocaleString()}`
                                : "₹0.00"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section 3: Completed Settlements History */}
                {balancesData?.settledHistory && balancesData.settledHistory.length > 0 && (
                  <div style={styles.sectionBlock}>
                    <h3 style={styles.sectionHeading}>📜 Settlement History</h3>
                    <p style={styles.sectionSubheading}>
                      Confirmed offline payments recorded for this trip
                    </p>

                    <div style={styles.settledList}>
                      {balancesData.settledHistory.map((sh) => (
                        <div key={sh.id} style={styles.settledItem} className="glass-card">
                          <div style={styles.settledLeft}>
                            <span style={{ fontSize: "20px" }}>✅</span>
                            <div>
                              <p style={styles.settledTitle}>
                                <strong>{sh.payerName}</strong> settled with <strong>{sh.payeeName}</strong>
                              </p>
                              <p style={styles.settledDate}>
                                {sh.settledAt
                                  ? new Date(sh.settledAt).toLocaleString()
                                  : "Completed Offline"}
                              </p>
                            </div>
                          </div>
                          <div style={styles.settledRight}>
                            <span style={styles.settledAmount}>
                              ₹{Number(sh.amount).toLocaleString()}
                            </span>
                            <span style={styles.settledBadge}>SETTLED</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Set Budget Modal */}
            {showBudgetForm && (
              <div style={styles.modal}>
                <div style={styles.modalCard} className="glass-card">
                  <h3 style={styles.modalTitle}>Set Budget</h3>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Total Amount (₹)</label>
                    <input
                      className="aurora-input"
                      type="number"
                      placeholder="e.g. 25000"
                      value={budgetForm.totalAmount}
                      onChange={(e) => setBudgetForm({ ...budgetForm, totalAmount: e.target.value })}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Currency</label>
                    <select
                      className="aurora-input"
                      value="INR"
                      disabled
                      aria-label="Currency"
                    >
                      <option value="INR" style={{ background: "#0d1529" }}>
                        INR (₹)
                      </option>
                    </select>
                  </div>
                  <div style={styles.modalActions}>
                    <button className="btn-ghost" onClick={() => setShowBudgetForm(false)}>
                      Cancel
                    </button>
                    <button className="btn-aurora" onClick={handleBudgetSubmit}>
                      Save Budget
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Expense Creation & Split Modal */}
            <CreateExpenseModal
              isOpen={showExpenseModal}
              onClose={() => {
                setShowExpenseModal(false);
                setEditingExpense(null);
              }}
              tripId={selectedTrip.id}
              trip={selectedTrip}
              editingExpense={editingExpense}
              onExpenseSaved={() => {
                fetchBudgetData(selectedTrip.id);
                fetchGroupBalances(selectedTrip.id);
              }}
            />
          </>
        )}
      </main>
    </div>
  );
};

const styles = {
  header: { marginBottom: "20px" },
  title: { fontSize: "28px", fontWeight: "700", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif" },
  subtitle: { color: "#94a3b8", fontSize: "14px", marginTop: "4px" },
  tripSelector: { display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px" },

  // Tabs
  tabsContainer: {
    display: "flex",
    gap: "8px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    marginBottom: "24px",
    paddingBottom: "8px",
  },
  tabBtn: {
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: "600",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    border: "none",
  },
  activeTabBtn: {
    background: "linear-gradient(135deg, rgba(124, 58, 237, 0.3), rgba(6, 182, 212, 0.2))",
    border: "1px solid rgba(124, 58, 237, 0.5)",
    color: "#f1f5f9",
  },
  inactiveTabBtn: {
    background: "transparent",
    color: "#94a3b8",
  },
  debtCountBadge: {
    background: "#ef4444",
    color: "#ffffff",
    fontSize: "11px",
    fontWeight: "700",
    padding: "2px 7px",
    borderRadius: "12px",
  },

  // Budget Overview
  budgetOverview: {
    padding: "28px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px",
    gap: "24px",
  },
  budgetLeft: { flex: 1 },
  budgetTitle: { fontSize: "18px", fontWeight: "600", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "4px" },
  budgetTrip: { color: "#94a3b8", fontSize: "13px", marginBottom: "16px" },
  budgetStats: { display: "flex", gap: "24px", flexWrap: "wrap" },
  budgetStat: { padding: "12px 16px", background: "rgba(255,255,255,0.05)", borderRadius: "10px", minWidth: "100px" },
  statLabel: { color: "#64748b", fontSize: "12px", marginBottom: "4px" },
  statValue: { color: "#f1f5f9", fontSize: "20px", fontWeight: "700", fontFamily: "'Space Grotesk', sans-serif" },
  budgetRight: { display: "flex", flexDirection: "column", gap: "16px", alignItems: "flex-end" },
  progressSection: { width: "200px" },
  progressLabel: { color: "#94a3b8", fontSize: "13px", marginBottom: "8px", textAlign: "right" },
  progressBar: { width: "100%", height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: "4px", transition: "width 0.3s ease" },
  budgetActions: { display: "flex", gap: "8px" },

  // Expenses Section
  expensesSection: { marginTop: "8px" },
  expensesSectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  sectionTitle: { fontSize: "18px", fontWeight: "600", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif", margin: 0 },
  emptyState: { padding: "40px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" },
  expensesList: { display: "flex", flexDirection: "column", gap: "12px" },
  expenseItem: { padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "transform 0.2s ease, box-shadow 0.2s ease" },
  expenseLeft: { display: "flex", alignItems: "center", gap: "16px" },
  expenseIcon: { fontSize: "28px" },
  expenseTitle: { color: "#f1f5f9", fontSize: "15px", fontWeight: "500", margin: 0 },
  splitBadge: {
    fontSize: "11px",
    fontWeight: "600",
    padding: "2px 8px",
    borderRadius: "12px",
    background: "rgba(124, 58, 237, 0.2)",
    color: "#c084fc",
    border: "1px solid rgba(124, 58, 237, 0.4)",
  },
  expenseMeta: { color: "#64748b", fontSize: "12px", margin: "4px 0 0 0" },
  expenseDesc: { color: "#94a3b8", fontSize: "12px", marginTop: "2px", margin: "4px 0 0 0" },
  expenseRight: { display: "flex", alignItems: "center", gap: "16px" },
  expenseAmount: { color: "#a78bfa", fontSize: "18px", fontWeight: "700", fontFamily: "'Space Grotesk', sans-serif" },
  expenseActions: { display: "flex", gap: "8px" },
  editBtn: { background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", color: "#93c5fd", borderRadius: "6px", cursor: "pointer", padding: "6px 10px" },
  deleteBtn: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5", borderRadius: "6px", cursor: "pointer", padding: "6px 10px" },
  totalRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: "rgba(124,58,237,0.1)", borderRadius: "12px", border: "1px solid rgba(124,58,237,0.3)", marginTop: "4px" },
  totalLabel: { color: "#a78bfa", fontSize: "15px", fontWeight: "600" },
  totalAmount: { color: "#a78bfa", fontSize: "22px", fontWeight: "700", fontFamily: "'Space Grotesk', sans-serif" },
  categorySummaryRow: { display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "16px" },
  categoryPill: { display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "20px", fontSize: "12px", background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)" },

  // Balances Tab
  balancesContainer: { display: "flex", flexDirection: "column", gap: "24px" },
  successBanner: { padding: "12px 16px", background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.4)", color: "#34d399", borderRadius: "10px", fontSize: "13px" },
  errorBanner: { padding: "12px 16px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.4)", color: "#fca5a5", borderRadius: "10px", fontSize: "13px" },

  summaryGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" },
  summaryCard: { padding: "18px", display: "flex", alignItems: "center", gap: "14px", borderRadius: "12px" },
  summaryCardIcon: { fontSize: "26px" },
  summaryCardLabel: { color: "#94a3b8", fontSize: "12px", margin: "0 0 4px 0" },
  summaryCardValue: { color: "#f1f5f9", fontSize: "20px", fontWeight: "700", fontFamily: "'Space Grotesk', sans-serif", margin: 0 },

  sectionBlock: { display: "flex", flexDirection: "column", gap: "12px" },
  sectionTitleRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  sectionHeading: { fontSize: "18px", fontWeight: "600", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif", margin: 0 },
  sectionSubheading: { color: "#64748b", fontSize: "13px", margin: "4px 0 0 0" },
  loadingBox: { padding: "30px", textAlign: "center" },

  // Simplified Debts
  debtsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" },
  debtCard: { padding: "20px", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "16px" },
  debtVisual: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0" },
  debtParticipant: { display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", width: "90px" },
  debtAvatar: { width: "40px", height: "40px", borderRadius: "50%", background: "rgba(239, 68, 68, 0.2)", border: "1px solid rgba(239, 68, 68, 0.4)", color: "#f87171", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "16px" },
  debtAvatarReceiver: { width: "40px", height: "40px", borderRadius: "50%", background: "rgba(16, 185, 129, 0.2)", border: "1px solid rgba(16, 185, 129, 0.4)", color: "#34d399", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "16px" },
  debtPayerName: { color: "#f1f5f9", fontSize: "13px", fontWeight: "600", textAlign: "center" },
  debtPayeeName: { color: "#f1f5f9", fontSize: "13px", fontWeight: "600", textAlign: "center" },
  debtRoleOwer: { color: "#f87171", fontSize: "11px", fontWeight: "500" },
  debtRoleReceiver: { color: "#34d399", fontSize: "11px", fontWeight: "500" },
  debtFlow: { display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" },
  debtAmountHighlight: { color: "#fbbf24", fontSize: "20px", fontWeight: "700", fontFamily: "'Space Grotesk', sans-serif" },
  debtArrow: { color: "#64748b", fontSize: "18px" },
  debtCardFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "14px" },
  pendingStatusBadge: { fontSize: "11px", fontWeight: "600", color: "#f59e0b" },

  // Member Balances
  memberBalancesGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" },
  memberBalanceCard: { padding: "18px", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "12px" },
  memberBalanceHeader: { display: "flex", alignItems: "center", gap: "12px" },
  userIconCircle: { width: "36px", height: "36px", borderRadius: "50%", background: "rgba(124, 58, 237, 0.2)", border: "1px solid rgba(124, 58, 237, 0.4)", color: "#c084fc", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "14px" },
  balanceUsername: { color: "#f1f5f9", fontSize: "14px", fontWeight: "600", margin: 0 },
  balanceEmail: { color: "#64748b", fontSize: "11px", margin: "2px 0 0 0" },
  balanceBreakdown: { display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" },
  breakdownRow: { display: "flex", justifyContent: "space-between", color: "#94a3b8" },
  breakdownLabel: { color: "#64748b" },
  breakdownVal: { color: "#cbd5e1", fontWeight: "500" },
  balanceFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "10px", marginTop: "4px" },
  netLabel: { fontSize: "13px", fontWeight: "600", color: "#94a3b8" },
  netValue: { fontSize: "16px", fontWeight: "700", fontFamily: "'Space Grotesk', sans-serif" },

  // Settlement History
  settledList: { display: "flex", flexDirection: "column", gap: "10px" },
  settledItem: { padding: "14px 18px", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  settledLeft: { display: "flex", alignItems: "center", gap: "12px" },
  settledTitle: { color: "#f1f5f9", fontSize: "13px", margin: 0 },
  settledDate: { color: "#64748b", fontSize: "11px", margin: "2px 0 0 0" },
  settledRight: { display: "flex", alignItems: "center", gap: "12px" },
  settledAmount: { color: "#34d399", fontSize: "15px", fontWeight: "700", fontFamily: "'Space Grotesk', sans-serif" },
  settledBadge: { fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "12px", background: "rgba(16, 185, 129, 0.15)", color: "#34d399", border: "1px solid rgba(16, 185, 129, 0.3)" },

  // Modals
  modal: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" },
  modalCard: { width: "480px", maxWidth: "90vw", padding: "32px" },
  modalTitle: { fontSize: "18px", fontWeight: "600", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "20px" },
  formGroup: { display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" },
  label: { color: "#94a3b8", fontSize: "13px", fontWeight: "500" },
  modalActions: { display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "8px" },
};

export default Budget;