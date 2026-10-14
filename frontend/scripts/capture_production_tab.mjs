import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BRAIN_DIR = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/5129bf94-62aa-4d85-933e-a3264d3ebc9c';
const SCRATCH_DIR = 'c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch';

fs.mkdirSync(BRAIN_DIR, { recursive: true });
fs.mkdirSync(SCRATCH_DIR, { recursive: true });

async function capture() {
  console.log('Launching browser to capture new Executive Production Tab...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();

  console.log('Connecting to http://localhost:4300...');
  await page.goto('http://localhost:4300', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  // Check login
  const loginInput = page.locator('#username');
  if (await loginInput.isVisible().catch(() => false)) {
    console.log('Logging in as SUPER_ADMIN...');
    await page.fill('#username', 'SUPER_ADMIN');
    await page.fill('#password', 'superadmin123');
    await page.click('#login-submit-btn');

    try {
      await page.waitForSelector('.uat-otp-helper-pill, .sidebar', { timeout: 10000 });
      if (await page.locator('.uat-otp-helper-pill').isVisible().catch(() => false)) {
        await page.click('.uat-otp-helper-pill');
        await page.waitForTimeout(600);
        const verifyBtn = page.locator('button:has-text("Verify"), button[type="submit"]');
        await verifyBtn.first().click();
      }
    } catch (e) {
      console.log('OTP step skipped or direct entrance.');
    }
  }

  console.log('Waiting for sidebar...');
  await page.waitForSelector('.sidebar', { timeout: 15000 });
  await page.waitForTimeout(1500);

  // Click on Production tab in sidebar
  console.log('Clicking Production navigation tab...');
  const productionNavItem = page.locator('.nav-menu-list li:has-text("Production"), li[title*="Production"]');
  await productionNavItem.first().click();
  await page.waitForTimeout(2000);

  console.log('Waiting for production screen...');
  await page.waitForSelector('.production-screen-wrapper, .production-page-header', { timeout: 15000 });
  await page.waitForTimeout(1500);

  // Capture full layout
  const fullLayoutPath = path.join(BRAIN_DIR, 'executive_production_layout.png');
  const scratchFullLayoutPath = path.join(SCRATCH_DIR, 'executive_production_layout.png');
  await page.screenshot({ path: fullLayoutPath });
  await page.screenshot({ path: scratchFullLayoutPath });
  console.log('Saved production layout screenshot to:', fullLayoutPath);

  // Close-up on Production Header and KPI grid
  const prodHeaderPath = path.join(BRAIN_DIR, 'executive_production_header_kpis.png');
  const prodWrapper = page.locator('.production-screen-wrapper');
  if (await prodWrapper.isVisible()) {
    await prodWrapper.screenshot({ path: prodHeaderPath });
    console.log('Saved production wrapper screenshot to:', prodHeaderPath);
  }

  await browser.close();
  console.log('Production tab capture complete!');
}

capture().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
