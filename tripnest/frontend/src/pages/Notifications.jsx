import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import api from "../services/api";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    try {
      const [notifRes, countRes] = await Promise.all([
        api.get("/notifications"),
        api.get("/notifications/unread/count"),
      ]);
      setNotifications(notifRes.data);
      setUnreadCount(countRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) { console.error(err); }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      fetchNotifications();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      fetchNotifications();
    } catch (err) { console.error(err); }
  };

  const typeIcons = {
    TRIP_REMINDER: "✈️",
    ACTIVITY_REMINDER: "📅",
    BUDGET_ALERT: "💰",
    GROUP_INVITATION: "👥",
    TRAVEL_UPDATE: "🗺️",
    SYSTEM: "🔔",
  };

  return (
    <div style={styles.container}>
      <Sidebar />
      <main style={styles.main}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Notifications 🔔</h1>
            <p style={styles.subtitle}>{unreadCount} unread notifications</p>
          </div>
          {unreadCount > 0 && (
            <button className="btn-ghost" onClick={handleMarkAllRead}
              style={{ fontSize: "13px" }}>
              ✓ Mark all as read
            </button>
          )}
        </div>

        {loading ? (
          <p style={{ color: "#94a3b8" }}>Loading...</p>
        ) : notifications.length === 0 ? (
          <div style={styles.emptyState} className="glass-card">
            <span style={{ fontSize: "48px" }}>🔔</span>
            <h3 style={{ color: "#f1f5f9" }}>No notifications</h3>
            <p style={{ color: "#94a3b8" }}>You're all caught up!</p>
          </div>
        ) : (
          <div style={styles.list}>
            {notifications.map((notif) => (
              <div key={notif.id}
                style={{ ...styles.notifCard, ...(notif.read ? {} : styles.unread) }}
                className="glass-card">
                <div style={styles.notifLeft}>
                  <span style={styles.notifIcon}>
                    {typeIcons[notif.type] || "🔔"}
                  </span>
                  <div>
                    <p style={styles.notifTitle}>{notif.title}</p>
                    <p style={styles.notifMessage}>{notif.message}</p>
                    <p style={styles.notifTime}>
                      {new Date(notif.createdAt).toLocaleString()}
                      {!notif.read && <span style={styles.unreadBadge}>• New</span>}
                    </p>
                  </div>
                </div>
                <div style={styles.notifActions}>
                  {!notif.read && (
                    <button className="btn-ghost" onClick={() => handleMarkRead(notif.id)}
                      style={{ fontSize: "12px", padding: "6px 12px" }}>
                      Mark Read
                    </button>
                  )}
                  <button onClick={() => handleDelete(notif.id)} style={styles.deleteBtn}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

const styles = {
  container: { display: "flex", minHeight: "100vh", background: "#0a0f1e" },
  main: { marginLeft: "260px", flex: 1, padding: "32px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" },
  title: { fontSize: "28px", fontWeight: "700", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif" },
  subtitle: { color: "#94a3b8", fontSize: "14px", marginTop: "4px" },
  emptyState: { padding: "48px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" },
  list: { display: "flex", flexDirection: "column", gap: "12px" },
  notifCard: { padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  unread: { borderColor: "rgba(124,58,237,0.4)", background: "rgba(124,58,237,0.05)" },
  notifLeft: { display: "flex", alignItems: "flex-start", gap: "16px" },
  notifIcon: { fontSize: "28px", flexShrink: 0 },
  notifTitle: { color: "#f1f5f9", fontSize: "15px", fontWeight: "600", marginBottom: "4px" },
  notifMessage: { color: "#94a3b8", fontSize: "13px", marginBottom: "6px" },
  notifTime: { color: "#64748b", fontSize: "12px" },
  unreadBadge: { color: "#a78bfa", marginLeft: "8px", fontWeight: "600" },
  notifActions: { display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 },
  deleteBtn: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5", borderRadius: "6px", cursor: "pointer", padding: "6px 10px" },
};

export default Notifications;