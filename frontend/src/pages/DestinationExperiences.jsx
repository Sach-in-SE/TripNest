import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PublicLayout from "../components/layout/PublicLayout";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const PAGE_SIZE = 9;

const DestinationExperiences = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [destination, setDestination] = useState(null);
  const [experiences, setExperiences] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch Destination Info
  useEffect(() => {
    const fetchDest = async () => {
      try {
        const res = await api.get(`/destinations/${id}/raw`);
        setDestination(res.data);
      } catch (err) {
        console.error("Failed to load destination summary:", err);
      }
    };
    fetchDest();
  }, [id]);

  // Fetch Paginated Experiences
  const fetchExperiences = useCallback(async (pageIndex) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/destinations/${id}/experiences`, {
        params: { page: pageIndex, size: PAGE_SIZE },
      });
      const data = res.data;
      if (data && Array.isArray(data.content)) {
        setExperiences(data.content);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      } else if (Array.isArray(data)) {
        setExperiences(data);
        setTotalPages(1);
        setTotalElements(data.length);
      } else {
        setExperiences([]);
      }
    } catch (err) {
      console.error("Failed to load destination experiences:", err);
      setError(err.response?.data?.message || "Failed to load traveler experiences.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchExperiences(page);
  }, [fetchExperiences, page]);

  const handleShareExperience = () => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
    } else {
      navigate(`/memories?destinationId=${id}`);
    }
  };

  const mainContent = (
    <div style={user ? styles.userContentWrapper : styles.contentWrapper}>
      {/* Top Navigation & Breadcrumb */}
      <div style={styles.topNavRow}>
        <button
          className="btn-ghost"
          onClick={() => navigate(`/destinations/${id}`)}
          style={{ fontSize: "13px" }}
        >
          ← Back to {destination?.name || "Destination"}
        </button>
        <button
          className="btn-aurora"
          onClick={handleShareExperience}
          style={{ fontSize: "13px", padding: "8px 16px" }}
        >
          📸 Share Your Experience
        </button>
      </div>

      {/* Header Banner */}
      <div style={styles.headerCard} className="glass-card">
        <div style={styles.headerIcon}>📸</div>
        <div>
          <h1 style={styles.headerTitle}>
            Traveler Experiences in {destination?.name || "Destination"}
          </h1>
          <p style={styles.headerSubtitle}>
            {destination?.state && destination?.country
              ? `📍 ${destination.state}, ${destination.country} • `
              : ""}
            {totalElements} {totalElements === 1 ? "story" : "stories"} shared by the TripNest community
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div style={styles.errorBanner} role="alert">
          <span>⚠️ {error}</span>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => fetchExperiences(page)}
            style={{ fontSize: "12px", padding: "4px 10px" }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Experiences Grid / Loading / Empty */}
      {loading ? (
        <div style={styles.grid}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} style={styles.skeletonCard} className="glass-card">
              <div style={styles.skeletonImg} />
              <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={styles.skeletonBarSmall} />
                <div style={styles.skeletonBarMedium} />
                <div style={styles.skeletonBarLarge} />
              </div>
            </div>
          ))}
        </div>
      ) : experiences.length === 0 ? (
        <div style={styles.emptyState} className="glass-card">
          <span style={{ fontSize: "56px", marginBottom: "12px" }}>📸</span>
          <h3 style={{ color: "var(--text-primary, #ffffff)", margin: "8px 0" }}>No Traveler Stories Yet</h3>
          <p style={{ color: "var(--text-secondary, #cbd5e1)", maxWidth: "420px", fontSize: "14px", lineHeight: "1.6", marginBottom: "20px" }}>
            Be the very first traveler to share your authentic photos and memorable moments from visiting {destination?.name || "this destination"}.
          </p>
          <button className="btn-aurora" onClick={handleShareExperience}>
            Share Your Experience
          </button>
        </div>
      ) : (
        <>
          <div style={styles.grid}>
            {experiences.map((exp) => (
              <div key={exp.id} style={styles.card} className="glass-card">
                {/* Author Info */}
                <div style={styles.authorRow}>
                  <div style={styles.avatar}>
                    {exp.userAvatarInitial || exp.userName?.substring(0, 1)?.toUpperCase() || "T"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={styles.authorName} title={exp.userName}>
                      {exp.userName || "Traveler"}
                    </div>
                    <div style={styles.date}>
                      {exp.createdAt
                        ? new Date(exp.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Recent"}
                    </div>
                  </div>
                  {exp.locationName && (
                    <span style={styles.locationBadge} title={exp.locationName}>
                      📍 {exp.locationName}
                    </span>
                  )}
                </div>

                {/* Photo */}
                {exp.imageUrl && (
                  <div style={styles.imgWrapper}>
                    <img
                      src={exp.imageUrl}
                      alt={exp.title}
                      style={styles.img}
                      loading="lazy"
                      onError={(e) => {
                        e.target.parentElement.style.display = "none";
                      }}
                    />
                  </div>
                )}

                {/* Title & Caption */}
                <h3 style={styles.title}>{exp.title}</h3>
                {exp.caption && (
                  <p style={styles.caption}>
                    {exp.caption}
                  </p>
                )}

                {/* Footer Metadata */}
                {exp.tripTitle && (
                  <div style={styles.tripBadge}>
                    ✈️ Trip: {exp.tripTitle}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={styles.paginationRow}>
              <button
                className="btn-ghost"
                disabled={page <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                style={{ fontSize: "13px", opacity: page <= 0 ? 0.5 : 1, cursor: page <= 0 ? "not-allowed" : "pointer" }}
              >
                ← Previous
              </button>
              <span style={styles.pageIndicator}>
                Page {page + 1} of {totalPages}
              </span>
              <button
                className="btn-ghost"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                style={{ fontSize: "13px", opacity: page >= totalPages - 1 ? 0.5 : 1, cursor: page >= totalPages - 1 ? "not-allowed" : "pointer" }}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );

  if (user) {
    return (
      <div className="tn-user-layout-container">
        <Sidebar />
        <main className="tn-user-main">{mainContent}</main>
      </div>
    );
  }

  return <PublicLayout>{mainContent}</PublicLayout>;
};

const styles = {
  userContentWrapper: { width: "100%", maxWidth: "1280px", margin: "0 auto", boxSizing: "border-box" },
  contentWrapper: { maxWidth: "1280px", margin: "0 auto", padding: "32px 24px", width: "100%", boxSizing: "border-box" },
  topNavRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" },
  headerCard: { padding: "24px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" },
  headerIcon: { fontSize: "36px", background: "rgba(56,189,248,0.12)", padding: "14px", borderRadius: "14px" },
  headerTitle: { fontSize: "24px", fontWeight: "700", color: "var(--text-primary, #ffffff)", fontFamily: "'Space Grotesk', sans-serif", margin: "0 0 4px 0" },
  headerSubtitle: { color: "var(--text-secondary, #cbd5e1)", fontSize: "14px", margin: 0 },
  errorBanner: { padding: "14px 18px", borderRadius: "10px", background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.2)", color: "#fca5a5", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", fontSize: "14px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" },
  card: { padding: "20px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: "12px" },
  authorRow: { display: "flex", alignItems: "center", gap: "10px" },
  avatar: { width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #7c3aed, #06b6d4)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "700" },
  authorName: { color: "var(--text-primary, #ffffff)", fontSize: "14px", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  date: { color: "#64748b", fontSize: "11px" },
  locationBadge: { fontSize: "11px", color: "#38bdf8", background: "rgba(56,189,248,0.1)", padding: "2px 6px", borderRadius: "4px", maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  imgWrapper: { width: "100%", height: "200px", borderRadius: "10px", overflow: "hidden", background: "rgba(255,255,255,0.02)" },
  img: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  title: { color: "var(--text-primary, #ffffff)", fontSize: "16px", fontWeight: "600", margin: 0, lineHeight: "1.4" },
  caption: { color: "var(--text-secondary, #cbd5e1)", fontSize: "13px", lineHeight: "1.6", margin: 0, whiteSpace: "pre-wrap" },
  tripBadge: { marginTop: "auto", paddingTop: "8px", borderTop: "1px dashed rgba(255,255,255,0.06)", fontSize: "11px", color: "#a78bfa" },
  emptyState: { padding: "60px 24px", textAlign: "center", borderRadius: "16px", border: "1px dashed rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", alignItems: "center" },
  paginationRow: { display: "flex", justifyContent: "center", alignItems: "center", gap: "16px", marginTop: "32px", padding: "16px 0" },
  pageIndicator: { color: "#94a3b8", fontSize: "13px", fontWeight: "500" },
  skeletonCard: { borderRadius: "14px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" },
  skeletonImg: { width: "100%", height: "180px", background: "rgba(255,255,255,0.04)" },
  skeletonBarSmall: { width: "40%", height: "12px", borderRadius: "4px", background: "rgba(255,255,255,0.04)" },
  skeletonBarMedium: { width: "70%", height: "14px", borderRadius: "4px", background: "rgba(255,255,255,0.04)" },
  skeletonBarLarge: { width: "90%", height: "12px", borderRadius: "4px", background: "rgba(255,255,255,0.04)" },
};

export default DestinationExperiences;
