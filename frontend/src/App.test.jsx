import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PrivateRoute, AdminPrivateRoute } from './App';

describe('RBAC Route Protection & Guards', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('PrivateRoute', () => {
    it('redirects unauthenticated user to /login', () => {
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <div>Secret Dashboard Content</div>
                </PrivateRoute>
              }
            />
            <Route path="/login" element={<div>Login Page Form</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.queryByText('Secret Dashboard Content')).not.toBeInTheDocument();
      expect(screen.getByText('Login Page Form')).toBeInTheDocument();
    });

    it('renders protected content when user has active session token', () => {
      localStorage.setItem('token', 'valid-traveler-jwt');

      render(
        <MemoryRouter initialEntries={['/trips']}>
          <Routes>
            <Route
              path="/trips"
              element={
                <PrivateRoute>
                  <div>Traveler Trips Page</div>
                </PrivateRoute>
              }
            />
            <Route path="/login" element={<div>Login Page Form</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Traveler Trips Page')).toBeInTheDocument();
      expect(screen.queryByText('Login Page Form')).not.toBeInTheDocument();
    });
  });

  describe('AdminPrivateRoute', () => {
    it('redirects unauthenticated user to /admin/login', () => {
      render(
        <MemoryRouter initialEntries={['/admin/dashboard']}>
          <Routes>
            <Route
              path="/admin/dashboard"
              element={
                <AdminPrivateRoute>
                  <div>Admin Super Dashboard</div>
                </AdminPrivateRoute>
              }
            />
            <Route path="/admin/login" element={<div>Admin Login Form</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.queryByText('Admin Super Dashboard')).not.toBeInTheDocument();
      expect(screen.getByText('Admin Login Form')).toBeInTheDocument();
    });

    it('redirects authenticated non-admin traveler (ROLE_USER) to /admin/login', () => {
      localStorage.setItem('token', 'traveler-token');
      localStorage.setItem(
        'user',
        JSON.stringify({ id: 1, username: 'traveler_sam', roles: ['ROLE_USER'] })
      );

      render(
        <MemoryRouter initialEntries={['/admin/users']}>
          <Routes>
            <Route
              path="/admin/users"
              element={
                <AdminPrivateRoute>
                  <div>Admin User Management</div>
                </AdminPrivateRoute>
              }
            />
            <Route path="/admin/login" element={<div>Admin Login Form</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.queryByText('Admin User Management')).not.toBeInTheDocument();
      expect(screen.getByText('Admin Login Form')).toBeInTheDocument();
    });

    it('renders admin content when user has ROLE_ADMIN', () => {
      localStorage.setItem('token', 'admin-token');
      localStorage.setItem(
        'user',
        JSON.stringify({ id: 99, username: 'admin_boss', roles: ['ROLE_ADMIN'] })
      );

      render(
        <MemoryRouter initialEntries={['/admin/reports']}>
          <Routes>
            <Route
              path="/admin/reports"
              element={
                <AdminPrivateRoute>
                  <div>Admin Financial Reports</div>
                </AdminPrivateRoute>
              }
            />
            <Route path="/admin/login" element={<div>Admin Login Form</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Admin Financial Reports')).toBeInTheDocument();
      expect(screen.queryByText('Admin Login Form')).not.toBeInTheDocument();
    });
  });
});
