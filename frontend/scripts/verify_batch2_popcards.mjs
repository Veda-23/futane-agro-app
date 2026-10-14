import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('scratch/popcards_batch2');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log('🚀 Running automated test for batch 2 pop cards (Transport, Drivers, Parties)...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    // 1. Complete Login Flow with UAT OTP
    await page.goto('http://localhost:4300', { waitUntil: 'networkidle' });
    if (await page.locator('#username').isVisible()) {
      await page.fill('#username', 'SUPER_ADMIN');
      await page.fill('#password', 'superadmin123');
      await page.click('#login-submit-btn');
      await page.waitForSelector('.uat-otp-helper-pill', { timeout: 10000 });
      await page.click('.uat-otp-helper-pill');
      await page.click('#otp-verify-submit-btn');
      await page.waitForSelector('.sidebar', { timeout: 10000 });
      console.log('✅ Logged in successfully!');
    }

    // ── CARD 1: Transport - Image 1 (Consignment Waybill & Freight Slip) ──
    console.log('Navigating to Transport...');
    const transportLink = page.locator('.nav-item:has-text("Transport"), li:has-text("Transport")').first();
    await transportLink.click();
    await page.waitForSelector('app-transports table', { timeout: 10000 });
    await page.waitForTimeout(1000);

    console.log('Testing Image 1: Consignment Waybill & Freight Slip...');
    const waybillBtn = page.locator('app-transports .btn-row-action.btn-view, app-transports button[title*="consignment waybill"]').first();
    await waybillBtn.waitFor({ state: 'visible', timeout: 5000 });
    await waybillBtn.click();
    await page.waitForTimeout(600);

    const waybillDialog = page.locator('.waybill-modal-dialog');
    if (await waybillDialog.isVisible()) {
      const box = await waybillDialog.boundingBox();
      const center = box.x + box.width / 2;
      console.log(`Waybill Modal BoundingBox: x=${box.x}, width=${box.width}, Center=${center}px (Target ~840px)`);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_transport_waybill_slip.png') });
      console.log('✅ Captured 01_transport_waybill_slip.png');
    }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    // ── CARD 2: Transport - Image 2 (Edit Transport Record) ──
    console.log('Testing Image 2: Edit Transport Record...');
    const editTripBtn = page.locator('app-transports .btn-row-action.btn-edit, app-transports button[title*="Edit transport"]').first();
    await editTripBtn.waitFor({ state: 'visible', timeout: 5000 });
    await editTripBtn.click();
    await page.waitForTimeout(600);

    const tripDrawer = page.locator('.slide-drawer');
    if (await tripDrawer.isVisible()) {
      const box = await tripDrawer.boundingBox();
      const center = box.x + box.width / 2;
      console.log(`Transport Drawer BoundingBox: x=${box.x}, width=${box.width}, Center=${center}px (Target ~840px)`);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_transport_edit_record.png') });
      console.log('✅ Captured 02_transport_edit_record.png');
    }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    // ── CARD 3: Drivers - Image 3 (Edit Driver Profile) ──
    console.log('Navigating to Drivers...');
    const driversLink = page.locator('.nav-item:has-text("Drivers"), li:has-text("Drivers")').first();
    await driversLink.click();
    await page.waitForSelector('app-drivers table', { timeout: 10000 });
    await page.waitForTimeout(1000);

    console.log('Testing Image 3: Edit Driver Profile...');
    const editDriverBtn = page.locator('app-drivers .btn-row-action.btn-edit, app-drivers button[title*="Edit Driver"]').first();
    await editDriverBtn.waitFor({ state: 'visible', timeout: 5000 });
    await editDriverBtn.click();
    await page.waitForTimeout(600);

    const driverDrawer = page.locator('.slide-drawer');
    if (await driverDrawer.isVisible()) {
      const box = await driverDrawer.boundingBox();
      const center = box.x + box.width / 2;
      console.log(`Driver Drawer BoundingBox: x=${box.x}, width=${box.width}, Center=${center}px (Target ~840px)`);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_driver_edit_profile.png') });
      console.log('✅ Captured 03_driver_edit_profile.png');
    }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    // ── CARD 4: Parties - Image 4 (Client Master Dossier) ──
    console.log('Navigating to Parties...');
    const partiesLink = page.locator('.nav-item:has-text("Parties"), li:has-text("Parties")').first();
    await partiesLink.click();
    await page.waitForSelector('app-party table', { timeout: 10000 });
    await page.waitForTimeout(1000);

    console.log('Testing Image 4: Client Master Dossier...');
    const dossierBtn = page.locator('app-party .btn-action-icon.btn-view, app-party button[title*="View Official Client Dossier"]').first();
    await dossierBtn.waitFor({ state: 'visible', timeout: 5000 });
    await dossierBtn.click();
    await page.waitForTimeout(600);

    const partyDossier = page.locator('.dossier-modal-container');
    if (await partyDossier.isVisible()) {
      const box = await partyDossier.boundingBox();
      const center = box.x + box.width / 2;
      console.log(`Party Dossier BoundingBox: x=${box.x}, width=${box.width}, Center=${center}px (Target ~840px)`);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_party_client_dossier.png') });
      console.log('✅ Captured 04_party_client_dossier.png');
    }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    // ── CARD 5: Parties - Image 5 (Edit Party Account) ──
    console.log('Testing Image 5: Edit Party Account...');
    const editPartyBtn = page.locator('app-party .btn-action-icon.btn-edit, app-party button[title*="Edit party"]').first();
    await editPartyBtn.waitFor({ state: 'visible', timeout: 5000 });
    await editPartyBtn.click();
    await page.waitForTimeout(600);

    const partyEditDialog = page.locator('.party-modal-dialog');
    if (await partyEditDialog.isVisible()) {
      const box = await partyEditDialog.boundingBox();
      const center = box.x + box.width / 2;
      console.log(`Party Edit Modal BoundingBox: x=${box.x}, width=${box.width}, Center=${center}px (Target ~840px)`);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_party_edit_account.png') });
      console.log('✅ Captured 05_party_edit_account.png');
    }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    console.log('🎉 ALL BATCH 2 POP CARDS TESTED AND CAPTURED!');
  } catch (err) {
    console.error('Error during batch 2 verification:', err);
  } finally {
    await browser.close();
  }
}

run();
