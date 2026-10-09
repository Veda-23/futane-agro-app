import { chromium } from '@playwright/test';

async function testLogin() {
  console.log('Testing full login on http://localhost:4300...');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1366, height: 768 });

  const start = Date.now();
  await page.goto('http://localhost:4300', { waitUntil: 'domcontentloaded' });
  console.log(`Initial page loaded in ${Date.now() - start}ms`);

  // Fill credentials using IDs
  await page.fill('#username', 'SUPER_ADMIN');
  await page.fill('#password', 'superadmin123');
  await page.click('#login-submit-btn');
  console.log('Submitted login credentials...');

  // Check if OTP helper appears or direct navigation
  const otpAppeared = await page.waitForSelector('.uat-otp-helper-pill, .otp-inputs-row, .sidebar', { timeout: 8000 }).catch(() => null);
  
  if (await page.locator('.uat-otp-helper-pill').isVisible().catch(() => false)) {
    console.log('OTP step displayed. Auto-filling demo OTP...');
    await page.click('.uat-otp-helper-pill');
    await page.waitForTimeout(500);
    // Click submit OTP
    const otpSubmit = page.locator('button[type="submit"]');
    if (await otpSubmit.isVisible()) {
      await otpSubmit.click();
    }
  }

  // Wait for post-login view
  await page.waitForTimeout(2000);
  console.log('Final URL after login:', page.url());
  
  const screenshotPath = 'C:\\Users\\Vedant\\.gemini\\antigravity-ide\\brain\\2a404500-c039-4b3f-a3a7-20719c23b105\\uat_login_verified_4300.png';
  await page.screenshot({ path: screenshotPath });
  console.log('Screenshot saved to:', screenshotPath);

  const title = await page.title();
  console.log('Final page title:', title);

  await browser.close();
}

testLogin().catch(console.error);
