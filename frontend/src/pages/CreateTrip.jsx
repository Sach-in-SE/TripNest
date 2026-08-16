import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TripForm from "../components/TripForm";

const CreateTrip = () => {
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSuccess = () => {
    setShowSuccess(true);
    setTimeout(() => {
      navigate("/trips");
    }, 2000);
  };

  return (
    <div className="tn-user-layout-container">
      <Sidebar />
      <main className="tn-user-main">
        {showSuccess ? (
          <div style={styles.successContainer} className="glass-card">
            <span style={styles.successIcon}>✅</span>
            <h2 style={styles.successTitle}>Trip Created Successfully!</h2>
            <p style={styles.successText}>Redirecting to My Trips...</p>
          </div>
        ) : (
          <TripForm onSuccess={handleSuccess} />
        )}
      </main>
    </div>
  );
};

const styles = {
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

export default CreateTrip;
