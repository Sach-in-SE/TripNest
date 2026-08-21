import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import api from '../../services/api';
import './AdminLayout.css';

const STATUS_FILTERS = [
  { value: '', label: 'All Statuses' },
  { value: 'NEW', label: '🆕 New' },
  { value: 'READ', label: '📖 Read' },
  { value: 'RESOLVED', label: '✅ Resolved' },
  { value: 'ARCHIVED', label: '📦 Archived' },
];

const AdminContactInbox = () => {
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState({ total: 0, newCount: 0, readCount: 0, resolvedCount: 0, archivedCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals & Action States
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (type, text) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/contact-messages/stats');
      setStats(res.data || { total: 0, newCount: 0, readCount: 0, resolvedCount: 0, archivedCount: 0 });
    } catch (err) {
      console.error('Failed to fetch contact stats:', err);
    }
  };

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await api.get('/admin/contact-messages', { params });
      setMessages(res.data || []);
      fetchStats();
    } catch (err) {
      console.error('Failed to fetch contact messages:', err);
      setError(err.response?.data?.message || 'Failed to load contact messages from server.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleOpenDetail = async (msg) => {
    setSelectedMessage(msg);

    // If message is NEW, auto-mark as READ on open to improve workflow
    if (msg.status === 'NEW') {
      try {
        const res = await api.put(`/admin/contact-messages/${msg.id}/status`, { status: 'READ' });
        setSelectedMessage(res.data);
        setMessages((prev) => prev.map((m) => (m.id === msg.id ? res.data : m)));
        fetchStats();
      } catch (err) {
        console.error('Failed to auto-mark message as read:', err);
      }
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    setActionLoading(true);
    try {
      const res = await api.put(`/admin/contact-messages/${id}/status`, { status: newStatus });
      showToast('success', `Message #${id} marked as ${res.data.statusDisplayName || newStatus}.`);
      setSelectedMessage(res.data);
      setMessages((prev) => prev.map((m) => (m.id === id ? res.data : m)));
      fetchStats();
    } catch (err) {
      console.error('Failed to update status:', err);
      showToast('error', err.response?.data?.message || 'Failed to update message status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMessage = async (id) => {
    if (!window.confirm(`Are you sure you want to permanently delete message #${id}?`)) {
      return;
    }

    setActionLoading(true);
    try {
      await api.delete(`/admin/contact-messages/${id}`);
      showToast('success', `Message #${id} deleted successfully.`);
      setSelectedMessage(null);
      setMessages((prev) => prev.filter((m) => m.id !== id));
      fetchStats();
    } catch (err) {
      console.error('Failed to delete message:', err);
      showToast('error', err.response?.data?.message || 'Failed to delete message.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return isoString;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'NEW':
        return 'admin-badge admin-badge--active';
      case 'READ':
        return 'admin-badge admin-badge--role';
      case 'RESOLVED':
        return 'admin-badge admin-badge--active';
      case 'ARCHIVED':
        return 'admin-badge admin-badge--disabled';
      default:
        return 'admin-badge';
    }
  };

  const getCategoryLabel = (category, categoryDisplayName) => {
    if (categoryDisplayName) return categoryDisplayName;
    switch (category) {
      case 'BUG_REPORT':
        return '🐛 Bug Report';
      case 'FEEDBACK':
        return '💡 Product Feedback';
      case 'FEATURE_REQUEST':
        return '✨ Feature Request';
      case 'GENERAL_INQUIRY':
        return '💬 General Inquiry';
      case 'OTHER':
        return '📌 Other';
      default:
        return category || 'General';
    }
  };

  return (
    <AdminLayout pageTitle="Support Inbox">
      <div className="admin-content-container">
        {/* Header */}
        <div className="admin-dashboard-header">
          <div>
            <h1>Support & Contact Inbox</h1>
            <p>Review, filter, manage, and resolve inquiries submitted by travelers and visitors.</p>
          </div>
          <button
            type="button"
            onClick={fetchMessages}
            disabled={loading}
            className="admin-refresh-btn"
            aria-label="Refresh inbox"
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div
            className={`admin-toast ${toastMessage.type === 'success' ? 'admin-toast--success' : 'admin-toast--error'}`}
            role="status"
            aria-live="polite"
          >
            <span>{toastMessage.type === 'success' ? '✅' : '⚠️'}</span>
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="admin-stats-grid" style={{ marginBottom: '1.75rem' }}>
          <div className="admin-stat-card">
            <div className="admin-stat-icon users-total">📬</div>
            <div className="admin-stat-info">
              <span className="admin-stat-label">Total Inquiries</span>
              <span className="admin-stat-value">{stats.total}</span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon trips-active">🆕</div>
            <div className="admin-stat-info">
              <span className="admin-stat-label">New & Unread</span>
              <span className="admin-stat-value" style={{ color: '#38bdf8' }}>{stats.newCount}</span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon trips-planning">📖</div>
            <div className="admin-stat-info">
              <span className="admin-stat-label">Read / In Review</span>
              <span className="admin-stat-value" style={{ color: '#fde047' }}>{stats.readCount}</span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon users-active">✅</div>
            <div className="admin-stat-info">
              <span className="admin-stat-label">Resolved</span>
              <span className="admin-stat-value" style={{ color: '#4ade80' }}>{stats.resolvedCount}</span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon users-disabled">📦</div>
            <div className="admin-stat-info">
              <span className="admin-stat-label">Archived</span>
              <span className="admin-stat-value" style={{ color: '#94a3b8' }}>{stats.archivedCount}</span>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="admin-filters-card" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.5rem' }}>
          {/* Search Box */}
          <div style={{ flex: '1 1 280px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search by sender name, email, subject, or message..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-filter-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          {/* Status Filter */}
          <div style={{ minWidth: '180px' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="admin-filter-select"
              style={{ width: '100%' }}
            >
              {STATUS_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="admin-error-banner" role="alert" style={{ padding: '1rem', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#fca5a5', marginBottom: '1.5rem' }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Messages Table */}
        <div className="admin-table-container" style={{ background: '#1e293b', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
              <p>Loading contact messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div style={{ padding: '3.5rem', textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📭</div>
              <h3 style={{ color: '#f8fafc', marginBottom: '0.5rem' }}>No messages found</h3>
              <p>{statusFilter || searchTerm ? 'Try adjusting your filters or search query.' : 'No contact submissions received yet.'}</p>
            </div>
          ) : (
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', fontSize: '0.8125rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '1rem' }}>Status</th>
                  <th style={{ padding: '1rem' }}>Sender</th>
                  <th style={{ padding: '1rem' }}>Category</th>
                  <th style={{ padding: '1rem' }}>Subject</th>
                  <th style={{ padding: '1rem' }}>Received</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((msg) => (
                  <tr
                    key={msg.id}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      background: msg.status === 'NEW' ? 'rgba(56, 189, 248, 0.04)' : 'transparent',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    {/* Status Badge */}
                    <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                      <span className={getStatusBadgeClass(msg.status)}>
                        {msg.statusDisplayName || msg.status}
                      </span>
                    </td>

                    {/* Sender Info */}
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: '600', color: '#f8fafc' }}>{msg.name}</div>
                      <div style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>{msg.email}</div>
                      {msg.username && (
                        <div style={{ fontSize: '0.75rem', color: '#c084fc', marginTop: '2px' }}>
                          👤 User: @{msg.username}
                        </div>
                      )}
                    </td>

                    {/* Category */}
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#cbd5e1', whiteSpace: 'nowrap' }}>
                      {getCategoryLabel(msg.category, msg.categoryDisplayName)}
                    </td>

                    {/* Subject */}
                    <td style={{ padding: '1rem', maxWidth: '300px' }}>
                      <div
                        style={{
                          fontWeight: msg.status === 'NEW' ? '700' : '500',
                          color: '#f8fafc',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={msg.subject}
                      >
                        {msg.subject}
                      </div>
                      <div
                        style={{
                          fontSize: '0.8125rem',
                          color: '#64748b',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          marginTop: '2px',
                        }}
                      >
                        {msg.message}
                      </div>
                    </td>

                    {/* Date */}
                    <td style={{ padding: '1rem', fontSize: '0.8125rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {formatDate(msg.createdAt)}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(msg)}
                        className="admin-action-btn"
                        style={{
                          padding: '0.4rem 0.85rem',
                          borderRadius: '6px',
                          background: 'rgba(99, 102, 241, 0.15)',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          color: '#818cf8',
                          fontSize: '0.8125rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          marginRight: '0.5rem',
                        }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Message Details Modal */}
        {selectedMessage && (
          <div className="admin-modal-overlay" onClick={() => setSelectedMessage(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
            <div
              className="admin-modal-box glass-card"
              onClick={(e) => e.stopPropagation()}
              style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '16px', maxWidth: '680px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-msg-title"
            >
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span className={getStatusBadgeClass(selectedMessage.status)}>
                      {selectedMessage.statusDisplayName || selectedMessage.status}
                    </span>
                    <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>Ticket #{selectedMessage.id}</span>
                  </div>
                  <h2 id="modal-msg-title" style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
                    {selectedMessage.subject}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMessage(null)}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer', padding: '0 0.5rem' }}
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>

              {/* Sender & Meta Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Sender Name</span>
                  <strong style={{ color: '#f8fafc', fontSize: '0.9375rem' }}>{selectedMessage.name}</strong>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Email Address</span>
                  <a href={`mailto:${selectedMessage.email}`} style={{ color: '#38bdf8', textDecoration: 'none', fontSize: '0.9375rem' }}>
                    {selectedMessage.email}
                  </a>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Category</span>
                  <span style={{ color: '#cbd5e1', fontSize: '0.9375rem' }}>
                    {getCategoryLabel(selectedMessage.category, selectedMessage.categoryDisplayName)}
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Received At</span>
                  <span style={{ color: '#cbd5e1', fontSize: '0.875rem' }}>
                    {formatDate(selectedMessage.createdAt)}
                  </span>
                </div>

                {selectedMessage.username && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Authenticated Account</span>
                    <span style={{ color: '#c084fc', fontSize: '0.875rem', fontWeight: '600' }}>
                      👤 Registered User: @{selectedMessage.username} (User ID #{selectedMessage.userId})
                    </span>
                  </div>
                )}
              </div>

              {/* Message Content */}
              <div style={{ marginBottom: '1.75rem' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#e2e8f0', display: 'block', marginBottom: '0.5rem' }}>
                  Complete Message Content:
                </span>
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '1.25rem',
                    color: '#f8fafc',
                    lineHeight: '1.7',
                    fontSize: '0.9375rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {selectedMessage.message}
                </div>
              </div>

              {/* Status Transition Actions Toolbar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.25rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {selectedMessage.status !== 'READ' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedMessage.id, 'READ')}
                      disabled={actionLoading}
                      style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: 'rgba(234, 179, 8, 0.15)', border: '1px solid rgba(234, 179, 8, 0.3)', color: '#fde047', fontSize: '0.8125rem', fontWeight: '600', cursor: 'pointer' }}
                    >
                      📖 Mark Read
                    </button>
                  )}

                  {selectedMessage.status !== 'RESOLVED' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedMessage.id, 'RESOLVED')}
                      disabled={actionLoading}
                      style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#4ade80', fontSize: '0.8125rem', fontWeight: '600', cursor: 'pointer' }}
                    >
                      ✅ Mark Resolved
                    </button>
                  )}

                  {selectedMessage.status !== 'ARCHIVED' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedMessage.id, 'ARCHIVED')}
                      disabled={actionLoading}
                      style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: 'rgba(148, 163, 184, 0.15)', border: '1px solid rgba(148, 163, 184, 0.3)', color: '#cbd5e1', fontSize: '0.8125rem', fontWeight: '600', cursor: 'pointer' }}
                    >
                      📦 Archive
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteMessage(selectedMessage.id)}
                  disabled={actionLoading}
                  style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', fontSize: '0.8125rem', fontWeight: '600', cursor: 'pointer' }}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminContactInbox;
