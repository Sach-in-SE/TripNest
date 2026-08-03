import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TripService from "../services/tripService";
import ShareTripModal from "../components/ShareTripModal";
import { useAuth } from "../context/AuthContext";

const Itineraries = () => {
  const [showShareModal, setShowShareModal] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trip, setTrip] = useState(null);
  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load trip data");
    } finally {
      setLoading(false);
    }
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
  activityDesc: { color: "#94a3b8", fontSize: "13px", lineHeight: "1.4" },
  activityCost: { color: "#10b981", fontSize: "13px", fontWeight: "600" },
};

export default Itineraries;