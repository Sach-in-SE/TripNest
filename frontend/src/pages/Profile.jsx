import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./Profile.css";

const SocialIcon = ({ name, hasLink, link, icon }) => {
  if (hasLink) {
    return (
      <a 
        href={link} 
        target="_blank" 
        rel="noopener noreferrer"
        style={styles.socialIcon}
        title={name}
      >
        {icon}
      </a>
    );
  }
  return (
    <span style={{ ...styles.socialIcon, ...styles.socialIconDisabled }} title={name}>
      {icon}
    </span>
  );
};

const Profile = () => {
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    bio: "",
    country: "",
    state: "",
    city: "",
    dateOfBirth: "",
    gender: "",
    occupation: "",
    travelStyle: "",
    preferredTransport: "",
    accommodationPreference: "",
    dreamDestination: "",
    favoriteDestination: "",
    passportHolder: false,
    emergencyContactName: "",
    emergencyContactRelationship: "",
    emergencyContactPhone: "",
    github: "",
    linkedin: "",
    instagram: "",
    portfolio: ""
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [formErrors, setFormErrors] = useState({});
  
  // Edit mode states
  const [editingSocialLinks, setEditingSocialLinks] = useState(false);
  const [editingPersonalProfile, setEditingPersonalProfile] = useState(false);
  const [editingAboutMe, setEditingAboutMe] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [socialLinksForm, setSocialLinksForm] = useState({ github: "", linkedin: "", instagram: "", portfolio: "" });
  const [aboutMeForm, setAboutMeForm] = useState("");
  const [usernameForm, setUsernameForm] = useState("");
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailability, setUsernameAvailability] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/user/profile");
        setProfile(res.data);
        setFormData({
          firstName: res.data.firstName || "",
          lastName: res.data.lastName || "",
          email: res.data.email || "",
          phone: res.data.phone || "",
          bio: res.data.bio || "",
          country: res.data.country || "",
          state: res.data.state || "",
          city: res.data.city || "",
          dateOfBirth: res.data.dateOfBirth || "",
          gender: res.data.gender || "",
          occupation: res.data.occupation || "",
          travelStyle: res.data.travelStyle || "",
          preferredTransport: res.data.preferredTransport || "",
          accommodationPreference: res.data.accommodationPreference || "",
          dreamDestination: res.data.dreamDestination || "",
          favoriteDestination: res.data.favoriteDestination || "",
          passportHolder: res.data.passportHolder || false,
          emergencyContactName: res.data.emergencyContactName || "",
          emergencyContactRelationship: res.data.emergencyContactRelationship || "",
          emergencyContactPhone: res.data.emergencyContactPhone || "",
          github: res.data.github || "",
          linkedin: res.data.linkedin || "",
          instagram: res.data.instagram || "",
          portfolio: res.data.portfolio || ""
        });
        setSocialLinksForm({
          github: res.data.github || "",
          linkedin: res.data.linkedin || "",
          instagram: res.data.instagram || "",
          portfolio: res.data.portfolio || ""
        });
        setAboutMeForm(res.data.bio || "");
        setUsernameForm(res.data.username || "");
      } catch (err) {
        console.error(err);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChangePassword = async () => {
    if (changingPassword) return;
    setPasswordError("");

    const errors = {};
    if (!passwordForm.currentPassword) errors.currentPassword = "Current password is required";
    if (!passwordForm.newPassword) errors.newPassword = "New password is required";
    else if (passwordForm.newPassword.length < 6) errors.newPassword = "New password must be at least 6 characters";
    if (!passwordForm.confirmPassword) errors.confirmPassword = "Please confirm your password";
    else if (passwordForm.newPassword !== passwordForm.confirmPassword) errors.confirmPassword = "Passwords do not match";

    if (Object.keys(errors).length > 0) {
      setPasswordError(Object.values(errors)[0]);
      return;
    }

    setChangingPassword(true);
    try {
      await api.post("/user/change-password", passwordForm);
      setMessage("Password changed successfully!");
      setShowPasswordForm(false);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setPasswordError(err.response?.data?.message || "Failed to change password. Please try again.");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSaveSocialLinks = async () => {
    if (saving) return;

    const errors = {};
    if (socialLinksForm.github && !/^(https?:\/\/)?(www\.)?github\.com\/[\w-]+\/?$/.test(socialLinksForm.github)) errors.github = "Invalid GitHub URL";
    if (socialLinksForm.linkedin && !/^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[\w-]+\/?$/.test(socialLinksForm.linkedin)) errors.linkedin = "Invalid LinkedIn URL";
    if (socialLinksForm.instagram && !/^(https?:\/\/)?(www\.)?instagram\.com\/[\w.]+\/?$/.test(socialLinksForm.instagram)) errors.instagram = "Invalid Instagram URL";
    if (socialLinksForm.portfolio && !/^(https?:\/\/)?(www\.)?[\w-]+\.[\w.-]+\/?$/.test(socialLinksForm.portfolio)) errors.portfolio = "Invalid portfolio URL";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setSaving(true);
    setError("");
    try {
      await api.put("/user/profile", { ...formData, ...socialLinksForm });
      setMessage("Social links updated successfully!");
      const res = await api.get("/user/profile");
      setProfile(res.data);
      setFormData({ ...formData, ...socialLinksForm });
      setEditingSocialLinks(false);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to update social links. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelSocialLinks = () => {
    setSocialLinksForm({
      github: formData.github,
      linkedin: formData.linkedin,
      instagram: formData.instagram,
      portfolio: formData.portfolio
    });
    setEditingSocialLinks(false);
    setFormErrors({});
  };

  const handleSavePersonalProfile = async () => {
    if (saving) return;

    const errors = {};
    if (formData.firstName && formData.firstName.length > 50) errors.firstName = "First name must be less than 50 characters";
    if (formData.lastName && formData.lastName.length > 50) errors.lastName = "Last name must be less than 50 characters";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = "Invalid email format";
    if (formData.phone && !/^[0-9+\-\s()]{10,15}$/.test(formData.phone)) errors.phone = "Invalid phone number format";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setSaving(true);
    setError("");
    try {
      await api.put("/user/profile", formData);
      setMessage("Profile updated successfully!");
      const res = await api.get("/user/profile");
      setProfile(res.data);
      setEditingPersonalProfile(false);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelPersonalProfile = () => {
    const res = api.get("/user/profile").then(response => {
      setFormData({
        firstName: response.data.firstName || "",
        lastName: response.data.lastName || "",
        email: response.data.email || "",
        phone: response.data.phone || "",
        bio: response.data.bio || "",
        country: response.data.country || "",
        state: response.data.state || "",
        city: response.data.city || "",
        dateOfBirth: response.data.dateOfBirth || "",
        gender: response.data.gender || "",
        occupation: response.data.occupation || "",
        travelStyle: response.data.travelStyle || "",
        preferredTransport: response.data.preferredTransport || "",
        accommodationPreference: response.data.accommodationPreference || "",
        dreamDestination: response.data.dreamDestination || "",
        favoriteDestination: response.data.favoriteDestination || "",
        passportHolder: response.data.passportHolder || false,
        emergencyContactName: response.data.emergencyContactName || "",
        emergencyContactRelationship: response.data.emergencyContactRelationship || "",
        emergencyContactPhone: response.data.emergencyContactPhone || "",
        github: response.data.github || "",
        linkedin: response.data.linkedin || "",
        instagram: response.data.instagram || "",
        portfolio: response.data.portfolio || ""
      });
    });
    setEditingPersonalProfile(false);
    setFormErrors({});
  };

  const handleSaveAboutMe = async () => {
    if (saving) return;

    const errors = {};
    if (aboutMeForm && aboutMeForm.length > 300) errors.bio = "Bio must be less than 300 characters";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setSaving(true);
    setError("");
    try {
      await api.put("/user/profile", { ...formData, bio: aboutMeForm });
      setMessage("About me updated successfully!");
      setFormData({ ...formData, bio: aboutMeForm });
      setEditingAboutMe(false);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to update about me. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelAboutMe = () => {
    setAboutMeForm(formData.bio);
    setEditingAboutMe(false);
    setFormErrors({});
  };

  // Username editing handlers
  useEffect(() => {
    const timer = setTimeout(() => {
      if (usernameForm && usernameForm.length >= 3 && usernameForm !== profile?.username) {
        checkUsernameAvailability(usernameForm);
      } else if (usernameForm === profile?.username) {
        setUsernameAvailability(true);
      } else {
        setUsernameAvailability(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [usernameForm, profile?.username]);

  const checkUsernameAvailability = async (username) => {
    if (username.length < 3) return;
    
    setCheckingUsername(true);
    try {
      const response = await api.get(`/auth/check-username?username=${username}`);
      setUsernameAvailability(response.data.available !== false);
    } catch (err) {
      console.error("Username check failed:", err);
      setUsernameAvailability(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleSaveUsername = async () => {
    if (saving) return;
    
    if (!usernameForm || usernameForm.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }

    if (usernameAvailability === false) {
      setError("Username is already taken");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const response = await api.put("/user/username", { username: usernameForm });
      
      // Update the JWT token in localStorage with the new token
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        
        // Update the user object in localStorage with new username
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        currentUser.username = response.data.username;
        localStorage.setItem('user', JSON.stringify(currentUser));
        
        // Update the AuthContext with the new user data
        updateUser(currentUser);
      }
      
      setMessage("Username updated successfully!");
      const res = await api.get("/user/profile");
      setProfile(res.data);
      setEditingUsername(false);
      setUsernameAvailability(null);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 401) {
        setError("Authentication failed. Please log in again.");
      } else if (err.response && err.response.status === 400) {
        setError(err.response?.data?.message || "Invalid username request.");
      } else {
        setError(err.response?.data?.message || "Failed to update username. Please try again.");
      }
      // Keep user in edit mode on error - don't set editingUsername to false
    } finally {
      setSaving(false);
    }
  };

  const handleCancelUsername = () => {
    setUsernameForm(profile?.username || "");
    setEditingUsername(false);
    setUsernameAvailability(null);
    setError("");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  if (loading) return <div className="tn-user-layout-container"><Sidebar /><main className="tn-user-main"><p style={{ color: "#94a3b8" }}>Loading...</p></main></div>;

  return (
    <div className="tn-user-layout-container">
      <Sidebar />
      <main className="tn-user-main profile-main" style={{ maxWidth: "1200px" }}>
        <h1 style={styles.title}>My Profile</h1>

        {message && <div style={styles.successBox}>✅ {message}</div>}
        {error && <div style={styles.errorBox}>❌ {error}</div>}

        {/* Hero Section */}
        <div style={styles.heroCard} className="glass-card profile-hero-card">
          <div style={styles.heroContent} className="profile-hero-content">
            <div style={styles.avatar}>
              {profile?.firstName?.charAt(0) || profile?.username?.charAt(0)}
            </div>
            <div style={styles.heroInfo}>
              <h2 style={styles.heroName}>{profile?.firstName} {profile?.lastName}</h2>
              {editingUsername ? (
                <div style={styles.usernameEditContainer}>
                  <input
                    className="aurora-input"
                    type="text"
                    value={usernameForm}
                    onChange={(e) => setUsernameForm(e.target.value)}
                    style={styles.usernameInput}
                    placeholder="Username"
                  />
                  {checkingUsername && (
                    <div style={styles.availabilityMessage}>Checking availability...</div>
                  )}
                  {usernameAvailability === true && usernameForm !== profile?.username && (
                    <div style={styles.availableMessage}>Username is available</div>
                  )}
                  {usernameAvailability === false && (
                    <div style={styles.takenMessage}>Username is already taken</div>
                  )}
                  <div style={styles.usernameEditButtons}>
                    <button
                      className="btn-ghost"
                      onClick={handleCancelUsername}
                      style={styles.usernameEditButton}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn-aurora"
                      onClick={handleSaveUsername}
                      disabled={saving || usernameAvailability === false}
                      style={styles.usernameEditButton}
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={styles.usernameDisplay}>
                  <p style={styles.heroUsername}>@{profile?.username}</p>
                  <button
                    className="btn-ghost"
                    onClick={() => setEditingUsername(true)}
                    style={styles.usernameEditIcon}
                    title="Edit username"
                  >
                    ✏️
                  </button>
                </div>
              )}
              <div style={styles.heroMeta} className="profile-hero-meta">
                <span className={`badge badge-upcoming`}>{profile?.roles?.[0]?.replace("ROLE_", "") || "TRAVELER"}</span>
                <span className={`badge ${profile?.enabled ? "badge-completed" : "badge-cancelled"}`}>
                  {profile?.enabled ? "Active" : "Disabled"}
                </span>
              </div>
              
              {/* Social Icons */}
              <div style={styles.socialIcons}>
                {editingSocialLinks ? (
                  <div style={styles.socialLinksEdit} className="profile-social-links-edit">
                    {[
                      { key: "github", label: "GitHub", placeholder: "https://github.com/username" },
                      { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/username" },
                      { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/username" },
                      { key: "portfolio", label: "Portfolio", placeholder: "https://yourportfolio.com" },
                    ].map((field) => (
                      <div key={field.key} style={styles.socialLinkInput}>
                        <label style={styles.label}>{field.label}</label>
                        <input
                          className="aurora-input"
                          placeholder={field.placeholder}
                          value={socialLinksForm[field.key]}
                          onChange={(e) => setSocialLinksForm({ ...socialLinksForm, [field.key]: e.target.value })}
                        />
                        {formErrors[field.key] && <div style={styles.validationError}>{formErrors[field.key]}</div>}
                      </div>
                    ))}
                    <div style={styles.socialActions}>
                      <button className="btn-ghost" onClick={handleCancelSocialLinks} disabled={saving}>
                        Cancel
                      </button>
                      <button className="btn-aurora" onClick={handleSaveSocialLinks} disabled={saving}>
                        {saving ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={styles.socialIconsDisplay} className="profile-social-icons-display">
                    <SocialIcon 
                      name="GitHub" 
                      hasLink={!!formData.github} 
                      link={formData.github} 
                      icon="📦"
                    />
                    <SocialIcon 
                      name="LinkedIn" 
                      hasLink={!!formData.linkedin} 
                      link={formData.linkedin} 
                      icon="💼"
                    />
                    <SocialIcon 
                      name="Instagram" 
                      hasLink={!!formData.instagram} 
                      link={formData.instagram} 
                      icon="📷"
                    />
                    <SocialIcon 
                      name="Portfolio" 
                      hasLink={!!formData.portfolio} 
                      link={formData.portfolio} 
                      icon="🌐"
                    />
                    <button 
                      className="btn-ghost" 
                      onClick={() => setEditingSocialLinks(true)}
                      style={styles.editIconButton}
                      title="Edit social links"
                    >
                      ✏️
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Personal Profile (Merged) */}
        <div style={styles.sectionCard} className="glass-card profile-section-card">
          <div style={styles.sectionHeader} className="profile-section-header">
            <h3 style={styles.sectionTitle}>Personal Profile</h3>
            {!editingPersonalProfile && (
              <button 
                className="btn-ghost" 
                onClick={() => setEditingPersonalProfile(true)}
                style={styles.editButton}
              >
                ✏️ Edit
              </button>
            )}
          </div>
          
          {editingPersonalProfile ? (
            <div style={styles.personalProfileEdit}>
              {/* Personal Information */}
              <div style={styles.subsection}>
                <h4 style={styles.subsectionTitle}>Personal Information</h4>
                <div style={styles.formGrid} className="profile-form-grid">
                  {[
                    { key: "firstName", label: "First Name", placeholder: "Enter first name" },
                    { key: "lastName", label: "Last Name", placeholder: "Enter last name" },
                    { key: "email", label: "Email", placeholder: "Enter email", type: "email" },
                    { key: "phone", label: "Phone Number", placeholder: "Enter phone number" },
                    { key: "dateOfBirth", label: "Date of Birth", placeholder: "YYYY-MM-DD", type: "date" },
                    { key: "gender", label: "Gender", type: "select", options: ["", "Male", "Female", "Other", "Prefer not to say"] },
                    { key: "country", label: "Country", placeholder: "Enter country" },
                    { key: "state", label: "State", placeholder: "Enter state" },
                    { key: "city", label: "City", placeholder: "Enter city" },
                    { key: "occupation", label: "Occupation", placeholder: "Enter occupation" },
                  ].map((field) => (
                    <div key={field.key} style={styles.formGroup}>
                      <label style={styles.label}>{field.label}</label>
                      {field.type === "select" ? (
                        <select
                          className="aurora-input"
                          value={formData[field.key]}
                          onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        >
                          {field.options.map((opt) => (
                            <option key={opt} value={opt}>{opt || "Select gender"}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          className="aurora-input"
                          type={field.type || "text"}
                          placeholder={field.placeholder}
                          value={formData[field.key]}
                          onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        />
                      )}
                      {formErrors[field.key] && <div style={styles.validationError}>{formErrors[field.key]}</div>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Travel Profile */}
              <div style={styles.subsection}>
                <h4 style={styles.subsectionTitle}>Travel Profile</h4>
                <div style={styles.formGrid} className="profile-form-grid">
                  {[
                    { key: "travelStyle", label: "Travel Style", type: "select", options: ["", "Solo", "Family", "Luxury", "Budget", "Backpacking", "Adventure", "Business"] },
                    { key: "preferredTransport", label: "Preferred Transport", type: "select", options: ["", "Flight", "Train", "Bus", "Car", "Bike"] },
                    { key: "accommodationPreference", label: "Accommodation Preference", type: "select", options: ["", "Hotel", "Hostel", "Resort", "Camping", "Homestay"] },
                    { key: "dreamDestination", label: "Dream Destination", placeholder: "Your dream destination" },
                    { key: "favoriteDestination", label: "Favorite Destination", placeholder: "Your favorite destination" },
                  ].map((field) => (
                    <div key={field.key} style={styles.formGroup}>
                      <label style={styles.label}>{field.label}</label>
                      {field.type === "select" ? (
                        <select
                          className="aurora-input"
                          value={formData[field.key]}
                          onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        >
                          {field.options.map((opt) => (
                            <option key={opt} value={opt}>{opt || "Select option"}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          className="aurora-input"
                          placeholder={field.placeholder}
                          value={formData[field.key]}
                          onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        />
                      )}
                    </div>
                  ))}
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Passport Holder</label>
                    <select
                      className="aurora-input"
                      value={formData.passportHolder ? "true" : "false"}
                      onChange={(e) => setFormData({ ...formData, passportHolder: e.target.value === "true" })}
                    >
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div style={styles.subsection}>
                <h4 style={styles.subsectionTitle}>Emergency Contact</h4>
                <div style={styles.formGrid} className="profile-form-grid">
                  {[
                    { key: "emergencyContactName", label: "Contact Name", placeholder: "Emergency contact name" },
                    { key: "emergencyContactRelationship", label: "Relationship", placeholder: "Relationship (e.g., Spouse, Parent)" },
                    { key: "emergencyContactPhone", label: "Phone Number", placeholder: "Emergency contact phone" },
                  ].map((field) => (
                    <div key={field.key} style={styles.formGroup}>
                      <label style={styles.label}>{field.label}</label>
                      <input
                        className="aurora-input"
                        placeholder={field.placeholder}
                        value={formData[field.key]}
                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div style={styles.actions}>
                <button className="btn-ghost" onClick={handleCancelPersonalProfile} disabled={saving}>
                  Cancel
                </button>
                <button className="btn-aurora" onClick={handleSavePersonalProfile} disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          ) : (
            <div style={styles.personalProfileDisplay}>
              {/* Personal Information Display */}
              <div style={styles.subsection}>
                <h4 style={styles.subsectionTitle}>Personal Information</h4>
                <div style={styles.infoGrid} className="profile-info-grid">
                  {[
                    { label: "First Name", value: formData.firstName || "Not set" },
                    { label: "Last Name", value: formData.lastName || "Not set" },
                    { label: "Email", value: formData.email || "Not set" },
                    { label: "Phone", value: formData.phone || "Not set" },
                    { label: "Date of Birth", value: formData.dateOfBirth || "Not set" },
                    { label: "Gender", value: formData.gender || "Not set" },
                    { label: "Country", value: formData.country || "Not set" },
                    { label: "State", value: formData.state || "Not set" },
                    { label: "City", value: formData.city || "Not set" },
                    { label: "Occupation", value: formData.occupation || "Not set" },
                  ].map((item, i) => (
                    <div key={i} style={styles.infoItem}>
                      <p style={styles.infoLabel}>{item.label}</p>
                      <p style={styles.infoValue}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Travel Profile Display */}
              <div style={styles.subsection}>
                <h4 style={styles.subsectionTitle}>Travel Profile</h4>
                <div style={styles.infoGrid} className="profile-info-grid">
                  {[
                    { label: "Travel Style", value: formData.travelStyle || "Not set" },
                    { label: "Preferred Transport", value: formData.preferredTransport || "Not set" },
                    { label: "Accommodation Preference", value: formData.accommodationPreference || "Not set" },
                    { label: "Dream Destination", value: formData.dreamDestination || "Not set" },
                    { label: "Favorite Destination", value: formData.favoriteDestination || "Not set" },
                    { label: "Passport Holder", value: formData.passportHolder ? "Yes" : "No" },
                  ].map((item, i) => (
                    <div key={i} style={styles.infoItem}>
                      <p style={styles.infoLabel}>{item.label}</p>
                      <p style={styles.infoValue}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Emergency Contact Display */}
              <div style={styles.subsection}>
                <h4 style={styles.subsectionTitle}>Emergency Contact</h4>
                <div style={styles.infoGrid} className="profile-info-grid">
                  {[
                    { label: "Contact Name", value: formData.emergencyContactName || "Not set" },
                    { label: "Relationship", value: formData.emergencyContactRelationship || "Not set" },
                    { label: "Phone", value: formData.emergencyContactPhone || "Not set" },
                  ].map((item, i) => (
                    <div key={i} style={styles.infoItem}>
                      <p style={styles.infoLabel}>{item.label}</p>
                      <p style={styles.infoValue}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Security */}
        <div style={styles.sectionCard} className="glass-card profile-section-card">
          <h3 style={styles.sectionTitle}>Security</h3>
          {!showPasswordForm ? (
            <button className="btn-ghost" onClick={() => setShowPasswordForm(true)}>Change Password</button>
          ) : (
            <div style={styles.passwordForm}>
              {passwordError && <div style={styles.passwordError}>{passwordError}</div>}
              {[
                { key: "currentPassword", label: "Current Password", type: "password", placeholder: "Enter current password" },
                { key: "newPassword", label: "New Password", type: "password", placeholder: "Enter new password (min 6 characters)" },
                { key: "confirmPassword", label: "Confirm Password", type: "password", placeholder: "Confirm new password" },
              ].map((field) => (
                <div key={field.key} style={styles.formGroup}>
                  <label style={styles.label}>{field.label}</label>
                  <input
                    className="aurora-input"
                    type={field.type}
                    placeholder={field.placeholder}
                    value={passwordForm[field.key]}
                    onChange={(e) => setPasswordForm({ ...passwordForm, [field.key]: e.target.value })}
                  />
                </div>
              ))}
              <div style={styles.actions}>
                <button className="btn-ghost" onClick={() => { setShowPasswordForm(false); setPasswordError(""); setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" }); }} disabled={changingPassword}>
                  Cancel
                </button>
                <button className="btn-aurora" onClick={handleChangePassword} disabled={changingPassword}>
                  {changingPassword ? "Changing..." : "Change Password"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* About Me */}
        <div style={styles.sectionCard} className="glass-card profile-section-card">
          <div style={styles.sectionHeader} className="profile-section-header">
            <h3 style={styles.sectionTitle}>About Me</h3>
            {!editingAboutMe && (
              <button 
                className="btn-ghost" 
                onClick={() => setEditingAboutMe(true)}
                style={styles.editButton}
              >
                ✏️ Edit
              </button>
            )}
          </div>
          
          {editingAboutMe ? (
            <div style={styles.aboutMeEdit}>
              <div style={styles.textareaGroup}>
                <textarea
                  className="aurora-input"
                  style={styles.textarea}
                  placeholder="Tell us about yourself..."
                  maxLength={300}
                  value={aboutMeForm}
                  onChange={(e) => setAboutMeForm(e.target.value)}
                />
                <div style={styles.charCounter}>{aboutMeForm.length}/300</div>
                {formErrors.bio && <div style={styles.validationError}>{formErrors.bio}</div>}
              </div>
              <div style={styles.actions}>
                <button className="btn-ghost" onClick={handleCancelAboutMe} disabled={saving}>
                  Cancel
                </button>
                <button className="btn-aurora" onClick={handleSaveAboutMe} disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          ) : (
            <div style={styles.aboutMeDisplay}>
              {formData.bio ? (
                <p style={styles.bioText}>{formData.bio}</p>
              ) : (
                <p style={styles.emptyHint}>No bio added yet</p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const styles = {
  title: { fontSize: "28px", fontWeight: "700", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "24px" },
  successBox: { background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "8px", padding: "12px 16px", color: "#6ee7b7", fontSize: "14px", marginBottom: "20px" },
  errorBox: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "12px 16px", color: "#f87171", fontSize: "14px", marginBottom: "20px" },
  heroCard: { padding: "32px", marginBottom: "32px" },
  heroContent: { display: "flex", alignItems: "flex-start", gap: "24px" },
  avatar: { width: "100px", height: "100px", borderRadius: "50%", background: "linear-gradient(135deg, #7c3aed, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px", fontWeight: "700", color: "white", textTransform: "uppercase", flexShrink: 0 },
  heroInfo: { flex: 1 },
  heroName: { fontSize: "28px", fontWeight: "700", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "4px" },
  heroUsername: { color: "#7c3aed", fontSize: "16px", marginBottom: "12px" },
  heroMeta: { display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", marginBottom: "16px" },
  socialIcons: { marginTop: "16px" },
  socialIconsDisplay: { display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" },
  socialIcon: { fontSize: "20px", padding: "8px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", transition: "all 0.2s ease", cursor: "pointer", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" },
  socialIconDisabled: { opacity: 0.3, cursor: "not-allowed" },
  editIconButton: { padding: "8px", fontSize: "16px", minWidth: "auto" },
  socialLinksEdit: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginTop: "16px" },
  socialLinkInput: { display: "flex", flexDirection: "column", gap: "6px" },
  socialActions: { display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "16px", gridColumn: "1 / -1" },
  sectionCard: { padding: "32px", marginBottom: "32px" },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  sectionTitle: { fontSize: "22px", fontWeight: "700", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "0" },
  editButton: { padding: "8px 16px", fontSize: "14px", minWidth: "auto" },
  subsection: { marginBottom: "24px" },
  subsectionTitle: { fontSize: "18px", fontWeight: "600", color: "#94a3b8", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "16px", paddingBottom: "8px", borderBottom: "1px solid rgba(255,255,255,0.1)" },
  personalProfileEdit: { display: "flex", flexDirection: "column", gap: "24px" },
  personalProfileDisplay: { display: "flex", flexDirection: "column", gap: "24px" },
  textareaGroup: { position: "relative" },
  textarea: { width: "100%", minHeight: "120px", resize: "vertical", fontFamily: "inherit" },
  charCounter: { position: "absolute", bottom: "8px", right: "12px", color: "#64748b", fontSize: "12px" },
  emptyHint: { color: "#64748b", fontSize: "14px", fontStyle: "italic" },
  bioText: { color: "#f1f5f9", fontSize: "15px", lineHeight: "1.6" },
  aboutMeEdit: { display: "flex", flexDirection: "column", gap: "16px" },
  aboutMeDisplay: { padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" },
  formGroup: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { color: "#94a3b8", fontSize: "13px", fontWeight: "500" },
  validationError: { color: "#f87171", fontSize: "12px", marginTop: "4px" },
  actions: { display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" },
  saveButton: { padding: "12px 32px", fontSize: "16px" },
  passwordForm: { display: "flex", flexDirection: "column", gap: "16px" },
  passwordError: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "12px 16px", color: "#f87171", fontSize: "13px" },
  infoGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" },
  infoItem: { padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)" },
  infoLabel: { color: "#64748b", fontSize: "12px", marginBottom: "6px" },
  infoValue: { color: "#f1f5f9", fontSize: "15px", fontWeight: "500" },
  usernameDisplay: { display: "flex", alignItems: "center", gap: "8px" },
  usernameEditIcon: { padding: "4px", fontSize: "14px", opacity: 0.7, transition: "opacity 0.2s" },
  usernameEditIconHover: { opacity: 1 },
  usernameEditContainer: { display: "flex", flexDirection: "column", gap: "8px", width: "100%", maxWidth: "300px" },
  usernameInput: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", padding: "8px 12px", color: "#f1f5f9", fontSize: "14px" },
  usernameEditButtons: { display: "flex", gap: "8px", justifyContent: "flex-end" },
  usernameEditButton: { padding: "6px 16px", fontSize: "13px" },
  availabilityMessage: { fontSize: "12px", color: "#94a3b8" },
  availableMessage: { fontSize: "12px", color: "#6ee7b7" },
  takenMessage: { fontSize: "12px", color: "#fca5a5" },
};

export default Profile;
