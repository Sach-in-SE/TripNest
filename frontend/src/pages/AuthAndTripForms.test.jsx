import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Signup from './Signup';
import TripForm from '../components/TripForm';
import api from '../services/api';

const mockSignup = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    signup: mockSignup,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Form Validation & Submission Behaviors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Signup Form Validation', () => {
    it('validates missing required fields on submit', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <Signup />
        </MemoryRouter>
      );

      const submitBtn = screen.getByRole('button', { name: /create account/i });
      await user.click(submitBtn);

      expect(
        screen.getByText('Please fill in all required fields (username, email, and password).')
      ).toBeInTheDocument();
      expect(mockSignup).not.toHaveBeenCalled();
    });

    it('rejects short usernames (< 3 characters)', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <Signup />
        </MemoryRouter>
      );

      await user.type(screen.getByPlaceholderText(/choose a unique username/i), 'ab');
      await user.type(screen.getByPlaceholderText(/name@example\.com/i), 'valid@mail.com');
      await user.type(screen.getByPlaceholderText(/Create a password/i), 'Pass1234!');

      await user.click(screen.getByRole('button', { name: /create account/i }));

      expect(screen.getByText('Username must be at least 3 characters long.')).toBeInTheDocument();
      expect(mockSignup).not.toHaveBeenCalled();
    });

    it('rejects invalid email formats', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <Signup />
        </MemoryRouter>
      );

      await user.type(screen.getByPlaceholderText(/choose a unique username/i), 'traveler');
      await user.type(screen.getByPlaceholderText(/name@example\.com/i), 'not-an-email');
      await user.type(screen.getByPlaceholderText(/Create a password/i), 'Pass1234!');

      await user.click(screen.getByRole('button', { name: /create account/i }));

      expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument();
    });

    it('submits successfully when fields are valid', async () => {
      const user = userEvent.setup();
      mockSignup.mockResolvedValueOnce({ success: true });

      render(
        <MemoryRouter>
          <Signup />
        </MemoryRouter>
      );

      await user.type(screen.getByPlaceholderText(/choose a unique username/i), 'super_traveler');
      await user.type(screen.getByPlaceholderText(/name@example\.com/i), 'sam@tripnest.com');
      await user.type(screen.getByPlaceholderText(/Create a password/i), 'SecurePass123!');

      await user.click(screen.getByRole('button', { name: /create account/i }));

      expect(mockSignup).toHaveBeenCalledWith({
        username: 'super_traveler',
        email: 'sam@tripnest.com',
        password: 'SecurePass123!',
        firstName: '',
        lastName: '',
        role: 'traveler',
      });

      await waitFor(() => {
        expect(
          screen.getByText('Account created successfully! Redirecting to sign in...')
        ).toBeInTheDocument();
      });
    });
  });

  describe('TripForm Component', () => {
    it('prefills destination and estimated budget from location state', () => {
      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/trips/new',
              state: { destination: { name: 'Ladakh', estimatedBudget: 1200 } },
            },
          ]}
        >
          <TripForm />
        </MemoryRouter>
      );

      const destInput = screen.getByDisplayValue('Ladakh');
      expect(destInput).toBeInTheDocument();
      expect(destInput).toHaveAttribute('readonly');
      expect(screen.getByDisplayValue('1200')).toBeInTheDocument();
    });

    it('submits POST /trips with form data and invokes onSuccess', async () => {
      const user = userEvent.setup();
      const handleSuccess = vi.fn();
      api.post.mockResolvedValueOnce({ data: { id: 77, title: 'Goa Holiday' } });

      render(
        <MemoryRouter>
          <TripForm onSuccess={handleSuccess} />
        </MemoryRouter>
      );

      await user.type(screen.getByPlaceholderText(/e\.g\. Goa Adventure/i), 'Goa Holiday');
      await user.type(screen.getByPlaceholderText(/Enter destination/i), 'Goa');

      await user.click(screen.getByRole('button', { name: /Create Trip/i }));

      expect(api.post).toHaveBeenCalledWith('/trips', expect.objectContaining({
        title: 'Goa Holiday',
        destination: 'Goa',
      }));

      await waitFor(() => {
        expect(handleSuccess).toHaveBeenCalled();
      });
    });

    it('displays error banner when backend returns 400 Bad Request', async () => {
      const user = userEvent.setup();
      api.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { message: 'End date must be after start date' },
        },
      });

      render(
        <MemoryRouter>
          <TripForm />
        </MemoryRouter>
      );

      await user.type(screen.getByPlaceholderText(/e\.g\. Goa Adventure/i), 'Invalid Trip');
      await user.click(screen.getByRole('button', { name: /Create Trip/i }));

      await waitFor(() => {
        expect(screen.getByText('End date must be after start date')).toBeInTheDocument();
      });
    });
  });
});
