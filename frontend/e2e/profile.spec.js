import { test, expect } from '@playwright/test';

test.describe('Profile & Role Switching E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate user session
    await page.addInitScript(() => {
      localStorage.setItem('token', 'mock-traveler-token');
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: 1,
          username: 'traveler_sam',
          email: 'sam@tripnest.com',
          roles: ['ROLE_USER'],
        })
      );
    });
  });

  test('displays user profile information and switches role to Group Admin', async ({ page }) => {
    let currentRoles = ['ROLE_USER'];

    await page.route('**/api/user/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          username: 'traveler_sam',
          email: 'sam@tripnest.com',
          firstName: 'Sam',
          lastName: 'Walker',
          roles: currentRoles,
          enabled: true,
          country: 'India',
        }),
      });
    });

    await page.route('**/api/user/role', async (route) => {
      const payload = JSON.parse(route.request().postData() || '{}');
      expect(payload.role).toBe('ROLE_GROUP_ADMIN');
      currentRoles = ['ROLE_GROUP_ADMIN'];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'new-role-token',
          id: 1,
          username: 'traveler_sam',
          email: 'sam@tripnest.com',
          roles: ['ROLE_GROUP_ADMIN'],
        }),
      });
    });

    await page.goto('/profile');

    // Verify initial profile data
    await expect(page.locator('text=Sam Walker')).toBeVisible();
    await expect(page.locator('text=@traveler_sam')).toBeVisible();
    await expect(page.locator('button:has-text("Switch to Group Admin")')).toBeVisible();

    // Click switch role button
    await page.locator('button:has-text("Switch to Group Admin")').click();

    // Verify success banner appears
    await expect(
      page.locator('text=Successfully switched role to Group Admin!')
    ).toBeVisible();

    // Verify updated state shows "Switch to Traveler" option now
    await expect(page.locator('button:has-text("Switch to Traveler")')).toBeVisible();
  });
});
