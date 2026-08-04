import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TripService from "../services/tripService";
import ShareTripModal from "../components/ShareTripModal";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const TripDetail = () => {
  const [showShareModal, setShowShareModal] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trip, setTrip] = useState(null);
  const [itineraries, setItineraries] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showItineraryForm, setShowItineraryForm] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [selectedItineraryId, setSelectedItineraryId] = useState(null);
  const [itineraryForm, setItineraryForm] = useState({ date: "", notes: "" });
  const [activityForm, setActivityForm] = useState({
    title: "", description: "", startTime: "", endTime: "",
    location: "", type: "SIGHTSEEING", cost: "",
  });

  useEffect(() => { fetchTripData(); }, [id]);

  const fetchTripData = async () => {
    try {
      const [tripData, itineraryData, expenseData] = await Promise.all([
        TripService.getTripById(id),
        TripService.getTripItineraries(id),
        api.get(`/expenses/trip/${id}`).catch(() => ({ data: [] })),
      ]);
      setTrip(tripData);
      setItineraries(itineraryData);
      setExpenses(expenseData.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Helper function for date formatting
    const formatDate = (dateStr) => {
      if (!dateStr) return "N/A";
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };
    
    // Helper function for date with weekday
    const formatDateWithWeekday = (dateStr) => {
      if (!dateStr) return "N/A";
      const date = new Date(dateStr);
      const formattedDate = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
      return `${formattedDate} (${weekday})`;
    };
    
    // Helper function for currency formatting
    const formatCurrency = (amount) => {
      if (amount === null || amount === undefined) return "N/A";
      return `INR ${amount.toLocaleString()}`;
    };
    
    // Helper function for status badge
    const getStatusBadge = (status) => {
      const statusMap = {
        'UPCOMING': 'Upcoming',
        'PLANNING': 'Planning',
        'ONGOING': 'Ongoing',
        'COMPLETED': 'Completed',
        'CANCELLED': 'Cancelled'
      };
      return statusMap[status] || status || 'N/A';
    };
    
    // Helper function for duration calculation
    const calculateDuration = (startDate, endDate) => {
      if (!startDate || !endDate) return "N/A";
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `${diffDays} Days`;
    };
    
    // Generate Report ID
    const generateReportId = () => {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `TR-${year}${month}${day}-${trip?.id || 'NA'}`;
    };
    
    // Get owner information from backend response (always original trip owner)
    const ownerName = trip?.ownerName || "N/A";
    const ownerEmail = trip?.ownerEmail || "N/A";
    
    // ==================== COVER PAGE ====================
    doc.setFillColor(124, 58, 237);
    doc.rect(0, 0, pageWidth, pageHeight, "F");
    
    // Draw decorative line
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.5);
    doc.line(40, 50, pageWidth - 40, 50);
    doc.line(40, pageHeight - 50, pageWidth - 40, pageHeight - 50);
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(36);
    doc.setFont("helvetica", "bold");
    doc.text("TripNest", pageWidth / 2, 80, { align: "center" });
    
    doc.setFontSize(24);
    doc.setFont("helvetica", "normal");
    doc.text("Travel Report", pageWidth / 2, 105, { align: "center" });
    
    // Draw separator line
    doc.line(40, 130, pageWidth - 40, 130);
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("Prepared For", pageWidth / 2, 150, { align: "center" });
    
    doc.setFontSize(18);
    doc.setFont("helvetica", "normal");
    doc.text(ownerName, pageWidth / 2, 170, { align: "center" });
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(220, 220, 220);
    doc.text(ownerEmail, pageWidth / 2, 185, { align: "center" });
    
    // Draw separator line
    doc.line(40, 210, pageWidth - 40, 210);
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    
    const coverTripInfo = [
      `Trip Name`,
      `Destination`,
      `Travel Dates`,
      `Status`,
      `Generated On`,
      `Report ID`,
    ];
    
    const tripValues = [
      trip?.title || "N/A",
      trip?.destination || "N/A",
      `${formatDate(trip?.startDate)} to ${formatDate(trip?.endDate)}`,
      getStatusBadge(trip?.status),
      formatDate(new Date().toISOString()),
      generateReportId(),
    ];
    
    let yPosition = 240;
    coverTripInfo.forEach((label, index) => {
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(200, 200, 200);
      doc.text(label, pageWidth / 2, yPosition, { align: "center" });
      
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text(tripValues[index], pageWidth / 2, yPosition + 12, { align: "center" });
      
      yPosition += 28;
    });
    
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    doc.text("TripNest • www.tripnest.com", pageWidth / 2, pageHeight - 35, { align: "center" });
    
    // ==================== TRIP INFORMATION PAGE ====================
    doc.addPage();
    doc.setFillColor(124, 58, 237);
    doc.rect(0, 0, pageWidth, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Trip Information", pageWidth / 2, 25, { align: "center" });
    
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Trip Details", 20, 60);
    
    // Draw separator line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(20, 65, pageWidth - 20, 65);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const tripInfo = [
      ["Title", trip?.title || "N/A"],
      ["Destination", trip?.destination || "N/A"],
      ["Start Date", formatDate(trip?.startDate)],
      ["End Date", formatDate(trip?.endDate)],
      ["Duration", calculateDuration(trip?.startDate, trip?.endDate)],
      ["Travelers", trip?.numberOfTravelers || "N/A"],
      ["Budget", formatCurrency(trip?.budget)],
      ["Status", getStatusBadge(trip?.status)],
      ["Description", trip?.description || "N/A"],
    ];
    
    autoTable(doc, {
      startY: 75,
      head: [["Field", "Value"]],
      body: tripInfo,
      theme: "grid",
      headStyles: { fillColor: [124, 58, 237], fontSize: 11, fontStyle: "bold", textColor: 255 },
      styles: { fontSize: 10, cellPadding: 8 },
      margin: { top: 10, right: 20, bottom: 20, left: 20 },
    });
    
    // ==================== EXPENSE SUMMARY ====================
    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const remainingBudget = trip?.budget ? trip.budget - totalExpenses : 0;
    const budgetUtilization = trip?.budget ? Math.round((totalExpenses / trip.budget) * 100) : 0;
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Expense Summary", 20, doc.lastAutoTable.finalY + 30);
    
    // Draw separator line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(20, doc.lastAutoTable.finalY + 35, pageWidth - 20, doc.lastAutoTable.finalY + 35);
    
    const expenseSummary = [
      ["Total Budget", formatCurrency(trip?.budget)],
      ["Total Spent", formatCurrency(totalExpenses)],
      [remainingBudget >= 0 ? "Remaining" : "Over Budget", formatCurrency(Math.abs(remainingBudget))],
      ["Budget Utilization", `${budgetUtilization}%`],
    ];
    
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 40,
      head: [["Category", "Amount"]],
      body: expenseSummary,
      theme: "grid",
      headStyles: { fillColor: [124, 58, 237], fontSize: 11, fontStyle: "bold", textColor: 255 },
      styles: { fontSize: 10, cellPadding: 8 },
      columnStyles: {
        0: { halign: 'left' },
        1: { halign: 'right' },
      },
      margin: { top: 10, right: 20, bottom: 20, left: 20 },
    });
    
    // ==================== CATEGORY-WISE EXPENSES ====================
    if (expenses.length > 0) {
      const categoryData = expenses.reduce((acc, exp) => {
        const category = exp.category || "MISCELLANEOUS";
        acc[category] = (acc[category] || 0) + (exp.amount || 0);
        return acc;
      }, {});
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Category-wise Expense Breakdown", 20, doc.lastAutoTable.finalY + 30);
      
      // Draw separator line
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(20, doc.lastAutoTable.finalY + 35, pageWidth - 20, doc.lastAutoTable.finalY + 35);
      
      const categoryRows = Object.entries(categoryData).map(([cat, amount]) => [
        cat || "N/A",
        formatCurrency(amount),
      ]);
      
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 40,
        head: [["Category", "Amount"]],
        body: categoryRows,
        theme: "grid",
        headStyles: { fillColor: [124, 58, 237], fontSize: 11, fontStyle: "bold", textColor: 255 },
        styles: { fontSize: 9, cellPadding: 8 },
        columnStyles: {
          0: { halign: 'left', cellWidth: 'auto' },
          1: { halign: 'right', cellWidth: 45 },
        },
        margin: { top: 10, right: 20, bottom: 20, left: 20 },
      });
      
      // ==================== DETAILED EXPENSE TABLE ====================
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Expense Details", 20, doc.lastAutoTable.finalY + 30);
      
      // Draw separator line
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(20, doc.lastAutoTable.finalY + 35, pageWidth - 20, doc.lastAutoTable.finalY + 35);
      
      const expenseRows = expenses.map(exp => [
        exp.title || "N/A",
        exp.category || "N/A",
        formatCurrency(exp.amount || 0),
        formatDate(exp.date),
        exp.description || "N/A",
      ]);
      
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 40,
        head: [["Expense Name", "Category", "Amount", "Date", "Description"]],
        body: expenseRows,
        theme: "grid",
        headStyles: { fillColor: [124, 58, 237], fontSize: 11, fontStyle: "bold", textColor: 255 },
        styles: { fontSize: 8, cellPadding: 5 },
        columnStyles: {
          0: { halign: 'left', cellWidth: 45 },
          1: { halign: 'left', cellWidth: 40 },
          2: { halign: 'right', cellWidth: 30 },
          3: { halign: 'center', cellWidth: 30 },
          4: { halign: 'left', cellWidth: 'auto' },
        },
        margin: { top: 10, right: 20, bottom: 20, left: 20 },
      });
    }
    
    // ==================== TRIP ITINERARY ====================
    if (itineraries.length > 0) {
      doc.addPage();
      doc.setFillColor(124, 58, 237);
      doc.rect(0, 0, pageWidth, 40, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Trip Itinerary", pageWidth / 2, 25, { align: "center" });
      
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Day-wise Activities", 20, 60);
      
      // Draw separator line
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(20, 65, pageWidth - 20, 65);
      
      const itineraryRows = [];
      itineraries.forEach((itinerary, index) => {
        itineraryRows.push([
          { content: `${formatDateWithWeekday(itinerary.date)} - Day ${index + 1}`, styles: { fontStyle: "bold", fillColor: [240, 240, 240], fontSize: 9 } },
          { content: itinerary.notes || "N/A", colSpan: 3, styles: { fillColor: [240, 240, 240], fontSize: 9 } },
        ]);
        if (itinerary.activities && itinerary.activities.length > 0) {
          itinerary.activities.forEach((activity) => {
            itineraryRows.push([
              { content: "", styles: { fillColor: [250, 250, 250] } },
              { content: "", styles: { fillColor: [250, 250, 250] } },
              activity.title || "N/A",
              `${activity.startTime || "N/A"} - ${activity.endTime || "N/A"}`,
              activity.notes || "N/A",
            ]);
          });
        }
      });
      
      autoTable(doc, {
        startY: 75,
        head: [["Date", "Activity", "Time", "Notes"]],
        body: itineraryRows,
        theme: "grid",
        headStyles: { fillColor: [124, 58, 237], fontSize: 11, fontStyle: "bold", textColor: 255 },
        styles: { fontSize: 8, cellPadding: 5 },
        margin: { top: 10, right: 20, bottom: 20, left: 20 },
        columnStyles: {
          0: { cellWidth: 55 },
          1: { cellWidth: 55 },
          2: { cellWidth: 30 },
          3: { cellWidth: 'auto' },
        },
      });
    }
    
    // ==================== CLOSING SECTION ====================
    const finalPage = doc.internal.getNumberOfPages();
    doc.setPage(finalPage);
    
    const closingY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 40 : 60;
    
    // Draw separator line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(40, closingY, pageWidth - 40, closingY);
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text("Thank You", pageWidth / 2, closingY + 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text("Generated by TripNest", pageWidth / 2, closingY + 35, { align: "center" });
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(124, 58, 237);
    doc.text("Have a Safe Journey", pageWidth / 2, closingY + 50, { align: "center" });
    
    // ==================== FOOTER ====================
    const pageCount = doc.internal.getNumberOfPages();
    const generatedDate = formatDate(new Date().toISOString());
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150, 150, 150);
      
      // Three-line footer as specified
      doc.text("Generated by TripNest", pageWidth / 2, pageHeight - 20, { align: "center" });
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 12, { align: "center" });
      doc.text(`Generated On: ${generatedDate}`, pageWidth / 2, pageHeight - 4, { align: "center" });
    }
    
    doc.save(`${trip?.title || "trip"}-report.pdf`);
  };

  const handleCreateItinerary = async () => {
    try {
      await TripService.createItinerary({ ...itineraryForm, tripId: parseInt(id) });
      setShowItineraryForm(false);
      setItineraryForm({ date: "", notes: "" });
      fetchTripData();
    } catch (err) { console.error(err); }
  };

  const handleDeleteItinerary = async (itineraryId) => {
    if (window.confirm("Delete this day plan?")) {
      await TripService.deleteItinerary(itineraryId);
      fetchTripData();
    }
  };

  const handleCreateActivity = async () => {
    try {
      await TripService.createActivity({ ...activityForm, itineraryId: selectedItineraryId });
      setShowActivityForm(false);
      setActivityForm({
        title: "", description: "", startTime: "", endTime: "",
        location: "", type: "SIGHTSEEING", cost: "",
      });
      fetchTripData();
    } catch (err) { console.error(err); }
  };

  const handleDeleteActivity = async (activityId) => {
    if (window.confirm("Delete this activity?")) {
      await TripService.deleteActivity(activityId);
      fetchTripData();
    }
  };

  const styles = {
    container: { display: "flex", minHeight: "100vh", background: "#0a0e27" },
    main: { flex: 1, padding: "20px", overflowY: "auto" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" },
    headerTitle: { fontSize: "28px", fontWeight: "bold", color: "#fff" },
    card: { background: "rgba(15, 23, 42, 0.8)", borderRadius: "16px", padding: "24px", marginBottom: "20px", border: "1px solid rgba(124, 58, 237, 0.2)" },
    sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" },
    sectionTitle: { fontSize: "20px", fontWeight: "bold", color: "#fff" },
    tripHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" },
    tripHeaderLeft: { flex: 1 },
    tripTitle: { fontSize: "24px", fontWeight: "bold", color: "#fff", marginBottom: "8px" },
    tripDest: { fontSize: "16px", color: "#a78bfa", marginBottom: "8px" },
    tripDesc: { fontSize: "14px", color: "#94a3b8" },
    tripHeaderRight: { textAlign: "right" },
    tripMetaGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "12px", marginTop: "16px" },
    metaBox: { background: "rgba(124, 58, 237, 0.1)", borderRadius: "8px", padding: "12px", border: "1px solid rgba(124, 58, 237, 0.2)" },
    metaLabel: { fontSize: "12px", color: "#94a3b8", marginBottom: "4px" },
    metaValue: { fontSize: "14px", fontWeight: "bold", color: "#fff" },
    itineraryCard: { background: "rgba(15, 23, 42, 0.6)", borderRadius: "12px", padding: "16px", marginBottom: "12px", border: "1px solid rgba(124, 58, 237, 0.15)" },
    itineraryHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" },
    itineraryDate: { fontSize: "16px", fontWeight: "bold", color: "#a78bfa" },
    activityItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", background: "rgba(255, 255, 255, 0.03)", borderRadius: "8px", marginBottom: "8px" },
    activityInfo: { flex: 1 },
    activityTitle: { fontSize: "14px", fontWeight: "bold", color: "#fff", marginBottom: "4px" },
    activityMeta: { fontSize: "12px", color: "#94a3b8" },
    form: { display: "grid", gap: "16px" },
    formGroup: { display: "flex", flexDirection: "column" },
    label: { fontSize: "13px", color: "#94a3b8", marginBottom: "6px" },
    modal: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0, 0, 0, 0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
    modalCard: { background: "#0f172a", borderRadius: "16px", padding: "24px", width: "90%", maxWidth: "500px", border: "1px solid rgba(124, 58, 237, 0.3)" },
    modalTitle: { fontSize: "20px", fontWeight: "bold", color: "#fff", marginBottom: "20px" },
    modalActions: { display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "20px" },
  };

  if (loading) return <div style={styles.container}><Sidebar /><div style={styles.main}><p style={{ color: "#fff" }}>Loading...</p></div></div>;

  return (
    <div style={styles.container}>
      <Sidebar />
      <div style={styles.main}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.headerTitle}>Trip Details</h1>
            <p style={{ color: "#94a3b8" }}>View and manage your trip</p>
          </div>
          <button className="btn-ghost" onClick={() => navigate("/trips")}>← Back to Trips</button>
        </div>

        {/* Trip Info Card */}
        <div style={styles.card}>
          <div style={styles.tripHeader}>
            <div style={styles.tripHeaderLeft}>
              <h2 style={styles.tripTitle}>{trip?.title}</h2>
              <p style={styles.tripDest}>📍 {trip?.destination}</p>
              {trip?.description && <p style={styles.tripDesc}>{trip?.description}</p>}
            </div>
          </div>
          <div style={styles.tripHeaderRight}>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {trip?.permission && trip?.permission !== "OWNER" && (
                <span className="badge" style={{ fontSize: "13px", padding: "6px 14px", background: "rgba(167, 139, 250, 0.15)", color: "#a78bfa" }}>
                  🤝 Shared ({trip?.permission})
                </span>
              )}
              <span className={`badge badge-${trip?.status?.toLowerCase()}`} style={{ fontSize: "13px", padding: "6px 14px" }}>
                {trip?.status}
              </span>
              <button className="btn-aurora" onClick={generatePDF}
                style={{ fontSize: "13px", padding: "6px 14px" }}>
                📄 Export Report
              </button>
              {(!trip?.permission || trip?.permission === "OWNER") && (
                <button className="btn-aurora" onClick={() => setShowShareModal(true)}
                  style={{ fontSize: "13px", padding: "6px 14px" }}>
                  🤝 Share Trip
                </button>
              )}
            </div>
            <div style={styles.tripMetaGrid}>
              {trip?.startDate && <div style={styles.metaBox}><p style={styles.metaLabel}>Start</p><p style={styles.metaValue}>{trip.startDate}</p></div>}
              {trip?.endDate && <div style={styles.metaBox}><p style={styles.metaLabel}>End</p><p style={styles.metaValue}>{trip.endDate}</p></div>}
              {trip?.numberOfTravelers && <div style={styles.metaBox}><p style={styles.metaLabel}>Travelers</p><p style={styles.metaValue}>👥 {trip.numberOfTravelers}</p></div>}
              {trip?.budget && <div style={styles.metaBox}><p style={styles.metaLabel}>Budget</p><p style={styles.metaValue}>💰 ₹{trip.budget.toLocaleString()}</p></div>}
            </div>
          </div>
        </div>

        {/* Itineraries Section */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>Itinerary</h3>
            {(!trip?.permission || trip?.permission === "OWNER" || trip?.permission === "EDIT") && (
              <button className="btn-aurora" onClick={() => setShowItineraryForm(true)}>+ Add Day</button>
            )}
          </div>
          {itineraries.length === 0 ? (
            <p style={{ color: "#94a3b8" }}>No itinerary planned yet.</p>
          ) : (
            itineraries.map((itinerary) => (
              <div key={itinerary.id} style={styles.itineraryCard}>
                <div style={styles.itineraryHeader}>
                  <span style={styles.itineraryDate}>{itinerary.date}</span>
                  {(!trip?.permission || trip?.permission === "OWNER" || trip?.permission === "EDIT") && (
                    <button className="btn-ghost" onClick={() => handleDeleteItinerary(itinerary.id)} style={{ fontSize: "12px" }}>Delete</button>
                  )}
                </div>
                {itinerary.notes && <p style={{ color: "#94a3b8", marginBottom: "12px" }}>{itinerary.notes}</p>}
                {itinerary.activities && itinerary.activities.length > 0 ? (
                  itinerary.activities.map((activity) => (
                    <div key={activity.id} style={styles.activityItem}>
                      <div style={styles.activityInfo}>
                        <div style={styles.activityTitle}>{activity.title}</div>
                        <div style={styles.activityMeta}>
                          {activity.startTime && activity.endTime && `${activity.startTime} - ${activity.endTime}`}
                          {activity.location && ` • ${activity.location}`}
                        </div>
                      </div>
                      {(!trip?.permission || trip?.permission === "OWNER" || trip?.permission === "EDIT") && (
                        <button className="btn-ghost" onClick={() => handleDeleteActivity(activity.id)} style={{ fontSize: "12px" }}>Delete</button>
                      )}
                    </div>
                  ))
                ) : (
                  <p style={{ color: "#94a3b8", fontSize: "13px" }}>No activities</p>
                )}
                {(!trip?.permission || trip?.permission === "OWNER" || trip?.permission === "EDIT") && (
                  <button className="btn-ghost" onClick={() => { setSelectedItineraryId(itinerary.id); setShowActivityForm(true); }} style={{ fontSize: "13px", marginTop: "8px" }}>+ Add Activity</button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Itinerary Form Modal */}
        {showItineraryForm && (
          <div style={styles.modal}>
            <div style={styles.modalCard} className="glass-card">
              <h3 style={styles.modalTitle}>Add Day to Itinerary</h3>
              <div style={styles.form}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Date</label>
                  <input className="aurora-input" type="date" value={itineraryForm.date}
                    onChange={(e) => setItineraryForm({ ...itineraryForm, date: e.target.value })} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Notes</label>
                  <input className="aurora-input" placeholder="Notes for this day"
                    value={itineraryForm.notes}
                    onChange={(e) => setItineraryForm({ ...itineraryForm, notes: e.target.value })} />
                </div>
              </div>
              <div style={styles.modalActions}>
                <button className="btn-ghost" onClick={() => setShowItineraryForm(false)}>Cancel</button>
                <button className="btn-aurora" onClick={handleCreateItinerary}>Add Day</button>
              </div>
            </div>
          </div>
        )}

        {/* Activity Form Modal */}
        {showActivityForm && (
          <div style={styles.modal}>
            <div style={styles.modalCard} className="glass-card">
              <h3 style={styles.modalTitle}>Add Activity</h3>
              <div style={styles.form}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Title</label>
                  <input className="aurora-input" placeholder="Activity title"
                    value={activityForm.title}
                    onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Description</label>
                  <input className="aurora-input" placeholder="Description"
                    value={activityForm.description}
                    onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Start Time</label>
                    <input className="aurora-input" type="time" value={activityForm.startTime}
                      onChange={(e) => setActivityForm({ ...activityForm, startTime: e.target.value })} />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>End Time</label>
                    <input className="aurora-input" type="time" value={activityForm.endTime}
                      onChange={(e) => setActivityForm({ ...activityForm, endTime: e.target.value })} />
                  </div>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Location</label>
                  <input className="aurora-input" placeholder="Location"
                    value={activityForm.location}
                    onChange={(e) => setActivityForm({ ...activityForm, location: e.target.value })} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Type</label>
                  <select className="aurora-input" value={activityForm.type}
                    onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value })}>
                    {["SIGHTSEEING", "FOOD", "TRANSPORT", "SHOPPING", "ENTERTAINMENT", "OTHER"].map(t => (
                      <option key={t} value={t} style={{ background: "#0d1529" }}>{t}</option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Cost (₹)</label>
                  <input className="aurora-input" type="number" placeholder="0"
                    value={activityForm.cost}
                    onChange={(e) => setActivityForm({ ...activityForm, cost: e.target.value })} />
                </div>
              </div>
              <div style={styles.modalActions}>
                <button className="btn-ghost" onClick={() => setShowActivityForm(false)}>Cancel</button>
                <button className="btn-aurora" onClick={handleCreateActivity}>Add Activity</button>
              </div>
            </div>
          </div>
        )}

        {/* Share Trip Modal */}
        {showShareModal && (
          <ShareTripModal
            tripId={parseInt(id)}
            onClose={() => setShowShareModal(false)}
            onShare={fetchTripData}
          />
        )}
      </div>
    </div>
  );
};

export default TripDetail;
