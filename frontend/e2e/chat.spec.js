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

    await page.addInitScript(() => {
      window.__POLL_INTERVAL__ = 300;
    });

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
    // Wait longer than poll interval (300ms) to ensure no new polls fire
    await page.waitForTimeout(700);
    expect(pollCount).toBe(currentCount);
  });

  test('cleans up polling timer on navigating away from discussion', async ({ page }) => {
    let pollCount = 0;

    await page.addInitScript(() => {
      window.__POLL_INTERVAL__ = 300;
    });

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

    // Wait longer than poll interval (300ms) and ensure pollCount hasn't increased
    await page.waitForTimeout(700);
    expect(pollCount).toBe(recordedPolls);
  });
});

function parseStompFrame(data) {
  const str = typeof data === 'string' ? data : data.toString();
  if (str === '\n' || str === '\r\n') return { command: 'PING' };
  const nullIndex = str.indexOf('\0');
  const frameStr = nullIndex !== -1 ? str.slice(0, nullIndex) : str;
  const headerEnd = frameStr.indexOf('\r\n\r\n') !== -1 ? frameStr.indexOf('\r\n\r\n') : frameStr.indexOf('\n\n');
  if (headerEnd === -1) {
    const lines = frameStr.trim().split(/\r?\n/);
    return { command: lines[0], headers: {}, body: '' };
  }
  const headerPart = frameStr.slice(0, headerEnd);
  const bodyPart = frameStr.slice(headerEnd + (frameStr.indexOf('\r\n\r\n') === headerEnd ? 4 : 2));
  const lines = headerPart.split(/\r?\n/);
  const command = lines[0].trim();
  const headers = {};
  for (let i = 1; i < lines.length; i++) {
    const idx = lines[i].indexOf(':');
    if (idx !== -1) headers[lines[i].slice(0, idx).trim().toLowerCase()] = lines[i].slice(idx + 1).trim();
  }
  return { command, headers, body: bodyPart };
}

function buildStompFrame(command, headers, body = '') {
  let frame = `${command}\n`;
  for (const [k, v] of Object.entries(headers)) {
    frame += `${k}:${v}\n`;
  }
  frame += '\n';
  frame += body;
  frame += '\0';
  return frame;
}

test.describe('Real-Time Multi-User Collaboration (WebSocket + STOMP)', () => {
  test('User A and User B collaborate in real time with duplicate prevention', async ({ browser }) => {
    let messageIdCounter = 100;
    const subscribers = [];
    const groupMessages = [
      {
        id: 1,
        senderId: 101,
        senderUsername: 'user_alice',
        content: 'Welcome to the trip discussion!',
        createdAt: '2026-09-17T10:00:00Z',
      },
    ];

    const broadcastToTopic = (topic, payload) => {
      for (const sub of subscribers) {
        if (sub.destination === topic) {
          const frame = buildStompFrame(
            'MESSAGE',
            {
              destination: topic,
              subscription: sub.subId,
              'message-id': `msg-${payload.id}-${Date.now()}`,
              'content-type': 'application/json',
            },
            JSON.stringify(payload)
          );
          sub.ws.send(frame);
        }
      }
    };

    const setupUserSession = async (user) => {
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.addInitScript((u) => {
        localStorage.setItem('token', `mock-token-${u.username}`);
        localStorage.setItem('user', JSON.stringify(u));
      }, user);

      await page.route('**/api/groups/100', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 100,
            name: 'Alpine Expedition',
            description: 'Swiss Alps collaborative planning',
          }),
        });
      });

      await page.route('**/api/groups/100/messages', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(groupMessages),
          });
        } else if (route.request().method() === 'POST') {
          const payload = JSON.parse(route.request().postData() || '{}');
          const newMsg = {
            id: ++messageIdCounter,
            groupId: 100,
            senderId: user.id,
            senderUsername: user.username,
            content: payload.content,
            createdAt: new Date().toISOString(),
          };
          groupMessages.push(newMsg);
          broadcastToTopic('/topic/groups/100', newMsg);
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify(newMsg),
          });
        }
      });

      await page.routeWebSocket(/.*/, (ws) => {
        ws.onMessage((data) => {
          const frame = parseStompFrame(data);
          if (frame.command === 'CONNECT') {
            ws.send(buildStompFrame('CONNECTED', { version: '1.2', 'heart-beat': '0,0' }));
          } else if (frame.command === 'SUBSCRIBE') {
            subscribers.push({
              ws,
              subId: frame.headers.id || 'sub-0',
              destination: frame.headers.destination,
              user,
            });
          } else if (frame.command === 'SEND') {
            try {
              const body = JSON.parse(frame.body || '{}');
              const newMsg = {
                id: ++messageIdCounter,
                groupId: 100,
                senderId: user.id,
                senderUsername: user.username,
                content: body.content,
                createdAt: new Date().toISOString(),
              };
              groupMessages.push(newMsg);
              const targetTopic = frame.headers.destination
                ? frame.headers.destination.replace('/app', '/topic').replace('/send', '')
                : '/topic/groups/100';
              broadcastToTopic(targetTopic, newMsg);
            } catch (err) {
              console.error('Error handling SEND frame:', err);
            }
          }
        });
      });

      return { context, page };
    };

    const userAlice = { id: 101, username: 'user_alice', roles: ['ROLE_USER'] };
    const userBob = { id: 102, username: 'user_bob', roles: ['ROLE_USER'] };

    const { context: contextA, page: pageA } = await setupUserSession(userAlice);
    const { context: contextB, page: pageB } = await setupUserSession(userBob);

    try {
      // 1. User A and User B open the same Group Discussion
      await pageA.goto('/groups/100/discussion');
      await pageB.goto('/groups/100/discussion');

      await expect(pageA.locator('h1, h2').filter({ hasText: 'Alpine Expedition' })).toBeVisible();
      await expect(pageB.locator('h1, h2').filter({ hasText: 'Alpine Expedition' })).toBeVisible();

      // Initial message is displayed on both screens
      await expect(pageA.locator('text=Welcome to the trip discussion!')).toBeVisible();
      await expect(pageB.locator('text=Welcome to the trip discussion!')).toBeVisible();

      // 2. User A posts a message: "Hey Bob, I just updated our trail map!"
      const inputA = pageA.locator('input[placeholder*="message"], textarea[placeholder*="message"]');
      await inputA.fill('Hey Bob, I just updated our trail map!');
      await pageA.locator('button[type="submit"]:has-text("Send"), button:has-text("Send")').click();

      // 3. User B receives and renders the message in real-time without refreshing
      await expect(pageB.locator('text=Hey Bob, I just updated our trail map!')).toBeVisible();
      // 4. Verify sender identity on the received message
      const receivedMsgB = pageB.locator('text=Hey Bob, I just updated our trail map!').locator('..');
      await expect(pageB.locator('text=user_alice').first()).toBeVisible();

      // Also visible on User A's screen
      await expect(pageA.locator('text=Hey Bob, I just updated our trail map!')).toBeVisible();

      // 5. Test duplicate message prevention:
      // Simulate duplicate broadcast arriving over the wire for the same message ID
      const lastMsg = groupMessages[groupMessages.length - 1];
      broadcastToTopic('/topic/groups/100', lastMsg);
      await pageB.waitForTimeout(500);

      // Verify message renders exactly once on both screens
      await expect(pageB.locator('text=Hey Bob, I just updated our trail map!')).toHaveCount(1);
      await expect(pageA.locator('text=Hey Bob, I just updated our trail map!')).toHaveCount(1);

      // 6. User B replies in real time: "Looks awesome Alice!"
      const inputB = pageB.locator('input[placeholder*="message"], textarea[placeholder*="message"]');
      await inputB.fill('Looks awesome Alice!');
      await pageB.locator('button[type="submit"]:has-text("Send"), button:has-text("Send")').click();

      // User A receives User B's reply in real-time
      await expect(pageA.locator('text=Looks awesome Alice!')).toBeVisible();
      await expect(pageA.locator('text=user_bob')).toBeVisible();
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });
});
