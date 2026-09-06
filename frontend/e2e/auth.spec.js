import { test, expect } from '@playwright/test';

test.describe('Authentication & Session Management', () => {
  test('login page renders with required fields and links', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[name="usernameOrEmail"], input[type="text"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('invalid login credentials displays error message without redirect loop', async ({ page }) => {
    await page.route('**/api/auth/signin', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Invalid username or password' }),
      });
    });

    await page.goto('/login');
    await page.locator('input[name="usernameOrEmail"], input[type="text"]').first().fill('wronguser');
    await page.locator('input[type="password"]').fill('WrongPass123!');
    await page.locator('button[type="submit"]').click();

    // Verify error message is rendered
    await expect(page.locator('.login-error-alert, [role="alert"]')).toContainText('Invalid username or password');
    // Verify user remains on /login (no redirect loop)
    expect(page.url()).toContain('/login');
  });

  test('successful login sets tokens in localStorage and redirects to dashboard', async ({ page }) => {
    await page.route('**/api/auth/signin', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-jwt-token-12345',
          id: 1,
          username: 'traveler_sam',
          email: 'sam@example.com',
          roles: ['ROLE_USER'],
        }),
      });
    });

    await page.route('**/api/user/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          username: 'traveler_sam',
          email: 'sam@example.com',
          roles: ['ROLE_USER'],
        }),
      });
    });

    await page.route('**/api/trips', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });
    await page.route('**/api/notifications', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.goto('/login');
    await page.locator('input[name="usernameOrEmail"], input[type="text"]').first().fill('traveler_sam');
    await page.locator('input[type="password"]').fill('CorrectPass123!');
    await page.locator('button[type="submit"]').click();

    await page.waitForURL('**/dashboard');
    expect(page.url()).toContain('/dashboard');

    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBe('mock-jwt-token-12345');
  });

  test('unauthenticated user accessing private route is redirected to /login', async ({ page }) => {
    // Ensure no token exists
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.clear();
    });

    await page.goto('/dashboard');
    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');
  });

  test('unauthenticated user accessing admin route is redirected to /admin/login', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.clear();
    });

    await page.goto('/admin/dashboard');
    await page.waitForURL('**/admin/login');
    expect(page.url()).toContain('/admin/login');
  });

  test('OAuth2 redirect callback stores credentials and navigates to dashboard', async ({ page }) => {
    await page.route('**/api/user/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 42,
          username: 'google_traveler',
          email: 'traveler@gmail.com',
          roles: ['ROLE_USER'],
        }),
      });
    });

    await page.route('**/api/trips', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });
    await page.route('**/api/notifications', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.goto('/oauth2/redirect?token=mock-oauth2-jwt-token');
    await page.waitForURL('**/dashboard');
    expect(page.url()).toContain('/dashboard');

    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBe('mock-oauth2-jwt-token');
  });
});
