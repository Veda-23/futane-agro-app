import { chromium } from '@playwright/test';

async function testSettings() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('http://localhost:4300', { waitUntil: 'domcontentloaded' });
  await page.fill('#username', 'SUPER_ADMIN');
  await page.fill('#password', 'superadmin123');
  await page.click('#login-submit-btn');

  await page.waitForSelector('.uat-otp-helper-pill, .sidebar', { timeout: 8000 }).catch(() => null);
  if (await page.locator('.uat-otp-helper-pill').isVisible().catch(() => false)) {
    await page.click('.uat-otp-helper-pill');
    await page.waitForTimeout(400);
    const submitBtn = page.locator('button[type="submit"]');
    if (await submitBtn.isVisible()) await submitBtn.click();
  }

  await page.waitForSelector('.sidebar', { timeout: 12000 });
  await page.waitForTimeout(1000);

  // Click Settings
  const settingsItem = page.locator('.nav-menu-list li').filter({ hasText: /Settings/i }).first();
  await settingsItem.click();
  await page.waitForTimeout(1500);

  await page.screenshot({ path: '../scratch/settings_check.png' });
  await browser.close();
  console.log('Saved settings_check.png');
}

testSettings().catch(console.error);
