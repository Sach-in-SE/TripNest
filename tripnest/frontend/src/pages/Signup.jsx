import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Signup = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signup(formData);
      setSuccess("Account created! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError("Signup failed! Username or email already exists.");
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
          <h2 style={styles.tagline}>Your Journey Begins Here</h2>
          <p style={styles.description}>
            Join thousands of travelers who plan smarter, explore deeper, and remember forever.
          </p>
          <div style={styles.statsRow}>
            {[
              { value: "10K+", label: "Travelers" },
              { value: "50K+", label: "Trips Planned" },
              { value: "100+", label: "Destinations" },
            ].map((stat, i) => (
              <div key={i} style={styles.statBox}>
                <span style={styles.statValue} className="gradient-text">{stat.value}</span>
                <span style={styles.statLabel}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div style={styles.rightPanel}>
        <div style={styles.formCard} className="glass-card">
          <h2 style={styles.formTitle}>Create Account</h2>
          <p style={styles.formSubtitle}>Start planning your dream trips today</p>

          {error && <div style={styles.errorBox}>⚠️ {error}</div>}
          {success && <div style={styles.successBox}>✅ {success}</div>}

          <div style={styles.form}>
            <div style={styles.row}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>First Name</label>
                <input
                  className="aurora-input"
                  type="text"
                  name="firstName"
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Last Name</label>
                <input
                  className="aurora-input"
                  type="text"
                  name="lastName"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Username</label>
              <input
                className="aurora-input"
                type="text"
                name="username"
                placeholder="Choose a username"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email</label>
              <input
                className="aurora-input"
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <input
                className="aurora-input"
                type="password"
                name="password"
                placeholder="Create a password"
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
              {loading ? "Creating Account..." : "Create Account →"}
            </button>
          </div>

          <p style={styles.switchText}>
            Already have an account?{" "}
            <Link to="/login" style={styles.link}>Sign In</Link>
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
    marginBottom: "40px",
  },
  statsRow: {
    display: "flex",
    gap: "24px",
  },
  statBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "16px 24px",
    background: "rgba(255,255,255,0.05)",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.08)",
    flex: 1,
  },
  statValue: {
    fontSize: "24px",
    fontWeight: "700",
    fontFamily: "'Space Grotesk', sans-serif",
  },
  statLabel: {
    color: "#94a3b8",
    fontSize: "12px",
    marginTop: "4px",
  },
  rightPanel: {
    width: "520px",
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
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  row: { display: "flex", gap: "16px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "8px", flex: 1 },
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

export default Signup;