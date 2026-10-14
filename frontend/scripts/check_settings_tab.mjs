import { chromium } from '@playwright/test';

async function checkSettings() {
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

  // Navigate to Settings
  await page.evaluate(() => {
    // Find settings nav item or trigger
    const items = Array.from(document.querySelectorAll('.nav-menu-list li'));
    const settings = items.find(el => el.textContent.includes('Settings'));
    if (settings) settings.click();
  });

  await page.waitForTimeout(1500);

  const sidebarStyles = await page.evaluate(() => {
    const el = document.querySelector('.sidebar');
    const s = window.getComputedStyle(el);
    return {
      bg: s.backgroundColor,
      color: s.color
    };
  });

  const headerHtml = await page.evaluate(() => {
    const el = document.querySelector('.header-right');
    return el ? el.innerHTML : 'no header-right';
  });

  console.log('In Settings - sidebarStyles:', JSON.stringify(sidebarStyles));
  console.log('In Settings - headerHtml snippet:', headerHtml.substring(0, 300));

  await page.screenshot({ path: '../scratch/settings_active_screenshot.png' });
  await browser.close();
}

checkSettings().catch(console.error);
