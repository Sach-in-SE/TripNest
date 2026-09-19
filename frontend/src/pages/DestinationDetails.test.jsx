import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import DestinationDetails from './DestinationDetails';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, username: 'sam' } }),
}));

// Mock child components that use leaflet or heavy maps
vi.mock('../components/DestinationMap', () => ({
  default: () => <div data-testid="destination-map-mock">Map Mock</div>,
}));

describe('DestinationDetails Performance & Progressive Hydration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders core destination metadata immediately from router state without waiting for API', () => {
    const passedDestination = {
      id: 10,
      name: 'Goa Golden Beach',
      country: 'India',
      category: 'Beach',
      budget: 450,
      durationDays: 4,
      rating: 4.8,
      imageUrl: 'https://images.unsplash.com/beach.jpg',
      description: 'Sun, sand and serene sea.',
    };

    // Return pending promise for full detail API to verify zero-delay state render
    api.get.mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/destinations/10',
            state: { destination: passedDestination },
          },
        ]}
      >
        <Routes>
          <Route path="/destinations/:id" element={<DestinationDetails />} />
        </Routes>
      </MemoryRouter>
    );

    // Frame 1 check: Core title, country, description are rendered immediately
    expect(screen.getByText('Goa Golden Beach')).toBeInTheDocument();
    expect(screen.getByText(/India/)).toBeInTheDocument();
    expect(screen.getByText('Sun, sand and serene sea.')).toBeInTheDocument();
  });

  it('progressively enriches weather and travel guide independently without blocking', async () => {
    const passedDestination = {
      id: 10,
      name: 'Manali Heights',
      country: 'India',
      category: 'Mountains',
      budget: 600,
      durationDays: 5,
      rating: 4.9,
    };

    api.get.mockImplementation((url) => {
      if (url === '/destinations/10') {
        return Promise.resolve({
          data: {
            destination: passedDestination,
            travelGuide: { available: false },
            weather: { available: false },
          },
        });
      }
      if (url === '/destinations/10/weather') {
        return Promise.resolve({
          data: {
            available: true,
            temperature: 18,
            weatherCode: 0,
            windSpeed: 8,
          },
        });
      }
      if (url === '/destinations/10/guide') {
        return Promise.resolve({
          data: {
            available: true,
            attractions: [{ title: 'Solang Valley', category: 'Valley' }],
            hotels: [],
            restaurants: [],
          },
        });
      }
      if (url === '/favorites') {
        return Promise.resolve({ data: [] });
      }
      return Promise.reject(new Error('Unknown URL: ' + url));
    });

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/destinations/10',
            state: { destination: passedDestination },
          },
        ]}
      >
        <Routes>
          <Route path="/destinations/:id" element={<DestinationDetails />} />
        </Routes>
      </MemoryRouter>
    );

    // Initial render
    expect(screen.getByText('Manali Heights')).toBeInTheDocument();

    // Verify progressive weather & guide endpoints were queried
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/destinations/10/weather');
      expect(api.get).toHaveBeenCalledWith('/destinations/10/guide');
    });

    // Verify progressive weather resolved and rendered
    await waitFor(() => {
      expect(screen.getByText('18.0°C')).toBeInTheDocument();
    });

    // Verify progressive travel guide resolved and rendered
    await waitFor(() => {
      expect(screen.getByText('Solang Valley')).toBeInTheDocument();
    });
  });

  it('enrichment failure does not crash or block the core destination UI', async () => {
    const passedDestination = {
      id: 10,
      name: 'Kerala Backwaters',
      country: 'India',
      category: 'Beach',
      budget: 800,
      durationDays: 6,
      rating: 4.9,
    };

    api.get.mockImplementation((url) => {
      if (url === '/destinations/10') {
        return Promise.resolve({
          data: {
            destination: passedDestination,
            travelGuide: { available: false },
            weather: { available: false },
          },
        });
      }
      if (url === '/destinations/10/weather') {
        // Third-party timeout simulation
        return Promise.reject(new Error('Open-Meteo gateway timeout'));
      }
      if (url === '/destinations/10/guide') {
        // OSM Overpass failure simulation
        return Promise.reject(new Error('OSM mirror 504'));
      }
      if (url === '/favorites') {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: {} });
    });

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/destinations/10',
            state: { destination: passedDestination },
          },
        ]}
      >
        <Routes>
          <Route path="/destinations/:id" element={<DestinationDetails />} />
        </Routes>
      </MemoryRouter>
    );

    // Core page remains fully intact and visible
    expect(screen.getByText('Kerala Backwaters')).toBeInTheDocument();

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/destinations/10/weather');
      expect(api.get).toHaveBeenCalledWith('/destinations/10/guide');
    });

    // Core page is still stable
    expect(screen.getByText('Kerala Backwaters')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('triggers only 1 primary destination-detail API request', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/destinations/10') {
        return Promise.resolve({
          data: {
            destination: { id: 10, name: 'Jaipur Pink City', category: 'Historical' },
            travelGuide: { available: true, attractions: [] },
            weather: { available: true, temperature: 30 },
          },
        });
      }
      if (url === '/favorites') {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: {} });
    });

    render(
      <MemoryRouter initialEntries={['/destinations/10']}>
        <Routes>
          <Route path="/destinations/:id" element={<DestinationDetails />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Jaipur Pink City')).toBeInTheDocument();
    });

    const destinationDetailCalls = api.get.mock.calls.filter((c) => c[0] === '/destinations/10');
    expect(destinationDetailCalls).toHaveLength(1);
  });
});
