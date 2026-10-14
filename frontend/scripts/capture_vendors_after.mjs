import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BRAIN_DIR = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/5129bf94-62aa-4d85-933e-a3264d3ebc9c';
const SCRATCH_DIR = 'c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch';

fs.mkdirSync(BRAIN_DIR, { recursive: true });
fs.mkdirSync(SCRATCH_DIR, { recursive: true });

async function run() {
  console.log('Launching browser to capture Vendors Tab (After Upgrade)...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:4300...');
  await page.goto('http://localhost:4300', { waitUntil: 'domcontentloaded' });

  console.log('Waiting for initial screen (.sidebar or #username)...');
  await page.waitForSelector('.sidebar, #username', { timeout: 25000 });

  const loginInput = page.locator('#username');
  if (await loginInput.isVisible().catch(() => false)) {
    console.log('Logging in as SUPER_ADMIN...');
    await page.fill('#username', 'SUPER_ADMIN');
    await page.fill('#password', 'superadmin123');
    await page.click('#login-submit-btn');
    await page.waitForSelector('.uat-otp-helper-pill, .sidebar', { timeout: 25000 });
    if (await page.locator('.uat-otp-helper-pill').isVisible().catch(() => false)) {
      await page.click('.uat-otp-helper-pill');
      await page.waitForTimeout(600);
      await page.locator('button:has-text("Verify"), button[type="submit"]').first().click();
    }
  }

  console.log('Waiting for sidebar...');
  await page.waitForSelector('.sidebar', { timeout: 20000 });
  await page.waitForTimeout(1000);

  console.log('Clicking Vendors in sidebar...');
  const vendorsNav = page.locator('.nav-menu-list li:has-text("Vendors"), li[title*="Vendors"]');
  await vendorsNav.first().click();
  await page.waitForTimeout(2000);

  console.log('Waiting for Vendors elements...');
  await page.waitForSelector('app-vendors, .vendors-container, .vendor-page-header, .page-header', { timeout: 15000 });
  await page.waitForTimeout(1500);

  // 1. Standard viewport screenshot
  const viewportPath = path.join(BRAIN_DIR, 'vendors_executive_layout.png');
  await page.screenshot({ path: viewportPath });
  console.log('Saved Vendors viewport after screenshot to:', viewportPath);

  // 2. Full page screenshot (Vertical & Horizontal)
  const fullPagePath = path.join(BRAIN_DIR, 'vendors_executive_fullpage.png');
  await page.screenshot({ path: fullPagePath, fullPage: true });
  console.log('Saved Vendors full page after screenshot to:', fullPagePath);

  await browser.close();
  console.log('Done capturing After screenshots for Vendors!');
}

run().catch(err => {
  console.error('Error capturing Vendors After:', err);
  process.exit(1);
});
