import React from "react";
import { Link } from "react-router-dom";
import PublicLayout from "../components/layout/PublicLayout";

const NotFound = () => {
  const token = localStorage.getItem("token");

  return (
    <PublicLayout>
      <div style={styles.pageContainer}>
        <div style={styles.card} className="glass-card">
          <div style={styles.errorCodeWrapper}>
            <span style={styles.errorCode} className="gradient-text">
              404
            </span>
          </div>

          <h1 style={styles.title}>Page Not Found</h1>

          <p style={styles.subtitle}>
            The destination you're looking for doesn't exist, was moved, or is temporarily unavailable. Let's get you back on track!
          </p>

          <div style={styles.actions}>
            <Link to="/" className="btn-aurora" style={styles.actionBtn}>
              🏠 Back to Home
            </Link>
            {token ? (
              <Link to="/dashboard" className="btn-ghost" style={styles.actionBtn}>
                📊 Go to Dashboard
              </Link>
            ) : (
              <Link to="/destinations" className="btn-ghost" style={styles.actionBtn}>
                🌍 Explore Destinations
              </Link>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

const styles = {
  pageContainer: {
    maxWidth: "700px",
    margin: "0 auto",
    padding: "80px 24px 100px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    padding: "56px 40px",
    borderRadius: "24px",
    textAlign: "center",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
  },
  errorCodeWrapper: {
    marginBottom: "4px",
  },
  errorCode: {
    fontSize: "clamp(72px, 12vw, 110px)",
    fontWeight: "900",
    lineHeight: "1",
    letterSpacing: "-0.03em",
    fontFamily: "'Space Grotesk', var(--tn-font-sans, sans-serif)",
  },
  title: {
    fontSize: "clamp(24px, 4vw, 32px)",
    fontWeight: "700",
    color: "#f8fafc",
    fontFamily: "'Space Grotesk', var(--tn-font-sans, sans-serif)",
  },
  subtitle: {
    fontSize: "15px",
    color: "#94a3b8",
    maxWidth: "480px",
    lineHeight: "1.6",
    marginBottom: "12px",
  },
  actions: {
    display: "flex",
    gap: "16px",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  actionBtn: {
    textDecoration: "none",
    padding: "12px 28px",
    fontSize: "14px",
    fontWeight: "500",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
};

export default NotFound;
