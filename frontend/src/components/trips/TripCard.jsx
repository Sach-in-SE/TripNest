import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDestinationCoverImage, DEFAULT_INDIAN_COVER } from '../../utils/tripCoverImage';

export const TripCard = ({
  trip,
  onEdit,
  onDelete,
  onShare,
}) => {
  const navigate = useNavigate();
  const [imgSrc, setImgSrc] = useState(() =>
    getDestinationCoverImage(trip.destination, trip.coverImageUrl)
  );

  const isOwner = !trip.permission || trip.permission === 'OWNER';
  const canEdit = isOwner || trip.permission === 'EDIT';

  const handleImageError = () => {
    if (imgSrc !== DEFAULT_INDIAN_COVER) {
      setImgSrc(DEFAULT_INDIAN_COVER);
    }
  };

  const statusClass = (trip.status || 'PLANNING').toLowerCase();

  return (
    <div className="tn-trip-card glass-card" style={styles.card}>
      {/* Cover Image Banner */}
      <div style={styles.coverWrapper}>
        <img
          src={imgSrc}
          alt={`${trip.title} - ${trip.destination}`}
          style={styles.coverImage}
          loading="lazy"
          onError={handleImageError}
        />
        <div style={styles.coverOverlay} />

        {/* Status & Permission Badges pinned on top right */}
        <div style={styles.badgeRow}>
          {trip.permission && trip.permission !== 'OWNER' && (
            <span
              className="badge"
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                color: '#c084fc',
                backdropFilter: 'blur(6px)',
                border: '1px solid rgba(192, 132, 252, 0.4)',
                fontSize: '11px',
              }}
            >
              🤝 Shared ({trip.permission})
            </span>
          )}
          <span
            className={`badge badge-${statusClass}`}
            style={{
              backdropFilter: 'blur(6px)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              fontSize: '11px',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            {trip.status || 'PLANNING'}
          </span>
        </div>

        {/* Destination label overlay on bottom left */}
        <div style={styles.destinationOverlayBadge}>
          <span>📍 {trip.destination}</span>
        </div>
      </div>

      {/* Card Content Body */}
      <div style={styles.cardBody}>
        <h3 style={styles.title} title={trip.title}>
          {trip.title}
        </h3>

        {trip.description && (
          <p style={styles.description} title={trip.description}>
            {trip.description}
          </p>
        )}

        <div style={styles.metaRow}>
          {trip.startDate && trip.endDate && (
            <span style={styles.metaChip}>
              📅 {trip.startDate} → {trip.endDate}
            </span>
          )}
          {trip.startDate && !trip.endDate && (
            <span style={styles.metaChip}>
              📅 {trip.startDate}
            </span>
          )}
          <span style={styles.metaChip}>
            👥 {trip.numberOfTravelers || 1} {Number(trip.numberOfTravelers) === 1 ? 'Traveler' : 'Travelers'}
          </span>
          {trip.budget && (
            <span style={{ ...styles.metaChip, color: '#34d399', background: 'rgba(16, 185, 129, 0.12)' }}>
              💰 ₹{Number(trip.budget).toLocaleString()}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div style={styles.actions}>
          <button
            type="button"
            className="btn-compact"
            onClick={() => navigate(`/itineraries/${trip.id}`)}
            title="View itinerary"
          >
            👁 View
          </button>

          {canEdit && (
            <button
              type="button"
              className="btn-compact"
              onClick={() => onEdit ? onEdit(trip) : navigate(`/trips/${trip.id}/edit`)}
              title="Edit trip details"
            >
              ✏️ Edit
            </button>
          )}

          {isOwner && onShare && (
            <button
              type="button"
              className="btn-compact"
              onClick={() => onShare(trip)}
              title="Share and collaborate"
            >
              🤝 Share
            </button>
          )}

          {isOwner && onDelete && (
            <button
              type="button"
              className="btn-compact danger"
              onClick={() => onDelete(trip.id)}
              title="Delete trip"
            >
              🗑️ Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  card: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    padding: 0,
    borderRadius: '16px',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  coverWrapper: {
    position: 'relative',
    width: '100%',
    height: '150px',
    overflow: 'hidden',
    backgroundColor: '#131d35',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.4s ease',
  },
  coverOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.7) 100%)',
  },
  badgeRow: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
    zIndex: 2,
  },
  destinationOverlayBadge: {
    position: 'absolute',
    bottom: '10px',
    left: '12px',
    background: 'rgba(15, 23, 42, 0.75)',
    backdropFilter: 'blur(8px)',
    color: '#f8fafc',
    fontSize: '12px',
    fontWeight: '600',
    padding: '3px 8px',
    borderRadius: '6px',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    zIndex: 2,
  },
  cardBody: {
    padding: '16px 20px 20px',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  title: {
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--tn-text-primary)',
    fontFamily: 'var(--tn-font-display)',
    marginBottom: '6px',
    lineHeight: 1.3,
  },
  description: {
    color: 'var(--tn-text-muted)',
    fontSize: '13px',
    lineHeight: '1.5',
    marginBottom: '12px',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  metaRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '16px',
    marginTop: 'auto',
  },
  metaChip: {
    color: 'var(--tn-text-secondary)',
    fontSize: '12px',
    background: 'var(--tn-surface-card)',
    border: '1px solid var(--tn-border-subtle)',
    padding: '4px 8px',
    borderRadius: '6px',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginTop: '4px',
    paddingTop: '12px',
    borderTop: '1px solid var(--tn-border-subtle)',
  },
};

export default TripCard;
