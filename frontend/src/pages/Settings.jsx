import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./Settings.css";

const SETTINGS_CATEGORIES = [
  {
    id: "notifications",
    title: "Notifications",
    description: "Manage travel alerts, email notifications, and communication preferences.",
    icon: "🔔",
    available: true,
    path: "/settings/notifications",
  },
  {
    id: "appearance",
    title: "Appearance",
    description: "Customize how TripNest looks and feels.",
    icon: "🎨",
    available: false,
  },
  {
    id: "account",
    title: "Account",
    description: "Manage account-level preferences and connected account settings.",
    icon: "👤",
    available: false,
  },
  {
    id: "security",
    title: "Security",
    description: "Manage password, authentication, and account security.",
    icon: "🛡️",
    available: false,
  },
  {
    id: "privacy",
    title: "Privacy",
    description: "Manage profile visibility, data sharing, and privacy preferences.",
    icon: "👁️",
    available: false,
  },
];

const Settings = () => {
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  const handleUnavailableSetting = (categoryName) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({
      id: Date.now(),
      message: `${categoryName} settings are coming soon.`,
    });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="tn-user-layout-container">
      <Sidebar />
      <main className="tn-user-main">
        <div className="tn-settings-container">
          {/* Header */}
          <header className="tn-settings-header">
            <h1 className="tn-settings-title">Settings</h1>
            <p className="tn-settings-subtitle">
              Manage your account preferences and TripNest experience.
            </p>
          </header>

          {/* Settings Categories List */}
          <div className="tn-settings-list" role="list">
            {SETTINGS_CATEGORIES.map((item) => {
              if (item.available) {
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    className="tn-settings-item"
                    aria-label={`${item.title}: ${item.description}`}
                  >
                    <div className="tn-settings-item-main">
                      <div className="tn-settings-icon-wrapper" aria-hidden="true">
                        <span>{item.icon}</span>
                      </div>
                      <div className="tn-settings-item-text">
                        <h2 className="tn-settings-item-title">{item.title}</h2>
                        <p className="tn-settings-item-desc">{item.description}</p>
                      </div>
                    </div>
                    <div className="tn-settings-item-meta">
                      <span className="tn-settings-badge tn-settings-badge--available">
                        Available
                      </span>
                      <span className="tn-settings-chevron" aria-hidden="true">
                        ›
                      </span>
                    </div>
                  </Link>
                );
              }

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleUnavailableSetting(item.title)}
                  className="tn-settings-item"
                  aria-label={`${item.title}: ${item.description} (Coming soon)`}
                >
                  <div className="tn-settings-item-main">
                    <div className="tn-settings-icon-wrapper" aria-hidden="true">
                      <span>{item.icon}</span>
                    </div>
                    <div className="tn-settings-item-text">
                      <h2 className="tn-settings-item-title">{item.title}</h2>
                      <p className="tn-settings-item-desc">{item.description}</p>
                    </div>
                  </div>
                  <div className="tn-settings-item-meta">
                    <span className="tn-settings-badge tn-settings-badge--coming-soon">
                      Coming soon
                    </span>
                    <span className="tn-settings-chevron" aria-hidden="true">
                      ›
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Non-blocking Accessible Toast Notification */}
        {toast && (
          <div
            className="tn-settings-toast"
            role="status"
            aria-live="polite"
          >
            <div className="tn-settings-toast-content">
              <span className="tn-settings-toast-icon" aria-hidden="true">ℹ️</span>
              <span className="tn-settings-toast-message">{toast.message}</span>
            </div>
            <button
              type="button"
              className="tn-settings-toast-close"
              onClick={() => setToast(null)}
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Settings;
