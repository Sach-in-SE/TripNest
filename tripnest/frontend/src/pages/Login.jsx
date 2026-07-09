import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(formData);
      navigate("/dashboard");
    } catch (err) {
      setError("Invalid username or password!");
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
          <h2 style={styles.tagline}>Plan. Explore. Remember.</h2>
          <p style={styles.description}>
            Your intelligent travel companion for crafting unforgettable journeys.
          </p>
          <div style={styles.features}>
            {["✈️ Smart Trip Planning", "📅 Day-wise Itineraries", "💰 Budget Tracking", "👥 Group Collaboration"].map((f, i) => (
              <div key={i} style={styles.featureItem}>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div style={styles.rightPanel}>
        <div style={styles.formCard} className="glass-card">
          <h2 style={styles.formTitle}>Welcome Back</h2>
          <p style={styles.formSubtitle}>Sign in to continue your journey</p>

          {error && (
            <div style={styles.errorBox}>
              ⚠️ {error}
            </div>
          )}

          <div style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Username</label>
              <input
                className="aurora-input"
                type="text"
                name="username"
                placeholder="Enter your username"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <input
                className="aurora-input"
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            <button
              className="btn-aurora"
              onClick={handleSubmit}
              disabled={loading}
              style={styles.submitBtn}
            >
              {loading ? "Signing in..." : "Sign In →"}
            </button>
          </div>

          <p style={styles.switchText}>
            Don't have an account?{" "}
            <Link to="/signup" style={styles.link}>Create one</Link>
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
  features: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  featureItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    color: "#cbd5e1",
    fontSize: "15px",
    padding: "10px 16px",
    background: "rgba(255,255,255,0.05)",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.08)",
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

export default Login;