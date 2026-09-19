import { test, expect } from '@playwright/test';

test.describe('Itinerary & Activity Planning E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate user session
    await page.addInitScript(() => {
      localStorage.setItem('token', 'mock-traveler-token');
      localStorage.setItem(
        'user',
        JSON.stringify({ id: 1, username: 'traveler_sam', roles: ['ROLE_USER'] })
      );
    });

    // Mock trip details
    await page.route('**/api/trips/50', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 50,
          title: 'Jaipur Heritage Tour',
          destination: 'Jaipur, Rajasthan',
          startDate: '2026-11-01',
          endDate: '2026-11-05',
          budget: 25000,
          status: 'PLANNING',
          permission: 'OWNER',
        }),
      });
    });

    // Mock expenses endpoint
    await page.route('**/api/expenses/trip/50', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });
  });

  test('displays empty day plans state when no itinerary days exist', async ({ page }) => {
    await page.route('**/api/itineraries/trip/50', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/itineraries/50');
    await expect(page.locator('h1')).toContainText('Jaipur Heritage Tour');
    await expect(page.locator('text=No day plans yet')).toBeVisible();
    await expect(page.locator('button:has-text("+ Add Day")')).toBeVisible();
  });

  test('adds a new itinerary day and creates an activity under it', async ({ page }) => {
    let itineraries = [];
    let activities = [];

    await page.route('**/api/itineraries/trip/50', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(itineraries),
      });
    });

    await page.route(/\/api\/itineraries$/, async (route) => {
      if (route.request().method() === 'POST') {
        const payload = JSON.parse(route.request().postData() || '{}');
        const newDay = {
          id: 501,
          tripId: 50,
          date: payload.date || '2026-11-01',
          notes: payload.notes || 'Arrival and Fort visit',
          activities: [],
        };
        itineraries.push(newDay);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newDay),
        });
      } else {
        await route.fallback();
      }
    });

    await page.route('**/api/activities', async (route) => {
      if (route.request().method() === 'POST') {
        const payload = JSON.parse(route.request().postData() || '{}');
        const newAct = {
          id: 801,
          itineraryId: 501,
          title: payload.title,
          location: payload.location,
          type: payload.type || 'SIGHTSEEING',
          cost: payload.cost,
        };
        activities.push(newAct);
        // Attach activity to itinerary
        if (itineraries[0]) {
          itineraries[0].activities = activities;
        }
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newAct),
        });
      }
    });

    await page.goto('/itineraries/50');
    await expect(page.locator('h1')).toContainText('Jaipur Heritage Tour');

    // 1. Add Itinerary Day
    await page.locator('button:has-text("+ Add Day")').click();
    await page.locator('input[type="date"]').first().fill('2026-11-01');
    await page.locator('input[placeholder="Day plan notes..."]').fill('Amber Fort & City Palace');
    await page.locator('button:has-text("Add Day")').last().click();

    // Verify day created
    await expect(page.locator('text=Amber Fort & City Palace')).toBeVisible();

    // 2. Add Activity
    await page.locator('button:has-text("+ Activity")').first().click();
    await expect(page.locator('h3:has-text("Add Activity")')).toBeVisible();

    await page.locator('input[placeholder="Activity title"]').fill('Amber Fort Exploration');
    await page.locator('input[placeholder="Location"]').fill('Amer, Jaipur');
    await page.locator('input[placeholder="Optional"], input[type="number"]').fill('500');
    await page.locator('button:has-text("Add Activity")').last().click();

    // Verify activity renders in timeline
    await expect(page.locator('text=Amber Fort Exploration')).toBeVisible();
    await expect(page.locator('text=Amer, Jaipur')).toBeVisible();
  });

  test('opens share trip modal and displays sharing controls', async ({ page }) => {
    await page.route('**/api/itineraries/trip/50', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.route('**/api/trip-shares/trip/50', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/itineraries/50');

    // Open share modal
    await page.locator('button:has-text("Share Trip")').click();
    await expect(page.locator('h3:has-text("Share Trip")')).toBeVisible();
  });
});
