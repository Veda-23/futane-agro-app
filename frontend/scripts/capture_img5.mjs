import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const SCRATCH_DIR = 'c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/popcards_after_five';

async function run() {
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

  console.log('Navigating directly to Vendors...');
  const vendorsLink = page.locator('a[href*="vendors"], .nav-item:has-text("Vendors"), li:has-text("Vendors")').first();
  await vendorsLink.click();
  await page.waitForSelector('app-vendors', { timeout: 10000 });
  await page.waitForTimeout(2000);

  console.log('Opening Edit Supplier Profile drawer...');
  const editVendorBtn = page.locator('app-vendors .btn-row-action.btn-edit').first();
  await editVendorBtn.click();
  await page.waitForSelector('app-vendors .erp-drawer.open', { timeout: 5000 });
  await page.waitForTimeout(1000);

  const p = path.join(SCRATCH_DIR, 'img5_vendor_edit_supplier_profile.png');
  await page.screenshot({ path: p });
  console.log('[SNAPSHOT] Saved img5_vendor_edit_supplier_profile.png successfully!');

  await browser.close();
}

run().catch(console.error);
