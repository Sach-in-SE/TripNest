import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';

export const UserMenu = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="tn-user-menu" ref={menuRef}>
      <button
        type="button"
        className="tn-user-menu-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="User menu"
      >
        <Avatar name={user.username || user.email} size="sm" />
      </button>

      {isOpen && (
        <div className="tn-user-dropdown" onClick={() => setIsOpen(false)}>
          <div className="tn-dropdown-header">
            <div className="tn-dropdown-user-name">{user.username || 'Traveler'}</div>
            <div className="tn-dropdown-user-email">{user.email}</div>
          </div>
          <Link to="/dashboard" className="tn-dropdown-item">
            <span>⊞</span>
            <span>Dashboard</span>
          </Link>
          <Link to="/trips" className="tn-dropdown-item">
            <span>✈️</span>
            <span>My Trips</span>
          </Link>
          <Link to="/profile" className="tn-dropdown-item">
            <span>👤</span>
            <span>Profile</span>
          </Link>
          <Link to="/settings" className="tn-dropdown-item">
            <span>⚙️</span>
            <span>Settings</span>
          </Link>
          <div style={{ height: 1, background: 'var(--tn-border-subtle)', margin: '4px 0' }} />
          <button type="button" className="tn-dropdown-item tn-dropdown-item--danger" onClick={handleLogout}>
            <span>🚪</span>
            <span>Log out</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
