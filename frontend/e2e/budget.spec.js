import { test, expect } from '@playwright/test';

test.describe('Budget & Expense Tracking E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate user session
    await page.addInitScript(() => {
      localStorage.setItem('token', 'mock-traveler-token');
      localStorage.setItem(
        'user',
        JSON.stringify({ id: 1, username: 'traveler_sam', roles: ['ROLE_USER'] })
      );
    });

    // Mock trips list
    await page.route('**/api/trips', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 15,
            title: 'Kerala Monsoon Retreat',
            destination: 'Munnar, Kerala',
            startDate: '2026-07-01',
            endDate: '2026-07-07',
            budget: 40000,
          },
        ]),
      });
    });

    // Mock trip detail
    await page.route('**/api/trips/15', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 15,
          title: 'Kerala Monsoon Retreat',
          startDate: '2026-07-01',
          endDate: '2026-07-07',
          budget: 40000,
        }),
      });
    });

    // Mock budget
    await page.route('**/api/budget/trip/15', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          tripId: 15,
          totalAmount: 40000,
          currency: 'INR',
        }),
      });
    });
  });

  test('displays budget summary and empty expense state', async ({ page }) => {
    await page.route('**/api/expenses/trip/15', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/budget');
    await expect(page.locator('h1')).toContainText('Budget & Expenses');
    await expect(page.locator('text=Kerala Monsoon Retreat').first()).toBeVisible();

    // Summary cards
    await expect(page.locator('text=Total Budget')).toBeVisible();
    await expect(page.locator('text=₹40,000').first()).toBeVisible();
    await expect(page.locator('text=No expenses yet')).toBeVisible();
  });

  test('adds an expense and displays updated category breakdown', async ({ page }) => {
    let expenses = [];

    await page.route('**/api/expenses/trip/15', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(expenses),
      });
    });

    await page.route('**/api/expenses', async (route) => {
      if (route.request().method() === 'POST') {
        const payload = JSON.parse(route.request().postData() || '{}');
        const newExpense = {
          id: 301,
          tripId: 15,
          title: payload.title,
          amount: parseFloat(payload.amount),
          category: payload.category || 'FOOD',
          description: payload.description,
          date: payload.date,
        };
        expenses.push(newExpense);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newExpense),
        });
      }
    });

    await page.goto('/budget');

    // Open Add Expense modal
    await page.locator('button:has-text("+ Add Expense")').click();
    await expect(page.locator('h3:has-text("Add Expense")')).toBeVisible();

    // Fill form
    await page.locator('input[placeholder="Expense title"]').fill('Authentic Kerala Sadhya');
    await page.locator('input[placeholder="0"]').fill('1200');
    await page.locator('select.aurora-input').last().selectOption('FOOD');
    await page.locator('input[type="date"]').fill('2026-07-02');
    await page.locator('input[placeholder="Description"]').fill('Traditional feast in banana leaf');

    // Submit
    await page.locator('button:has-text("Add Expense")').last().click();

    // Verify added expense is rendered
    await expect(page.locator('text=Authentic Kerala Sadhya')).toBeVisible();
    await expect(page.locator('text=₹1,200').first()).toBeVisible();
  });

  test('deletes an expense after confirmation and updates list', async ({ page }) => {
    let expenses = [
      {
        id: 302,
        tripId: 15,
        title: 'Spice Plantation Tour',
        amount: 800,
        category: 'ENTERTAINMENT',
        date: '2026-07-03',
      },
    ];

    await page.route('**/api/expenses/trip/15', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(expenses),
      });
    });

    await page.route('**/api/expenses/302', async (route) => {
      if (route.request().method() === 'DELETE') {
        expenses = [];
        await route.fulfill({ status: 204 });
      }
    });

    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Delete this expense?');
      await dialog.accept();
    });

    await page.goto('/budget');
    await expect(page.locator('text=Spice Plantation Tour')).toBeVisible();

    // Click delete expense icon
    await page.locator('button:has-text("🗑️")').click();

    // Verify expense deleted and empty state displayed
    await expect(page.locator('text=No expenses yet')).toBeVisible();
  });
});
