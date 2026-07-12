import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import api from "../services/api";

const Documents = () => {
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadForm, setUploadForm] = useState({ file: null, documentType: "TICKET" });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchTrips(); }, []);

  const fetchTrips = async () => {
    try {
      const res = await api.get("/trips");
      setTrips(res.data);
      if (res.data.length > 0) {
        setSelectedTrip(res.data[0]);
        fetchDocuments(res.data[0].id);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchDocuments = async (tripId) => {
    try {
      const res = await api.get(`/documents/trip/${tripId}`);
      setDocuments(res.data);
    } catch (err) { console.error(err); }
  };

  const handleTripSelect = (trip) => {
    setSelectedTrip(trip);
    setDocuments([]);
    fetchDocuments(trip.id);
  };

  const handleUpload = async () => {
    if (!uploadForm.file || !selectedTrip) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadForm.file);
      formData.append("tripId", selectedTrip.id);
      formData.append("documentType", uploadForm.documentType);

      await api.post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setShowUploadForm(false);
      setUploadForm({ file: null, documentType: "TICKET" });
      fetchDocuments(selectedTrip.id);
    } catch (err) { console.error(err); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this document?")) {
      await api.delete(`/documents/${id}`);
      fetchDocuments(selectedTrip.id);
    }
  };

  const handleView = (fileUrl) => {
    window.open(`http://localhost:8080${fileUrl}`, "_blank");
  };

  const typeIcons = {
    TICKET: "🎫",
    HOTEL_BOOKING: "🏨",
    PHOTO: "📷",
    VISA: "🛂",
    INSURANCE: "📋",
    OTHER: "📄",
  };

  return (
    <div style={styles.container}>
      <Sidebar />
      <main style={styles.main}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Travel Documents 📁</h1>
            <p style={styles.subtitle}>Store tickets, bookings & travel files</p>
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
            <div style={styles.actionBar}>
              <h2 style={styles.sectionTitle}>
                {selectedTrip.title} — Documents ({documents.length})
              </h2>
              <button className="btn-aurora" onClick={() => setShowUploadForm(true)}
                style={{ fontSize: "13px", padding: "8px 16px" }}>
                + Upload Document
              </button>
            </div>

            {showUploadForm && (
              <div style={styles.modal}>
                <div style={styles.modalCard} className="glass-card">
                  <h3 style={styles.modalTitle}>Upload Document</h3>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>File</label>
                    <input
                      type="file"
                      className="aurora-input"
                      onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files[0] })}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Document Type</label>
                    <select className="aurora-input" value={uploadForm.documentType}
                      onChange={(e) => setUploadForm({ ...uploadForm, documentType: e.target.value })}>
                      {["TICKET", "HOTEL_BOOKING", "PHOTO", "VISA", "INSURANCE", "OTHER"].map(t => (
                        <option key={t} value={t} style={{ background: "#0d1529" }}>
                          {t.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={styles.modalActions}>
                    <button className="btn-ghost" onClick={() => setShowUploadForm(false)} disabled={uploading}>
                      Cancel
                    </button>
                    <button className="btn-aurora" onClick={handleUpload} disabled={uploading || !uploadForm.file}>
                      {uploading ? "Uploading..." : "Upload"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {documents.length === 0 ? (
              <div style={styles.emptyState} className="glass-card">
                <span style={{ fontSize: "48px" }}>📁</span>
                <h3 style={{ color: "#f1f5f9" }}>No documents yet</h3>
                <p style={{ color: "#94a3b8" }}>Upload tickets, bookings, or travel photos</p>
              </div>
            ) : (
              <div style={styles.grid}>
                {documents.map((doc) => (
                  <div key={doc.id} style={styles.card} className="glass-card">
                    <div style={styles.cardIcon}>
                      {typeIcons[doc.documentType] || "📄"}
                    </div>
                    <p style={styles.fileName} title={doc.fileName}>{doc.fileName}</p>
                    <span className="badge badge-upcoming" style={{ fontSize: "11px" }}>
                      {doc.documentType?.replace("_", " ")}
                    </span>
                    <p style={styles.uploadedBy}>
                      Uploaded by {doc.username} • {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                    <div style={styles.cardActions}>
                      <button className="btn-ghost" onClick={() => handleView(doc.fileUrl)}
                        style={{ fontSize: "12px", flex: 1 }}>
                        👁️ View
                      </button>
                      <button onClick={() => handleDelete(doc.id)} style={styles.deleteBtn}>
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
  actionBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  sectionTitle: { fontSize: "18px", fontWeight: "600", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif" },
  modal: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" },
  modalCard: { width: "440px", maxWidth: "90vw", padding: "32px" },
  modalTitle: { fontSize: "18px", fontWeight: "600", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "20px" },
  formGroup: { display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" },
  label: { color: "#94a3b8", fontSize: "13px", fontWeight: "500" },
  modalActions: { display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "8px" },
  emptyState: { padding: "48px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" },
  card: { padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", textAlign: "center" },
  cardIcon: { fontSize: "40px" },
  fileName: { color: "#f1f5f9", fontSize: "13px", fontWeight: "500", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  uploadedBy: { color: "#64748b", fontSize: "11px" },
  cardActions: { display: "flex", gap: "8px", width: "100%", marginTop: "4px" },
  deleteBtn: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5", borderRadius: "6px", cursor: "pointer", padding: "6px 10px", fontSize: "12px" },
};

export default Documents;