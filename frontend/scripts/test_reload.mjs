import { chromium } from '@playwright/test';

async function testActiveTabs() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1366, height: 768 });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));

  // Log in
  await page.goto('http://localhost:4200', { waitUntil: 'domcontentloaded' });
  await page.fill('#username', 'SUPER_ADMIN');
  await page.fill('#password', 'superadmin123');
  await page.click('#login-submit-btn');

  await page.waitForSelector('.uat-otp-helper-pill', { timeout: 6000 });
  await page.click('.uat-otp-helper-pill');
  await page.click('#otp-verify-submit-btn');

  await page.waitForSelector('.app-container', { timeout: 10000 });
  console.log('Logged in successfully!');

  // Now reload the page with active session!
  console.log('Reloading page with active session in storage...');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));

  const title = await page.title();
  const hasAppContainer = await page.evaluate(() => !!document.querySelector('.app-container'));
  console.log('After reload - Title:', title, 'hasAppContainer:', hasAppContainer);
  console.log('Errors during reload:', errors);

  await page.screenshot({ path: '../scratch/after_reload.png' });
  await browser.close();
}

testActiveTabs().catch(console.error);
