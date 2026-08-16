import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import LoadingSkeleton from '../ui/LoadingSkeleton';
import api from '../../services/api';

const CATEGORY_FALLBACK_IMAGES = {
  Mountains: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
  Mountain: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
  Beach: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  Historical: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=800&q=80',
  Adventure: 'https://images.unsplash.com/photo-1533240332313-0db49b459ad6?auto=format&fit=crop&w=800&q=80',
  Wildlife: 'https://images.unsplash.com/photo-1534177616072-ef7dc120449d?auto=format&fit=crop&w=800&q=80',
  Spiritual: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=80',
  City: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=800&q=80',
  Default: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80',
};

const FILTER_CATEGORIES = ['All', 'Mountains', 'Beach', 'Historical', 'Adventure', 'Wildlife'];

const normalizeCategory = (categoryStr) => {
  if (!categoryStr || typeof categoryStr !== 'string') return '';
  return categoryStr.trim().toLowerCase();
};

const matchesCategory = (destinationCategory, selectedFilter) => {
  if (!selectedFilter || selectedFilter === 'All') return true;
  const destCat = normalizeCategory(destinationCategory);
  const filterCat = normalizeCategory(selectedFilter);

  if (!destCat) return false;
  if (destCat === filterCat) return true;

  // Plural / singular / synonym mappings
  if (filterCat === 'mountains' || filterCat === 'mountain') {
    return destCat === 'mountains' || destCat === 'mountain' || destCat.includes('mountain') || destCat.includes('hill');
  }
  if (filterCat === 'beach' || filterCat === 'beaches') {
    return destCat === 'beach' || destCat === 'beaches' || destCat.includes('beach') || destCat.includes('coast');
  }
  if (filterCat === 'historical' || filterCat === 'history' || filterCat === 'heritage') {
    return destCat === 'historical' || destCat === 'history' || destCat === 'heritage' || destCat.includes('historic');
  }
  if (filterCat === 'adventure') {
    return destCat === 'adventure' || destCat.includes('adventure') || destCat.includes('trek');
  }
  if (filterCat === 'wildlife' || filterCat === 'nature') {
    return destCat === 'wildlife' || destCat.includes('wildlife') || destCat.includes('safari') || destCat.includes('nature');
  }

  return destCat === filterCat;
};

export const DestinationCatalog = () => {
  const [destinations, setDestinations] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loadingDestinations, setLoadingDestinations] = useState(true);

  // Fetch destinations once on mount
  useEffect(() => {
    let isMounted = true;
    const fetchFeaturedDestinations = async () => {
      try {
        const response = await api.get('/destinations');
        if (isMounted && Array.isArray(response.data)) {
          setDestinations(response.data);
        }
      } catch (err) {
        console.warn('Failed to load landing page featured destinations:', err);
      } finally {
        if (isMounted) {
          setLoadingDestinations(false);
        }
      }
    };

    fetchFeaturedDestinations();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter in-memory locally without additional network requests
  const filteredDestinations = useMemo(() => {
    if (selectedCategory === 'All') {
      return destinations.slice(0, 6);
    }
    const filtered = destinations.filter((d) => matchesCategory(d.category, selectedCategory));
    return filtered.slice(0, 6);
  }, [destinations, selectedCategory]);

  const getFallbackImage = (category) => {
    return CATEGORY_FALLBACK_IMAGES[category] || CATEGORY_FALLBACK_IMAGES.Default;
  };

  return (
    <section id="destinations" className="tn-landing-section" aria-label="Featured Destinations">
      <div className="tn-section-heading">
        <Badge variant="warning" style={{ marginBottom: '12px' }}>Curated Travel Catalog</Badge>
        <h2 className="tn-section-heading-title">Explore Hand-Picked Destinations</h2>
        <p className="tn-section-heading-desc">
          Discover incredible places with realistic budget estimates, recommended trip durations, and seasonal weather insights.
        </p>
      </div>

      {/* Category Filter Pills */}
      <div className="tn-destination-filters" role="tablist" aria-label="Destination Categories">
        {FILTER_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={isSelected}
              className={`tn-filter-pill ${isSelected ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {loadingDestinations ? (
        <div className="tn-destinations-grid">
          <LoadingSkeleton height="320px" count={6} />
        </div>
      ) : filteredDestinations.length > 0 ? (
        <div className="tn-destinations-grid">
          {filteredDestinations.map((dest) => {
            const fallback = getFallbackImage(dest.category);
            return (
              <Link
                key={dest.id}
                to={`/destinations/${dest.id}`}
                className="tn-dest-card"
                aria-label={`${dest.name}, ${dest.country || 'Destination'}`}
              >
                <div className="tn-dest-image-container">
                  <img
                    src={dest.imageUrl || fallback}
                    alt={dest.name}
                    className="tn-dest-image"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.target.src = fallback;
                    }}
                  />
                  <div className="tn-dest-image-overlay">
                    <Badge variant="neutral" className="tn-dest-category-badge">
                      {dest.category || 'Popular'}
                    </Badge>
                    <span className="tn-dest-rating-pill" aria-label={`Rating: ${dest.rating || '4.8'} out of 5 stars`}>
                      ⭐ {dest.rating ? dest.rating.toFixed(1) : '4.8'}
                    </span>
                  </div>
                </div>

                <div className="tn-dest-content">
                  <h3 className="tn-dest-title">{dest.name}</h3>
                  <p className="tn-dest-location">
                    📍 {dest.state ? `${dest.state}, ` : ''}{dest.country || 'Global'}
                  </p>

                  <div className="tn-dest-meta-row">
                    <span className="tn-dest-meta-tag" title="Recommended Duration">
                      📅 {dest.recommendedDays || 3} Days
                    </span>
                    <span className="tn-dest-meta-tag" title="Estimated Budget">
                      💰 ₹{dest.estimatedBudget ? Number(dest.estimatedBudget).toLocaleString() : '15,000'}
                    </span>
                    <span className="tn-dest-meta-tag" title="Best Season to Visit">
                      🌤️ {dest.bestSeason || 'Oct–Mar'}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="tn-destination-empty">
          <p>No destinations found for "{selectedCategory}".</p>
          <Button variant="ghost" size="sm" onClick={() => setSelectedCategory('All')}>
            Show All Destinations
          </Button>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '36px' }}>
        <Link to="/destinations" style={{ textDecoration: 'none' }}>
          <Button variant="secondary" size="md">
            Explore All Destinations ➔
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default DestinationCatalog;
