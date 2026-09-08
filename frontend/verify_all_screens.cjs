const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/c1c6338c-1671-4e87-b480-7a9ae9928b58';

async function verify() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:8081...');
  await page.goto('http://localhost:8081', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Login
  const usernameInput = await page.$('input[placeholder*="Username" i], input[type="text"]');
  if (usernameInput) {
    console.log('Logging in...');
    await page.fill('input[placeholder*="Username" i], input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
    await page.waitForTimeout(2000);
  }

  // 1. Billing Hub
  console.log('Navigating to Billing Hub...');
  await page.click('.sidebar-nav li:has-text("Billing Hub")');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_billing_hub.png') });
  console.log('Captured verified_billing_hub.png');

  // 2. Analytics
  console.log('Navigating to Analytics...');
  await page.click('.sidebar-nav li:has-text("Analytics")');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_analytics.png') });
  console.log('Captured verified_analytics.png');

  // 3. Parties
  console.log('Navigating to Parties...');
  await page.click('.sidebar-nav li:has-text("Parties")');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_parties.png') });
  console.log('Captured verified_parties.png');

  await browser.close();
  console.log('All targeted verification snapshots captured!');
}

verify().catch(err => {
  console.error('Verification error:', err);
  process.exit(1);
});
