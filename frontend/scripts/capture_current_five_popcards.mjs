import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const SCRATCH_DIR = 'c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/popcards_after_five';
fs.mkdirSync(SCRATCH_DIR, { recursive: true });

async function saveScreenshot(page, name) {
  const p = path.join(SCRATCH_DIR, `${name}.png`);
  await page.screenshot({ path: p });
  console.log(`[SNAPSHOT] Saved: ${name}.png`);
}

async function run() {
  console.log('Starting automated audit of the 5 reference image pop cards...');
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

  // ── 1. MACHINES TAB: Edit Equipment Profile (User Image 1) ──
  console.log('Navigating to Machines...');
  const machinesLink = page.locator('a[href*="machines"], .nav-item:has-text("Machines"), li:has-text("Machines")').first();
  await machinesLink.click();
  await page.waitForTimeout(2000);

  console.log('Opening Machine Edit Drawer...');
  const editMachineBtn = page.locator('.btn-row-action.btn-edit, button[title="Edit"]').first();
  await editMachineBtn.click();
  await page.waitForSelector('.erp-drawer.open', { timeout: 5000 });
  await page.waitForTimeout(1000);
  await saveScreenshot(page, 'img1_machine_edit_equipment_profile');

  console.log('Closing Machine Drawer with Escape...');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);

  // ── 2 & 3. RAW MATERIALS TAB: GRN Note & Edit Batch (User Images 2 & 3) ──
  console.log('Navigating to Raw Materials...');
  const rmLink = page.locator('a[href*="raw-materials"], .nav-item:has-text("Raw Materials"), li:has-text("Raw Materials")').first();
  await rmLink.click();
  await page.waitForTimeout(2000);

  // User Image 2: GRN Voucher / Inspection Note
  console.log('Opening GRN Inspection Note dialog...');
  const grnBtn = page.locator('.btn-row-action.btn-inspect, button[title*="Inspect"]').first();
  await grnBtn.click();
  await page.waitForSelector('.grn-voucher-dialog', { timeout: 5000 });
  await page.waitForTimeout(1000);
  await saveScreenshot(page, 'img2_raw_materials_grn_voucher');

  console.log('Closing GRN dialog with Escape...');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);

  // User Image 3: Edit Batch Drawer
  console.log('Opening Raw Material Edit Batch drawer...');
  const editBatchBtn = page.locator('.btn-row-action.btn-edit, button[title*="Edit Procurement"]').first();
  await editBatchBtn.click();
  await page.waitForSelector('.erp-drawer.open', { timeout: 5000 });
  await page.waitForTimeout(1000);
  await saveScreenshot(page, 'img3_raw_materials_edit_batch_drawer');

  console.log('Closing Edit Batch Drawer with Escape...');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);

  // ── 4 & 5. VENDORS TAB: Balaji Agro Dossier & Edit Supplier Profile (User Images 4 & 5) ──
  console.log('Navigating to Vendors...');
  const vendorsLink = page.locator('a[href*="vendors"], .nav-item:has-text("Vendors"), li:has-text("Vendors")').first();
  await vendorsLink.click();
  await page.waitForTimeout(2000);

  // User Image 4: Balaji Agro Official Supplier Dossier
  console.log('Opening Supplier Dossier dialog...');
  const dossierBtn = page.locator('.btn-row-action.btn-dossier, button[title*="Dossier"]').first();
  await dossierBtn.click();
  await page.waitForSelector('.dossier-voucher-dialog', { timeout: 5000 });
  await page.waitForTimeout(1000);
  await saveScreenshot(page, 'img4_vendor_supplier_dossier');

  console.log('Closing Dossier with Escape...');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);

  // User Image 5: Edit Supplier Profile Drawer
  console.log('Opening Edit Supplier Profile drawer...');
  const editVendorBtn = page.locator('.btn-row-action.btn-edit, button[title*="Edit Supplier"]').first();
  await editVendorBtn.click();
  await page.waitForSelector('.erp-drawer.open', { timeout: 5000 });
  await page.waitForTimeout(1000);
  await saveScreenshot(page, 'img5_vendor_edit_supplier_profile');

  console.log('Closing Edit Supplier Drawer with Escape...');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);

  console.log('ALL 5 REFERENCE POP CARDS AUDITED & CAPTURED SUCCESSFULLY!');
  await browser.close();
}

run().catch(console.error);
