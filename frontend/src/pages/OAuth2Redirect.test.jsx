import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import OAuth2Redirect from './OAuth2Redirect';
import AuthService from '../services/authService';

const mockNavigate = vi.fn();
const mockRefreshUser = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    refreshUser: mockRefreshUser,
  }),
}));

describe('OAuth2Redirect Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    delete window.location;
    window.location = new URL('http://localhost/oauth2/redirect');
  });

  it('exchanges one-time authorization code via AuthService and redirects to /dashboard', async () => {
    window.location = new URL('http://localhost/oauth2/redirect?code=tn_oec_valid_code_12345');
    const exchangeSpy = vi.spyOn(AuthService, 'exchangeOAuthCode').mockResolvedValueOnce({
      token: 'jwt-mock-token-xyz',
      username: 'traveler_google',
    });

    render(
      <MemoryRouter initialEntries={['/oauth2/redirect?code=tn_oec_valid_code_12345']}>
        <Routes>
          <Route path="/oauth2/redirect" element={<OAuth2Redirect />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Signing you in with Google/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(exchangeSpy).toHaveBeenCalledWith('tn_oec_valid_code_12345');
      expect(mockRefreshUser).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  it('displays error banner when oauth_error query param is present without calling exchange', async () => {
    window.location = new URL('http://localhost/oauth2/redirect?oauth_error=true');
    const exchangeSpy = vi.spyOn(AuthService, 'exchangeOAuthCode');

    render(
      <MemoryRouter initialEntries={['/oauth2/redirect?oauth_error=true']}>
        <Routes>
          <Route path="/oauth2/redirect" element={<OAuth2Redirect />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Google sign-in was cancelled or encountered an error/i)).toBeInTheDocument();
      expect(exchangeSpy).not.toHaveBeenCalled();
    });
  });

  it('displays error banner when no code parameter is provided', async () => {
    window.location = new URL('http://localhost/oauth2/redirect');
    const exchangeSpy = vi.spyOn(AuthService, 'exchangeOAuthCode');

    render(
      <MemoryRouter initialEntries={['/oauth2/redirect']}>
        <Routes>
          <Route path="/oauth2/redirect" element={<OAuth2Redirect />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No authorization code received from Google login/i)).toBeInTheDocument();
      expect(exchangeSpy).not.toHaveBeenCalled();
    });
  });

  it('handles exchange rejection by displaying error and clearing stored session', async () => {
    window.location = new URL('http://localhost/oauth2/redirect?code=expired_code');
    localStorage.setItem('token', 'stale_token');
    localStorage.setItem('user', JSON.stringify({ name: 'old' }));

    vi.spyOn(AuthService, 'exchangeOAuthCode').mockRejectedValueOnce({
      response: { data: { message: 'Invalid or expired exchange code' } },
    });

    render(
      <MemoryRouter initialEntries={['/oauth2/redirect?code=expired_code']}>
        <Routes>
          <Route path="/oauth2/redirect" element={<OAuth2Redirect />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Invalid or expired exchange code/i)).toBeInTheDocument();
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });
});
