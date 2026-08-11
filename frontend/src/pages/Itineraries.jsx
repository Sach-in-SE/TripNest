import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TripService from "../services/tripService";
import ShareTripModal from "../components/ShareTripModal";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const Itineraries = () => {
  const [showShareModal, setShowShareModal] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trip, setTrip] = useState(null);
  const [itineraries, setItineraries] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showItineraryForm, setShowItineraryForm] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [selectedItineraryId, setSelectedItineraryId] = useState(null);
  const [itineraryForm, setItineraryForm] = useState({ date: "", notes: "" });
  const [activityForm, setActivityForm] = useState({
    title: "", description: "", startTime: "", endTime: "",
    location: "", type: "SIGHTSEEING", cost: "", reminder: "THIRTY_MINUTES",
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
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load trip data");
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
    
    // Helper function for currency formatting
    const formatCurrency = (amount) => {
      if (amount === null || amount === undefined) return "N/A";
      return `INR ${amount.toLocaleString()}`;
    };
    
    // Helper function for date with weekday
    const formatDateWithWeekday = (dateStr) => {
      if (!dateStr) return "N/A";
      const date = new Date(dateStr);
      const formattedDate = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
      return `${formattedDate} (${weekday})`;
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
        styles: { fontSize: 8, cellPadding: 6 },
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
    // Frontend timeline validation
    if (trip?.startDate && trip?.endDate) {
      const selectedDate = new Date(itineraryForm.date);
      const startDate = new Date(trip.startDate);
      const endDate = new Date(trip.endDate);
      
      if (selectedDate < startDate || selectedDate > endDate) {
        alert(`Date must be between ${trip.startDate} and ${trip.endDate}`);
        return;
      }
    }
    
    try {
      await TripService.createItinerary({ ...itineraryForm, tripId: parseInt(id) });
      setShowItineraryForm(false);
      setItineraryForm({ date: "", notes: "" });
      fetchTripData();
    } catch (err) { 
      console.error(err);
      alert(err.response?.data?.message || "Failed to create itinerary");
    }
  };

  const handleDeleteItinerary = async (itineraryId) => {
    if (window.confirm("Delete this day plan?")) {
      await TripService.deleteItinerary(itineraryId);
      fetchTripData();
    }
  };

  const handleCreateActivity = async () => {
    try {
      await TripService.createActivity({
        ...activityForm,
        itineraryId: selectedItineraryId,
        cost: activityForm.cost ? parseFloat(activityForm.cost) : null,
      });
      setShowActivityForm(false);
      setActivityForm({ title: "", description: "", startTime: "", endTime: "", location: "", type: "SIGHTSEEING", cost: "" });
      fetchTripData();
    } catch (err) { console.error(err); }
  };

  const handleDeleteActivity = async (activityId) => {
    if (window.confirm("Delete this activity?")) {
      await TripService.deleteActivity(activityId);
      fetchTripData();
    }
  };

  if (loading) return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0f1e" }}>
      <Sidebar />
      <main style={{ marginLeft: "260px", padding: "32px", color: "#94a3b8" }}>Loading...</main>
    </div>
  );

  if (error) return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0f1e" }}>
      <Sidebar />
      <main style={{ marginLeft: "260px", padding: "32px" }}>
        <div style={{ color: "#ef4444", marginBottom: "16px" }}>{error}</div>
        <button className="btn-ghost" onClick={() => navigate("/trips")}>← Back to My Trips</button>
      </main>
    </div>
  );

  if (!trip) return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0f1e" }}>
      <Sidebar />
      <main style={{ marginLeft: "260px", padding: "32px", color: "#94a3b8" }}>
        <div>Trip not found</div>
        <button className="btn-ghost" onClick={() => navigate("/trips")} style={{ marginTop: "16px" }}>← Back to My Trips</button>
      </main>
    </div>
  );

  return (
    <div style={styles.container}>
      <Sidebar />
      <main style={styles.main}>
        {/* Back Button */}
        <button className="btn-ghost" onClick={() => navigate("/trips")}
          style={{ marginBottom: "24px", fontSize: "13px" }}>
          ← Back to My Trips
        </button>

        {/* Trip Header */}
        <div style={styles.tripHeader} className="glass-card">
          <div style={styles.tripHeaderLeft}>
            <span style={{ fontSize: "40px" }}>🌍</span>
            <div>
              <h1 style={styles.tripTitle}>{trip?.title}</h1>
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
            <h2 style={styles.sectionTitle}>📅 Day-wise Itinerary</h2>
            {(!trip?.permission || trip?.permission !== "VIEW") && (
              <button className="btn-aurora" onClick={() => setShowItineraryForm(true)}
                style={{ fontSize: "13px", padding: "8px 16px" }}>
                + Add Day
              </button>
            )}
          </div>

          {/* Itinerary Form */}
          {showItineraryForm && (
            <div style={styles.inlineForm} className="glass-card">
              <h3 style={styles.formTitle}>Add Day Plan</h3>
              <div style={styles.formRow}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Date</label>
                  <input className="aurora-input" type="date" value={itineraryForm.date}
                    min={trip?.startDate} max={trip?.endDate}
                    onChange={(e) => setItineraryForm({ ...itineraryForm, date: e.target.value })} />
                  <p style={styles.hint}>Must be between {trip?.startDate} and {trip?.endDate}</p>
                </div>
                <div style={{ ...styles.inputGroup, flex: 2 }}>
                  <label style={styles.label}>Notes</label>
                  <input className="aurora-input" placeholder="Day plan notes..."
                    value={itineraryForm.notes}
                    onChange={(e) => setItineraryForm({ ...itineraryForm, notes: e.target.value })} />
                </div>
              </div>
              <div style={styles.formActions}>
                <button className="btn-ghost" onClick={() => setShowItineraryForm(false)}>Cancel</button>
                <button className="btn-aurora" onClick={handleCreateItinerary}>Add Day</button>
              </div>
            </div>
          )}

          {/* Activity Form Modal */}
          {showActivityForm && (
            <div style={styles.modal}>
              <div style={styles.modalCard} className="glass-card">
                <h3 style={styles.formTitle}>Add Activity</h3>
                <div style={styles.activityFormGrid}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Title</label>
                    <input className="aurora-input" placeholder="Activity title"
                      value={activityForm.title}
                      onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })} />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Type</label>
                    <select className="aurora-input" value={activityForm.type}
                      onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value })}>
                      {["SIGHTSEEING", "TRANSPORTATION", "ACCOMMODATION", "DINING", "ADVENTURE", "SHOPPING", "OTHER"].map(t => (
                        <option key={t} value={t} style={{ background: "#0d1529" }}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Start Time</label>
                    <input className="aurora-input" type="time" value={activityForm.startTime}
                      onChange={(e) => setActivityForm({ ...activityForm, startTime: e.target.value })} />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>End Time</label>
                    <input className="aurora-input" type="time" value={activityForm.endTime}
                      onChange={(e) => setActivityForm({ ...activityForm, endTime: e.target.value })} />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Location</label>
                    <input className="aurora-input" placeholder="Location"
                      value={activityForm.location}
                      onChange={(e) => setActivityForm({ ...activityForm, location: e.target.value })} />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Cost (₹)</label>
                    <input className="aurora-input" type="number" placeholder="Optional"
                      value={activityForm.cost}
                      onChange={(e) => setActivityForm({ ...activityForm, cost: e.target.value })} />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Reminder</label>
                    <select className="aurora-input" value={activityForm.reminder}
                      onChange={(e) => setActivityForm({ ...activityForm, reminder: e.target.value })}>
                      <option value="NONE" style={{ background: "#0d1529" }}>No reminder</option>
                      <option value="THIRTY_MINUTES" style={{ background: "#0d1529" }}>30 minutes before</option>
                      <option value="ONE_HOUR" style={{ background: "#0d1529" }}>1 hour before</option>
                      <option value="TWO_HOURS" style={{ background: "#0d1529" }}>2 hours before</option>
                      <option value="ONE_DAY" style={{ background: "#0d1529" }}>1 day before</option>
                    </select>
                  </div>
                  <div style={{ ...styles.inputGroup, gridColumn: "1 / -1" }}>
                    <label style={styles.label}>Description</label>
                    <textarea className="aurora-input" placeholder="Activity description..." rows={3}
                      value={activityForm.description}
                      onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                      style={{ resize: "vertical" }} />
                  </div>
                </div>
                <div style={styles.formActions}>
                  <button className="btn-ghost" onClick={() => setShowActivityForm(false)}>Cancel</button>
                  <button className="btn-aurora" onClick={handleCreateActivity}>Add Activity</button>
                </div>
              </div>
            </div>
          )}

          {/* Itineraries List */}
          {itineraries.length === 0 ? (
            <div style={styles.emptyState} className="glass-card">
              <span style={{ fontSize: "48px" }}>📅</span>
              <h3 style={{ color: "#f1f5f9" }}>No day plans yet</h3>
              <p style={{ color: "#94a3b8" }}>Start planning your trip day by day</p>
            </div>
          ) : (
            <div style={styles.itinerariesList}>
              {itineraries.map((itinerary) => (
                <div key={itinerary.id} style={styles.itineraryCard} className="glass-card">
                  <div style={styles.itineraryHeader}>
                    <div style={styles.itineraryDate}>
                      <span style={styles.dayIcon}>📅</span>
                      <div>
                        <p style={styles.dateText}>{new Date(itinerary.date).toLocaleDateString()}</p>
                        {itinerary.notes && <p style={styles.notesText}>{itinerary.notes}</p>}
                      </div>
                    </div>
                    {(!trip?.permission || trip?.permission !== "VIEW") && (
                      <div style={styles.itineraryActions}>
                        <button className="btn-aurora" onClick={() => {
                          setSelectedItineraryId(itinerary.id);
                          setShowActivityForm(true);
                        }} style={{ fontSize: "12px", padding: "6px 12px" }}>
                          + Activity
                        </button>
                        <button className="btn-ghost" onClick={() => handleDeleteItinerary(itinerary.id)}
                          style={{ fontSize: "12px", padding: "6px 12px", color: "#ef4444" }}>
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Activities */}
                  {itinerary.activities && itinerary.activities.length > 0 && (
                    <div style={styles.activitiesList}>
                      {itinerary.activities.map((activity) => (
                        <div key={activity.id} style={styles.activityCard}>
                          <div style={styles.activityHeader}>
                            <span style={styles.activityIcon}>
                              {activity.type === "SIGHTSEEING" && "🏛️"}
                              {activity.type === "TRANSPORTATION" && "🚗"}
                              {activity.type === "ACCOMMODATION" && "🏨"}
                              {activity.type === "DINING" && "🍽️"}
                              {activity.type === "ADVENTURE" && "🎢"}
                              {activity.type === "SHOPPING" && "🛍️"}
                              {activity.type === "OTHER" && "📍"}
                            </span>
                            <div style={styles.activityInfo}>
                              <p style={styles.activityTitle}>{activity.title}</p>
                              <p style={styles.activityMeta}>
                                {activity.startTime && activity.endTime && `${activity.startTime} - ${activity.endTime}`}
                                {activity.location && ` • ${activity.location}`}
                              </p>
                              {activity.reminder && activity.reminder !== "NONE" && (
                                <p style={styles.activityReminder}>🔔 {activity.reminder.replace(/_/g, ' ').toLowerCase()}</p>
                              )}
                              {activity.description && <p style={styles.activityDesc}>{activity.description}</p>}
                            </div>
                            {activity.cost && (
                              <span style={styles.activityCost}>💰 ₹{activity.cost}</span>
                            )}
                          </div>
                          {(!trip?.permission || trip?.permission !== "VIEW") && (
                            <button className="btn-ghost" onClick={() => handleDeleteActivity(activity.id)}
                              style={{ fontSize: "11px", padding: "4px 8px", alignSelf: "flex-start", color: "#ef4444" }}>
                              Delete
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Share Trip Modal */}
        {showShareModal && trip && (
          <ShareTripModal
            tripId={trip.id}
            canManageShares={Boolean(user && trip.userId === user.id)}
            onClose={() => setShowShareModal(false)}
            onShareSuccess={() => {
              setShowShareModal(false);
              fetchTripData();
            }}
          />
        )}
      </main>
    </div>
  );
};

const styles = {
  container: { display: "flex", minHeight: "100vh", background: "#0a0f1e" },
  main: { marginLeft: "260px", flex: 1, padding: "32px" },
  tripHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", padding: "24px" },
  tripHeaderLeft: { display: "flex", gap: "16px", alignItems: "flex-start" },
  tripTitle: { fontSize: "24px", fontWeight: "700", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "4px" },
  tripDest: { color: "#94a3b8", fontSize: "14px", marginBottom: "4px" },
  tripDesc: { color: "#64748b", fontSize: "13px", lineHeight: "1.5" },
  tripHeaderRight: { display: "flex", flexDirection: "column", gap: "12px", alignItems: "flex-end" },
  tripMetaGrid: { display: "flex", gap: "12px" },
  metaBox: { textAlign: "center", padding: "8px 12px", background: "rgba(255,255,255,0.05)", borderRadius: "8px" },
  metaLabel: { color: "#64748b", fontSize: "11px", marginBottom: "2px" },
  metaValue: { color: "#f1f5f9", fontSize: "13px", fontWeight: "600" },
  section: { marginBottom: "32px" },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" },
  sectionTitle: { fontSize: "18px", fontWeight: "600", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif" },
  inlineForm: { padding: "20px", marginBottom: "16px" },
  formTitle: { fontSize: "16px", fontWeight: "600", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "16px" },
  formRow: { display: "flex", gap: "16px", marginBottom: "16px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "6px", flex: 1 },
  label: { color: "#94a3b8", fontSize: "13px", fontWeight: "500" },
  hint: { color: "#64748b", fontSize: "11px", marginTop: "2px" },
  formActions: { display: "flex", gap: "12px", justifyContent: "flex-end" },
  modal: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" },
  modalCard: { width: "500px", maxWidth: "90vw", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" },
  activityFormGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  emptyState: { padding: "48px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" },
  itinerariesList: { display: "flex", flexDirection: "column", gap: "16px" },
  itineraryCard: { padding: "20px" },
  itineraryHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" },
  itineraryDate: { display: "flex", gap: "12px", alignItems: "flex-start" },
  dayIcon: { fontSize: "24px" },
  dateText: { color: "#f1f5f9", fontSize: "16px", fontWeight: "600", marginBottom: "2px" },
  notesText: { color: "#64748b", fontSize: "13px" },
  itineraryActions: { display: "flex", gap: "8px" },
  activitiesList: { display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" },
  activityCard: { padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" },
  activityHeader: { display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "8px" },
  activityIcon: { fontSize: "20px" },
  activityInfo: { flex: 1 },
  activityTitle: { color: "#f1f5f9", fontSize: "14px", fontWeight: "600", marginBottom: "4px" },
  activityMeta: { color: "#64748b", fontSize: "12px", marginBottom: "4px" },
  activityReminder: { color: "#8b5cf6", fontSize: "11px", marginBottom: "4px" },
  activityDesc: { color: "#94a3b8", fontSize: "13px", lineHeight: "1.4" },
  activityCost: { color: "#10b981", fontSize: "13px", fontWeight: "600" },
};

export default Itineraries;