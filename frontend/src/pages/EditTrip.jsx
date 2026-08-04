import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TripForm from "../components/TripForm";
import api from "../services/api";

const EditTrip = () => {
  const { id } = useParams();
  const [tripData, setTripData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTrip();
  }, [id]);

  const fetchTrip = async () => {
    try {
      const res = await api.get(`/trips/${id}`);
      setTripData(res.data);
    } catch (err) {
      console.error(err);
      navigate("/trips");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setShowSuccess(true);
    setTimeout(() => {
      navigate("/trips");
    }, 1500);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Sidebar />
        <main style={styles.main}>
          <p style={{ color: "#94a3b8" }}>Loading trip...</p>
        </main>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebar />
      <main style={styles.main}>
        {showSuccess ? (
          <div style={styles.successContainer} className="glass-card">
            <span style={styles.successIcon}>✅</span>
            <h2 style={styles.successTitle}>Trip Updated Successfully!</h2>
            <p style={styles.successText}>Redirecting to My Trips...</p>
          </div>
        ) : (
          <>
            <button 
              className="btn-ghost" 
              onClick={() => navigate("/trips")}
              style={{ marginBottom: "24px", fontSize: "13px" }}
            >
              ← Back to Trips
            </button>
            <TripForm isEdit={true} initialData={tripData} onSuccess={handleSuccess} />
          </>
        )}
      </main>
    </div>
  );
};

const styles = {
  container: { display: "flex", minHeight: "100vh", background: "#0a0f1e" },
  main: { marginLeft: "260px", flex: 1, padding: "32px" },
  successContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "64px 32px",
    textAlign: "center",
  },
  successIcon: { fontSize: "64px", marginBottom: "24px" },
  successTitle: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#f1f5f9",
    fontFamily: "'Space Grotesk', sans-serif",
    marginBottom: "12px",
  },
  successText: { color: "#94a3b8", fontSize: "16px" },
};

export default EditTrip;
