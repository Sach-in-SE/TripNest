import { test, expect } from '@playwright/test';

test.describe('Memories Multi-Image & Gallery (A3)', () => {
  test.beforeEach(async ({ page }) => {
    // Mock user authentication state
    await page.addInitScript(() => {
      localStorage.setItem('token', 'mock-auth-token');
      localStorage.setItem('user', JSON.stringify({ id: 1, username: 'traveler_sam', roles: ['ROLE_USER'] }));
    });

    // Mock trips & destinations for metadata
    await page.route('**/api/trips', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 10, title: 'Goa Beach Vacation' }]),
      });
    });

    await page.route('**/api/destinations', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 20, name: 'Goa', category: 'Beach' }]),
      });
    });
  });

  test('renders memories page and toggles between personal and public tabs', async ({ page }) => {
    await page.route('**/api/memories', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.route('**/api/memories/public', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/memories');
    await expect(page.locator('h1.tn-memories-title')).toContainText('Travel Memories');

    // Verify Tab switching
    const publicTab = page.locator('button[role="tab"]:has-text("Community Gallery")');
    await expect(publicTab).toBeVisible();
    await publicTab.click();
    await expect(publicTab).toHaveClass(/active/);
  });

  test('modal validates empty photo selection on memory creation', async ({ page }) => {
    await page.route('**/api/memories', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.goto('/memories');
    await page.locator('button.tn-memories-add-btn, button:has-text("Add Memory")').first().click();

    // Verify modal is open
    await expect(page.locator('.tn-memories-modal-title')).toContainText('Add Travel Memory');

    // Fill title only without selecting photos
    await page.locator('#mem-title').fill('My Trip Memory');

    // 1. Verify HTML5 validation marks the file input as invalid
    const fileInput = page.locator('input.tn-memories-file-input').first();
    const isInvalid = await fileInput.evaluate((el) => !el.checkValidity());
    expect(isInvalid).toBe(true);

    // 2. Bypass native HTML5 browser tooltip to test React handleSubmit error handling
    await page.locator('form.tn-memories-form').evaluate((form) => {
      form.noValidate = true;
    });
    await page.locator('.tn-memories-submit-btn').click();

    // Verify error banner is shown
    await expect(page.locator('.tn-memories-form-error')).toContainText('Please select at least one photo');
  });

  test('allows selecting 1 photo, shows Cover badge, and allows thumbnail removal', async ({ page }) => {
    await page.route('**/api/memories', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.goto('/memories');
    await page.locator('button.tn-memories-add-btn, button:has-text("Add Memory")').first().click();

    // Set 1 mock image file
    const fileInput = page.locator('input.tn-memories-file-input').first();
    await fileInput.setInputFiles({
      name: 'photo1.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-bytes-1'),
    });

    // Verify Cover badge is rendered
    await expect(page.locator('.tn-memories-thumb-cover-tag')).toContainText('Cover');
    await expect(page.locator('.tn-memories-thumb-card')).toHaveCount(1);

    // Remove photo
    await page.locator('.tn-memories-thumb-remove-btn').click();
    await expect(page.locator('.tn-memories-thumb-card')).toHaveCount(0);
  });

  test('rejects selecting more than 5 photos with explicit error', async ({ page }) => {
    await page.route('**/api/memories', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.goto('/memories');
    await page.locator('button.tn-memories-add-btn, button:has-text("Add Memory")').first().click();

    const fileInput = page.locator('input.tn-memories-file-input').first();
    // Try uploading 6 photos
    await fileInput.setInputFiles([
      { name: 'photo1.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('1') },
      { name: 'photo2.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('2') },
      { name: 'photo3.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('3') },
      { name: 'photo4.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('4') },
      { name: 'photo5.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('5') },
      { name: 'photo6.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('6') },
    ]);

    // Verify error rejection message
    await expect(page.locator('.tn-memories-form-error')).toContainText('You can select up to 5 photos');
    await expect(page.locator('.tn-memories-thumb-card')).toHaveCount(0);
  });

  test('multi-image lightbox opens, navigates with keyboard, and closes on Escape', async ({ page }) => {
    const mockMemories = [
      {
        id: 99,
        title: 'Alpine Expedition',
        caption: 'High in the peaks',
        locationName: 'Swiss Alps',
        visibility: 'PUBLIC',
        createdAt: '2026-08-15T10:00:00Z',
        images: [
          { id: 1, fileUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b', displayOrder: 0 },
          { id: 2, fileUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e', displayOrder: 1 },
        ],
      },
    ];

    await page.route('**/api/memories', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockMemories),
      });
    });

    await page.goto('/memories');
    await expect(page.locator('.tn-memory-card-title')).toContainText('Alpine Expedition');

    // Click photo box to open lightbox
    await page.locator('.tn-memory-img-box').first().click();

    // Verify lightbox is visible
    const lightbox = page.locator('.tn-memory-preview-container');
    await expect(lightbox).toBeVisible();
    await expect(page.locator('.tn-memory-preview-counter')).toContainText('1 / 2');

    // Keyboard navigation - ArrowRight
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.tn-memory-preview-counter')).toContainText('2 / 2');

    // Keyboard navigation - ArrowLeft
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('.tn-memory-preview-counter')).toContainText('1 / 2');

    // Close on Escape
    await page.keyboard.press('Escape');
    await expect(lightbox).not.toBeVisible();
  });
});
