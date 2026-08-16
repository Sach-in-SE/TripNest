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
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const res = await api.get("/trips");
      setTrips(res.data || []);
      if (res.data && res.data.length > 0) {
        setSelectedTrip(res.data[0]);
        fetchDocuments(res.data[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch trips:", err);
      setErrorMessage("Failed to load user trips.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async (tripId) => {
    setErrorMessage(null);
    try {
      const res = await api.get(`/documents/trip/${tripId}`);
      setDocuments(res.data || []);
    } catch (err) {
      console.error("Failed to fetch trip documents:", err);
      setErrorMessage(
        err.response?.data?.message || "Failed to load documents for the selected trip."
      );
    }
  };

  const handleTripSelect = (trip) => {
    setSelectedTrip(trip);
    setDocuments([]);
    setErrorMessage(null);
    setSuccessMessage(null);
    fetchDocuments(trip.id);
  };

  const validateFileClientSide = (file) => {
    if (!file) return "Please select a file to upload.";
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return "File size exceeds maximum allowed limit of 10MB.";
    }
    const allowedExtensions = ["pdf", "jpg", "jpeg", "png", "webp", "docx", "txt"];
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !allowedExtensions.includes(ext)) {
      return `Unsupported file extension (.${ext}). Allowed formats: PDF, JPEG, PNG, WEBP, DOCX, TXT.`;
    }
    return null;
  };

  const handleUpload = async () => {
    if (!uploadForm.file || !selectedTrip) return;

    const validationError = validateFileClientSide(uploadForm.file);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

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
      setSuccessMessage("Document uploaded successfully!");
      setTimeout(() => setSuccessMessage(null), 4000);
      fetchDocuments(selectedTrip.id);
    } catch (err) {
      console.error("Document upload error:", err);
      setErrorMessage(
        err.response?.data?.message || "Document upload failed. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this travel document?")) {
      setErrorMessage(null);
      setSuccessMessage(null);
      try {
        await api.delete(`/documents/${id}`);
        setSuccessMessage("Document deleted successfully!");
        setTimeout(() => setSuccessMessage(null), 4000);
        fetchDocuments(selectedTrip.id);
      } catch (err) {
        console.error("Delete document error:", err);
        setErrorMessage(
          err.response?.data?.message || "Failed to delete document. Access denied."
        );
      }
    }
  };

  const handleViewOrDownload = async (doc, mode = "download") => {
    setErrorMessage(null);
    try {
      // Resolve endpoint relative to api baseURL (/api)
      let endpoint = doc.fileUrl;
      if (endpoint?.startsWith("/api/")) {
        endpoint = endpoint.substring(4);
      } else if (!endpoint) {
        endpoint = `/documents/download/${encodeURIComponent(doc.fileName)}`;
      }

      const response = await api.get(endpoint, { responseType: "blob" });
      const contentType = doc.fileType || response.headers["content-type"] || "application/octet-stream";
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);

      if (mode === "view") {
        window.open(url, "_blank", "noopener,noreferrer");
        setTimeout(() => window.URL.revokeObjectURL(url), 60000);
      } else {
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", doc.fileName || "download");
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => window.URL.revokeObjectURL(url), 10000);
      }
    } catch (err) {
      console.error(`Failed to ${mode} document:`, err);
      setErrorMessage(
        err.response?.data?.message || `Failed to ${mode} document. Access denied or file not found.`
      );
    }
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
    <div className="tn-user-layout-container">
      <Sidebar />
      <main className="tn-user-main">
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Travel Documents 📁</h1>
            <p style={styles.subtitle}>Securely store and share tickets, bookings & travel media</p>
          </div>
        </div>

        {/* Feedback Banners */}
        {errorMessage && (
          <div style={styles.errorBanner}>
            <span>⚠️ {errorMessage}</span>
            <button style={styles.closeBannerBtn} onClick={() => setErrorMessage(null)}>✕</button>
          </div>
        )}

        {successMessage && (
          <div style={styles.successBanner}>
            <span>✅ {successMessage}</span>
            <button style={styles.closeBannerBtn} onClick={() => setSuccessMessage(null)}>✕</button>
          </div>
        )}

        {loading ? (
          <div style={styles.emptyState} className="glass-card">
            <h3 style={{ color: "#94a3b8" }}>Loading travel documents...</h3>
          </div>
        ) : (
          <>
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
                <div style={styles.actionBar}>
                  <h2 style={styles.sectionTitle}>
                    {selectedTrip.title} — Documents ({documents.length})
                  </h2>
                  <button
                    className="btn-aurora"
                    onClick={() => {
                      setErrorMessage(null);
                      setShowUploadForm(true);
                    }}
                    style={{ fontSize: "13px", padding: "8px 16px" }}
                  >
                    + Upload Document
                  </button>
                </div>

                {showUploadForm && (
                  <div style={styles.modal}>
                    <div style={styles.modalCard} className="glass-card">
                      <h3 style={styles.modalTitle}>Upload Document</h3>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Select File (Max 10MB: PDF, JPG, PNG, WEBP, DOCX, TXT)</label>
                        <input
                          type="file"
                          className="aurora-input"
                          onChange={(e) =>
                            setUploadForm({ ...uploadForm, file: e.target.files[0] })
                          }
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Document Category</label>
                        <select
                          className="aurora-input"
                          value={uploadForm.documentType}
                          onChange={(e) =>
                            setUploadForm({ ...uploadForm, documentType: e.target.value })
                          }
                        >
                          {["TICKET", "HOTEL_BOOKING", "PHOTO", "VISA", "INSURANCE", "OTHER"].map((t) => (
                            <option key={t} value={t} style={{ background: "#0d1529" }}>
                              {t.replace("_", " ")}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div style={styles.modalActions}>
                        <button
                          className="btn-ghost"
                          onClick={() => setShowUploadForm(false)}
                          disabled={uploading}
                        >
                          Cancel
                        </button>
                        <button
                          className="btn-aurora"
                          onClick={handleUpload}
                          disabled={uploading || !uploadForm.file}
                        >
                          {uploading ? "Uploading Securely..." : "Upload File"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {documents.length === 0 ? (
                  <div style={styles.emptyState} className="glass-card">
                    <span style={{ fontSize: "48px" }}>📁</span>
                    <h3 style={{ color: "#f1f5f9" }}>No documents uploaded yet</h3>
                    <p style={{ color: "#94a3b8" }}>
                      Upload flight tickets, hotel reservations, visas, or travel photos for this trip.
                    </p>
                  </div>
                ) : (
                  <div style={styles.grid}>
                    {documents.map((doc) => (
                      <div key={doc.id} style={styles.card} className="glass-card">
                        <div style={styles.cardIcon}>
                          {typeIcons[doc.documentType] || "📄"}
                        </div>
                        <p style={styles.fileName} title={doc.fileName}>
                          {doc.fileName}
                        </p>
                        <span className="badge badge-upcoming" style={{ fontSize: "11px" }}>
                          {doc.documentType?.replace("_", " ")}
                        </span>
                        <p style={styles.uploadedBy}>
                          Uploaded by {doc.username} • {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                        <div style={styles.cardActions}>
                          <button
                            className="btn-ghost"
                            onClick={() => handleViewOrDownload(doc, "view")}
                            style={{ fontSize: "12px", flex: 1, padding: "6px 8px" }}
                            title="View document in new tab"
                          >
                            👁️ View
                          </button>
                          <button
                            className="btn-aurora"
                            onClick={() => handleViewOrDownload(doc, "download")}
                            style={{ fontSize: "12px", flex: 1, padding: "6px 8px" }}
                            title="Download document"
                          >
                            ⬇️ Download
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            style={styles.deleteBtn}
                            title="Delete document"
                            aria-label="Delete document"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
};

const styles = {
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
  errorBanner: { padding: "12px 16px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5", borderRadius: "8px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "14px" },
  successBanner: { padding: "12px 16px", background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", color: "#4ade80", borderRadius: "8px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "14px" },
  closeBannerBtn: { background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: "14px" },
};

export default Documents;