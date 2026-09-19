import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthService from "../services/authService";

const OAuth2Redirect = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get("oauth_error") || params.get("error");
    if (oauthError) {
      setError("Google sign-in was cancelled or encountered an error. Please try again.");
      return;
    }

    const code = params.get("code");
    if (!code) {
      setError("No authorization code received from Google login.");
      return;
    }

    AuthService.exchangeOAuthCode(code)
      .then(() => {
        // Refresh AuthContext to pick up new authentication state
        refreshUser();
        // Replace URL in browser history to prevent code or token persistence
        navigate("/dashboard", { replace: true });
      })
      .catch((err) => {
        console.error("OAuth exchange error:", err);
        const errorMsg =
          err.response?.data?.message ||
          "Failed to complete Google authentication. The authorization code may be expired or already used.";
        setError(errorMsg);
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