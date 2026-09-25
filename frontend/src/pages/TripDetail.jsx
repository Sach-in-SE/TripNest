import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TripService from "../services/tripService";
import CollaboratorModal from "../components/CollaboratorModal";
import api from "../services/api";
import { getDestinationCoverImage, DEFAULT_INDIAN_COVER } from "../utils/tripCoverImage";
import { websocketService } from "../services/websocketService";

const TripDetail = () => {
  const [showShareModal, setShowShareModal] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
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

  // Real-time WebSocket subscriptions with functional state updates to prevent stale closures
  useEffect(() => {
    if (!id) return;

    const handleIncomingTripMessage = (message) => {
      try {
        const payload = typeof message === "string" ? JSON.parse(message) : message;
        if (!payload) return;

        // Ensure all incoming WebSocket messages (itinerary updates, activities, expense events)
        // update component state using functional updater syntax: setTrip(prevTrip => { ... })
        // instead of closing over the stale trip instance, preventing rapid concurrent updates from overwriting each other.
        if (payload.type === "ITINERARY_UPDATE" || payload.type === "ITINERARY_CREATED" || payload.type === "ITINERARY_DELETED") {
          setTrip((prevTrip) => {
            if (!prevTrip) return prevTrip;
            return {
              ...prevTrip,
              ...(payload.trip || {}),
              updatedAt: payload.timestamp || new Date().toISOString(),
            };
          });

          if (payload.itineraries) {
            setItineraries(payload.itineraries);
          } else if (payload.itinerary) {
            setItineraries((prevItineraries) => {
              if (payload.type === "ITINERARY_DELETED") {
                return prevItineraries.filter((itin) => itin.id !== payload.itinerary.id);
              }
              const exists = prevItineraries.some((itin) => itin.id === payload.itinerary.id);
              return exists
                ? prevItineraries.map((itin) => itin.id === payload.itinerary.id ? { ...itin, ...payload.itinerary } : itin)
                : [...prevItineraries, payload.itinerary];
            });
          }
        } else if (payload.type === "ACTIVITY_UPDATE" || payload.type === "ACTIVITY_CREATED" || payload.type === "ACTIVITY_DELETED") {
          setTrip((prevTrip) => {
            if (!prevTrip) return prevTrip;
            return {
              ...prevTrip,
              ...(payload.trip || {}),
              updatedAt: payload.timestamp || new Date().toISOString(),
            };
          });

          if (payload.activity) {
            setItineraries((prevItineraries) =>
              prevItineraries.map((itin) => {
                if (itin.id === payload.activity.itineraryId) {
                  const activities = itin.activities || [];
                  if (payload.type === "ACTIVITY_DELETED") {
                    return {
                      ...itin,
                      activities: activities.filter((act) => act.id !== payload.activity.id),
                    };
                  }
                  const exists = activities.some((act) => act.id === payload.activity.id);
                  const updatedActs = exists
                    ? activities.map((act) => act.id === payload.activity.id ? { ...act, ...payload.activity } : act)
                    : [...activities, payload.activity];
                  return { ...itin, activities: updatedActs };
                }
                return itin;
              })
            );
          }
        } else if (payload.type === "EXPENSE_UPDATE" || payload.type === "EXPENSE_CREATED" || payload.type === "EXPENSE_DELETED") {
          setTrip((prevTrip) => {
            if (!prevTrip) return prevTrip;
            return {
              ...prevTrip,
              ...(payload.trip || {}),
              updatedAt: payload.timestamp || new Date().toISOString(),
            };
          });

          if (payload.expenses) {
            setExpenses(payload.expenses);
          } else if (payload.expense) {
            setExpenses((prevExpenses) => {
              if (payload.type === "EXPENSE_DELETED") {
                return prevExpenses.filter((exp) => exp.id !== payload.expense.id);
              }
              const exists = prevExpenses.some((exp) => exp.id === payload.expense.id);
              return exists
                ? prevExpenses.map((exp) => exp.id === payload.expense.id ? { ...exp, ...payload.expense } : exp)
                : [...prevExpenses, payload.expense];
            });
          }
        } else {
          // General trip update event
          setTrip((prevTrip) => {
            if (!prevTrip) return prevTrip;
            return {
              ...prevTrip,
              ...(payload.trip || payload),
              updatedAt: payload.timestamp || new Date().toISOString(),
            };
          });
        }
      } catch (err) {
        console.error("Failed to process WebSocket trip update:", err);
      }
    };

    const unsubscribe = websocketService.subscribeToTrip(id, handleIncomingTripMessage);

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [id]);

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

  const [generatingPdf, setGeneratingPdf] = useState(false);

  const generatePDF = async () => {
    try {
      setGeneratingPdf(true);
      const { generateTripReportPDF } = await import("../utils/reportGenerator");
      generateTripReportPDF({ trip, itineraries, expenses });
    } catch (err) {
      console.error("Failed to generate trip PDF report:", err);
      alert("Failed to generate PDF report. Please try again.");
    } finally {
      setGeneratingPdf(false);
    }
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
      await TripService.createActivity({
        ...activityForm,
        itineraryId: selectedItineraryId,
        cost: activityForm.cost ? parseFloat(activityForm.cost) : null,
      });
      setShowActivityForm(false);
      setActivityForm({
        title: "", description: "", startTime: "", endTime: "",
        location: "", type: "SIGHTSEEING", cost: "",
      });
      fetchTripData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to add activity. Please check input values.");
    }
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

  if (loading) return <div className="tn-user-layout-container"><Sidebar /><main className="tn-user-main"><p style={{ color: "#fff" }}>Loading...</p></main></div>;

  return (
    <div className="tn-user-layout-container">
      <Sidebar />
      <main className="tn-user-main">
        <div style={styles.header}>
          <div>
            <h1 style={styles.headerTitle}>Trip Details</h1>
            <p style={{ color: "#94a3b8" }}>View and manage your trip</p>
          </div>
          <button className="btn-ghost" onClick={() => navigate("/trips")}>← Back to Trips</button>
        </div>

        {/* Trip Info Card */}
        <div style={styles.card}>
          {trip && (
            <div style={{ position: "relative", width: "100%", height: "200px", borderRadius: "12px", overflow: "hidden", marginBottom: "20px" }}>
              <img
                src={getDestinationCoverImage(trip.destination, trip.coverImageUrl)}
                alt={trip.title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => { e.target.src = DEFAULT_INDIAN_COVER; }}
              />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 40%, rgba(15,23,42,0.85) 100%)" }} />
              <div style={{ position: "absolute", bottom: "12px", left: "16px", color: "#fff", fontWeight: "600", fontSize: "14px", textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>
                📍 {trip.destination}
              </div>
            </div>
          )}
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
              <button
                className="btn-aurora"
                onClick={generatePDF}
                disabled={generatingPdf}
                style={{ fontSize: "13px", padding: "6px 14px" }}
              >
                {generatingPdf ? "⏳ Generating..." : "📄 Export Report"}
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
                    {[
                      { value: "SIGHTSEEING", label: "Sightseeing" },
                      { value: "TRANSPORTATION", label: "Transportation" },
                      { value: "ACCOMMODATION", label: "Accommodation" },
                      { value: "DINING", label: "Dining" },
                      { value: "ADVENTURE", label: "Adventure" },
                      { value: "SHOPPING", label: "Shopping" },
                      { value: "OTHER", label: "Other" }
                    ].map(t => (
                      <option key={t.value} value={t.value} style={{ background: "#0d1529" }}>{t.label}</option>
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

        {/* Share / Collaborate Modal */}
        {showShareModal && (
          <CollaboratorModal
            tripId={parseInt(id)}
            tripTitle={trip?.title}
            canManageShares={!trip?.permission || trip?.permission === "OWNER"}
            onClose={() => setShowShareModal(false)}
            onSuccess={fetchTripData}
          />
        )}
      </main>
    </div>
  );
};

export default TripDetail;
