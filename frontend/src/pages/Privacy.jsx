import React from "react";
import { Link } from "react-router-dom";
import PublicLayout from "../components/layout/PublicLayout";

const Privacy = () => {
  return (
    <PublicLayout>
      <div style={styles.pageContainer}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.badgeWrapper}>
            <span style={styles.badge}>
              <span style={{ fontSize: "14px" }}>🔒</span> Privacy Policy
            </span>
          </div>
          <h1 style={styles.title}>
            TripNest <span className="gradient-text">Privacy Policy</span>
          </h1>
          <p style={styles.subtitle}>
            Project Demonstration & Academic Scope • Last updated: August 2026
          </p>
        </header>

        {/* Policy Content Body */}
        <div style={styles.contentWrapper} className="glass-card">
          {/* 1. Overview */}
          <section style={styles.section}>
            <h2 style={styles.sectionHeading}>1. Overview</h2>
            <p style={styles.paragraph}>
              TripNest is an educational software project and travel planning platform designed to demonstrate modern full-stack web application development, collaborative itinerary creation, and travel management capabilities. This Privacy Policy describes how information is collected, processed, and managed within the application during project evaluations, user demonstrations, and testing.
            </p>
          </section>

          {/* 2. Information We Collect */}
          <section style={styles.section}>
            <h2 style={styles.sectionHeading}>2. Information We Collect</h2>
            <p style={styles.paragraph}>
              To enable core travel planning, group collaboration, and personalized itinerary management, TripNest stores the following categories of user-provided information:
            </p>
            <ul style={styles.list}>
              <li style={styles.listItem}>
                <strong>Account Information:</strong> Username, email address, hashed password, optional first/last name, phone number, and self-reported travel preferences.
              </li>
              <li style={styles.listItem}>
                <strong>Trip & Travel Data:</strong> Destination names, departure and return dates, scheduled activities, notes, and planned travel budgets.
              </li>
              <li style={styles.listItem}>
                <strong>Financial Expense Records:</strong> User-logged expenditures, item categories (e.g., food, lodging, transport), amounts, and expense dates.
              </li>
              <li style={styles.listItem}>
                <strong>Uploaded Memories & Documents:</strong> Travel photos, vouchers, flight tickets, and documents uploaded by travelers to their private or group vault.
              </li>
              <li style={styles.listItem}>
                <strong>Collaboration Data:</strong> Group memberships, chat discussion messages, and shared trip permissions.
              </li>
            </ul>
          </section>

          {/* 3. How Information Is Used */}
          <section style={styles.section}>
            <h2 style={styles.sectionHeading}>3. How Information Is Used</h2>
            <p style={styles.paragraph}>
              The collected information is used strictly to facilitate platform features:
            </p>
            <ul style={styles.list}>
              <li style={styles.listItem}>Authenticating user identity and managing secure login sessions via JWT.</li>
              <li style={styles.listItem}>Rendering personal dashboards, day-by-day itineraries, and budget calculations.</li>
              <li style={styles.listItem}>Enabling group chat and notifying travelers of invitations or trip shares.</li>
              <li style={styles.listItem}>Exporting formatted travel summaries and itineraries as downloadable PDF documents.</li>
            </ul>
          </section>

          {/* 4. Authentication & Security */}
          <section style={styles.section}>
            <h2 style={styles.sectionHeading}>4. Authentication & Security</h2>
            <p style={styles.paragraph}>
              User passwords are cryptographically hashed using standard BCrypt password encoders before storage in the database. Protected endpoints require valid JSON Web Tokens (JWT) transmitted over secure HTTP headers. File uploads are validated for file extension and size limits prior to local storage.
            </p>
          </section>

          {/* 5. Third-Party Services */}
          <section style={styles.section}>
            <h2 style={styles.sectionHeading}>5. Third-Party Services & Integrations</h2>
            <p style={styles.paragraph}>
              TripNest integrates with select external services strictly for real-time information lookup and sign-in convenience:
            </p>
            <ul style={styles.list}>
              <li style={styles.listItem}>
                <strong>Google OAuth 2.0:</strong> Optional social authentication to allow travelers to sign in using their verified Google identity.
              </li>
              <li style={styles.listItem}>
                <strong>Open-Meteo API:</strong> Fetches live temperature and weather forecast data for cataloged destination coordinates without transmitting personal user identifiers.
              </li>
              <li style={styles.listItem}>
                <strong>Wikipedia REST API:</strong> Fetches informational destination extracts and encyclopedic summaries for traveler reference.
              </li>
            </ul>
          </section>

          {/* 6. Data Storage & Retention */}
          <section style={styles.section}>
            <h2 style={styles.sectionHeading}>6. Data Storage & Retention</h2>
            <p style={styles.paragraph}>
              All user data, trips, expenses, and document metadata are stored in a dedicated relational MySQL database. Files and travel photos are stored in application-controlled storage directories. Users have the ability to delete their trips, expenses, memories, documents, and groups at any time through the respective user interfaces.
            </p>
          </section>

          {/* 7. User Responsibilities */}
          <section style={styles.section}>
            <h2 style={styles.sectionHeading}>7. User Responsibilities</h2>
            <p style={styles.paragraph}>
              Users and evaluators are advised not to upload sensitive personal identification numbers, unredacted financial card numbers, or proprietary confidential files during software demonstrations. TripNest is intended for travel planning demonstration and testing purposes.
            </p>
          </section>

          {/* 8. Support & Inquiries */}
          <section style={styles.section}>
            <h2 style={styles.sectionHeading}>8. Project Inquiries</h2>
            <p style={styles.paragraph}>
              If you have questions, feedback, or observations regarding this demonstration software or its privacy architecture, please reach out via the project repository or academic presentation forum.
            </p>
          </section>

          <div style={styles.footerNote}>
            <p>
              TripNest Project Demonstration •{" "}
              <Link to="/terms" style={styles.inlineLink}>
                Terms of Service
              </Link>{" "}
              •{" "}
              <Link to="/about" style={styles.inlineLink}>
                About TripNest
              </Link>
            </p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

const styles = {
  pageContainer: {
    maxWidth: "960px",
    margin: "0 auto",
    padding: "48px 24px 80px",
  },
  header: {
    textAlign: "center",
    marginBottom: "40px",
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
    fontSize: "clamp(28px, 4vw, 40px)",
    fontWeight: "800",
    color: "#f8fafc",
    marginBottom: "12px",
    fontFamily: "'Space Grotesk', var(--tn-font-sans, sans-serif)",
  },
  subtitle: {
    fontSize: "14px",
    color: "#94a3b8",
  },
  contentWrapper: {
    padding: "40px 48px",
    borderRadius: "20px",
  },
  section: {
    marginBottom: "32px",
  },
  sectionHeading: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#f8fafc",
    marginBottom: "12px",
    fontFamily: "'Space Grotesk', var(--tn-font-sans, sans-serif)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
    paddingBottom: "8px",
  },
  paragraph: {
    fontSize: "15px",
    color: "#cbd5e1",
    lineHeight: "1.7",
    marginBottom: "12px",
  },
  list: {
    paddingLeft: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  listItem: {
    fontSize: "14px",
    color: "#cbd5e1",
    lineHeight: "1.6",
  },
  footerNote: {
    marginTop: "40px",
    paddingTop: "20px",
    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
    textAlign: "center",
    fontSize: "13px",
    color: "#94a3b8",
  },
  inlineLink: {
    color: "#a78bfa",
    textDecoration: "none",
    fontWeight: "500",
  },
};

export default Privacy;
