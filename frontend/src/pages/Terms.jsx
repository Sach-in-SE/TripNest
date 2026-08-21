import React from "react";
import { Link } from "react-router-dom";
import PublicLayout from "../components/layout/PublicLayout";

const Terms = () => {
  return (
    <PublicLayout>
      <div style={styles.pageContainer}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.badgeWrapper}>
            <span style={styles.badge}>
              <span style={{ fontSize: "14px" }}>📜</span> Terms of Service
            </span>
          </div>
          <h1 style={styles.title}>
            TripNest <span className="gradient-text">Terms of Service</span>
          </h1>
          <p style={styles.subtitle}>
            Project Demonstration & Usage Guidelines • Last updated: August 2026
          </p>
        </header>

        {/* Terms Content Body */}
        <div style={styles.contentWrapper} className="glass-card">
          {/* 1. Acceptance of Terms */}
          <section style={styles.section}>
            <h2 style={styles.sectionHeading}>1. Acceptance of Terms</h2>
            <p style={styles.paragraph}>
              By creating an account, browsing destination catalogs, or utilizing any feature of TripNest, you acknowledge that you are participating in a software demonstration and agree to adhere to these Terms of Service. If you do not agree with any portion of these guidelines, please discontinue use of the platform.
            </p>
          </section>

          {/* 2. Account Responsibility */}
          <section style={styles.section}>
            <h2 style={styles.sectionHeading}>2. Account Responsibility</h2>
            <p style={styles.paragraph}>
              When creating an account, you agree to provide accurate basic registration details. You are responsible for safeguarding your login credentials and for all activities conducted under your user account. Administrators reserve the right to disable or reset accounts created for malicious or abusive purposes during evaluations.
            </p>
          </section>

          {/* 3. Appropriate Use & Conduct */}
          <section style={styles.section}>
            <h2 style={styles.sectionHeading}>3. Appropriate Use & Conduct</h2>
            <p style={styles.paragraph}>
              TripNest is designed for collaborative itinerary management and travel organization. Users agree not to:
            </p>
            <ul style={styles.list}>
              <li style={styles.listItem}>Upload unlawful, abusive, or copyrighted materials without authorization.</li>
              <li style={styles.listItem}>Interfere with platform infrastructure, authentication tokens, or network communications.</li>
              <li style={styles.listItem}>Attempt unauthorized administrative role escalation or database manipulation.</li>
              <li style={styles.listItem}>Spam group discussion channels or harass other collaborators.</li>
            </ul>
          </section>

          {/* 4. User-Generated Content & Travel Photos */}
          <section style={styles.section}>
            <h2 style={styles.sectionHeading}>4. User-Generated Content & Media</h2>
            <p style={styles.paragraph}>
              You retain ownership of any itineraries, notes, budgets, and travel photos you submit to TripNest. When marking a travel memory as "Public", you grant the TripNest community gallery permission to display the photo and caption to other registered users. You can revert visibility to "Private" or delete memories at any time.
            </p>
          </section>

          {/* 5. Document Storage Vault */}
          <section style={styles.section}>
            <h2 style={styles.sectionHeading}>5. Travel Documents & Files</h2>
            <p style={styles.paragraph}>
              The Travel Documents feature provides a convenient vault for storing travel vouchers, boarding passes, and tickets (up to 10MB per file). Files are stored for demonstration purposes. Users are advised to retain primary original copies of critical government travel documents outside the demonstration platform.
            </p>
          </section>

          {/* 6. Trip Information & Third-Party Insights */}
          <section style={styles.section}>
            <h2 style={styles.sectionHeading}>6. Information & Third-Party Services Disclaimer</h2>
            <p style={styles.paragraph}>
              Weather forecasts and destination descriptions are retrieved dynamically from Open-Meteo and Wikipedia APIs. While intended to provide helpful travel context, TripNest makes no warranties regarding the absolute accuracy, completeness, or timeliness of external meteorological or geographic data.
            </p>
          </section>

          {/* 7. Service Availability & Modifications */}
          <section style={styles.section}>
            <h2 style={styles.sectionHeading}>7. Service Availability & Demo Operations</h2>
            <p style={styles.paragraph}>
              As an academic and software demonstration project, TripNest is provided on an "as-is" and "as-available" basis. Developers may update schemas, redeploy microservices, or reset demonstration test data periodically to support evaluation workflows.
            </p>
          </section>

          {/* 8. Limitation of Liability */}
          <section style={styles.section}>
            <h2 style={styles.sectionHeading}>8. Limitation of Liability</h2>
            <p style={styles.paragraph}>
              In no event shall the authors, contributors, or evaluators of TripNest be liable for any direct, indirect, incidental, or consequential damages resulting from the use of or inability to use this demonstration software.
            </p>
          </section>

          {/* 9. Contact & Feedback */}
          <section style={styles.section}>
            <h2 style={styles.sectionHeading}>9. Feedback & Inquiries</h2>
            <p style={styles.paragraph}>
              For inquiries, feedback, or suggestions regarding the TripNest project, please communicate via the designated evaluation and project repository channels.
            </p>
          </section>

          <div style={styles.footerNote}>
            <p>
              TripNest Project Demonstration •{" "}
              <Link to="/privacy" style={styles.inlineLink}>
                Privacy Policy
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

export default Terms;
