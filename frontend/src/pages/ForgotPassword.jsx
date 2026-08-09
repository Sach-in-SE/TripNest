import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // Basic email validation
    if (!email) {
      setError("Email is required");
      setLoading(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Invalid email format");
      setLoading(false);
      return;
    }

    try {
      await api.post("/auth/forgot-password", { email });
      setSuccess("If an account exists with this email, a password reset link has been sent.");
      setEmail("");
    } catch (err) {
      console.error(err);
      setError("Failed to send password reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Left Panel */}
      <div style={styles.leftPanel}>
        <div style={styles.leftContent}>
          <div style={styles.logoArea}>
            <span style={styles.logoIcon}>🧳</span>
            <h1 style={styles.logoText} className="gradient-text">TripNest</h1>
          </div>
          <h2 style={styles.tagline}>Reset Your Password</h2>
          <p style={styles.description}>
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div style={styles.rightPanel}>
        <div style={styles.formCard} className="glass-card">
          <h2 style={styles.formTitle}>Forgot Password</h2>
          <p style={styles.formSubtitle}>We'll send you a reset link</p>

          {error && <div style={styles.errorBox}>⚠️ {error}</div>}
          {success && <div style={styles.successBox}>✅ {success}</div>}

          <div style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <input
                className="aurora-input"
                type="email"
                name="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <button
              className="btn-aurora"
              onClick={handleSubmit}
              disabled={loading}
              style={styles.submitBtn}
            >
              {loading ? "Sending Reset Link..." : "Send Reset Link"}
            </button>
          </div>

          <p style={styles.switchText}>
            Remember your password?{" "}
            <Link to="/login" style={styles.link}>Back to Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    background: "#0a0f1e",
  },
  leftPanel: {
    flex: 1,
    background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(6,182,212,0.08))",
    borderRight: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px",
  },
  leftContent: { maxWidth: "420px" },
  logoArea: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "32px",
  },
  logoIcon: { fontSize: "48px" },
  logoText: {
    fontSize: "42px",
    fontWeight: "700",
    fontFamily: "'Space Grotesk', sans-serif",
    margin: 0,
  },
  tagline: {
    fontSize: "28px",
    fontWeight: "600",
    color: "#f1f5f9",
    marginBottom: "16px",
    fontFamily: "'Space Grotesk', sans-serif",
  },
  description: {
    color: "#94a3b8",
    fontSize: "16px",
    lineHeight: "1.6",
    marginBottom: "32px",
  },
  rightPanel: {
    width: "480px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 40px",
  },
  formCard: {
    width: "100%",
    padding: "40px",
  },
  formTitle: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#f1f5f9",
    marginBottom: "8px",
    fontFamily: "'Space Grotesk', sans-serif",
  },
  formSubtitle: {
    color: "#94a3b8",
    fontSize: "14px",
    marginBottom: "32px",
  },
  errorBox: {
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: "8px",
    padding: "12px 16px",
    color: "#fca5a5",
    fontSize: "14px",
    marginBottom: "20px",
  },
  successBox: {
    background: "rgba(16,185,129,0.1)",
    border: "1px solid rgba(16,185,129,0.3)",
    borderRadius: "8px",
    padding: "12px 16px",
    color: "#6ee7b7",
    fontSize: "14px",
    marginBottom: "20px",
  },
  form: { display: "flex", flexDirection: "column", gap: "20px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { color: "#94a3b8", fontSize: "13px", fontWeight: "500" },
  submitBtn: {
    width: "100%",
    padding: "14px",
    fontSize: "15px",
    fontWeight: "600",
    marginTop: "8px",
  },
  switchText: {
    textAlign: "center",
    color: "#64748b",
    fontSize: "14px",
    marginTop: "24px",
  },
  link: {
    color: "#a78bfa",
    textDecoration: "none",
    fontWeight: "500",
  },
};

export default ForgotPassword;