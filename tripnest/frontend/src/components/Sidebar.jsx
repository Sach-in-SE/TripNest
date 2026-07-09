import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { path: "/dashboard", icon: "⊞", label: "Dashboard" },
    { path: "/trips", icon: "✈️", label: "My Trips" },
    { path: "/itineraries", icon: "📅", label: "Itineraries" },
    { path: "/destinations", icon: "🌍", label: "Destinations" },
    { path: "/profile", icon: "👤", label: "Profile" },
  ];

  return (
    <aside style={styles.sidebar}>
      {/* Logo */}
      <div style={styles.logo}>
        <span style={styles.logoIcon}>🧳</span>
        <span style={styles.logoText} className="gradient-text">
          TripNest
        </span>
      </div>

      {/* User Info */}
      <div style={styles.userInfo}>
        <div style={styles.avatar}>
          {user?.username?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p style={styles.userName}>{user?.username}</p>
          <p style={styles.userRole}>
            {user?.roles?.[0]?.replace("ROLE_", "") || "Traveler"}
          </p>
        </div>
      </div>

      <div className="divider" />

      {/* Nav Items */}
      <nav style={styles.nav}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              ...styles.navItem,
              ...(isActive ? styles.navItemActive : {}),
            })}
          >
            <span style={styles.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <button onClick={handleLogout} style={styles.logoutBtn}>
        <span>🚪</span>
        <span>Logout</span>
      </button>
    </aside>
  );
};

const styles = {
  sidebar: {
    width: "260px",
    minHeight: "100vh",
    background: "rgba(13, 21, 41, 0.95)",
    backdropFilter: "blur(20px)",
    borderRight: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    flexDirection: "column",
    padding: "24px 16px",
    position: "fixed",
    top: 0,
    left: 0,
    zIndex: 100,
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "0 8px",
    marginBottom: "32px",
  },
  logoIcon: { fontSize: "28px" },
  logoText: {
    fontSize: "22px",
    fontWeight: "700",
    fontFamily: "'Space Grotesk', sans-serif",
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    background: "rgba(255,255,255,0.05)",
    borderRadius: "12px",
    marginBottom: "16px",
  },
  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    fontWeight: "700",
    color: "white",
    flexShrink: 0,
  },
  userName: {
    color: "#f1f5f9",
    fontSize: "14px",
    fontWeight: "600",
  },
  userRole: {
    color: "#94a3b8",
    fontSize: "12px",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    flex: 1,
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 12px",
    borderRadius: "10px",
    color: "#94a3b8",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s ease",
  },
  navItemActive: {
    background: "rgba(124, 58, 237, 0.15)",
    color: "#a78bfa",
    borderLeft: "3px solid #7c3aed",
  },
  navIcon: { fontSize: "18px" },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 12px",
    borderRadius: "10px",
    background: "transparent",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    color: "#fca5a5",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
    marginTop: "16px",
    width: "100%",
  },
};

export default Sidebar;