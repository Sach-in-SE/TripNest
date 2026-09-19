import { test, expect } from '@playwright/test';

test.describe('Admin Control Center & Management E2E', () => {
  test('admin signs in with valid credentials and accesses admin dashboard', async ({ page }) => {
    await page.route('**/api/admin/auth/login', async (route) => {
      const payload = JSON.parse(route.request().postData() || '{}');
      expect(payload.email || payload.usernameOrEmail).toBe('admin@tripnest.com');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-admin-token-777',
          id: 99,
          username: 'super_admin',
          email: 'admin@tripnest.com',
          roles: ['ROLE_ADMIN'],
        }),
      });
    });

    await page.route('**/api/admin/reports', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalUsers: 150,
          totalTrips: 45,
          activeGroups: 12,
          destinationsCount: 88,
        }),
      });
    });

    await page.goto('/admin/login');
    await expect(page.locator('h1')).toContainText('Admin Sign In');

    await page.locator('#admin-email').fill('admin@tripnest.com');
    await page.locator('#admin-password').fill('AdminSecret2026!');
    await page.locator('button[type="submit"]').click();

    await page.waitForURL('**/admin/dashboard');
    expect(page.url()).toContain('/admin/dashboard');

    const storedToken = await page.evaluate(() => localStorage.getItem('token'));
    expect(storedToken).toBe('mock-admin-token-777');
  });

  test('admin manages users and toggles active/disabled status', async ({ page }) => {
    // Authenticate as Admin
    await page.addInitScript(() => {
      localStorage.setItem('token', 'mock-admin-token-777');
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: 99,
          username: 'super_admin',
          email: 'admin@tripnest.com',
          roles: ['ROLE_ADMIN'],
        })
      );
    });

    let users = [
      {
        id: 44,
        username: 'suspicious_actor',
        email: 'spammer@example.com',
        roles: ['ROLE_USER'],
        enabled: true,
      },
    ];

    await page.route('**/api/admin/users*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(users),
      });
    });

    let toggledStatus = null;
    await page.route('**/api/admin/users/44/status', async (route) => {
      const payload = JSON.parse(route.request().postData() || '{}');
      toggledStatus = payload.enabled;
      users[0].enabled = payload.enabled;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(users[0]),
      });
    });

    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Are you sure you want to disable user');
      await dialog.accept();
    });

    await page.goto('/admin/users');
    await expect(page.locator('text=suspicious_actor')).toBeVisible();

    // Click toggle status (e.g. Disable button)
    const disableBtn = page.locator('button:has-text("Disable"), button[title*="Disable"], button:has-text("Deactivate")').first();
    await disableBtn.click();

    // Verify toast notification appears
    await expect(
      page.locator('text=successfully disabled')
    ).toBeVisible();
    expect(toggledStatus).toBe(false);
  });

  test('admin views destination management table', async ({ page }) => {
    // Authenticate as Admin
    await page.addInitScript(() => {
      localStorage.setItem('token', 'mock-admin-token-777');
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: 99,
          username: 'super_admin',
          email: 'admin@tripnest.com',
          roles: ['ROLE_ADMIN'],
        })
      );
    });

    await page.route('**/api/destinations', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 110,
            name: 'Rann of Kutch',
            state: 'Gujarat',
            country: 'India',
            category: 'Historical',
            estimatedBudget: 20000,
            recommendedDays: 3,
            rating: 4.7,
          },
        ]),
      });
    });

    await page.goto('/admin/destinations');
    await expect(page.locator('text=Rann of Kutch')).toBeVisible();
    await expect(page.locator('text=Gujarat, India')).toBeVisible();
  });

  test('admin permanently deletes a traveler account after confirming modal', async ({ page }) => {
    // Authenticate as Admin
    await page.addInitScript(() => {
      localStorage.setItem('token', 'mock-admin-token-777');
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: 99,
          username: 'super_admin',
          email: 'admin@tripnest.com',
          roles: ['ROLE_ADMIN'],
        })
      );
    });

    let users = [
      {
        id: 99,
        username: 'super_admin',
        email: 'admin@tripnest.com',
        roles: ['ROLE_ADMIN'],
        enabled: true,
      },
      {
        id: 45,
        username: 'traveler_to_delete',
        email: 'delete_me@example.com',
        roles: ['ROLE_TRAVELER'],
        enabled: true,
      },
    ];

    await page.route('**/api/admin/users*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(users),
      });
    });

    let deletedUserId = null;
    await page.route('**/api/admin/users/45', async (route) => {
      if (route.request().method() === 'DELETE') {
        deletedUserId = 45;
        users = users.filter((u) => u.id !== 45);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'User deleted successfully' }),
        });
      }
    });

    await page.goto('/admin/users');
    await expect(page.locator('text=traveler_to_delete')).toBeVisible();

    // Verify self admin does NOT have a delete button
    await expect(page.locator('button[aria-label="Delete super_admin"]')).toHaveCount(0);

    // Click delete for traveler_to_delete
    const deleteBtn = page.locator('button[aria-label="Delete traveler_to_delete"]');
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();

    // Verify confirmation modal opens
    const modal = page.locator('[role="dialog"][aria-modal="true"]');
    await expect(modal).toBeVisible();
    await expect(modal.locator('text=Permanently Delete User')).toBeVisible();
    await expect(modal.locator('text=delete_me@example.com')).toBeVisible();

    // Confirm deletion
    const confirmBtn = modal.locator('button:has-text("Permanently Delete")');
    await confirmBtn.click();

    // Verify delete endpoint was invoked
    expect(deletedUserId).toBe(45);

    // Verify success toast appears
    await expect(page.locator('text=permanently deleted')).toBeVisible();
  });

  test('admin securely changes own password from topbar modal', async ({ page }) => {
    // Authenticate as Admin
    await page.addInitScript(() => {
      localStorage.setItem('token', 'mock-admin-token-777');
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: 99,
          username: 'super_admin',
          email: 'admin@tripnest.com',
          roles: ['ROLE_ADMIN'],
        })
      );
    });

    let passwordPayload = null;
    await page.route('**/api/user/change-password', async (route) => {
      passwordPayload = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Password changed successfully!' }),
      });
    });

    await page.route('**/api/admin/reports', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalUsers: 150,
          totalTrips: 45,
          activeGroups: 12,
          destinationsCount: 88,
        }),
      });
    });

    await page.goto('/admin/dashboard');

    // Click Change Password in topbar
    const changePwdBtn = page.locator('button[aria-label="Change Admin Password"]');
    await expect(changePwdBtn).toBeVisible();
    await changePwdBtn.click();

    // Verify change password modal opens
    const modal = page.locator('[role="dialog"][aria-modal="true"]');
    await expect(modal).toBeVisible();
    await expect(modal.locator('text=Change Your Password')).toBeVisible();

    // Fill form
    await page.locator('#current-admin-pwd').fill('CurrentAdminPass123!');
    await page.locator('#new-admin-pwd').fill('NewAdminPass2026!#');
    await page.locator('#confirm-admin-pwd').fill('NewAdminPass2026!#');

    // Submit form
    await modal.locator('button[type="submit"]').click();

    // Verify API called with right payload
    expect(passwordPayload).toEqual({
      currentPassword: 'CurrentAdminPass123!',
      newPassword: 'NewAdminPass2026!#',
      confirmPassword: 'NewAdminPass2026!#',
    });

    // Verify success feedback
    await expect(modal.locator('text=Password changed successfully!')).toBeVisible();
  });
});
