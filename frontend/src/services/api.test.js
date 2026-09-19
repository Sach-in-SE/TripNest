import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';

describe('api service and interceptors', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Request Interceptor', () => {
    it('injects Bearer Authorization header when token exists in localStorage', async () => {
      localStorage.setItem('token', 'sample-jwt-token-xyz');

      // Interceptor is registered on api.interceptors.request.handlers[0]
      const requestHandler = api.interceptors.request.handlers[0];
      expect(requestHandler).toBeDefined();

      const config = { headers: {} };
      const updatedConfig = await requestHandler.fulfilled(config);

      expect(updatedConfig.headers.Authorization).toBe('Bearer sample-jwt-token-xyz');
    });

    it('does not inject Authorization header when no token exists', async () => {
      const requestHandler = api.interceptors.request.handlers[0];
      const config = { headers: {} };
      const updatedConfig = await requestHandler.fulfilled(config);

      expect(updatedConfig.headers.Authorization).toBeUndefined();
    });

    it('propagates request errors through rejected handler', async () => {
      const requestHandler = api.interceptors.request.handlers[0];
      const testError = new Error('Network Setup Failed');

      await expect(requestHandler.rejected(testError)).rejects.toThrow('Network Setup Failed');
    });
  });

  describe('Response Interceptor & 401 Handling', () => {
    it('passes through successful responses unchanged', () => {
      const responseHandler = api.interceptors.response.handlers[0];
      const mockResponse = { data: { success: true }, status: 200 };

      expect(responseHandler.fulfilled(mockResponse)).toBe(mockResponse);
    });

    it('does not evict credentials or redirect for 401 on auth endpoints (e.g. invalid credentials)', async () => {
      localStorage.setItem('token', 'active-token');
      localStorage.setItem('user', JSON.stringify({ username: 'sam' }));

      const responseHandler = api.interceptors.response.handlers[0];
      const authError = {
        config: { url: '/auth/signin' },
        response: { status: 401, data: { message: 'Invalid credentials' } },
      };

      await expect(responseHandler.rejected(authError)).rejects.toBe(authError);

      // Token and user remain intact
      expect(localStorage.getItem('token')).toBe('active-token');
      expect(localStorage.getItem('user')).not.toBeNull();
    });

    it('evicts expired token and user on 401 for protected endpoints', async () => {
      localStorage.setItem('token', 'expired-token');
      localStorage.setItem('user', JSON.stringify({ username: 'sam' }));

      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

      const responseHandler = api.interceptors.response.handlers[0];
      const expiredSessionError = {
        config: { url: '/trips/10' },
        response: { status: 401, data: { message: 'JWT expired' } },
      };

      await expect(responseHandler.rejected(expiredSessionError)).rejects.toBe(expiredSessionError);

      // Verify token eviction and storage event dispatch
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(dispatchSpy).toHaveBeenCalled();
    });

    it('propagates non-401 error responses (e.g. 403, 500)', async () => {
      const responseHandler = api.interceptors.response.handlers[0];
      const serverError = {
        config: { url: '/trips' },
        response: { status: 500, data: { message: 'Internal Server Error' } },
      };

      await expect(responseHandler.rejected(serverError)).rejects.toBe(serverError);
    });
  });
});
