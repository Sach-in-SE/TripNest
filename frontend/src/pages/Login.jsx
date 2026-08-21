import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

const Login = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const identifier = formData.username.trim();
    const password = formData.password;

    if (!identifier || !password) {
      setError("Please enter both your email/username and password.");
      return;
    }

    setLoading(true);
    try {
      await login({ username: identifier, password });
      navigate("/dashboard");
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        "Invalid email/username or password. Please try again.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const backendBase = import.meta.env.VITE_BACKEND_URL
      ? import.meta.env.VITE_BACKEND_URL.replace(/\/+$/, "")
      : "";
    window.location.href = `${backendBase}/oauth2/authorization/google`;
  };

  return (
    <div className="login-page-container">
      {/* Left Brand Showcase Panel */}
      <div className="login-brand-panel">
        <div className="login-brand-glow" aria-hidden="true" />
        <div className="login-brand-content">
          {/* Logo */}
          <Link to="/" className="login-brand-logo">
            <span className="login-logo-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </span>
            <span className="login-logo-text">TripNest</span>
          </Link>

          <h1 className="login-tagline">Plan. Explore. Remember.</h1>
          <p className="login-description">
            Your intelligent travel companion for crafting unforgettable journeys,
            tracking expenses, and exploring destinations effortlessly.
          </p>

          {/* Value Props */}
          <div className="login-features-list">
            <div className="login-feature-item">
              <div className="login-feature-icon-wrapper">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <div className="login-feature-text">
                <span className="login-feature-title">Smart Trip Planning</span>
                <span className="login-feature-desc">AI-assisted itinerary suggestions and custom routes</span>
              </div>
            </div>

            <div className="login-feature-item">
              <div className="login-feature-icon-wrapper">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div className="login-feature-text">
                <span className="login-feature-title">Day-wise Itineraries</span>
                <span className="login-feature-desc">Structured daily schedules with maps & activities</span>
              </div>
            </div>

            <div className="login-feature-item">
              <div className="login-feature-icon-wrapper">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div className="login-feature-text">
                <span className="login-feature-title">Budget Tracking</span>
                <span className="login-feature-desc">Live expense logs, cost analytics, and split estimates</span>
              </div>
            </div>

            <div className="login-feature-item">
              <div className="login-feature-icon-wrapper">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="login-feature-text">
                <span className="login-feature-title">Group Collaboration</span>
                <span className="login-feature-desc">Co-plan, discuss, and travel with your group</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Authentication Panel */}
      <div className="login-auth-panel">
        <div className="login-auth-card">
          {/* Mobile Header Branding */}
          <div className="login-mobile-brand">
            <Link to="/" className="login-mobile-logo">
              <span className="login-logo-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </span>
              <span className="login-logo-text">TripNest</span>
            </Link>
          </div>

          <div className="login-card-header">
            <h2 className="login-form-title">Welcome Back</h2>
            <p className="login-form-subtitle">Sign in to continue your journey</p>
          </div>

          {/* Inline Error Presentation */}
          {error && (
            <div
              className="login-error-banner"
              role="alert"
              aria-live="assertive"
            >
              <svg
                className="login-error-icon"
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

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="login-form">
            {/* Email or Username */}
            <div className="login-form-group">
              <label htmlFor="login-username" className="login-label">
                Email or username
              </label>
              <div className="login-input-wrapper">
                <svg
                  className="login-field-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  id="login-username"
                  name="username"
                  type="text"
                  placeholder="Enter your email or username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck="false"
                  enterKeyHint="next"
                  disabled={loading}
                  aria-required="true"
                  className="login-input"
                />
              </div>
            </div>

            {/* Password */}
            <div className="login-form-group">
              <div className="login-password-label-row">
                <label htmlFor="login-password" className="login-label">
                  Password
                </label>
                <Link to="/forgot-password" className="login-forgot-link" tabIndex={0}>
                  Forgot password?
                </Link>
              </div>
              <div className="login-input-wrapper">
                <svg
                  className="login-field-icon"
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
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                  enterKeyHint="done"
                  disabled={loading}
                  aria-required="true"
                  className="login-input login-password-input"
                />
                <button
                  type="button"
                  className="login-password-toggle"
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

            {/* Primary Sign In Button */}
            <button
              type="submit"
              className="login-submit-btn"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <svg
                    className="login-spinner"
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
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <svg
                    className="login-btn-arrow"
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

            {/* OR Divider */}
            <div className="login-divider">
              <span className="login-divider-line" />
              <span className="login-divider-text">OR</span>
              <span className="login-divider-line" />
            </div>

            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="login-google-btn"
              disabled={loading}
            >
              <svg className="login-google-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29A11.96 11.96 0 000 12c0 1.93.46 3.76 1.29 5.38l3.98-3.09z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </form>

          {/* Switch to Signup */}
          <div className="login-switch-footer">
            <p>
              Don't have an account?{" "}
              <Link to="/signup" className="login-switch-link">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;