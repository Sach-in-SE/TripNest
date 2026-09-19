import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={styles.container} role="alert">
          <div style={styles.card} className="glass-card">
            <div style={styles.iconWrapper}>
              <span style={{ fontSize: "40px" }} aria-hidden="true">⚠️</span>
            </div>
            <h2 style={styles.title}>Something went wrong</h2>
            <p style={styles.description}>
              An unexpected error occurred while loading this page. This may be caused by a temporary network interruption or expired session.
            </p>
            <div style={styles.buttonRow}>
              <button
                type="button"
                onClick={this.handleReload}
                className="btn-aurora"
                style={styles.primaryBtn}
              >
                ↻ Reload Application
              </button>
              <button
                type="button"
                onClick={this.handleHome}
                className="btn-ghost"
                style={styles.secondaryBtn}
              >
                ← Return to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  container: {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background: "var(--bg-primary, #0a0f1e)",
    color: "var(--text-primary, #f1f5f9)",
    boxSizing: "border-box",
  },
  card: {
    maxWidth: "480px",
    width: "100%",
    padding: "36px 28px",
    borderRadius: "16px",
    background: "rgba(15, 23, 42, 0.8)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.5)",
  },
  iconWrapper: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    background: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "20px",
  },
  title: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#f1f5f9",
    fontFamily: "'Space Grotesk', sans-serif",
    margin: "0 0 10px 0",
  },
  description: {
    fontSize: "14px",
    lineHeight: "1.6",
    color: "#94a3b8",
    margin: "0 0 24px 0",
    maxWidth: "380px",
  },
  buttonRow: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  primaryBtn: {
    padding: "10px 20px",
    fontSize: "13px",
    fontWeight: "600",
  },
  secondaryBtn: {
    padding: "10px 18px",
    fontSize: "13px",
  },
};

export default ErrorBoundary;
