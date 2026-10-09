import { chromium } from '@playwright/test';

async function testPort4200() {
  console.log('Testing http://localhost:4200 with real Google Chrome...');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1366, height: 768 });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));

  console.log('Navigating to http://localhost:4200...');
  const start = Date.now();
  await page.goto('http://localhost:4200', { waitUntil: 'domcontentloaded' });
  console.log(`DOM ready in ${Date.now() - start}ms`);

  const isLoginVisible = await page.isVisible('.login-card-container');
  console.log('Login container visible:', isLoginVisible);

  console.log('Logging in as SUPER_ADMIN...');
  await page.fill('#username', 'SUPER_ADMIN');
  await page.fill('#password', 'superadmin123');
  await page.click('#login-submit-btn');

  await page.waitForSelector('.uat-otp-helper-pill', { timeout: 6000 });
  await page.click('.uat-otp-helper-pill');
  await new Promise(r => setTimeout(r, 400));
  await page.click('#otp-verify-submit-btn');

  await page.waitForSelector('.app-container', { timeout: 10000 });
  console.log('Dashboard loaded on port 4200!');

  await page.screenshot({ path: '../scratch/port4200_verified.png' });
  console.log('Screenshot saved to scratch/port4200_verified.png');

  console.log('Errors:', errors);
  await browser.close();
}

testPort4200().catch(console.error);
