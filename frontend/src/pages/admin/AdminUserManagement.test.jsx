import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AdminUserManagement from './AdminUserManagement';
import { AdminLayout } from '../../components/layout/AdminLayout';
import api from '../../services/api';

const mockLogout = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'admin_master', roles: ['ROLE_ADMIN'], firstName: 'Admin', lastName: 'User' },
    logout: mockLogout,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Feature 8: Admin User Deletion & Password Change', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUsersList = [
    {
      id: 1,
      username: 'admin_master',
      email: 'admin@tripnest.com',
      enabled: true,
      roles: ['ROLE_ADMIN'],
    },
    {
      id: 2,
      username: 'other_admin',
      email: 'admin2@tripnest.com',
      enabled: true,
      roles: ['ROLE_ADMIN'],
    },
    {
      id: 10,
      username: 'traveler_john',
      email: 'john@example.com',
      enabled: true,
      roles: ['ROLE_TRAVELER'],
    },
    {
      id: 20,
      username: 'group_admin_sarah',
      email: 'sarah@example.com',
      enabled: true,
      roles: ['ROLE_GROUP_ADMIN'],
    },
  ];

  describe('AdminUserManagement Component', () => {
    it('shows delete button only for deletable users (travelers & group admins) and excludes admins', async () => {
      api.get.mockResolvedValueOnce({ data: mockUsersList });

      render(
        <MemoryRouter>
          <AdminUserManagement />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('traveler_john')).toBeInTheDocument();
      });

      // Self (admin_master) should NOT have delete button
      expect(screen.queryByLabelText('Delete admin_master')).not.toBeInTheDocument();

      // Other admin (other_admin) should NOT have delete button
      expect(screen.queryByLabelText('Delete other_admin')).not.toBeInTheDocument();

      // Traveler should have delete button
      expect(screen.getByLabelText('Delete traveler_john')).toBeInTheDocument();

      // Group Admin should have delete button
      expect(screen.getByLabelText('Delete group_admin_sarah')).toBeInTheDocument();
    });

    it('opens confirmation modal and executes permanent delete on confirmation', async () => {
      const user = userEvent.setup();
      api.get.mockResolvedValue({ data: mockUsersList });
      api.delete.mockResolvedValueOnce({ data: { message: 'User deleted successfully' } });

      render(
        <MemoryRouter>
          <AdminUserManagement />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('traveler_john')).toBeInTheDocument();
      });

      // Click delete for traveler_john
      const deleteBtn = screen.getByLabelText('Delete traveler_john');
      await user.click(deleteBtn);

      // Verify modal is displayed
      expect(screen.getByRole('dialog', { name: /permanently delete user/i })).toBeInTheDocument();
      expect(screen.getByText(/All trips, itineraries, activities, expenses, budgets/i)).toBeInTheDocument();

      // Confirm permanent deletion
      const confirmBtn = screen.getByRole('button', { name: /permanently delete/i });
      await user.click(confirmBtn);

      // Verify DELETE API called with target user ID
      expect(api.delete).toHaveBeenCalledWith('/admin/users/10');

      // Verify modal is closed
      await waitFor(() => {
        expect(screen.queryByRole('dialog', { name: /permanently delete user/i })).not.toBeInTheDocument();
      });
    });

    it('cancels deletion when cancel button is clicked', async () => {
      const user = userEvent.setup();
      api.get.mockResolvedValue({ data: mockUsersList });

      render(
        <MemoryRouter>
          <AdminUserManagement />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('traveler_john')).toBeInTheDocument();
      });

      await user.click(screen.getByLabelText('Delete traveler_john'));
      expect(screen.getByRole('dialog', { name: /permanently delete user/i })).toBeInTheDocument();

      const cancelBtn = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelBtn);

      expect(api.delete).not.toHaveBeenCalled();
      expect(screen.queryByRole('dialog', { name: /permanently delete user/i })).not.toBeInTheDocument();
    });
  });

  describe('AdminLayout Self Password Change', () => {
    it('opens password change modal and submits change request successfully', async () => {
      const user = userEvent.setup();
      api.post.mockResolvedValueOnce({ data: { message: 'Password changed successfully!' } });

      render(
        <MemoryRouter>
          <AdminLayout pageTitle="Test Page">
            <div>Page Content</div>
          </AdminLayout>
        </MemoryRouter>
      );

      const changePwdBtn = screen.getByRole('button', { name: /change admin password/i });
      await user.click(changePwdBtn);

      expect(screen.getByRole('dialog', { name: /change your password/i })).toBeInTheDocument();

      // Fill in passwords
      await user.type(screen.getByLabelText(/current password/i), 'oldAdminPwd123');
      await user.type(screen.getByLabelText(/new password \(min 6 characters\)/i), 'newSecureAdminPwd456');
      await user.type(screen.getByLabelText(/confirm new password/i), 'newSecureAdminPwd456');

      const submitBtn = screen.getByRole('button', { name: /update password/i });
      await user.click(submitBtn);

      expect(api.post).toHaveBeenCalledWith('/user/change-password', {
        currentPassword: 'oldAdminPwd123',
        newPassword: 'newSecureAdminPwd456',
        confirmPassword: 'newSecureAdminPwd456',
      });

      await waitFor(() => {
        expect(screen.getByText(/password changed successfully!/i)).toBeInTheDocument();
      });
    });

    it('rejects password change when new and confirm passwords do not match', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <AdminLayout pageTitle="Test Page">
            <div>Page Content</div>
          </AdminLayout>
        </MemoryRouter>
      );

      await user.click(screen.getByRole('button', { name: /change admin password/i }));

      await user.type(screen.getByLabelText(/current password/i), 'oldAdminPwd123');
      await user.type(screen.getByLabelText(/new password \(min 6 characters\)/i), 'newPassword123');
      await user.type(screen.getByLabelText(/confirm new password/i), 'differentPassword');

      await user.click(screen.getByRole('button', { name: /update password/i }));

      expect(screen.getByText(/new password and confirm password do not match/i)).toBeInTheDocument();
      expect(api.post).not.toHaveBeenCalled();
    });
  });
});
