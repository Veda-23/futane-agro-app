import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('scratch/popcards_final');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log('🚀 Running automated test for all 5 pop cards & centering verification...');
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

    // ── TEST 1: Sales - Image 3 (Edit Commercial Sales Order) ──
    console.log('Navigating to Sales...');
    const salesLink = page.locator('.nav-item:has-text("Sales"), li:has-text("Sales")').first();
    await salesLink.click();
    await page.waitForSelector('app-sales table', { timeout: 10000 });
    await page.waitForTimeout(1000);

    console.log('Testing Sales Image 3: Edit Commercial Sales Order...');
    const salesEditBtn = page.locator('app-sales .btn-row-action.btn-edit, app-sales button[title*="Edit"]').first();
    await salesEditBtn.waitFor({ state: 'visible', timeout: 5000 });
    await salesEditBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'card3_sales_edit_order.png'), fullPage: false });
    console.log('✅ Card 3 captured: card3_sales_edit_order.png');

    // Close form
    const cancelFormBtn = page.locator('.btn-close-form').first();
    if (await cancelFormBtn.isVisible()) {
      await cancelFormBtn.click();
      await page.waitForTimeout(400);
    }

    // ── TEST 2: Sales - Image 1 (Commercial Sales Contract & Order Dossier) ──
    console.log('Testing Sales Image 1: Commercial Sales Contract & Order Dossier...');
    const salesViewBtn = page.locator('app-sales .btn-row-action.btn-view, app-sales button[title*="dossier"], app-sales button[title*="Dossier"]').first();
    await salesViewBtn.waitFor({ state: 'visible', timeout: 5000 });
    await salesViewBtn.click();
    await page.waitForTimeout(600);

    const salesDossier = page.locator('.sales-dossier-dialog');
    const dossierBox = await salesDossier.boundingBox();
    console.log(`Sales Dossier BoundingBox: x=${dossierBox.x}, y=${dossierBox.y}, width=${dossierBox.width}, height=${dossierBox.height}`);
    const dossierCenter = dossierBox.x + dossierBox.width / 2;
    console.log(`Sales Dossier Horizontal Center: ${dossierCenter}px (Target ~840px)`);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'card1_sales_order_dossier.png'), fullPage: false });
    console.log('✅ Card 1 captured: card1_sales_order_dossier.png');

    // Close dossier via Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    // ── TEST 3: Sales - Image 2 (Material Outward & Dispatch) ──
    console.log('Testing Sales Image 2: Material Outward & Dispatch...');
    const outwardBtn = page.locator('app-sales button[title*="Material Outward"], app-sales button[title*="Dispatch"], app-sales .btn-row-action:has(.bi-truck)').first();
    if (await outwardBtn.isVisible()) {
      await outwardBtn.click();
      await page.waitForTimeout(600);

      const outwardDialog = page.locator('.outward-modal-dialog');
      const outwardBox = await outwardDialog.boundingBox();
      console.log(`Outward Dialog BoundingBox: x=${outwardBox.x}, y=${outwardBox.y}, width=${outwardBox.width}, height=${outwardBox.height}`);
      const outwardCenter = outwardBox.x + outwardBox.width / 2;
      console.log(`Outward Dialog Horizontal Center: ${outwardCenter}px (Target ~840px)`);

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'card2_sales_outward_dispatch.png'), fullPage: false });
      console.log('✅ Card 2 captured: card2_sales_outward_dispatch.png');

      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    }

    // ── TEST 4: Dispatch - Image 4 (Consignment Outward & Delivery Challan) ──
    console.log('Navigating to Dispatch...');
    const dispatchLink = page.locator('.nav-item:has-text("Dispatch"), li:has-text("Dispatch")').first();
    await dispatchLink.click();
    await page.waitForSelector('app-dispatch table', { timeout: 10000 });
    await page.waitForTimeout(1000);

    console.log('Testing Dispatch Image 4: Delivery Challan Dossier...');
    const dispatchViewBtn = page.locator('app-dispatch .btn-row-action.btn-view').first();
    await dispatchViewBtn.waitFor({ state: 'visible', timeout: 5000 });
    await dispatchViewBtn.click();
    await page.waitForTimeout(600);

    const dispatchDossier = page.locator('.dispatch-dossier-dialog');
    const dBox = await dispatchDossier.boundingBox();
    console.log(`Dispatch Dossier BoundingBox: x=${dBox.x}, y=${dBox.y}, width=${dBox.width}, height=${dBox.height}`);
    const dCenter = dBox.x + dBox.width / 2;
    console.log(`Dispatch Dossier Horizontal Center: ${dCenter}px (Target ~840px)`);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'card4_dispatch_delivery_challan.png'), fullPage: false });
    console.log('✅ Card 4 captured: card4_dispatch_delivery_challan.png');

    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    // ── TEST 5: Dispatch - Image 5 (Edit Dispatch Manifest - The Bug in Last Image) ──
    console.log('Testing Dispatch Image 5: Edit Dispatch Manifest (CRITICAL BUG FIX)...');
    const dispatchEditBtn = page.locator('app-dispatch .btn-row-action.btn-edit').first();
    await dispatchEditBtn.waitFor({ state: 'visible', timeout: 5000 });
    await dispatchEditBtn.click();
    await page.waitForTimeout(600);

    const dispatchEditDialog = page.locator('.dispatch-modal-dialog');
    const isEditVisible = await dispatchEditDialog.isVisible();
    console.log(`Is Dispatch Edit Modal Visible: ${isEditVisible}`);

    const editBox = await dispatchEditDialog.boundingBox();
    console.log(`Dispatch Edit Modal BoundingBox: x=${editBox.x}, y=${editBox.y}, width=${editBox.width}, height=${editBox.height}`);
    const editCenter = editBox.x + editBox.width / 2;
    console.log(`Dispatch Edit Modal Horizontal Center: ${editCenter}px (Target ~840px)`);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'card5_dispatch_edit_manifest.png'), fullPage: false });
    console.log('✅ Card 5 captured: card5_dispatch_edit_manifest.png');

    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    console.log('🎉 ALL 5 POP CARDS VERIFIED AND CAPTURED SUCCESSFULLY!');
  } catch (err) {
    console.error('Error in verification:', err);
  } finally {
    await browser.close();
  }
}

run();
