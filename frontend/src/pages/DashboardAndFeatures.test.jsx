import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from './Dashboard';
import Notifications from './Notifications';
import Profile from './Profile';
import api from '../services/api';
import AuthService from '../services/authService';

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../services/authService', () => ({
  default: {
    switchRole: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'sam', roles: ['ROLE_USER'] },
    updateUser: vi.fn(),
  }),
}));

vi.mock('react-chartjs-2', () => ({
  Doughnut: () => <div data-testid="doughnut-chart-mock">Doughnut Chart</div>,
  Line: () => <div data-testid="line-chart-mock">Line Chart</div>,
}));

describe('Core Feature Component Testing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Dashboard Component', () => {
    it('displays loading state and then renders traveler statistics', async () => {
      api.get.mockImplementation((url) => {
        if (url === '/user/profile') {
          return Promise.resolve({ data: { firstName: 'Sam', username: 'sam' } });
        }
        if (url === '/trips') {
          return Promise.resolve({
            data: [
              { id: 1, title: 'Goa Holiday', destination: 'Goa', budget: 1500, status: 'PLANNING' },
              { id: 2, title: 'Manali Trek', destination: 'Manali', budget: 2500, status: 'UPCOMING' },
            ],
          });
        }
        if (url === '/notifications') {
          return Promise.resolve({ data: [] });
        }
        if (url === '/expenses/user') {
          return Promise.resolve({
            data: [{ id: 1, amount: 500, category: 'Food' }],
          });
        }
        return Promise.resolve({ data: [] });
      });

      render(
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      );

      // Verify dashboard statistics are rendered
      await waitFor(() => {
        expect(screen.getByText('Total Trips')).toBeInTheDocument();
        expect(screen.getByText('Total Budget')).toBeInTheDocument();
      });
    });

    it('renders empty trips banner when traveler has no trips', async () => {
      api.get.mockImplementation((url) => {
        if (url === '/trips') return Promise.resolve({ data: [] });
        return Promise.resolve({ data: [] });
      });

      render(
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/No trips planned yet/i)).toBeInTheDocument();
      });
    });
  });

  describe('Notifications Component', () => {
    it('renders notification list and unread items', async () => {
      api.get.mockImplementation((url) => {
        if (url === '/notifications') {
          return Promise.resolve({
            data: [
              {
                id: 101,
                title: 'Trip Invite',
                message: 'Alice invited you to Swiss Alps trip',
                read: false,
                createdAt: '2026-09-15T10:00:00Z',
              },
            ],
          });
        }
        if (url === '/notifications/unread/count') {
          return Promise.resolve({ data: 1 });
        }
        return Promise.resolve({ data: [] });
      });

      render(
        <MemoryRouter>
          <Notifications />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Trip Invite')).toBeInTheDocument();
        expect(screen.getByText('Alice invited you to Swiss Alps trip')).toBeInTheDocument();
      });
    });

    it('displays empty state when there are zero notifications', async () => {
      api.get.mockImplementation((url) => {
        if (url === '/notifications/unread/count') {
          return Promise.resolve({ data: 0 });
        }
        return Promise.resolve({ data: [] });
      });

      render(
        <MemoryRouter>
          <Notifications />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('No notifications')).toBeInTheDocument();
      });
    });
  });

  describe('Profile & RBAC Role Switch', () => {
    it('renders user details and triggers role switch', async () => {
      const user = userEvent.setup();

      api.get.mockResolvedValue({
        data: {
          username: 'sam_traveler',
          email: 'sam@tripnest.com',
          roles: ['ROLE_USER'],
        },
      });

      AuthService.switchRole.mockResolvedValueOnce({
        token: 'new-role-jwt-token',
        roles: ['ROLE_GROUP_ADMIN'],
      });

      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Application Role/i)).toBeInTheDocument();
      });

      // Find role switch button for Group Admin
      const switchBtn = await screen.findByRole('button', { name: /switch to group admin/i });
      expect(switchBtn).toBeInTheDocument();
      await user.click(switchBtn);
      expect(AuthService.switchRole).toHaveBeenCalledWith('ROLE_GROUP_ADMIN');
    });
  });
});
