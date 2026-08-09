import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const OAuth2Redirect = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setError("No token received from Google login.");
      return;
    }

    // Store token first
    localStorage.setItem("token", token);

    // Fetch user profile to get complete user information
    api.get("/user/profile")
      .then((res) => {
        const profile = res.data;

        // Normalize roles - handle both string arrays and object arrays
        let roles = [];
        if (Array.isArray(profile.roles)) {
          roles = profile.roles.map((r) => (typeof r === "string" ? r : r.name));
        }

        // Create user object matching the expected format
        const userObject = {
          token,
          id: profile.id,
          username: profile.username,
          email: profile.email,
          roles,
        };

        // Store user object in localStorage
        localStorage.setItem("user", JSON.stringify(userObject));

        // Refresh AuthContext to pick up new authentication state
        refreshUser();

        // Navigate to dashboard
        navigate("/dashboard", { replace: true });
      })
      .catch((err) => {
        console.error("Profile fetch error:", err);
        setError("Failed to fetch profile after Google login.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      });
  }, [navigate, refreshUser]);

  return (
    <div style={styles.container}>
      {error ? (
        <div style={styles.card}>
          <p style={styles.errorText}>❌ {error}</p>
          <button className="btn-aurora" onClick={() => navigate("/login")}>
            Back to Login
          </button>
        </div>
      ) : (
        <div style={styles.card}>
          <p style={styles.loadingText}>Signing you in with Google...</p>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    background: "#0a0f1e",
  },
  card: {
    textAlign: "center",
    padding: "32px",
  },
  loadingText: { color: "#94a3b8", fontSize: "16px" },
  errorText: { color: "#fca5a5", fontSize: "16px", marginBottom: "16px" },
};

export default OAuth2Redirect;