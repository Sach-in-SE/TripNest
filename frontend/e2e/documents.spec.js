import { test, expect } from '@playwright/test';

test.describe('Documents Management & Security (A1)', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate user
    await page.addInitScript(() => {
      localStorage.setItem('token', 'mock-bearer-token-xyz');
      localStorage.setItem('user', JSON.stringify({ id: 1, username: 'traveler_sam', roles: ['ROLE_USER'] }));
    });

    // Mock trips
    await page.route('**/api/trips', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 101, title: 'Summer Trek' }]),
      });
    });
  });

  test('renders documents page and displays existing trip documents', async ({ page }) => {
    await page.route('**/api/documents/trip/101', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 501,
            fileName: 'Flight_Ticket.pdf',
            documentType: 'TICKET',
            fileUrl: '/api/documents/download/uuid-ticket.pdf',
            fileSize: 1048576,
          },
        ]),
      });
    });

    await page.goto('/documents');
    await expect(page.locator('h1')).toContainText('Travel Documents');
    await expect(page.locator('text=Flight_Ticket.pdf')).toBeVisible();
  });

  test('upload form validates file extension client-side', async ({ page }) => {
    await page.route('**/api/documents/trip/101', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.goto('/documents');
    await page.locator('button:has-text("+ Upload Document")').click();

    // Attach invalid file extension (.exe)
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'malicious.exe',
      mimeType: 'application/x-msdownload',
      buffer: Buffer.from('fake-exe'),
    });

    await page.locator('button:has-text("Upload File")').click();

    // Verify client-side rejection banner
    await expect(page.locator('text=Unsupported file extension')).toBeVisible();
  });

  test('authenticated download request passes Authorization header and handles 403 error', async ({ page }) => {
    let capturedAuthHeader = null;

    await page.route('**/api/documents/trip/101', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 502,
            fileName: 'Hotel_Booking.pdf',
            documentType: 'HOTEL_BOOKING',
            fileUrl: '/api/documents/download/uuid-hotel.pdf',
          },
        ]),
      });
    });

    // Mock 403 Forbidden with Blob-wrapped JSON error
    await page.route('**/api/documents/download/uuid-hotel.pdf', async (route) => {
      capturedAuthHeader = route.request().headers()['authorization'];
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Access denied: You do not own or share this document.' }),
      });
    });

    await page.goto('/documents');
    await expect(page.locator('text=Hotel_Booking.pdf')).toBeVisible();

    // Click Download button
    await page.locator('button:has-text("⬇️ Download")').click();

    // Verify Authorization Bearer was attached to the request
    expect(capturedAuthHeader).toBe('Bearer mock-bearer-token-xyz');

    // Verify UI error message extracted from the server response
    await expect(page.locator('text=Access denied: You do not own or share this document.')).toBeVisible();
  });
});
