import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Signup = () => {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        firstName: "",
        lastName: "",
    });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await signup(formData);
            setSuccess("Account created successfully! Redirecting...");
            setTimeout(() => navigate("/login"), 2000);
        } catch (err) {
            setError("Signup failed! Username or email already exists.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>🧳 TripNest</h2>
                <h3 style={styles.subtitle}>Create Account</h3>
                {error && <p style={styles.error}>{error}</p>}
                {success && <p style={styles.success}>{success}</p>}
                <div>
                    <input
                        style={styles.input}
                        type="text"
                        name="firstName"
                        placeholder="First Name"
                        value={formData.firstName}
                        onChange={handleChange}
                    />
                    <input
                        style={styles.input}
                        type="text"
                        name="lastName"
                        placeholder="Last Name"
                        value={formData.lastName}
                        onChange={handleChange}
                    />
                    <input
                        style={styles.input}
                        type="text"
                        name="username"
                        placeholder="Username"
                        value={formData.username}
                        onChange={handleChange}
                    />
                    <input
                        style={styles.input}
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleChange}
                    />
                    <input
                        style={styles.input}
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                    />
                    <button
                        style={styles.button}
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? "Creating Account..." : "Sign Up"}
                    </button>
                </div>
                <p style={styles.link}>
                    Already have an account?{" "}
                    <Link to="/login">Sign In</Link>
                </p>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f0f4f8",
    },
    card: {
        backgroundColor: "white",
        padding: "40px",
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        width: "100%",
        maxWidth: "400px",
    },
    title: {
        textAlign: "center",
        color: "#2d6a4f",
        fontSize: "28px",
        marginBottom: "8px",
    },
    subtitle: {
        textAlign: "center",
        color: "#555",
        marginBottom: "24px",
    },
    input: {
        width: "100%",
        padding: "12px",
        marginBottom: "16px",
        borderRadius: "8px",
        border: "1px solid #ddd",
        fontSize: "16px",
        boxSizing: "border-box",
    },
    button: {
        width: "100%",
        padding: "12px",
        backgroundColor: "#2d6a4f",
        color: "white",
        border: "none",
        borderRadius: "8px",
        fontSize: "16px",
        cursor: "pointer",
    },
    error: {
        color: "red",
        textAlign: "center",
        marginBottom: "16px",
    },
    success: {
        color: "green",
        textAlign: "center",
        marginBottom: "16px",
    },
    link: {
        textAlign: "center",
        marginTop: "16px",
        color: "#555",
    },
};

export default Signup;