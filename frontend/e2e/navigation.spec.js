import { test, expect } from '@playwright/test';

test.describe('Core Navigation, Lazy Loading, & Error Handling', () => {
  test('navigates all critical public pages successfully', async ({ page }) => {
    // 1. Landing Page
    await page.goto('/');
    await expect(page.locator('#root')).toBeVisible();

    // 2. About Page
    await page.goto('/about');
    await expect(page.locator('h1, h2').first()).toBeVisible();

    // 3. Privacy Policy Page
    await page.goto('/privacy');
    await expect(page.locator('h1, h2').first()).toBeVisible();

    // 4. Terms of Service Page
    await page.goto('/terms');
    await expect(page.locator('h1, h2').first()).toBeVisible();

    // 5. Contact Page
    await page.goto('/contact');
    await expect(page.locator('h1, h2').first()).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();
  });

  test('renders custom 404 page for unmatched routes', async ({ page }) => {
    await page.goto('/unknown-page-route-404-test');
    // Verify 404 content
    await expect(page.locator('h1:has-text("Page Not Found")')).toBeVisible();
  });

  test('ErrorBoundary renders fallback UI when a component crashes', async ({ page }) => {
    // Inject a runtime error flag into the page context
    await page.addInitScript(() => {
      window.__triggerTestCrash = true;
    });

    await page.goto('/');
    // Verify ErrorBoundary alert card and recovery options
    await expect(page.locator('[role="alert"]')).toBeVisible();
    await expect(page.locator('h2')).toContainText('Something went wrong');
    await expect(page.locator('button:has-text("Reload Application")')).toBeVisible();
    await expect(page.locator('button:has-text("Return to Home")')).toBeVisible();
  });
});
