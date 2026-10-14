import { chromium } from '@playwright/test';

async function checkConsole() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
      errors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log('UNCAUGHT PAGE ERROR:', err.message, err.stack);
    errors.push(err.message);
  });

  await page.goto('http://localhost:4300', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  
  if (await page.locator('#username').isVisible()) {
    await page.fill('#username', 'SUPER_ADMIN');
    await page.fill('#password', 'superadmin123');
    await page.click('#login-submit-btn');
    await page.waitForTimeout(1000);
    const otp = page.locator('.uat-otp-helper-pill');
    if (await otp.isVisible()) {
      await otp.click();
      await page.waitForTimeout(300);
      await page.click('#otp-verify-submit-btn');
    }
  }

  await page.waitForTimeout(2500);

  console.log('Clicking Payment Registry...');
  await page.locator('.sidebar-nav li:has-text("Payment Registry")').first().click();
  await page.waitForTimeout(2500);

  console.log('Total Errors:', errors.length);

  await browser.close();
}

checkConsole();
