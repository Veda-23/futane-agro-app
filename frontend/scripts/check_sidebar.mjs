import { chromium } from '@playwright/test';

async function check() {
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

  const otpHolder = await page.waitForSelector('.uat-otp-helper-pill, .sidebar', { timeout: 8000 }).catch(() => null);
  if (await page.locator('.uat-otp-helper-pill').isVisible().catch(() => false)) {
    await page.click('.uat-otp-helper-pill');
    await page.waitForTimeout(400);
    const submitBtn = page.locator('button[type="submit"]');
    if (await submitBtn.isVisible()) await submitBtn.click();
  }

  await page.waitForSelector('.sidebar', { timeout: 12000 });
  await page.waitForTimeout(1000);

  const bodyClass = await page.evaluate(() => document.body.className);
  const sidebarStyles = await page.evaluate(() => {
    const el = document.querySelector('.sidebar');
    const s = window.getComputedStyle(el);
    return {
      bg: s.backgroundColor,
      color: s.color,
      border: s.borderRight
    };
  });
  const headerStyles = await page.evaluate(() => {
    const el = document.querySelector('.app-header');
    const s = window.getComputedStyle(el);
    return {
      bg: s.backgroundColor,
      color: s.color,
      height: s.height
    };
  });

  console.log('bodyClass:', bodyClass);
  console.log('sidebarStyles:', JSON.stringify(sidebarStyles));
  console.log('headerStyles:', JSON.stringify(headerStyles));

  await page.screenshot({ path: '../scratch/auth_check.png' });
  await browser.close();
}

check().catch(console.error);
