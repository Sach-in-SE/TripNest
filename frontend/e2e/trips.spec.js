import { test, expect } from '@playwright/test';

test.describe('Trips Management E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate user session
    await page.addInitScript(() => {
      localStorage.setItem('token', 'mock-traveler-token');
      localStorage.setItem(
        'user',
        JSON.stringify({ id: 1, username: 'traveler_sam', roles: ['ROLE_USER'] })
      );
    });
  });

  test('renders trips list with trip cards and metadata', async ({ page }) => {
    await page.route('**/api/trips', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 10,
            title: 'Himalayan Expedition',
            destination: 'Manali, Himachal Pradesh',
            description: 'High altitude trekking experience',
            startDate: '2026-10-01',
            endDate: '2026-10-10',
            numberOfTravelers: 4,
            budget: 45000,
            status: 'PLANNING',
            permission: 'OWNER',
          },
        ]),
      });
    });

    await page.goto('/trips');
    await expect(page.locator('h1')).toContainText('My Trips');
    await expect(page.locator('text=Himalayan Expedition')).toBeVisible();
    await expect(page.locator('text=Manali, Himachal Pradesh')).toBeVisible();
    await expect(page.locator('text=₹45,000')).toBeVisible();
    await expect(page.locator('text=PLANNING')).toBeVisible();
  });

  test('displays empty state when user has no trips and links to creation form', async ({ page }) => {
    await page.route('**/api/trips', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/trips');
    await expect(page.locator('text=No trips yet!')).toBeVisible();
    await expect(page.locator('button:has-text("Plan a Trip")')).toBeVisible();

    await page.locator('button:has-text("Plan a Trip")').click();
    await page.waitForURL('**/trips/new');
    expect(page.url()).toContain('/trips/new');
  });

  test('creates a new trip successfully and displays confirmation', async ({ page }) => {
    let createdPayload = null;

    await page.route('**/api/trips', async (route) => {
      if (route.request().method() === 'POST') {
        createdPayload = JSON.parse(route.request().postData() || '{}');
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 99,
            ...createdPayload,
            status: 'PLANNING',
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      }
    });

    await page.goto('/trips/new');
    await expect(page.locator('h2:has-text("Plan New Trip")')).toBeVisible();

    // Fill form fields
    await page.locator('input[placeholder="e.g. Goa Adventure"]').fill('Goa Sunset Retreat');
    await page.locator('input[placeholder="Enter destination"]').fill('Goa, India');
    await page.locator('input[placeholder="e.g. 25000"]').fill('35000');
    await page.locator('textarea[placeholder*="description"]').fill('Beach exploration and water sports');

    // Submit form
    await page.locator('button:has-text("Create Trip")').click();

    // Verify confirmation and submission payload
    await expect(page.locator('text=Trip Created Successfully!')).toBeVisible();
    expect(createdPayload.title).toBe('Goa Sunset Retreat');
    expect(createdPayload.destination).toBe('Goa, India');
  });

  test('edits an existing trip and submits updated details', async ({ page }) => {
    let updatePayload = null;

    await page.route('**/api/trips/10', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 10,
            title: 'Himalayan Expedition',
            destination: 'Manali',
            description: 'Trekking trip',
            startDate: '2026-10-01',
            endDate: '2026-10-10',
            numberOfTravelers: 2,
            budget: 40000,
            status: 'PLANNING',
          }),
        });
      } else if (route.request().method() === 'PUT') {
        updatePayload = JSON.parse(route.request().postData() || '{}');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 10,
            ...updatePayload,
          }),
        });
      }
    });

    await page.goto('/trips/10/edit');
    await expect(page.locator('h2:has-text("Edit Trip")')).toBeVisible();

    // Update title and budget
    const titleInput = page.locator('input[value="Himalayan Expedition"], input[placeholder="e.g. Goa Adventure"]');
    await titleInput.fill('Himalayan Grand Expedition');

    const budgetInput = page.locator('input[value="40000"], input[placeholder="e.g. 25000"]');
    await budgetInput.fill('50000');

    // Submit update
    await page.locator('button:has-text("Update Trip")').click();
    await expect(page.locator('text=Trip Updated Successfully!')).toBeVisible();
    expect(updatePayload.title).toBe('Himalayan Grand Expedition');
  });

  test('deletes a trip from the list after confirmation dialog', async ({ page }) => {
    let deletedId = null;
    let trips = [
      {
        id: 77,
        title: 'Kerala Backwaters',
        destination: 'Alleppey, Kerala',
        description: 'Houseboat retreat',
        status: 'CONFIRMED',
        permission: 'OWNER',
        numberOfTravelers: 2,
        budget: 30000,
      },
    ];

    await page.route('**/api/trips', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(trips),
      });
    });

    await page.route('**/api/trips/77', async (route) => {
      if (route.request().method() === 'DELETE') {
        deletedId = 77;
        trips = [];
        await route.fulfill({ status: 204 });
      }
    });

    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Delete this trip?');
      await dialog.accept();
    });

    await page.goto('/trips');
    await expect(page.locator('text=Kerala Backwaters')).toBeVisible();

    await page.locator('button:has-text("Delete")').click();

    // Verify trip is deleted and empty state appears
    await expect(page.locator('text=No trips yet!')).toBeVisible();
    expect(deletedId).toBe(77);
  });
});
