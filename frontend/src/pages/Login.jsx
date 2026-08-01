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

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:8080/oauth2/authorization/google";
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

            <div style={styles.divider}>
              <span style={styles.dividerLine} />
              <span style={styles.dividerText}>OR</span>
              <span style={styles.dividerLine} />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              style={styles.googleBtn}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/>
                <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29A11.96 11.96 0 000 12c0 1.93.46 3.76 1.29 5.38l3.98-3.09z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/>
              </svg>
              Sign in with Google
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
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    margin: "4px 0",
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    background: "rgba(255,255,255,0.1)",
  },
  dividerText: {
    color: "#64748b",
    fontSize: "12px",
    fontWeight: "500",
  },
  googleBtn: {
    width: "100%",
    padding: "12px",
    fontSize: "14px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "10px",
    color: "#f1f5f9",
    cursor: "pointer",
    transition: "all 0.2s ease",
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