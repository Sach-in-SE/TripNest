import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const Dashboard = () => {
    const [profile, setProfile] = useState(null);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get("/user/profile");
                setProfile(response.data);
            } catch (err) {
                navigate("/login");
            }
        };
        fetchProfile();
    }, []);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div style={styles.container}>
            <div style={styles.navbar}>
                <h2 style={styles.logo}>🧳 TripNest</h2>
                <button style={styles.logoutBtn} onClick={handleLogout}>
                    Logout
                </button>
            </div>
            <div style={styles.content}>
                <div style={styles.card}>
                    <h3 style={styles.welcome}>
                        Welcome, {profile?.firstName || user?.username}! 👋
                    </h3>
                    <p style={styles.role}>
                        Role: {profile?.roles?.[0] || "Traveler"}
                    </p>
                    <hr />
                    <h4>Your Profile</h4>
                    <p><strong>Username:</strong> {profile?.username}</p>
                    <p><strong>Email:</strong> {profile?.email}</p>
                    <p><strong>First Name:</strong> {profile?.firstName}</p>
                    <p><strong>Last Name:</strong> {profile?.lastName}</p>
                    <p><strong>Phone:</strong> {profile?.phone || "Not set"}</p>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        minHeight: "100vh",
        backgroundColor: "#f0f4f8",
    },
    navbar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#2d6a4f",
        padding: "16px 32px",
        color: "white",
    },
    logo: {
        margin: 0,
        color: "white",
    },
    logoutBtn: {
        padding: "8px 20px",
        backgroundColor: "white",
        color: "#2d6a4f",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: "bold",
    },
    content: {
        padding: "32px",
        maxWidth: "800px",
        margin: "0 auto",
    },
    card: {
        backgroundColor: "white",
        padding: "32px",
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
    },
    welcome: {
        color: "#2d6a4f",
        fontSize: "24px",
    },
    role: {
        color: "#666",
        marginBottom: "16px",
    },
};

export default Dashboard;