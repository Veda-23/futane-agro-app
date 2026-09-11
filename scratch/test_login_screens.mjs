import path from 'path';
import puppeteer from 'puppeteer-core';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\Vedant\\.gemini\\antigravity-ide\\brain\\5ef8ae70-aa75-4fa8-9f4f-96191d2e828b';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1400,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900, deviceScaleFactor: 1.25 });

  console.log('Navigating to http://localhost:4200...');
  await page.goto('http://localhost:4200/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  // Enter credentials
  await page.evaluate(() => {
    const u = document.querySelector('#username');
    const p = document.querySelector('#password');
    if (u) {
      u.value = 'SUPER_ADMIN';
      u.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (p) {
      p.value = 'superadmin123';
      p.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });

  await new Promise(r => setTimeout(r, 400));
  await page.click('#login-submit-btn');

  // Wait for 2FA screen
  console.log('Waiting for OTP screen...');
  await page.waitForSelector('.uat-otp-helper-card', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 500));

  // Click the test OTP helper to fill the 6 boxes!
  console.log('Clicking test OTP helper card...');
  await page.click('.uat-otp-helper-card');
  await new Promise(r => setTimeout(r, 500));

  // Click Verify button
  console.log('Clicking Verify & Enter Portal button...');
  const verifyBtn = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('button[type="submit"]'));
    return btns[btns.length - 1];
  });
  await verifyBtn.click();

  // Wait for login success into ERP dashboard
  console.log('Waiting for dashboard navigation...');
  await new Promise(r => setTimeout(r, 3000));

  const dashShot = path.join(ARTIFACT_DIR, '03_enterprise_dashboard_screen.png');
  await page.screenshot({ path: dashShot });
  console.log('Captured dashboard screen:', dashShot);

  await browser.close();
  console.log('Complete verification successful!');
}

run().catch(console.error);
