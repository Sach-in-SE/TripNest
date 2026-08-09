import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import api from "../services/api";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (!tokenParam) {
      setError("Invalid reset link. Please request a new password reset.");
      setTokenValid(false);
    } else {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // Validation
    if (!password) {
      setError("Password is required");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      await api.post("/auth/reset-password", { token, newPassword: password });
      setSuccess("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.message || "Failed to reset password. The link may be invalid or expired.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p style={styles.errorText}>❌ {error}</p>
          <Link to="/forgot-password" style={styles.link}>Request a new reset link</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Left Panel */}
      <div style={styles.leftPanel}>
        <div style={styles.leftContent}>
          <div style={styles.logoArea}>
            <span style={styles.logoIcon}>🧳</span>
            <h1 style={styles.logoText} className="gradient-text">TripNest</h1>
          </div>
          <h2 style={styles.tagline}>Set New Password</h2>
          <p style={styles.description}>
            Create a new secure password for your TripNest account.
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div style={styles.rightPanel}>
        <div style={styles.formCard} className="glass-card">
          <h2 style={styles.formTitle}>Reset Password</h2>
          <p style={styles.formSubtitle}>Enter your new password below</p>

          {error && <div style={styles.errorBox}>⚠️ {error}</div>}
          {success && <div style={styles.successBox}>✅ {success}</div>}

          <div style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>New Password</label>
              <input
                className="aurora-input"
                type="password"
                name="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Confirm Password</label>
              <input
                className="aurora-input"
                type="password"
                name="confirmPassword"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <button
              className="btn-aurora"
              onClick={handleSubmit}
              disabled={loading}
              style={styles.submitBtn}
            >
              {loading ? "Resetting Password..." : "Reset Password"}
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
  card: {
    textAlign: "center",
    padding: "32px",
  },
  errorText: { color: "#fca5a5", fontSize: "16px", marginBottom: "16px" },
};

export default ResetPassword;