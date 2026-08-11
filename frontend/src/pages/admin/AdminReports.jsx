import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./AdminLayout.css";

function AdminReports() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(null);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, usersRes, destsRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/users").catch(() => ({ data: [] })),
        api.get("/destinations").catch(() => ({ data: [] })),
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data || []);
      setDestinations(destsRes.data || []);
    } catch (err) {
      console.error("Failed to fetch report datasets:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load platform data for report generation."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const showToast = (type, text) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // --- CSV HELPER FUNCTION ---
  const downloadCSV = (filename, headers, rows) => {
    const csvLines = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((val) => `"${String(val ?? "").replace(/"/g, '""')}"`)
          .join(",")
      ),
    ];
    const blob = new Blob([csvLines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- REPORT 1: SYSTEM EXECUTIVE SUMMARY REPORT ---
  const exportExecutiveSummaryPDF = () => {
    setGenerating("exec-pdf");
    try {
      const doc = new jsPDF();
      const generatedAt = new Date().toLocaleString();

      doc.setFontSize(18);
      doc.setTextColor(30, 41, 59);
      doc.text("TripNest Platform - Executive Summary Report", 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated on: ${generatedAt} | Authorized Administrator: ${user?.username || "Admin"}`, 14, 27);

      // Section 1: User Metrics
      autoTable(doc, {
        startY: 34,
        head: [["User Management Metric", "Count / Value"]],
        body: [
          ["Total Registered Accounts", String(stats?.totalUsers || 0)],
          ["Active / Enabled Users", String(stats?.activeUsers || 0)],
          ["Disabled / Restricted Users", String(stats?.disabledUsers || 0)],
        ],
        theme: "grid",
        headStyles: { fillColor: [99, 102, 241], fontStyle: "bold" },
        styles: { fontSize: 9.5, cellPadding: 4 },
      });

      // Section 2: Trip Metrics
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 8,
        head: [["Trip Operational Metric", "Count"]],
        body: [
          ["Total Trips Platform-wide", String(stats?.totalTrips || 0)],
          ["Active Trips (Planning/Upcoming/Ongoing)", String(stats?.activeTrips || 0)],
          ["Planning Trips", String(stats?.planningTrips || 0)],
          ["Upcoming Trips", String(stats?.upcomingTrips || 0)],
          ["Ongoing Trips", String(stats?.ongoingTrips || 0)],
          ["Completed Trips", String(stats?.completedTrips || 0)],
          ["Cancelled Trips", String(stats?.cancelledTrips || 0)],
        ],
        theme: "grid",
        headStyles: { fillColor: [14, 165, 233], fontStyle: "bold" },
        styles: { fontSize: 9.5, cellPadding: 4 },
      });

      // Section 3: Catalog & Financial Overview
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 8,
        head: [["Catalog & Financial Metric", "Value"]],
        body: [
          ["Total Destinations Cataloged", String(stats?.totalDestinations || 0)],
          ["Total Allocated System Budget", formatCurrency(stats?.totalBudgetedAmount)],
          ["Total Logged Expenditures", formatCurrency(stats?.totalExpensesAmount)],
          ["Total Expense Entries Logged", String(stats?.totalExpensesCount || 0)],
        ],
        theme: "grid",
        headStyles: { fillColor: [34, 197, 94], fontStyle: "bold" },
        styles: { fontSize: 9.5, cellPadding: 4 },
      });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("TripNest Administrative System Report • Confidential", 14, doc.internal.pageSize.height - 10);

      doc.save(`TripNest_Executive_Summary_${new Date().toISOString().slice(0, 10)}.pdf`);
      showToast("success", "Executive Summary PDF downloaded successfully.");
    } catch (err) {
      console.error("Failed to export Executive Summary PDF:", err);
      showToast("error", "Failed to generate Executive Summary PDF.");
    } finally {
      setGenerating(null);
    }
  };

  const exportExecutiveSummaryCSV = () => {
    setGenerating("exec-csv");
    try {
      const headers = ["Metric Category", "Metric Name", "Value"];
      const rows = [
        ["User Management", "Total Registered Accounts", stats?.totalUsers || 0],
        ["User Management", "Active / Enabled Users", stats?.activeUsers || 0],
        ["User Management", "Disabled Users", stats?.disabledUsers || 0],
        ["Trip Operations", "Total Trips Platform-wide", stats?.totalTrips || 0],
        ["Trip Operations", "Active Trips", stats?.activeTrips || 0],
        ["Trip Operations", "Planning Trips", stats?.planningTrips || 0],
        ["Trip Operations", "Upcoming Trips", stats?.upcomingTrips || 0],
        ["Trip Operations", "Ongoing Trips", stats?.ongoingTrips || 0],
        ["Trip Operations", "Completed Trips", stats?.completedTrips || 0],
        ["Trip Operations", "Cancelled Trips", stats?.cancelledTrips || 0],
        ["Catalog & Finance", "Total Destinations Cataloged", stats?.totalDestinations || 0],
        ["Catalog & Finance", "Total Allocated System Budget (INR)", formatCurrency(stats?.totalBudgetedAmount)],
        ["Catalog & Finance", "Total Logged Expenditures (INR)", formatCurrency(stats?.totalExpensesAmount)],
        ["Catalog & Finance", "Total Expense Entries Logged", stats?.totalExpensesCount || 0],
      ];

      downloadCSV(`TripNest_Executive_Summary_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
      showToast("success", "Executive Summary CSV downloaded successfully.");
    } catch (err) {
      console.error("Failed to export Executive Summary CSV:", err);
      showToast("error", "Failed to generate Executive Summary CSV.");
    } finally {
      setGenerating(null);
    }
  };

  // --- REPORT 2: USER DIRECTORY AUDIT REPORT ---
  const exportUserDirectoryPDF = () => {
    setGenerating("user-pdf");
    try {
      const doc = new jsPDF();
      const generatedAt = new Date().toLocaleString();

      doc.setFontSize(16);
      doc.setTextColor(30, 41, 59);
      doc.text("TripNest Platform - User Directory Audit Report", 14, 18);

      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated on: ${generatedAt} | Total Accounts: ${users.length}`, 14, 25);

      const tableRows = users.map((u) => [
        u.id,
        u.username || "—",
        u.email || "—",
        [u.firstName, u.lastName].filter(Boolean).join(" ") || "—",
        (u.roles || []).map((r) => r.replace("ROLE_", "")).join(", ") || "Traveler",
        u.enabled ? "Active" : "Disabled",
        u.passwordChangeRequired ? "Reset Req." : "Normal",
      ]);

      autoTable(doc, {
        startY: 30,
        head: [["ID", "Username", "Email", "Full Name", "Roles", "Status", "Security Flag"]],
        body: tableRows,
        theme: "striped",
        headStyles: { fillColor: [79, 70, 229], fontStyle: "bold" },
        styles: { fontSize: 8, cellPadding: 3 },
      });

      doc.save(`TripNest_User_Directory_Audit_${new Date().toISOString().slice(0, 10)}.pdf`);
      showToast("success", "User Directory Audit PDF downloaded successfully.");
    } catch (err) {
      console.error("Failed to export User Directory PDF:", err);
      showToast("error", "Failed to generate User Directory PDF.");
    } finally {
      setGenerating(null);
    }
  };

  const exportUserDirectoryCSV = () => {
    setGenerating("user-csv");
    try {
      const headers = [
        "User ID",
        "Username",
        "Email",
        "Full Name",
        "Roles",
        "Account Status",
        "Password Reset Required",
        "Email Verified",
        "Provider",
      ];
      const rows = users.map((u) => [
        u.id,
        u.username,
        u.email,
        [u.firstName, u.lastName].filter(Boolean).join(" ") || "N/A",
        (u.roles || []).join("; "),
        u.enabled ? "Active" : "Disabled",
        u.passwordChangeRequired ? "Yes" : "No",
        u.emailVerified ? "Yes" : "No",
        u.provider || "LOCAL",
      ]);

      downloadCSV(`TripNest_User_Directory_Audit_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
      showToast("success", "User Directory Audit CSV downloaded successfully.");
    } catch (err) {
      console.error("Failed to export User Directory CSV:", err);
      showToast("error", "Failed to generate User Directory CSV.");
    } finally {
      setGenerating(null);
    }
  };

  // --- REPORT 3: DESTINATION CATALOG SUMMARY REPORT ---
  const exportDestinationCatalogPDF = () => {
    setGenerating("dest-pdf");
    try {
      const doc = new jsPDF();
      const generatedAt = new Date().toLocaleString();

      doc.setFontSize(16);
      doc.setTextColor(30, 41, 59);
      doc.text("TripNest Platform - Destination Catalog Summary Report", 14, 18);

      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated on: ${generatedAt} | Total Destinations: ${destinations.length}`, 14, 25);

      const tableRows = destinations.map((d) => [
        d.id,
        d.name || "—",
        [d.state, d.country].filter(Boolean).join(", ") || "—",
        d.category || "General",
        formatCurrency(d.estimatedBudget),
        d.recommendedDays ? `${d.recommendedDays} days` : "—",
        d.rating != null ? d.rating.toFixed(1) : "N/A",
      ]);

      autoTable(doc, {
        startY: 30,
        head: [["ID", "Destination Name", "Location", "Category", "Est. Budget", "Stay Days", "Rating"]],
        body: tableRows,
        theme: "striped",
        headStyles: { fillColor: [236, 72, 153], fontStyle: "bold" },
        styles: { fontSize: 8, cellPadding: 3 },
      });

      doc.save(`TripNest_Destination_Catalog_${new Date().toISOString().slice(0, 10)}.pdf`);
      showToast("success", "Destination Catalog PDF downloaded successfully.");
    } catch (err) {
      console.error("Failed to export Destination Catalog PDF:", err);
      showToast("error", "Failed to generate Destination Catalog PDF.");
    } finally {
      setGenerating(null);
    }
  };

  const exportDestinationCatalogCSV = () => {
    setGenerating("dest-csv");
    try {
      const headers = [
        "Destination ID",
        "Destination Name",
        "State",
        "Country",
        "Category",
        "Best Season",
        "Estimated Budget (INR)",
        "Recommended Days",
        "Rating",
      ];
      const rows = destinations.map((d) => [
        d.id,
        d.name,
        d.state || "N/A",
        d.country || "N/A",
        d.category || "General",
        d.bestSeason || "N/A",
        formatCurrency(d.estimatedBudget),
        d.recommendedDays || "N/A",
        d.rating != null ? d.rating : "N/A",
      ]);

      downloadCSV(`TripNest_Destination_Catalog_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
      showToast("success", "Destination Catalog CSV downloaded successfully.");
    } catch (err) {
      console.error("Failed to export Destination Catalog CSV:", err);
      showToast("error", "Failed to generate Destination Catalog CSV.");
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="admin-portal-layout">
      {/* Admin Sidebar Navigation */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-brand">
            <span>🛡️ TripNest</span>
            <span className="admin-brand-tag">ADMIN</span>
          </div>
        </div>

        <nav className="admin-nav">
          <Link to="/admin/dashboard" className="admin-nav-item">
            📊 Overview
          </Link>
          <Link to="/admin/users" className="admin-nav-item">
            👥 User Management
          </Link>
          <Link to="/admin/destinations" className="admin-nav-item">
            📍 Destinations
          </Link>
          <Link to="/admin/reports" className="admin-nav-item active">
            📈 Analytics & Reports
          </Link>
        </nav>
      </aside>

      {/* Main Content Wrapper */}
      <div className="admin-main-wrapper">
        {/* Top Header */}
        <header className="admin-topbar">
          <div className="admin-page-title">Analytics & Reports</div>

          <div className="admin-user-profile">
            <div className="admin-user-info">
              <div className="admin-username">{user?.username || "Admin"}</div>
              <div className="admin-role-badge">System Administrator</div>
            </div>
            <button onClick={handleLogout} className="admin-logout-btn">
              Sign Out
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="admin-content-area">
          <div className="admin-dashboard-header">
            <div>
              <h2>Administrative Report Center</h2>
              <p>Generate, preview, and export platform audit summaries in PDF and CSV formats</p>
            </div>
            <button
              onClick={fetchReportData}
              disabled={loading}
              className="admin-refresh-btn"
            >
              🔄 {loading ? "Refreshing..." : "Refresh Report Data"}
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

          {loading ? (
            <div className="admin-loading-container">
              <div className="admin-spinner"></div>
              <p style={{ color: "#94a3b8", fontSize: "0.95rem" }}>
                Preparing system report data...
              </p>
            </div>
          ) : error ? (
            <div className="admin-error-container">
              <div className="admin-error-icon">⚠️</div>
              <div className="admin-error-msg">{error}</div>
              <button onClick={fetchReportData} className="admin-retry-btn">
                Retry Loading Data
              </button>
            </div>
          ) : (
            <div className="admin-reports-grid">
              {/* REPORT 1: SYSTEM EXECUTIVE SUMMARY */}
              <div className="admin-report-card">
                <div>
                  <div className="admin-report-icon-header">
                    <div className="admin-report-icon">📑</div>
                    <div className="admin-report-title-box">
                      <h3>System Executive Summary</h3>
                      <p>High-level operational overview</p>
                    </div>
                  </div>

                  <div className="admin-report-body-text">
                    Comprehensive platform report compiling total user accounts, trip lifecycle status counts, cataloged places, and total system budget vs. expenditures formatted in Indian Rupees (₹).
                  </div>

                  <div className="admin-report-preview-stats">
                    <div>Users: <strong>{stats?.totalUsers || 0}</strong> ({stats?.activeUsers || 0} Active)</div>
                    <div>Trips: <strong>{stats?.totalTrips || 0}</strong> ({stats?.activeTrips || 0} Active)</div>
                    <div>System Budget: <strong>{formatCurrency(stats?.totalBudgetedAmount)}</strong></div>
                  </div>
                </div>

                <div className="admin-report-actions">
                  <button
                    onClick={exportExecutiveSummaryPDF}
                    disabled={generating === "exec-pdf"}
                    className="admin-btn-pdf"
                  >
                    📄 {generating === "exec-pdf" ? "Exporting..." : "Export PDF"}
                  </button>
                  <button
                    onClick={exportExecutiveSummaryCSV}
                    disabled={generating === "exec-csv"}
                    className="admin-btn-csv"
                  >
                    📊 {generating === "exec-csv" ? "Exporting..." : "Export CSV"}
                  </button>
                </div>
              </div>

              {/* REPORT 2: USER DIRECTORY AUDIT REPORT */}
              <div className="admin-report-card">
                <div>
                  <div className="admin-report-icon-header">
                    <div className="admin-report-icon">👥</div>
                    <div className="admin-report-title-box">
                      <h3>User Directory Audit</h3>
                      <p>Security & account access audit</p>
                    </div>
                  </div>

                  <div className="admin-report-body-text">
                    Detailed account audit listing User IDs, usernames, email addresses, assigned system roles, enabled/disabled statuses, and temporary password reset security flags.
                  </div>

                  <div className="admin-report-preview-stats">
                    <div>Accounts Loaded: <strong>{users.length} Users</strong></div>
                    <div>Enabled Accounts: <strong>{users.filter(u => u.enabled).length}</strong></div>
                    <div>Security Flagged: <strong>{users.filter(u => u.passwordChangeRequired).length}</strong></div>
                  </div>
                </div>

                <div className="admin-report-actions">
                  <button
                    onClick={exportUserDirectoryPDF}
                    disabled={generating === "user-pdf"}
                    className="admin-btn-pdf"
                  >
                    📄 {generating === "user-pdf" ? "Exporting..." : "Export PDF"}
                  </button>
                  <button
                    onClick={exportUserDirectoryCSV}
                    disabled={generating === "user-csv"}
                    className="admin-btn-csv"
                  >
                    📊 {generating === "user-csv" ? "Exporting..." : "Export CSV"}
                  </button>
                </div>
              </div>

              {/* REPORT 3: DESTINATION CATALOG SUMMARY REPORT */}
              <div className="admin-report-card">
                <div>
                  <div className="admin-report-icon-header">
                    <div className="admin-report-icon">📍</div>
                    <div className="admin-report-title-box">
                      <h3>Destination Catalog Summary</h3>
                      <p>Public travel place index</p>
                    </div>
                  </div>

                  <div className="admin-report-body-text">
                    Full catalog report summarizing destination names, geographic locations (state & country), categories, estimated trip budget (₹), recommended stay durations, and user ratings.
                  </div>

                  <div className="admin-report-preview-stats">
                    <div>Destinations Loaded: <strong>{destinations.length} Places</strong></div>
                    <div>Categories Represented: <strong>{new Set(destinations.map(d => d.category)).size} Categories</strong></div>
                  </div>
                </div>

                <div className="admin-report-actions">
                  <button
                    onClick={exportDestinationCatalogPDF}
                    disabled={generating === "dest-pdf"}
                    className="admin-btn-pdf"
                  >
                    📄 {generating === "dest-pdf" ? "Exporting..." : "Export PDF"}
                  </button>
                  <button
                    onClick={exportDestinationCatalogCSV}
                    disabled={generating === "dest-csv"}
                    className="admin-btn-csv"
                  >
                    📊 {generating === "dest-csv" ? "Exporting..." : "Export CSV"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default AdminReports;
