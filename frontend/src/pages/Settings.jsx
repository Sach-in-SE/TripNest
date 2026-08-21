import React from "react";
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
    id: "account",
    title: "Account & Profile",
    description: "Manage your personal information, travel style, and emergency contact details.",
    icon: "👤",
    available: true,
    path: "/profile",
  },
  {
    id: "security",
    title: "Security & Password",
    description: "Update your account password and review security credentials.",
    icon: "🛡️",
    available: true,
    path: "/profile",
  },
  {
    id: "privacy",
    title: "Privacy Policy",
    description: "Review data handling guidelines, security architecture, and user privacy terms.",
    icon: "👁️",
    available: true,
    path: "/privacy",
  },
];

const Settings = () => {
  return (
    <div className="tn-user-layout-container">
      <Sidebar />
      <main className="tn-user-main">
        <div className="tn-settings-container">
          {/* Header */}
          <header className="tn-settings-header">
            <h1 className="tn-settings-title">Settings</h1>
            <p className="tn-settings-subtitle">
              Manage your account preferences, notifications, and TripNest experience.
            </p>
          </header>

          {/* Settings Categories List */}
          <div className="tn-settings-list" role="list">
            {SETTINGS_CATEGORIES.map((item) => (
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
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
