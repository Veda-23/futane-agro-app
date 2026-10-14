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
  console.log('Starting automated audit of the 4 pop cards...');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('http://localhost:4300');
  await page.fill('#username', 'SUPER_ADMIN');
  await page.fill('#password', 'superadmin123');
  await page.click('#login-submit-btn');
  await page.waitForSelector('.uat-otp-helper-pill');
  await page.click('.uat-otp-helper-pill');
  await page.click('#otp-verify-submit-btn');
  await page.waitForSelector('.sidebar');
  console.log('Logged in successfully!');

  // 1. PRODUCTION DOSSIER MODAL (Image 1 fix)
  const prodLink = page.locator('a[href*="production"], .nav-item:has-text("Production"), li:has-text("Production")').first();
  await prodLink.click();
  await page.waitForTimeout(2000);

  console.log('Opening Production Batch Dossier modal...');
  const viewDossierBtn = page.locator('button[title="View Batch QC Inspection Slip"]').first();
  await viewDossierBtn.click();
  await page.waitForSelector('.dossier-modal-container', { timeout: 5000 });
  await page.waitForTimeout(1000);
  await saveScreenshot(page, 'fix1_production_dossier_modal');

  console.log('Closing Dossier with Escape...');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);

  // 2. MONTHLY SUMMARY EDIT DRAWER (Image 2 fix)
  console.log('Switching to Monthly Summary subtab...');
  const monthlyTab = page.locator('.subnav-tab-btn:has-text("Monthly Summary")').first();
  await monthlyTab.click();
  await page.waitForTimeout(2000);

  console.log('Opening Monthly Edit Drawer...');
  const editPpmBtn = page.locator('.btn-action-icon.btn-edit, button[title*="Edit"]').first();
  await editPpmBtn.click();
  await page.waitForSelector('.slide-in-drawer', { timeout: 5000 });
  await page.waitForTimeout(1000);
  await saveScreenshot(page, 'fix2_monthly_edit_drawer');

  console.log('Closing Monthly Drawer with Escape...');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);

  // 3. INVENTORY TAB (Images 3 & 4 fixes)
  console.log('Navigating to Inventory...');
  const invLink = page.locator('a[href*="inventory"], .nav-item:has-text("Inventory"), li:has-text("Inventory")').first();
  await invLink.click();
  await page.waitForTimeout(2000);

  // Image 3: Stock Adjustment Modal
  console.log('Opening Stock Adjustment modal...');
  const adjustBtn = page.locator('button[title*="Adjust"], button:has(.bi-sliders2-vertical), .btn-adjust').first();
  await adjustBtn.click();
  await page.waitForSelector('.modal-dialog-box', { timeout: 5000 });
  await page.waitForTimeout(1000);
  await saveScreenshot(page, 'fix3_inventory_stock_adjustment');

  console.log('Closing Adjustment modal with Escape...');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);

  // Image 4: Edit Crate Inventory Record Drawer
  console.log('Opening Edit Crate Record drawer...');
  const editCrateBtn = page.locator('.btn-action-icon.btn-edit, button[title*="Edit"]').first();
  await editCrateBtn.click();
  await page.waitForSelector('.drawer-panel', { timeout: 5000 });
  await page.waitForTimeout(1000);
  await saveScreenshot(page, 'fix4_inventory_edit_drawer');

  console.log('Closing Edit Drawer with Escape...');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);

  console.log('ALL 4 POP CARDS VERIFIED AND CAPTURED!');
  await browser.close();
}

run().catch(console.error);
