import { test, expect } from '@playwright/test';

test.describe('Group Discussion Chat & Polling Hardening (A2)', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate user
    await page.addInitScript(() => {
      localStorage.setItem('token', 'mock-chat-token');
      localStorage.setItem('user', JSON.stringify({ id: 10, username: 'chat_user', roles: ['ROLE_USER'] }));
    });

    // Mock group details
    await page.route('**/api/groups/88', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 88,
          name: 'Mountain Trekkers',
          description: 'Himalayas 2026 expedition group',
        }),
      });
    });
  });

  test('renders discussion, displays messages, and sends a new message', async ({ page }) => {
    let messages = [
      {
        id: 1,
        senderId: 10,
        senderUsername: 'chat_user',
        content: 'Hey everyone, gears ready?',
        createdAt: '2026-08-20T12:00:00Z',
      },
    ];

    await page.route('**/api/groups/88/messages', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(messages),
        });
      } else if (route.request().method() === 'POST') {
        const payload = JSON.parse(route.request().postData() || '{}');
        const newMsg = {
          id: 2,
          senderId: 10,
          senderUsername: 'chat_user',
          content: payload.content,
          createdAt: new Date().toISOString(),
        };
        messages.push(newMsg);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newMsg),
        });
      }
    });

    await page.goto('/groups/88/discussion');

    // Verify group title and initial message
    await expect(page.locator('h1, h2').filter({ hasText: 'Mountain Trekkers' })).toBeVisible();
    await expect(page.locator('text=Hey everyone, gears ready?')).toBeVisible();

    // Type and send a new message
    const input = page.locator('input[placeholder*="message"], textarea[placeholder*="message"]');
    await input.fill('All packed and set!');
    await page.locator('button[type="submit"]:has-text("Send"), button:has-text("Send")').click();

    // Verify input cleared and message displayed
    await expect(input).toHaveValue('');
    await expect(page.locator('text=All packed and set!')).toBeVisible();
  });

  test('terminates polling immediately when 403 Forbidden is encountered', async ({ page }) => {
    let pollCount = 0;

    await page.route('**/api/groups/88/messages', async (route) => {
      pollCount++;
      // Return 403 Forbidden (simulating member removed from group)
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Access denied: You are not a member of this group.' }),
      });
    });

    await page.goto('/groups/88/discussion');

    // Verify error message is rendered informing user they lost access
    await expect(
      page.locator('text=You no longer have access to this discussion. You may have been removed from the group.')
    ).toBeVisible();

    const currentCount = pollCount;
    // Wait longer than 4.5 seconds (normal polling is every 4s) to ensure no new polls fire
    await page.waitForTimeout(4500);
    expect(pollCount).toBe(currentCount);
  });

  test('cleans up polling timer on navigating away from discussion', async ({ page }) => {
    let pollCount = 0;

    await page.route('**/api/groups/88/messages', async (route) => {
      pollCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.route('**/api/trips', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.goto('/groups/88/discussion');
    await expect(page.locator('h1, h2').filter({ hasText: 'Mountain Trekkers' })).toBeVisible();
    expect(pollCount).toBeGreaterThanOrEqual(1);

    // Client-side navigate to /trips by clicking sidebar link
    await page.locator('a[href="/trips"]').first().click();
    await page.waitForURL('**/trips');
    const recordedPolls = pollCount;

    // Wait 4.5 seconds and ensure pollCount hasn't increased
    await page.waitForTimeout(4500);
    expect(pollCount).toBe(recordedPolls);
  });
});
