import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./AdminLogin.css";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { adminLogin } = useAuth();
  const navigate = useNavigate();

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (error) setError("");
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    setLoading(true);

    try {
      await adminLogin({ email: trimmedEmail, password });
      navigate("/admin/dashboard");
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        "Invalid administrator credentials or unauthorized account.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      {/* Subtle ambient lighting backdrop */}
      <div className="admin-login-glow" aria-hidden="true" />

      <div className="admin-login-card">
        {/* Top accent gradient bar */}
        <div className="admin-card-top-bar" aria-hidden="true" />

        {/* Brand identity badge */}
        <div className="admin-badge-wrapper">
          <div className="admin-badge">
            <svg
              className="admin-badge-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <span>TripNest Control Center</span>
          </div>
        </div>

        {/* Header */}
        <div className="admin-login-header">
          <h1>Admin Sign In</h1>
          <p>Restricted administrative gateway. Authorized personnel only.</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            className="admin-error-banner"
            role="alert"
            aria-live="assertive"
          >
            <svg
              className="admin-error-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate className="admin-login-form">
          {/* Email Field */}
          <div className="admin-form-group">
            <label htmlFor="admin-email">Administrator Email</label>
            <div className="admin-input-wrapper">
              <svg
                className="admin-input-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L1 7" />
              </svg>
              <input
                id="admin-email"
                name="email"
                type="email"
                placeholder="admin@tripnest.com"
                value={email}
                onChange={handleEmailChange}
                required
                autoComplete="email"
                autoCapitalize="none"
                spellCheck="false"
                enterKeyHint="next"
                disabled={loading}
                aria-required="true"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="admin-form-group">
            <label htmlFor="admin-password">Password</label>
            <div className="admin-input-wrapper">
              <svg
                className="admin-input-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                id="admin-password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                value={password}
                onChange={handlePasswordChange}
                required
                autoComplete="current-password"
                enterKeyHint="done"
                disabled={loading}
                aria-required="true"
              />
              <button
                type="button"
                className="admin-password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                tabIndex={0}
                disabled={loading}
              >
                {showPassword ? (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                    <line x1="2" y1="2" x2="22" y2="22" />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="admin-submit-btn"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? (
              <>
                <svg
                  className="admin-spinner"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  aria-hidden="true"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeOpacity="0.25"
                  />
                  <path
                    d="M12 2a10 10 0 0 1 10 10"
                    stroke="currentColor"
                    strokeLinecap="round"
                  />
                </svg>
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Access Control Panel</span>
                <svg
                  className="admin-btn-arrow"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Security and Return Links */}
        <div className="admin-footer-section">
          <div className="admin-security-notice">
            <svg
              className="admin-security-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>All administrative sign-in attempts and IP addresses are audited.</span>
          </div>

          <div className="admin-back-link-wrapper">
            <Link to="/" className="admin-back-link">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Return to TripNest Home</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
