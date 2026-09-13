import puppeteer from 'puppeteer-core';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function test() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  await page.goto('http://localhost:4200/#/login', { waitUntil: 'networkidle2' });

  // 1. Fill credentials and submit
  await page.evaluate(() => {
    document.querySelectorAll('input')[0].value = 'SUPER_ADMIN';
    document.querySelectorAll('input')[0].dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelectorAll('input')[1].value = 'superadmin123';
    document.querySelectorAll('input')[1].dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('button[type="submit"]').click();
  });

  // 2. Wait for OTP helper card
  await page.waitForSelector('.uat-otp-helper-card', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 600)); // wait for animation
  await page.screenshot({ path: 'scratch/2fa_screen_verified.png' });
  console.log('Saved 2FA screenshot: scratch/2fa_screen_verified.png');

  // 3. Click auto-fill on OTP helper card
  await page.click('.uat-otp-helper-card');
  await new Promise(r => setTimeout(r, 300));

  // 4. Click Verify & Enter Portal
  await page.click('button[type="submit"]');

  // 5. Wait for app-container (dashboard)
  await page.waitForSelector('.app-container', { timeout: 15000 });
  console.log('🎉 Successfully logged in to Dashboard!');
  await new Promise(r => setTimeout(r, 1000));

  await page.screenshot({ path: 'scratch/dashboard_after_login.png' });
  console.log('Saved dashboard screenshot: scratch/dashboard_after_login.png');

  await browser.close();
}

test().catch(console.error);
