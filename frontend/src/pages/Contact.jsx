import React, { useState, useEffect, useId } from "react";
import { Link } from "react-router-dom";
import PublicLayout from "../components/layout/PublicLayout";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const CATEGORIES = [
  { value: "GENERAL_INQUIRY", label: "💬 General Inquiry", desc: "General questions about TripNest features and usage" },
  { value: "BUG_REPORT", label: "🐛 Bug Report", desc: "Report unexpected errors or platform glitches" },
  { value: "FEEDBACK", label: "💡 Product Feedback", desc: "Share suggestions on usability and travel planning flow" },
  { value: "FEATURE_REQUEST", label: "✨ Feature Request", desc: "Propose new capabilities or integrations" },
  { value: "OTHER", label: "📌 Other", desc: "Any other topic or project collaboration inquiry" },
];

const Contact = () => {
  const { user } = useAuth();
  const baseId = useId();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "GENERAL_INQUIRY",
    subject: "",
    message: "",
  });

  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successData, setSuccessData] = useState(null);

  // Pre-fill user information if authenticated
  useEffect(() => {
    if (user) {
      const userFullName =
        (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}`.trim() : null) ||
        user.name ||
        user.username ||
        "";

      setFormData((prev) => ({
        ...prev,
        name: prev.name || userFullName,
        email: prev.email || user.email || "",
      }));
    }
  }, [user]);

  // Validation function
  const validate = (values) => {
    const errs = {};
    const name = values.name.trim();
    const email = values.email.trim();
    const subject = values.subject.trim();
    const message = values.message.trim();

    if (!name) {
      errs.name = "Full name is required";
    } else if (name.length < 2) {
      errs.name = "Name must be at least 2 characters long";
    } else if (name.length > 100) {
      errs.name = "Name cannot exceed 100 characters";
    }

    if (!email) {
      errs.email = "Email address is required";
    } else if (email.length > 100) {
      errs.email = "Email cannot exceed 100 characters";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = "Please enter a valid email address (e.g. name@example.com)";
    }

    if (!values.category) {
      errs.category = "Please select an inquiry category";
    }

    if (!subject) {
      errs.subject = "Subject is required";
    } else if (subject.length < 3) {
      errs.subject = "Subject must be at least 3 characters long";
    } else if (subject.length > 200) {
      errs.subject = "Subject cannot exceed 200 characters";
    }

    if (!message) {
      errs.message = "Message content is required";
    } else if (message.length < 10) {
      errs.message = "Message must be at least 10 characters long";
    } else if (message.length > 3000) {
      errs.message = "Message cannot exceed 3,000 characters";
    }

    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (serverError) setServerError("");

    if (touched[name]) {
      const fieldErrors = validate({ ...formData, [name]: value });
      setErrors((prev) => ({ ...prev, [name]: fieldErrors[name] }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const fieldErrors = validate(formData);
    setErrors((prev) => ({ ...prev, [name]: fieldErrors[name] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    setTouched({
      name: true,
      email: true,
      category: true,
      subject: true,
      message: true,
    });

    const validationErrors = validate(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        category: formData.category,
        subject: formData.subject.trim(),
        message: formData.message.trim(),
      };

      const response = await api.post("/contact", payload);
      setSuccessData(response.data);
    } catch (err) {
      console.error("Contact form submission error:", err);
      const errMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to send your message. Please check your details and try again.";
      setServerError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    setSuccessData(null);
    setFormData({
      name: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}`.trim() : (user?.name || user?.username || ""),
      email: user?.email || "",
      category: "GENERAL_INQUIRY",
      subject: "",
      message: "",
    });
    setTouched({});
    setErrors({});
    setServerError("");
  };

  const messageLength = formData.message.length;
  const maxMessageLength = 3000;

  return (
    <PublicLayout>
      <div style={styles.pageContainer}>
        {/* Page Header */}
        <header style={styles.header}>
          <div style={styles.badgeWrapper}>
            <span style={styles.badge}>
              <span style={{ fontSize: "14px" }}>📬</span> Contact & Support
            </span>
          </div>
          <h1 style={styles.title}>
            Get in Touch with <span className="gradient-text">TripNest</span>
          </h1>
          <p style={styles.subtitle}>
            Have a question, found an issue, or want to share feedback? Send us a message and our administration team will review it.
          </p>
        </header>

        {/* 2-Column Responsive Layout */}
        <div style={styles.mainGrid}>
          {/* Left Column: Context & Developer Info */}
          <aside style={styles.infoCol}>
            {/* About Box */}
            <div style={styles.infoCard} className="glass-card">
              <div style={styles.infoIconHeader}>
                <span style={{ fontSize: "28px" }}>🧭</span>
                <div>
                  <h2 style={styles.infoCardTitle}>TripNest Platform</h2>
                  <p style={styles.infoCardSubtitle}>All-in-One Travel Ecosystem</p>
                </div>
              </div>
              <p style={styles.infoText}>
                TripNest unifies itinerary scheduling, group travel collaboration, live budget management, photo diaries, and document vaults in a single web experience.
              </p>
            </div>

            {/* How We Can Help */}
            <div style={styles.infoCard} className="glass-card">
              <h2 style={styles.infoCardTitle}>How Can We Help?</h2>
              <ul style={styles.helpList}>
                <li style={styles.helpItem}>
                  <span style={styles.helpBullet}>💬</span>
                  <div>
                    <strong>General Inquiries:</strong> Questions regarding travel tools, group coordination, or destination guides.
                  </div>
                </li>
                <li style={styles.helpItem}>
                  <span style={styles.helpBullet}>🐛</span>
                  <div>
                    <strong>Bug Reports:</strong> Encountered a visual glitch or unexpected behavior? Let us know so we can fix it.
                  </div>
                </li>
                <li style={styles.helpItem}>
                  <span style={styles.helpBullet}>💡</span>
                  <div>
                    <strong>Product Feedback:</strong> Suggestions on how to make TripNest more intuitive for solo and group travelers.
                  </div>
                </li>
                <li style={styles.helpItem}>
                  <span style={styles.helpBullet}>✨</span>
                  <div>
                    <strong>Feature Requests:</strong> Propose new capabilities, third-party integrations, or export options.
                  </div>
                </li>
              </ul>
            </div>

            {/* Developer Section */}
            <div style={styles.infoCard} className="glass-card">
              <h2 style={styles.infoCardTitle}>Project & Developer</h2>
              <p style={styles.infoText}>
                Developed by <strong>Sachin Kumar</strong> as a solo full-stack project under the <strong>Infosys Springboard Internship 7.0</strong> program.
              </p>

              <div style={styles.developerLinks}>
                <a
                  href="https://github.com/Sach-in-SE/TripNest"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.devLink}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  <span>Project Repository (GitHub)</span>
                </a>
              </div>
            </div>
          </aside>

          {/* Right Column: Contact Form */}
          <main style={styles.formCol}>
            <div style={styles.formCard} className="glass-card">
              {/* Success State View */}
              {successData ? (
                <div style={styles.successWrapper} role="status" aria-live="polite">
                  <div style={styles.successIconWrapper}>
                    <span style={{ fontSize: "36px" }}>✅</span>
                  </div>
                  <h2 style={styles.successTitle}>Message Sent Successfully!</h2>
                  <p style={styles.successMessage}>
                    Thank you, <strong>{successData.name}</strong>. Your message regarding <strong>"{successData.subject}"</strong> has been securely delivered to the TripNest administrative desk (Ticket #{successData.id}).
                  </p>

                  <div style={styles.successMetaBox}>
                    <div style={styles.successMetaItem}>
                      <span style={styles.successMetaLabel}>Category:</span>
                      <span style={styles.successMetaValue}>{successData.categoryDisplayName || successData.category}</span>
                    </div>
                    <div style={styles.successMetaItem}>
                      <span style={styles.successMetaLabel}>Status:</span>
                      <span style={styles.successMetaBadge}>{successData.statusDisplayName || successData.status}</span>
                    </div>
                    <div style={styles.successMetaItem}>
                      <span style={styles.successMetaLabel}>Sender Email:</span>
                      <span style={styles.successMetaValue}>{successData.email}</span>
                    </div>
                  </div>

                  <div style={styles.successActions}>
                    <button
                      type="button"
                      onClick={handleResetForm}
                      className="btn-aurora"
                      style={styles.successBtn}
                    >
                      ✉️ Send Another Message
                    </button>
                    <Link to="/" className="btn-ghost" style={styles.successBtn}>
                      🏠 Return Home
                    </Link>
                  </div>
                </div>
              ) : (
                /* Interactive Form View */
                <div>
                  <div style={styles.formHeader}>
                    <h2 style={styles.formTitle}>Send Us a Message</h2>
                    <p style={styles.formSubtitle}>
                      Fill in the details below and we will process your inquiry.
                    </p>
                  </div>

                  {/* Top-Level Server Error Banner */}
                  {serverError && (
                    <div style={styles.errorBanner} role="alert" aria-live="assertive">
                      <span style={{ fontSize: "18px" }}>⚠️</span>
                      <div style={{ flex: 1 }}>
                        <strong>Submission Error:</strong> {serverError}
                      </div>
                      <button
                        type="button"
                        onClick={() => setServerError("")}
                        style={styles.errorCloseBtn}
                        aria-label="Dismiss error"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} noValidate style={styles.form}>
                    {/* Name & Email Row */}
                    <div style={styles.formRow}>
                      {/* Name Field */}
                      <div style={styles.formGroup}>
                        <label htmlFor={`${baseId}-name`} style={styles.label}>
                          Full Name <span style={styles.requiredAsterisk}>*</span>
                        </label>
                        <input
                          id={`${baseId}-name`}
                          name="name"
                          type="text"
                          placeholder="Your full name"
                          value={formData.name}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          disabled={loading}
                          required
                          aria-required="true"
                          aria-invalid={!!(touched.name && errors.name)}
                          aria-describedby={touched.name && errors.name ? `${baseId}-name-err` : undefined}
                          className="aurora-input"
                          style={{
                            ...styles.input,
                            borderColor: touched.name && errors.name ? "#ef4444" : undefined,
                          }}
                        />
                        {touched.name && errors.name && (
                          <div id={`${baseId}-name-err`} style={styles.fieldError} role="alert">
                            {errors.name}
                          </div>
                        )}
                      </div>

                      {/* Email Field */}
                      <div style={styles.formGroup}>
                        <label htmlFor={`${baseId}-email`} style={styles.label}>
                          Email Address <span style={styles.requiredAsterisk}>*</span>
                        </label>
                        <input
                          id={`${baseId}-email`}
                          name="email"
                          type="email"
                          placeholder="name@example.com"
                          value={formData.email}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          disabled={loading}
                          required
                          aria-required="true"
                          aria-invalid={!!(touched.email && errors.email)}
                          aria-describedby={touched.email && errors.email ? `${baseId}-email-err` : undefined}
                          className="aurora-input"
                          style={{
                            ...styles.input,
                            borderColor: touched.email && errors.email ? "#ef4444" : undefined,
                          }}
                        />
                        {touched.email && errors.email && (
                          <div id={`${baseId}-email-err`} style={styles.fieldError} role="alert">
                            {errors.email}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Category Selection */}
                    <div style={styles.formGroup}>
                      <label htmlFor={`${baseId}-category`} style={styles.label}>
                        Inquiry Category <span style={styles.requiredAsterisk}>*</span>
                      </label>
                      <select
                        id={`${baseId}-category`}
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={loading}
                        required
                        aria-required="true"
                        aria-invalid={!!(touched.category && errors.category)}
                        className="aurora-input"
                        style={{
                          ...styles.input,
                          ...styles.selectInput,
                          borderColor: touched.category && errors.category ? "#ef4444" : undefined,
                        }}
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat.value} value={cat.value} style={styles.selectOption}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                      {touched.category && errors.category && (
                        <div style={styles.fieldError} role="alert">
                          {errors.category}
                        </div>
                      )}
                    </div>

                    {/* Subject Field */}
                    <div style={styles.formGroup}>
                      <label htmlFor={`${baseId}-subject`} style={styles.label}>
                        Subject <span style={styles.requiredAsterisk}>*</span>
                      </label>
                      <input
                        id={`${baseId}-subject`}
                        name="subject"
                        type="text"
                        placeholder="Brief summary of your inquiry"
                        value={formData.subject}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={loading}
                        required
                        aria-required="true"
                        aria-invalid={!!(touched.subject && errors.subject)}
                        aria-describedby={touched.subject && errors.subject ? `${baseId}-subject-err` : undefined}
                        className="aurora-input"
                        style={{
                          ...styles.input,
                          borderColor: touched.subject && errors.subject ? "#ef4444" : undefined,
                        }}
                      />
                      {touched.subject && errors.subject && (
                        <div id={`${baseId}-subject-err`} style={styles.fieldError} role="alert">
                          {errors.subject}
                        </div>
                      )}
                    </div>

                    {/* Message Field with Character Counter */}
                    <div style={styles.formGroup}>
                      <div style={styles.textareaLabelRow}>
                        <label htmlFor={`${baseId}-message`} style={styles.label}>
                          Message <span style={styles.requiredAsterisk}>*</span>
                        </label>
                        <span
                          style={{
                            ...styles.charCounter,
                            color:
                              messageLength > maxMessageLength
                                ? "#ef4444"
                                : messageLength >= 10
                                ? "#94a3b8"
                                : "#cbd5e1",
                          }}
                          aria-live="polite"
                        >
                          {messageLength} / {maxMessageLength} chars
                        </span>
                      </div>
                      <textarea
                        id={`${baseId}-message`}
                        name="message"
                        rows={6}
                        placeholder="Please describe your question, issue, or feedback in detail (minimum 10 characters)..."
                        value={formData.message}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={loading}
                        required
                        aria-required="true"
                        aria-invalid={!!(touched.message && errors.message)}
                        aria-describedby={touched.message && errors.message ? `${baseId}-msg-err` : undefined}
                        className="aurora-input"
                        style={{
                          ...styles.input,
                          ...styles.textarea,
                          borderColor: touched.message && errors.message ? "#ef4444" : undefined,
                        }}
                      />
                      {touched.message && errors.message && (
                        <div id={`${baseId}-msg-err`} style={styles.fieldError} role="alert">
                          {errors.message}
                        </div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <div style={styles.submitRow}>
                      <button
                        type="submit"
                        disabled={loading}
                        aria-busy={loading}
                        className="btn-aurora"
                        style={styles.submitBtn}
                      >
                        {loading ? (
                          <>
                            <svg
                              style={styles.spinner}
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              aria-hidden="true"
                            >
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" />
                              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeLinecap="round" />
                            </svg>
                            <span>Sending Message...</span>
                          </>
                        ) : (
                          <>
                            <span>Send Message</span>
                            <span style={{ fontSize: "16px" }}>✈️</span>
                          </>
                        )}
                      </button>

                      <p style={styles.submitDisclaimer}>
                        🔒 Messages are securely transmitted and stored for administrative review.
                      </p>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </PublicLayout>
  );
};

const styles = {
  pageContainer: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "48px 24px 80px",
  },
  header: {
    textAlign: "center",
    marginBottom: "48px",
    maxWidth: "760px",
    margin: "0 auto 48px",
  },
  badgeWrapper: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "16px",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 16px",
    borderRadius: "999px",
    background: "rgba(124, 58, 237, 0.12)",
    border: "1px solid rgba(124, 58, 237, 0.3)",
    color: "#c084fc",
    fontSize: "13px",
    fontWeight: "600",
  },
  title: {
    fontSize: "clamp(30px, 5vw, 44px)",
    fontWeight: "800",
    color: "#f8fafc",
    lineHeight: "1.2",
    marginBottom: "16px",
    fontFamily: "'Space Grotesk', var(--tn-font-sans, sans-serif)",
  },
  subtitle: {
    fontSize: "16px",
    lineHeight: "1.6",
    color: "#94a3b8",
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
    gap: "32px",
    alignItems: "start",
  },
  infoCol: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  formCol: {
    width: "100%",
  },
  infoCard: {
    padding: "28px",
    borderRadius: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  infoIconHeader: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  infoCardTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#f8fafc",
    fontFamily: "'Space Grotesk', var(--tn-font-sans, sans-serif)",
  },
  infoCardSubtitle: {
    fontSize: "13px",
    color: "#a78bfa",
    margin: 0,
  },
  infoText: {
    fontSize: "14px",
    color: "#cbd5e1",
    lineHeight: "1.6",
    margin: 0,
  },
  helpList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  helpItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    fontSize: "13.5px",
    color: "#cbd5e1",
    lineHeight: "1.5",
  },
  helpBullet: {
    fontSize: "18px",
    flexShrink: 0,
    marginTop: "2px",
  },
  developerLinks: {
    marginTop: "6px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  devLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    color: "#c084fc",
    textDecoration: "none",
    fontSize: "13.5px",
    fontWeight: "500",
    padding: "8px 14px",
    background: "rgba(124, 58, 237, 0.08)",
    border: "1px solid rgba(124, 58, 237, 0.2)",
    borderRadius: "8px",
    transition: "all 0.2s ease",
    width: "fit-content",
  },
  formCard: {
    padding: "36px 32px",
    borderRadius: "20px",
  },
  formHeader: {
    marginBottom: "24px",
  },
  formTitle: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#f8fafc",
    marginBottom: "6px",
    fontFamily: "'Space Grotesk', var(--tn-font-sans, sans-serif)",
  },
  formSubtitle: {
    fontSize: "14px",
    color: "#94a3b8",
    margin: 0,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  formRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "13.5px",
    fontWeight: "600",
    color: "#e2e8f0",
  },
  requiredAsterisk: {
    color: "#f43f5e",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 14px",
    borderRadius: "10px",
    fontSize: "14px",
    color: "#f8fafc",
    background: "rgba(15, 23, 42, 0.6)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    outline: "none",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
  },
  selectInput: {
    cursor: "pointer",
  },
  selectOption: {
    background: "#0f172a",
    color: "#f8fafc",
    padding: "8px",
  },
  textarea: {
    resize: "vertical",
    minHeight: "130px",
    fontFamily: "inherit",
    lineHeight: "1.5",
  },
  textareaLabelRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  charCounter: {
    fontSize: "12px",
  },
  fieldError: {
    fontSize: "12px",
    color: "#ef4444",
    marginTop: "2px",
  },
  errorBanner: {
    padding: "12px 16px",
    borderRadius: "10px",
    background: "rgba(239, 68, 68, 0.15)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    color: "#fca5a5",
    fontSize: "13.5px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "20px",
  },
  errorCloseBtn: {
    background: "transparent",
    border: "none",
    color: "#fca5a5",
    cursor: "pointer",
    fontSize: "14px",
    padding: "2px 6px",
  },
  submitRow: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "8px",
  },
  submitBtn: {
    width: "100%",
    padding: "13px 24px",
    fontSize: "15px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    border: "none",
    cursor: "pointer",
    borderRadius: "10px",
  },
  submitDisclaimer: {
    fontSize: "12px",
    color: "#64748b",
    textAlign: "center",
    margin: 0,
  },
  spinner: {
    width: "18px",
    height: "18px",
    animation: "spin 1s linear infinite",
  },
  successWrapper: {
    padding: "24px 8px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
  },
  successIconWrapper: {
    width: "68px",
    height: "68px",
    borderRadius: "50%",
    background: "rgba(34, 197, 94, 0.15)",
    border: "1px solid rgba(34, 197, 94, 0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#f8fafc",
    fontFamily: "'Space Grotesk', var(--tn-font-sans, sans-serif)",
  },
  successMessage: {
    fontSize: "15px",
    color: "#cbd5e1",
    lineHeight: "1.6",
    maxWidth: "480px",
  },
  successMetaBox: {
    width: "100%",
    maxWidth: "420px",
    background: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "12px",
    padding: "16px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    textAlign: "left",
  },
  successMetaItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "13px",
  },
  successMetaLabel: {
    color: "#94a3b8",
    fontWeight: "500",
  },
  successMetaValue: {
    color: "#f8fafc",
    fontWeight: "600",
  },
  successMetaBadge: {
    background: "rgba(99, 102, 241, 0.2)",
    color: "#a5b4fc",
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "600",
  },
  successActions: {
    display: "flex",
    gap: "14px",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: "8px",
  },
  successBtn: {
    padding: "10px 24px",
    fontSize: "14px",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
};

export default Contact;
