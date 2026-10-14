import { chromium } from '@playwright/test';

async function verifyLogin() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1339, height: 720 } });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:4300...');
  await page.goto('http://localhost:4300', { waitUntil: 'networkidle' });

  // Fill in login credentials
  console.log('Filling in credentials...');
  await page.fill('input[name="username"]', 'SUPER_ADMIN');
  await page.fill('input[name="password"]', 'superadmin123');

  // Click Submit
  console.log('Clicking Secure Sign In...');
  await page.click('#login-submit-btn');

  // Wait for OTP screen or dashboard
  await page.waitForTimeout(1000);

  // If OTP screen is shown, click the helper pill
  const otpPill = await page.$('.uat-otp-helper-pill');
  if (otpPill) {
    console.log('OTP screen active, clicking UAT OTP helper pill...');
    await otpPill.click();
    await page.waitForTimeout(500);

    // Click verify OTP button
    const verifyBtn = await page.$('button[type="submit"]');
    if (verifyBtn) {
      console.log('Submitting OTP...');
      await verifyBtn.click();
    }
  }

  // Wait for dashboard to load
  console.log('Waiting for ERP dashboard...');
  await page.waitForSelector('.sidebar', { timeout: 15000 });
  await page.waitForTimeout(1500);

  const screenshotPath = 'c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/targeted_tabs_audit/login_verified_dashboard.png';
  await page.screenshot({ path: screenshotPath });
  console.log('Logged in successfully! Screenshot saved to:', screenshotPath);

  await browser.close();
}

verifyLogin().catch(err => {
  console.error('Login verification error:', err);
  process.exit(1);
});
