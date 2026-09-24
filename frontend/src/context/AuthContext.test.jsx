import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext';
import AuthService from '../services/authService';

// Mock AuthService
vi.mock('../services/authService', () => ({
  default: {
    getCurrentUser: vi.fn(),
    signin: vi.fn(),
    adminSignin: vi.fn(),
    signup: vi.fn(),
    signout: vi.fn(),
    updateStoredUser: vi.fn(),
    switchRole: vi.fn(),
  },
}));

// Test helper component consuming useAuth
const TestConsumer = () => {
  const { user, loading, login, adminLogin, signup, logout, refreshUser, updateUser } = useAuth();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div data-testid="user-info">{user ? user.username : 'Anonymous'}</div>
      <button onClick={() => login({ username: 'sam', password: 'secret' })}>Login</button>
      <button onClick={() => adminLogin({ username: 'admin', password: 'secret' })}>Admin Login</button>
      <button onClick={() => signup({ username: 'newuser', email: 'new@test.com', password: 'pass' })}>Signup</button>
      <button onClick={logout}>Logout</button>
      <button onClick={() => updateUser({ id: 1, username: 'updated_sam' })}>Update User</button>
      <button onClick={refreshUser}>Refresh User</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with null user when no saved session exists', async () => {
    AuthService.getCurrentUser.mockReturnValue(null);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('user-info')).toHaveTextContent('Anonymous');
    expect(AuthService.getCurrentUser).toHaveBeenCalled();
  });

  it('restores existing user session on mount', async () => {
    AuthService.getCurrentUser.mockReturnValue({ id: 5, username: 'existing_traveler' });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('user-info')).toHaveTextContent('existing_traveler');
  });

  it('logs in traveler and updates auth state', async () => {
    const user = userEvent.setup();
    AuthService.getCurrentUser.mockReturnValue(null);
    AuthService.signin.mockResolvedValue({ id: 1, username: 'sam', token: 'jwt-123' });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('user-info')).toHaveTextContent('Anonymous');

    await user.click(screen.getByText('Login'));

    expect(AuthService.signin).toHaveBeenCalledWith({ username: 'sam', password: 'secret' });
    expect(screen.getByTestId('user-info')).toHaveTextContent('sam');
  });

  it('logs in admin and updates auth state', async () => {
    const user = userEvent.setup();
    AuthService.getCurrentUser.mockReturnValue(null);
    AuthService.adminSignin.mockResolvedValue({ id: 99, username: 'admin_boss', roles: ['ROLE_ADMIN'] });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await user.click(screen.getByText('Admin Login'));

    expect(AuthService.adminSignin).toHaveBeenCalledWith({ username: 'admin', password: 'secret' });
    expect(screen.getByTestId('user-info')).toHaveTextContent('admin_boss');
  });

  it('signs out user and clears user state', async () => {
    const user = userEvent.setup();
    AuthService.getCurrentUser.mockReturnValue({ id: 1, username: 'sam' });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('user-info')).toHaveTextContent('sam');

    await user.click(screen.getByText('Logout'));

    expect(AuthService.signout).toHaveBeenCalled();
    expect(screen.getByTestId('user-info')).toHaveTextContent('Anonymous');
  });

  it('updates user directly via updateUser', async () => {
    const user = userEvent.setup();
    AuthService.getCurrentUser.mockReturnValue({ id: 1, username: 'sam' });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await user.click(screen.getByText('Update User'));
    expect(screen.getByTestId('user-info')).toHaveTextContent('updated_sam');
  });

  it('refreshes user from storage via refreshUser', async () => {
    const user = userEvent.setup();
    AuthService.getCurrentUser.mockReturnValueOnce({ id: 1, username: 'sam' });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    AuthService.getCurrentUser.mockReturnValueOnce({ id: 1, username: 'refreshed_sam' });
    await user.click(screen.getByText('Refresh User'));

    expect(screen.getByTestId('user-info')).toHaveTextContent('refreshed_sam');
  });

  it('synchronizes user on cross-tab storage event', async () => {
    AuthService.getCurrentUser.mockReturnValueOnce({ id: 1, username: 'tab1_user' });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('user-info')).toHaveTextContent('tab1_user');

    AuthService.getCurrentUser.mockReturnValue({ id: 2, username: 'tab2_switched_user' });

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'user' }));
    });

    expect(screen.getByTestId('user-info')).toHaveTextContent('tab2_switched_user');
  });
});
