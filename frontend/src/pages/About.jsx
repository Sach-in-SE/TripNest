import React from "react";
import { Link } from "react-router-dom";
import PublicLayout from "../components/layout/PublicLayout";

const CORE_CAPABILITIES = [
  {
    icon: "🗺️",
    title: "Trip Planning",
    desc: "Create comprehensive travel journeys with defined start and end dates, estimated budgets, and traveler limits.",
  },
  {
    icon: "📅",
    title: "Day-Wise Itineraries",
    desc: "Structure daily activities with precise scheduling, location details, notes, and PDF export capabilities.",
  },
  {
    icon: "💰",
    title: "Budget & Expense Tracking",
    desc: "Monitor travel expenses across food, lodging, transport, and leisure with budget alerts and visual breakdown charts.",
  },
  {
    icon: "📸",
    title: "Travel Memories",
    desc: "Preserve photographic highlights in personal diaries or share scenic moments with the public travel community.",
  },
  {
    icon: "📁",
    title: "Document Vault",
    desc: "Securely store and retrieve boarding passes, hotel vouchers, visas, and insurance documents anytime.",
  },
  {
    icon: "👥",
    title: "Group Collaboration",
    desc: "Form travel groups with customized roles, member management, and synchronized trip itineraries.",
  },
  {
    icon: "💬",
    title: "Group Chat",
    desc: "Coordinate logistics, discuss travel ideas, and stay aligned with dedicated in-app discussion channels.",
  },
  {
    icon: "🤝",
    title: "Trip Sharing",
    desc: "Invite friends and travel companions with granular View or Edit permissions and interactive notification responses.",
  },
  {
    icon: "🌍",
    title: "Destination Discovery",
    desc: "Explore cataloged destinations enriched with real-time Open-Meteo weather forecasts and Wikipedia insights.",
  },
];

const VALUE_PROPOSITIONS = [
  {
    icon: "🎯",
    title: "All-in-One Travel Hub",
    desc: "Eliminate scattered notes, spreadsheets, and lost emails. TripNest consolidates your entire travel lifecycle in one centralized platform.",
  },
  {
    icon: "⚡",
    title: "Seamless Collaboration",
    desc: "Plan together in real-time. Share itineraries, coordinate group expenses, and discuss trip details with fellow travelers without leaving the app.",
  },
  {
    icon: "🔒",
    title: "Secure & Reliable",
    desc: "Role-based access control, secure document storage, and verified weather and destination data keep your travel plans safe and accurate.",
  },
];

const About = () => {
  return (
    <PublicLayout>
      <div style={styles.pageContainer}>
        {/* Hero Section */}
        <section style={styles.heroSection}>
          <div style={styles.badgeWrapper}>
            <span style={styles.badge}>
              <span style={{ fontSize: "14px" }}>🧳</span> About TripNest
            </span>
          </div>
          <h1 style={styles.heroTitle}>
            Smart Travel Planning, <span className="gradient-text">Made Simple</span>
          </h1>
          <p style={styles.heroSubtitle}>
            TripNest is an all-in-one travel planning and collaboration platform built to simplify how modern travelers organize journeys, coordinate with groups, track expenses, and capture unforgettable memories.
          </p>
        </section>

        {/* The Problem & Solution */}
        <section style={styles.section}>
          <div style={styles.gridTwoCol}>
            <div style={styles.card} className="glass-card">
              <span style={styles.cardIcon}>🧩</span>
              <h2 style={styles.cardTitle}>The Challenge</h2>
              <p style={styles.cardText}>
                Planning a trip often means juggling disconnected spreadsheets, chat groups, ticket PDFs, and budget calculators. Keeping everyone on the same page becomes chaotic and stressful.
              </p>
            </div>

            <div style={styles.card} className="glass-card">
              <span style={styles.cardIcon}>💡</span>
              <h2 style={styles.cardTitle}>Our Solution</h2>
              <p style={styles.cardText}>
                TripNest brings every stage of your trip together — from initial destination discovery and timeline scheduling to budget tracking, document storage, and shared group collaboration.
              </p>
            </div>
          </div>
        </section>

        {/* Core Capabilities */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              Everything You Need for <span className="gradient-text">Smarter Travel</span>
            </h2>
            <p style={styles.sectionSubtitle}>
              Built with essential tools to orchestrate solo adventures and group expeditions seamlessly.
            </p>
          </div>

          <div style={styles.capabilitiesGrid}>
            {CORE_CAPABILITIES.map((cap, index) => (
              <div key={index} style={styles.capCard} className="glass-card">
                <div style={styles.capIconWrapper}>{cap.icon}</div>
                <h3 style={styles.capTitle}>{cap.title}</h3>
                <p style={styles.capDesc}>{cap.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Why TripNest Section */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Why Choose TripNest?</h2>
            <p style={styles.sectionSubtitle}>
              Engineered for simplicity, reliability, and effortless coordination.
            </p>
          </div>

          <div style={styles.gridThreeCol}>
            {VALUE_PROPOSITIONS.map((prop, idx) => (
              <div key={idx} style={styles.propCard} className="glass-card">
                <span style={styles.propIcon}>{prop.icon}</span>
                <h3 style={styles.propTitle}>{prop.title}</h3>
                <p style={styles.propDesc}>{prop.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Call to Action Banner */}
        <section style={styles.ctaSection}>
          <div style={styles.ctaCard} className="glass-card">
            <h2 style={styles.ctaTitle}>Ready to Start Your Next Journey?</h2>
            <p style={styles.ctaSubtitle}>
              Discover top destinations, organize your day-by-day itinerary, and travel with total peace of mind.
            </p>
            <div style={styles.ctaActions}>
              <Link to="/destinations" className="btn-aurora" style={styles.ctaPrimaryBtn}>
                Explore Destinations ✈️
              </Link>
              <Link to="/signup" className="btn-ghost" style={styles.ctaSecondaryBtn}>
                Create Free Account
              </Link>
            </div>
          </div>
        </section>
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
  heroSection: {
    textAlign: "center",
    marginBottom: "56px",
    maxWidth: "840px",
    margin: "0 auto 56px",
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
  heroTitle: {
    fontSize: "clamp(32px, 5vw, 48px)",
    fontWeight: "800",
    color: "#f8fafc",
    lineHeight: "1.2",
    marginBottom: "20px",
    fontFamily: "'Space Grotesk', var(--tn-font-sans, sans-serif)",
  },
  heroSubtitle: {
    fontSize: "17px",
    lineHeight: "1.6",
    color: "#94a3b8",
    maxWidth: "720px",
    margin: "0 auto",
  },
  section: {
    marginBottom: "64px",
  },
  sectionHeader: {
    textAlign: "center",
    marginBottom: "36px",
    maxWidth: "700px",
    margin: "0 auto 36px",
  },
  sectionTitle: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#f8fafc",
    marginBottom: "12px",
    fontFamily: "'Space Grotesk', var(--tn-font-sans, sans-serif)",
  },
  sectionSubtitle: {
    fontSize: "15px",
    color: "#94a3b8",
    lineHeight: "1.5",
  },
  gridTwoCol: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "24px",
  },
  gridThreeCol: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "24px",
  },
  card: {
    padding: "32px",
    borderRadius: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  cardIcon: {
    fontSize: "32px",
  },
  cardTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#f8fafc",
    fontFamily: "'Space Grotesk', var(--tn-font-sans, sans-serif)",
  },
  cardText: {
    fontSize: "15px",
    color: "#cbd5e1",
    lineHeight: "1.6",
  },
  capabilitiesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "20px",
  },
  capCard: {
    padding: "24px",
    borderRadius: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  capIconWrapper: {
    fontSize: "28px",
  },
  capTitle: {
    fontSize: "17px",
    fontWeight: "600",
    color: "#f8fafc",
  },
  capDesc: {
    fontSize: "14px",
    color: "#94a3b8",
    lineHeight: "1.5",
  },
  propCard: {
    padding: "28px",
    borderRadius: "14px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  },
  propIcon: {
    fontSize: "36px",
  },
  propTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#f8fafc",
  },
  propDesc: {
    fontSize: "14px",
    color: "#94a3b8",
    lineHeight: "1.5",
  },
  ctaSection: {
    marginTop: "40px",
  },
  ctaCard: {
    padding: "48px 32px",
    borderRadius: "20px",
    textAlign: "center",
    background: "linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(6, 182, 212, 0.08))",
    border: "1px solid rgba(124, 58, 237, 0.3)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
  },
  ctaTitle: {
    fontSize: "clamp(24px, 4vw, 32px)",
    fontWeight: "700",
    color: "#f8fafc",
    fontFamily: "'Space Grotesk', var(--tn-font-sans, sans-serif)",
  },
  ctaSubtitle: {
    fontSize: "15px",
    color: "#cbd5e1",
    maxWidth: "580px",
    lineHeight: "1.6",
  },
  ctaActions: {
    display: "flex",
    gap: "16px",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: "8px",
  },
  ctaPrimaryBtn: {
    textDecoration: "none",
    padding: "12px 28px",
    fontSize: "15px",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
  },
  ctaSecondaryBtn: {
    textDecoration: "none",
    padding: "12px 28px",
    fontSize: "15px",
  },
};

export default About;
