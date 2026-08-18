import { useState, useEffect, useCallback, useId } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "./Signup.css";

const Signup = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [usernameAvailability, setUsernameAvailability] = useState(null); // null = not checked, true = available, false = taken
  const [checkingUsername, setCheckingUsername] = useState(false);
  
  const { signup } = useAuth();
  const navigate = useNavigate();
  const baseId = useId();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
    
    // Reset username availability when username changes
    if (name === "username") {
      setUsernameAvailability(null);
    }
  };

  // Debounced username availability check
  const checkUsernameAvailability = useCallback(async (username) => {
    const trimmed = username.trim();
    if (!trimmed || trimmed.length < 3) {
      setUsernameAvailability(null);
      return;
    }

    setCheckingUsername(true);
    try {
      const response = await api.get(`/auth/check-username?username=${encodeURIComponent(trimmed)}`);
      const message = response.data?.message;
      setUsernameAvailability(message === "Username is available");
    } catch (err) {
      console.error("Username check failed:", err);
      // Don't block signup if availability check fails - let server validation handle it
      setUsernameAvailability(null);
    } finally {
      setCheckingUsername(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.username.trim()) {
        checkUsernameAvailability(formData.username);
      }
    }, 450); // 450ms debounce

    return () => clearTimeout(timeoutId);
  }, [formData.username, checkUsernameAvailability]);

  // Derived password strength metrics
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: "", colorClass: "" };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: "Weak", colorClass: "strength-weak" };
    if (score === 2 || score === 3) return { score: 2, label: "Medium", colorClass: "strength-medium" };
    return { score: 3, label: "Strong", colorClass: "strength-strong" };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const username = formData.username.trim();
    const email = formData.email.trim();
    const password = formData.password;
    const firstName = formData.firstName.trim();
    const lastName = formData.lastName.trim();

    // Client-side validations
    if (!username || !email || !password) {
      setError("Please fill in all required fields (username, email, and password).");
      return;
    }

    if (username.length < 3) {
      setError("Username must be at least 3 characters long.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (usernameAvailability === false) {
      setError("The chosen username is already taken. Please choose another one.");
      return;
    }

    setLoading(true);
    try {
      await signup({
        username,
        email,
        password,
        firstName,
        lastName,
      });
      setSuccess("Account created successfully! Redirecting to sign in...");
      setTimeout(() => navigate("/login"), 1800);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        "Signup failed. Username or email may already be in use.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const backendBase = (import.meta.env.VITE_BACKEND_URL || "http://localhost:8080").replace(/\/+$/, "");
    window.location.href = `${backendBase}/oauth2/authorization/google`;
  };

  return (
    <div className="signup-page-container">
      {/* Left Brand Showcase Panel */}
      <div className="signup-brand-panel">
        <div className="signup-brand-glow" aria-hidden="true" />
        <div className="signup-brand-content">
          {/* Logo */}
          <Link to="/" className="signup-brand-logo">
            <span className="signup-logo-icon">
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
            <span className="signup-logo-text">TripNest</span>
          </Link>

          <h1 className="signup-tagline">Your Journey Begins Here</h1>
          <p className="signup-description">
            Join thousands of travelers who plan smarter, explore deeper, and create
            unforgettable journeys with AI-powered travel tools.
          </p>

          {/* Value Props Showcase */}
          <div className="signup-features-list">
            <div className="signup-feature-item">
              <div className="signup-feature-icon-wrapper">
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
              <div className="signup-feature-text">
                <span className="signup-feature-title">Intelligent Trip Planning</span>
                <span className="signup-feature-desc">Day-wise itineraries tailored to your travel style</span>
              </div>
            </div>

            <div className="signup-feature-item">
              <div className="signup-feature-icon-wrapper">
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
              <div className="signup-feature-text">
                <span className="signup-feature-title">Seamless Group Travel</span>
                <span className="signup-feature-desc">Co-plan, chat, and travel with companions in real-time</span>
              </div>
            </div>

            <div className="signup-feature-item">
              <div className="signup-feature-icon-wrapper">
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
              <div className="signup-feature-text">
                <span className="signup-feature-title">Live Expense & Budget Tracking</span>
                <span className="signup-feature-desc">Cost analytics, splits, and currency calculations</span>
              </div>
            </div>

            <div className="signup-feature-item">
              <div className="signup-feature-icon-wrapper">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                </svg>
              </div>
              <div className="signup-feature-text">
                <span className="signup-feature-title">Global Destination Catalog</span>
                <span className="signup-feature-desc">Curated spots, best seasons, and recommended activities</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Authentication Panel */}
      <div className="signup-auth-panel">
        <div className="signup-auth-card">
          {/* Mobile Top Header */}
          <div className="signup-mobile-brand">
            <Link to="/" className="signup-mobile-logo">
              <span className="signup-logo-icon">
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
              <span className="signup-logo-text">TripNest</span>
            </Link>
          </div>

          <div className="signup-card-header">
            <h2 className="signup-form-title">Create Account</h2>
            <p className="signup-form-subtitle">Start planning your dream trips today</p>
          </div>

          {/* Success Banner */}
          {success && (
            <div className="signup-success-banner" role="status" aria-live="polite">
              <svg
                className="signup-status-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>{success}</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="signup-error-banner" role="alert" aria-live="assertive">
              <svg
                className="signup-status-icon"
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

          {/* Registration Form */}
          <form onSubmit={handleSubmit} noValidate className="signup-form">
            {/* First & Last Name Row */}
            <div className="signup-name-row">
              <div className="signup-form-group">
                <label htmlFor={`${baseId}-firstname`} className="signup-label">
                  First Name <span className="signup-optional">(optional)</span>
                </label>
                <div className="signup-input-wrapper">
                  <input
                    id={`${baseId}-firstname`}
                    name="firstName"
                    type="text"
                    placeholder="Jane"
                    value={formData.firstName}
                    onChange={handleChange}
                    autoComplete="given-name"
                    disabled={loading || !!success}
                    className="signup-input signup-name-input"
                  />
                </div>
              </div>

              <div className="signup-form-group">
                <label htmlFor={`${baseId}-lastname`} className="signup-label">
                  Last Name <span className="signup-optional">(optional)</span>
                </label>
                <div className="signup-input-wrapper">
                  <input
                    id={`${baseId}-lastname`}
                    name="lastName"
                    type="text"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={handleChange}
                    autoComplete="family-name"
                    disabled={loading || !!success}
                    className="signup-input signup-name-input"
                  />
                </div>
              </div>
            </div>

            {/* Username Field with inline status */}
            <div className="signup-form-group">
              <div className="signup-label-row">
                <label htmlFor={`${baseId}-username`} className="signup-label">
                  Username <span className="signup-required">*</span>
                </label>
                {/* Username live availability feedback */}
                {checkingUsername && (
                  <span className="signup-availability-badge checking">
                    <svg className="signup-mini-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                    </svg>
                    Checking...
                  </span>
                )}
                {!checkingUsername && usernameAvailability === true && (
                  <span className="signup-availability-badge available">
                    ✓ Available
                  </span>
                )}
                {!checkingUsername && usernameAvailability === false && (
                  <span className="signup-availability-badge taken">
                    ✕ Already taken
                  </span>
                )}
              </div>
              <div className="signup-input-wrapper">
                <svg
                  className="signup-field-icon"
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
                  id={`${baseId}-username`}
                  name="username"
                  type="text"
                  placeholder="Choose a unique username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck="false"
                  enterKeyHint="next"
                  disabled={loading || !!success}
                  aria-required="true"
                  aria-invalid={usernameAvailability === false}
                  className="signup-input"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="signup-form-group">
              <label htmlFor={`${baseId}-email`} className="signup-label">
                Email Address <span className="signup-required">*</span>
              </label>
              <div className="signup-input-wrapper">
                <svg
                  className="signup-field-icon"
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
                  id={`${baseId}-email`}
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck="false"
                  enterKeyHint="next"
                  disabled={loading || !!success}
                  aria-required="true"
                  className="signup-input"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="signup-form-group">
              <div className="signup-label-row">
                <label htmlFor={`${baseId}-password`} className="signup-label">
                  Password <span className="signup-required">*</span>
                </label>
                {formData.password && (
                  <span className={`signup-strength-text ${passwordStrength.colorClass}`}>
                    {passwordStrength.label}
                  </span>
                )}
              </div>
              <div className="signup-input-wrapper">
                <svg
                  className="signup-field-icon"
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
                  id={`${baseId}-password`}
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password (min 6 characters)"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                  enterKeyHint="done"
                  disabled={loading || !!success}
                  aria-required="true"
                  className="signup-input signup-password-input"
                />
                <button
                  type="button"
                  className="signup-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  tabIndex={0}
                  disabled={loading || !!success}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                      <line x1="2" y1="2" x2="22" y2="22" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Password strength meter bar */}
              {formData.password && (
                <div className="signup-strength-meter" aria-hidden="true">
                  <div className={`signup-strength-bar ${passwordStrength.score >= 1 ? passwordStrength.colorClass : ""}`} />
                  <div className={`signup-strength-bar ${passwordStrength.score >= 2 ? passwordStrength.colorClass : ""}`} />
                  <div className={`signup-strength-bar ${passwordStrength.score >= 3 ? passwordStrength.colorClass : ""}`} />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="signup-submit-btn"
              disabled={loading || !!success || usernameAvailability === false}
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <svg className="signup-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeLinecap="round" />
                  </svg>
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <svg className="signup-btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>

            {/* OR Divider */}
            <div className="signup-divider">
              <span className="signup-divider-line" />
              <span className="signup-divider-text">OR</span>
              <span className="signup-divider-line" />
            </div>

            {/* Google Sign In Option */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="signup-google-btn"
              disabled={loading || !!success}
            >
              <svg className="signup-google-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
                <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29A11.96 11.96 0 000 12c0 1.93.46 3.76 1.29 5.38l3.98-3.09z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
              </svg>
              <span>Continue with Google</span>
            </button>
          </form>

          {/* Switch to Sign In */}
          <div className="signup-switch-footer">
            <p>
              Already have an account?{" "}
              <Link to="/login" className="signup-switch-link">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;