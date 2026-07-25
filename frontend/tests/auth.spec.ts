import { test, expect } from '@playwright/test';

test.describe('ERP Authentication & E2E Smoke Test', () => {
  const ERP_URL = 'http://80.225.192.171/';

  test('Should load login page correctly', async ({ page }) => {
    await page.goto(ERP_URL);
    await expect(page.locator('h2')).toContainText('Futane Agro ERP');
    await expect(page.locator('input[placeholder="Enter your username or mobile number"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Enter your password"]')).toBeVisible();
    await expect(page.locator('button', { hasText: 'Sign In' })).toBeVisible();
  });

  test('Should show error on invalid credentials', async ({ page }) => {
    await page.goto(ERP_URL);
    await page.locator('input[placeholder="Enter your username or mobile number"]').fill('invalid_user');
    await page.locator('input[placeholder="Enter your password"]').fill('wrong_password');
    await page.locator('button', { hasText: 'Sign In' }).click();

    // Check for error toast or message
    await expect(page.locator('.toast-error, .error-message')).toBeVisible({ timeout: 5000 });
  });

  test('Should login and navigate to Payments tab', async ({ page }) => {
    await page.goto(ERP_URL);
    await page.locator('input[placeholder="Enter your username or mobile number"]').fill('9876543210');
    await page.locator('input[placeholder="Enter your password"]').fill('password');
    await page.locator('button', { hasText: 'Sign In' }).click();

    // Verify Dashboard loads
    await expect(page.locator('h1')).toContainText('Overview', { timeout: 10000 });

    // Navigate to Payments
    await page.locator('text=Payment Registry').click();
    await expect(page.locator('h3').first()).toContainText('Add Payment Record', { timeout: 5000 });
  });
});
