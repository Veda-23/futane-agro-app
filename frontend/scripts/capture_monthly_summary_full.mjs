import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BRAIN_DIR = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/5129bf94-62aa-4d85-933e-a3264d3ebc9c';
const SCRATCH_DIR = 'c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch';

fs.mkdirSync(BRAIN_DIR, { recursive: true });
fs.mkdirSync(SCRATCH_DIR, { recursive: true });

async function run() {
  console.log('Launching browser for Monthly Summary...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:4300...');
  await page.goto('http://localhost:4300', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

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

  console.log('Clicking Monthly Summary in sidebar...');
  const monthlySummaryNav = page.locator('.nav-menu-list li:has-text("Monthly Summary"), li[title*="Monthly Summary"]');
  await monthlySummaryNav.first().click();
  await page.waitForTimeout(2000);

  console.log('Waiting for Monthly Summary elements...');
  await page.waitForSelector('.ppm-kpi-grid, .production-page-header', { timeout: 15000 });
  await page.waitForTimeout(1500);

  // 1. Standard executive viewport
  const viewportPath = path.join(BRAIN_DIR, 'monthly_summary_executive_layout.png');
  await page.screenshot({ path: viewportPath });
  console.log('Saved viewport layout screenshot to:', viewportPath);

  // 2. Full-page screenshot (Full vertical & horizontal)
  const fullPagePath = path.join(BRAIN_DIR, 'monthly_summary_executive_fullpage.png');
  await page.screenshot({ path: fullPagePath, fullPage: true });
  console.log('Saved full page (vertical & horizontal) screenshot to:', fullPagePath);

  await browser.close();
  console.log('Capture complete!');
}

run().catch(err => {
  console.error('Run error:', err);
  process.exit(1);
});
