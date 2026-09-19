import { test, expect } from '@playwright/test';

test.describe('Groups & Collaboration E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate user session
    await page.addInitScript(() => {
      localStorage.setItem('token', 'mock-traveler-token');
      localStorage.setItem(
        'user',
        JSON.stringify({ id: 1, username: 'traveler_sam', roles: ['ROLE_USER'] })
      );
    });

    // Mock trips for group creation selection
    await page.route('**/api/trips', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 10, title: 'Summer Trek 2026' }]),
      });
    });

    // Mock invitations
    await page.route('**/api/groups/invitations', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });
  });

  test('displays empty group state and creates a new collaboration group', async ({ page }) => {
    let groups = [];

    await page.route('**/api/groups', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(groups),
        });
      } else if (route.request().method() === 'POST') {
        const payload = JSON.parse(route.request().postData() || '{}');
        const newGroup = {
          id: 55,
          name: payload.name,
          description: payload.description,
          tripId: payload.tripId,
          memberCount: 1,
        };
        groups.push(newGroup);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newGroup),
        });
      }
    });

    await page.goto('/groups');
    await expect(page.locator('h1')).toContainText('Group Collaboration');
    await expect(page.locator('text=No groups yet!')).toBeVisible();

    // Open creation modal
    await page.locator('button:has-text("+ Create Group")').click();
    await expect(page.locator('h3:has-text("Create Travel Group")')).toBeVisible();

    // Fill form
    await page.locator('input[placeholder="e.g. Goa Gang"]').fill('Everest Basecamp Pioneers');
    await page.locator('input[placeholder="Group description"]').fill('Planning logistics and fitness prep');
    await page.locator('.glass-card').filter({ hasText: 'Create Travel Group' }).locator('button:has-text("Create Group")').click();

    // Verify group renders in list
    await expect(page.locator('text=Everest Basecamp Pioneers')).toBeVisible();
    await expect(page.locator('text=Planning logistics and fitness prep')).toBeVisible();
  });

  test('renders group details page with members list', async ({ page }) => {
    await page.route('**/api/groups/55', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 55,
          name: 'Everest Basecamp Pioneers',
          description: 'Planning logistics and fitness prep',
          canInviteMembers: true,
          ownerId: 1,
        }),
      });
    });

    await page.route('**/api/groups/55/members', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, userId: 1, name: 'traveler_sam', email: 'sam@tripnest.com', role: 'OWNER' },
          { id: 2, userId: 2, name: 'hiker_alex', email: 'alex@tripnest.com', role: 'MEMBER' },
        ]),
      });
    });

    await page.route('**/api/groups/55/pending-invitations', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/groups/55');
    await expect(page.locator('h1, h2').filter({ hasText: 'Everest Basecamp Pioneers' })).toBeVisible();
    await expect(page.locator('text=traveler_sam')).toBeVisible();
    await expect(page.locator('text=hiker_alex')).toBeVisible();
  });
});
