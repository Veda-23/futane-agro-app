import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const SCRATCH_DIR = 'c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/popcards_after';
fs.mkdirSync(SCRATCH_DIR, { recursive: true });

async function saveScreenshot(page, name) {
  const p = path.join(SCRATCH_DIR, `${name}.png`);
  await page.screenshot({ path: p });
  console.log(`[SNAPSHOT] Saved: ${name}.png`);
}

async function run() {
  console.log('Launching browser to capture after-fix pop cards...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:4300...');
  await page.goto('http://localhost:4300', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // Authenticate
  const loginInput = page.locator('#username');
  if (await loginInput.isVisible().catch(() => false)) {
    console.log('Logging in as SUPER_ADMIN...');
    await page.fill('#username', 'SUPER_ADMIN');
    await page.fill('#password', 'superadmin123');
    await page.click('#login-submit-btn');

    console.log('Waiting for OTP helper pill...');
    const helperPill = page.locator('.uat-otp-helper-pill');
    await helperPill.waitFor({ state: 'visible', timeout: 15000 });
    console.log('Clicking OTP helper pill...');
    await helperPill.click();
    await page.waitForTimeout(600);

    console.log('Clicking OTP verify submit button...');
    const verifyBtn = page.locator('#otp-verify-submit-btn');
    await verifyBtn.click();
    await page.waitForTimeout(2000);
  }

  console.log('Waiting for sidebar...');
  await page.waitForSelector('.sidebar', { timeout: 20000 });
  await page.waitForTimeout(1500);

  // 1. PRODUCTION TAB - DOSSIER MODAL (Image 1 fix)
  console.log('Navigating to Production...');
  await page.goto('http://localhost:4300/production', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const viewBtn = page.locator('.btn-action-icon.btn-view, button[title*="View Batch"]').first();
  await viewBtn.waitFor({ state: 'visible', timeout: 10000 });
  console.log('Opening Production Dossier modal...');
  await viewBtn.click();
  await page.waitForSelector('.dossier-modal-container', { timeout: 5000 });
  await page.waitForTimeout(1000);
  await saveScreenshot(page, 'fix1_production_dossier_modal');
  console.log('Closing Dossier via Escape key...');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);

  // 2. MONTHLY PRODUCTION SUMMARY EDIT DRAWER (Image 2 fix)
  console.log('Switching to Monthly Production subtab...');
  const monthlySubtab = page.locator('.subnav-tab-btn:has-text("Monthly Production")').first();
  await monthlySubtab.click();
  await page.waitForTimeout(1500);

  const editPpmBtn = page.locator('.btn-action-icon.btn-edit, button[title*="Edit"]').first();
  await editPpmBtn.waitFor({ state: 'visible', timeout: 10000 });
  console.log('Opening Monthly Production Summary Edit Drawer...');
  await editPpmBtn.click();
  await page.waitForSelector('.slide-in-drawer', { timeout: 5000 });
  await page.waitForTimeout(1000);
  await saveScreenshot(page, 'fix2_monthly_edit_drawer');
  console.log('Closing Drawer via Escape key...');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);

  // 3. INVENTORY TAB - WAREHOUSE STOCK ADJUSTMENT MODAL (Image 3 fix)
  console.log('Navigating to Inventory...');
  await page.goto('http://localhost:4300/inventory', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const adjustBtn = page.locator('button[title*="Adjust"], button:has(.bi-sliders2-vertical), .btn-adjust').first();
  await adjustBtn.waitFor({ state: 'visible', timeout: 10000 });
  console.log('Opening Warehouse Stock Adjustment modal...');
  await adjustBtn.click();
  await page.waitForSelector('.modal-dialog-box', { timeout: 5000 });
  await page.waitForTimeout(1000);
  await saveScreenshot(page, 'fix3_inventory_stock_adjustment');
  console.log('Closing Adjustment modal via Escape key...');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);

  // 4. INVENTORY TAB - EDIT CRATE INVENTORY RECORD DRAWER (Image 4 fix)
  const editCrateBtn = page.locator('button[title*="Edit"], .btn-action-icon.btn-edit').first();
  await editCrateBtn.waitFor({ state: 'visible', timeout: 10000 });
  console.log('Opening Edit Crate Record drawer...');
  await editCrateBtn.click();
  await page.waitForSelector('.drawer-panel', { timeout: 5000 });
  await page.waitForTimeout(1000);
  await saveScreenshot(page, 'fix4_inventory_edit_drawer');
  console.log('Closing Drawer via Escape key...');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);

  console.log('All 4 reference fix screenshots captured successfully!');
  await browser.close();
}

run().catch(err => {
  console.error('Error running audit:', err);
  process.exit(1);
});
