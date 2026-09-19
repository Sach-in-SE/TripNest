import { test, expect } from '@playwright/test';

test.describe('Destinations Catalog & Progressive Detail Hydration E2E', () => {
  const mockDestinations = [
    {
      id: 201,
      name: 'Manali Heights',
      state: 'Himachal Pradesh',
      country: 'India',
      category: 'Mountains',
      imageUrl: 'https://images.unsplash.com/photo-test-manali.jpg',
      rating: 4.8,
      estimatedBudget: 22000,
      bestSeason: 'October to June',
      description: 'Scenic hill station nestled in the Himalayas.',
    },
    {
      id: 202,
      name: 'Goa Coastal Haven',
      state: 'Goa',
      country: 'India',
      category: 'Beach',
      imageUrl: 'https://images.unsplash.com/photo-test-goa.jpg',
      rating: 4.6,
      estimatedBudget: 18000,
      bestSeason: 'November to February',
      description: 'Pristine beaches, water sports, and vibrant nightlife.',
    },
  ];

  test('displays destinations, searches by query, and filters by category', async ({ page }) => {
    await page.route('**/api/destinations', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockDestinations),
      });
    });

    await page.route('**/api/destinations/search?query=Manali', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockDestinations[0]]),
      });
    });

    await page.route('**/api/destinations/filter?category=Mountains', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockDestinations[0]]),
      });
    });

    await page.goto('/destinations');
    await expect(page.locator('h1')).toContainText('Destinations');

    // Both destinations visible initially
    await expect(page.locator('text=Manali Heights')).toBeVisible();
    await expect(page.locator('text=Goa Coastal Haven')).toBeVisible();

    // 1. Search filter
    const searchInput = page.locator('input[placeholder*="Search by name"]');
    await searchInput.fill('Manali');
    await page.locator('button:has-text("Search")').click();

    await expect(page.locator('text=Manali Heights')).toBeVisible();
    await expect(page.locator('text=Goa Coastal Haven')).not.toBeVisible();

    // Clear search
    await searchInput.fill('');
    await page.locator('button:has-text("Search")').click();
    await expect(page.locator('text=Goa Coastal Haven')).toBeVisible();

    // 2. Category filter
    await page.locator('button:has-text("Mountains")').click();
    await expect(page.locator('text=Manali Heights')).toBeVisible();
    await expect(page.locator('text=Goa Coastal Haven')).not.toBeVisible();
  });

  test('explore button navigates with router state and progressively hydrates weather & travel guide', async ({ page }) => {
    await page.route('**/api/destinations', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockDestinations[0]]),
      });
    });

    // Mock single destination detail
    await page.route('**/api/destinations/201', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockDestinations[0]),
      });
    });

    // Mock progressive weather endpoint
    await page.route('**/api/destinations/201/weather', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          available: true,
          temperature: 15.4,
          weatherCondition: 'Clear Sky',
          humidity: 42,
          windSpeed: 8.5,
        }),
      });
    });

    // Mock progressive travel guide endpoint
    await page.route('**/api/destinations/201/guide', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          available: true,
          attractions: [
            { title: 'Solang Valley Adventure Arena', category: 'Attraction' },
            { title: 'Hadimba Devi Temple', category: 'Culture' },
          ],
        }),
      });
    });

    await page.goto('/destinations');
    await expect(page.locator('text=Manali Heights')).toBeVisible();

    // Click "Explore" on the destination card
    await page.locator('button:has-text("Explore")').first().click();
    await page.waitForURL('**/destinations/201');

    // 1. Immediate render verification: destination name is immediately visible
    await expect(page.locator('h1')).toContainText('Manali Heights');
    await expect(page.locator('text=Himachal Pradesh, India')).toBeVisible();

    // 2. Progressive enrichment verification
    await expect(page.locator('text=15.4°C')).toBeVisible();
    await expect(page.locator('text=Clear Sky')).toBeVisible();
    await expect(page.locator('text=Solang Valley Adventure Arena')).toBeVisible();
    await expect(page.locator('text=Hadimba Devi Temple')).toBeVisible();
  });
});
