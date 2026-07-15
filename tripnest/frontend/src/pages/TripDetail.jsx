import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TripService from "../services/tripService";
import ShareTripModal from "../components/ShareTripModal";
import { useAuth } from "../context/AuthContext";

const TripDetail = () => {
  const [showShareModal, setShowShareModal] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trip, setTrip] = useState(null);
  const [itineraries, setItineraries] = useState([]);
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
      const [tripData, itineraryData] = await Promise.all([
        TripService.getTripById(id),
        TripService.getTripItineraries(id),
      ]);
      setTrip(tripData);
      setItineraries(itineraryData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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

  return (
    <div style={styles.container}>
      <Sidebar />
      <main style={styles.main}>
        {/* Back Button */}
        <button className="btn-ghost" onClick={() => navigate("/trips")}
          style={{ marginBottom: "24px", fontSize: "13px" }}>
          ← Back to Trips
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
              <span className={`badge badge-${trip?.status?.toLowerCase()}`} style={{ fontSize: "13px", padding: "6px 14px" }}>
                {trip?.status}
              </span>
              <button className="btn-aurora" onClick={() => setShowShareModal(true)}
                style={{ fontSize: "13px", padding: "6px 14px" }}>
                🤝 Share Trip
              </button>
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
            <button className="btn-aurora" onClick={() => setShowItineraryForm(true)}
              style={{ fontSize: "13px", padding: "8px 16px" }}>
              + Add Day
            </button>
          </div>

          {/* Itinerary Form */}
          {showItineraryForm && (
            <div style={styles.inlineForm} className="glass-card">
              <h3 style={styles.formTitle}>Add Day Plan</h3>
              <div style={styles.formRow}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Date</label>
                  <input className="aurora-input" type="date" value={itineraryForm.date}
                    onChange={(e) => setItineraryForm({ ...itineraryForm, date: e.target.value })} />
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
                    <input className="aurora-input" type="number" placeholder="0"
                      value={activityForm.cost}
                      onChange={(e) => setActivityForm({ ...activityForm, cost: e.target.value })} />
                  </div>
                  <div style={{ ...styles.inputGroup, gridColumn: "1 / -1" }}>
                    <label style={styles.label}>Description</label>
                    <input className="aurora-input" placeholder="Activity description"
                      value={activityForm.description}
                      onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })} />
                  </div>
                </div>
                <div style={styles.formActions}>
                  <button className="btn-ghost" onClick={() => setShowActivityForm(false)}>Cancel</button>
                  <button className="btn-aurora" onClick={handleCreateActivity}>Add Activity</button>
                </div>
              </div>
            </div>
          )}

          {/* Itinerary List */}
          {itineraries.length === 0 ? (
            <div style={styles.emptyState} className="glass-card">
              <span style={{ fontSize: "40px" }}>📅</span>
              <p style={{ color: "#f1f5f9", fontWeight: "600" }}>No days planned yet</p>
              <p style={{ color: "#94a3b8", fontSize: "14px" }}>Add day-wise plans for your trip</p>
            </div>
          ) : (
            <div style={styles.itineraryList}>
              {itineraries.map((itin) => (
                <div key={itin.id} style={styles.itineraryCard} className="glass-card">
                  <div style={styles.itineraryHeader}>
                    <div>
                      <h3 style={styles.itineraryDate}>📅 {itin.date}</h3>
                      {itin.notes && <p style={styles.itineraryNotes}>{itin.notes}</p>}
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button className="btn-aurora" onClick={() => {
                        setSelectedItineraryId(itin.id);
                        setShowActivityForm(true);
                      }} style={{ fontSize: "12px", padding: "6px 12px" }}>
                        + Activity
                      </button>
                      <button onClick={() => handleDeleteItinerary(itin.id)}
                        style={styles.deleteBtn}>🗑️</button>
                    </div>
                  </div>

                  {/* Activities */}
                  {itin.activities && itin.activities.length > 0 && (
                    <div style={styles.activitiesList}>
                      {itin.activities.map((activity) => (
                        <div key={activity.id} style={styles.activityItem}>
                          <div style={styles.activityLeft}>
                            <span style={styles.activityType}>
                              {activity.type === "SIGHTSEEING" ? "👁️" :
                               activity.type === "DINING" ? "🍽️" :
                               activity.type === "TRANSPORTATION" ? "🚗" :
                               activity.type === "ACCOMMODATION" ? "🏨" :
                               activity.type === "ADVENTURE" ? "🏔️" :
                               activity.type === "SHOPPING" ? "🛍️" : "📌"}
                            </span>
                            <div>
                              <p style={styles.activityTitle}>{activity.title}</p>
                              {activity.location && <p style={styles.activityLocation}>📍 {activity.location}</p>}
                            </div>
                          </div>
                          <div style={styles.activityRight}>
                            {activity.startTime && (
                              <span style={styles.activityTime}>
                                {activity.startTime} {activity.endTime ? `- ${activity.endTime}` : ""}
                              </span>
                            )}
                            {activity.cost && <span style={styles.activityCost}>₹{activity.cost}</span>}
                            <button onClick={() => handleDeleteActivity(activity.id)}
                              style={{ ...styles.deleteBtn, padding: "4px 8px", fontSize: "12px" }}>🗑️</button>
                          </div>
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
          />
        )}
      </main>
    </div>
  );
};

const styles = {
  container: { display: "flex", minHeight: "100vh", background: "#0a0f1e" },
  main: { marginLeft: "260px", flex: 1, padding: "32px" },
  tripHeader: { padding: "28px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px", gap: "24px" },
  tripHeaderLeft: { display: "flex", gap: "20px", alignItems: "flex-start", flex: 1 },
  tripTitle: { fontSize: "26px", fontWeight: "700", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "4px" },
  tripDest: { color: "#94a3b8", fontSize: "14px", marginBottom: "8px" },
  tripDesc: { color: "#64748b", fontSize: "13px", lineHeight: "1.5" },
  tripHeaderRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "16px" },
  tripMetaGrid: { display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "flex-end" },
  metaBox: { background: "rgba(255,255,255,0.05)", borderRadius: "8px", padding: "10px 14px", textAlign: "center", minWidth: "80px" },
  metaLabel: { color: "#64748b", fontSize: "11px", marginBottom: "4px" },
  metaValue: { color: "#f1f5f9", fontSize: "13px", fontWeight: "600" },
  section: { marginBottom: "32px" },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" },
  sectionTitle: { fontSize: "18px", fontWeight: "600", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif" },
  inlineForm: { padding: "24px", marginBottom: "16px" },
  formTitle: { fontSize: "16px", fontWeight: "600", color: "#f1f5f9", marginBottom: "16px" },
  formRow: { display: "flex", gap: "16px", marginBottom: "16px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "8px", flex: 1 },
  label: { color: "#94a3b8", fontSize: "13px", fontWeight: "500" },
  formActions: { display: "flex", gap: "12px", justifyContent: "flex-end" },
  modal: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" },
  modalCard: { width: "560px", maxWidth: "90vw", padding: "32px", maxHeight: "90vh", overflowY: "auto" },
  activityFormGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" },
  emptyState: { padding: "40px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" },
  itineraryList: { display: "flex", flexDirection: "column", gap: "16px" },
  itineraryCard: { padding: "20px" },
  itineraryHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" },
  itineraryDate: { fontSize: "16px", fontWeight: "600", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "4px" },
  itineraryNotes: { color: "#94a3b8", fontSize: "13px" },
  activitiesList: { display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "16px" },
  activityItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: "8px" },
  activityLeft: { display: "flex", alignItems: "center", gap: "12px" },
  activityType: { fontSize: "20px" },
  activityTitle: { color: "#f1f5f9", fontSize: "14px", fontWeight: "500", marginBottom: "2px" },
  activityLocation: { color: "#64748b", fontSize: "12px" },
  activityRight: { display: "flex", alignItems: "center", gap: "12px" },
  activityTime: { color: "#a78bfa", fontSize: "12px" },
  activityCost: { color: "#10b981", fontSize: "12px", fontWeight: "500" },
  deleteBtn: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5", borderRadius: "6px", cursor: "pointer", padding: "6px 10px", fontSize: "14px" },
};

export default TripDetail;