import React from 'react';
import { NavLink } from 'react-router-dom';

export const Sidebar = ({ isCollapsed, onToggleCollapse }) => {
  const sidebarItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '⊞' },
    { path: '/trips', label: 'My Trips', icon: '✈️' },
    { path: '/itineraries', label: 'Itineraries', icon: '📅' },
    { path: '/budget', label: 'Budget', icon: '💰' },
    { path: '/destinations', label: 'Destinations', icon: '🌍' },
    { path: '/groups', label: 'Groups', icon: '👥' },
    { path: '/documents', label: 'Documents', icon: '📁' },
  ];

  return (
    <aside className={`tn-sidebar ${isCollapsed ? 'tn-sidebar--collapsed' : ''}`}>
      <nav className="tn-sidebar-nav">
        {sidebarItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `tn-sidebar-item ${isActive ? 'active' : ''}`}
            title={isCollapsed ? item.label : undefined}
          >
            <span style={{ fontSize: '18px', flexShrink: 0 }}>{item.icon}</span>
            {!isCollapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {onToggleCollapse && (
        <button
          type="button"
          className="tn-sidebar-toggle"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span>{isCollapsed ? '➔' : '⬅ Collapse'}</span>
        </button>
      )}
    </aside>
  );
};

export default Sidebar;
