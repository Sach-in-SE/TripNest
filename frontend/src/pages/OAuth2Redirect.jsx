import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const OAuth2Redirect = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setError("No token received from Google login.");
      return;
    }

    localStorage.setItem("token", token);

    // Token set ho gaya, ab profile fetch karo taaki user object bhi sahi format mein ban sake
    api.get("/user/profile")
      .then((res) => {
        const profile = res.data;

        // roles kisi bhi shape mein aa sakte hain (string array ya object array) - defensively normalize
        let roles = [];
        if (Array.isArray(profile.roles)) {
          roles = profile.roles.map((r) => (typeof r === "string" ? r : r.name));
        }

        const userObject = {
          token,
          id: profile.id,
          username: profile.username,
          email: profile.email,
          roles,
        };

        localStorage.setItem("user", JSON.stringify(userObject));
        // Reload taaki AuthContext naye localStorage se user pick kare
        window.location.href = "/dashboard";
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to fetch profile after Google login.");
        localStorage.removeItem("token");
      });
  }, [navigate]);

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