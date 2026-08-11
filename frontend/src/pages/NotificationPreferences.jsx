import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import api from "../services/api";

const NotificationPreferences = () => {
  const [preferences, setPreferences] = useState({
    tripReminders: true,
    activityReminders: true,
    budgetAlerts: true,
    groupNotifications: true,
    tripShareNotifications: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await api.get("/notification-preferences");
      if (response.data && Object.keys(response.data).length > 0) {
        setPreferences(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch preferences:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      await api.put("/notification-preferences", preferences);
      setMessage("Preferences saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Failed to save preferences:", err);
      setMessage("Failed to save preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const prefConfig = [
    { key: "tripReminders", label: "Trip Reminders", description: "Get notified before your trips start", icon: "✈️" },
    { key: "activityReminders", label: "Activity Reminders", description: "Get reminded about scheduled activities", icon: "📅" },
    { key: "budgetAlerts", label: "Budget Alerts", description: "Notifications about budget updates", icon: "💰" },
    { key: "groupNotifications", label: "Group Notifications", description: "Updates about group activities", icon: "👥" },
    { key: "tripShareNotifications", label: "Trip Share Notifications", description: "Invitations and trip sharing updates", icon: "🔗" },
  ];

  return (
    <div style={styles.container}>
      <Sidebar />
      <main style={styles.main}>
        <div style={styles.header}>
          <h1 style={styles.title}>Notification Preferences</h1>
          <p style={styles.subtitle}>Manage which notifications you receive</p>
        </div>

        {loading ? (
          <p style={{ color: "#94a3b8" }}>Loading preferences...</p>
        ) : (
          <div style={styles.content}>
            {prefConfig.map((pref) => (
              <div key={pref.key} style={styles.prefCard} className="glass-card">
                <div style={styles.prefLeft}>
                  <span style={styles.prefIcon}>{pref.icon}</span>
                  <div>
                    <p style={styles.prefLabel}>{pref.label}</p>
                    <p style={styles.prefDescription}>{pref.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle(pref.key)}
                  style={{
                    ...styles.toggle,
                    ...(preferences[pref.key] ? styles.toggleOn : styles.toggleOff),
                  }}
                >
                  <span style={styles.toggleKnob}>
                    {preferences[pref.key] ? "✓" : "✗"}
                  </span>
                </button>
              </div>
            ))}

            <div style={styles.actions}>
              {message && (
                <p style={{ ...styles.message, color: message.includes("Failed") ? "#ef4444" : "#10b981" }}>
                  {message}
                </p>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                style={styles.saveButton}
                className="btn-primary"
              >
                {saving ? "Saving..." : "Save Preferences"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const styles = {
  container: { display: "flex", minHeight: "100vh", background: "#0a0f1e" },
  main: { marginLeft: "260px", flex: 1, padding: "32px" },
  header: { marginBottom: "32px" },
  title: { fontSize: "28px", fontWeight: "700", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif" },
  subtitle: { color: "#94a3b8", fontSize: "14px", marginTop: "4px" },
  content: { display: "flex", flexDirection: "column", gap: "16px" },
  prefCard: {
    padding: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  prefLeft: { display: "flex", alignItems: "center", gap: "16px" },
  prefIcon: { fontSize: "24px" },
  prefLabel: { color: "#f1f5f9", fontSize: "16px", fontWeight: "600", marginBottom: "4px" },
  prefDescription: { color: "#94a3b8", fontSize: "14px" },
  toggle: {
    width: "56px",
    height: "28px",
    borderRadius: "14px",
    border: "none",
    cursor: "pointer",
    position: "relative",
    transition: "all 0.2s ease",
  },
  toggleOn: { background: "linear-gradient(135deg, #7c3aed, #06b6d4)" },
  toggleOff: { background: "rgba(255,255,255,0.1)" },
  toggleKnob: {
    position: "absolute",
    top: "4px",
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    background: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "bold",
    transition: "all 0.2s ease",
  },
  actions: { marginTop: "24px", display: "flex", alignItems: "center", gap: "16px" },
  message: { fontSize: "14px", fontWeight: "500" },
  saveButton: {
    padding: "12px 24px",
    borderRadius: "8px",
    background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
    color: "white",
    border: "none",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
};

export default NotificationPreferences;
