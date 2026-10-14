import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('scratch/all_shared_images_qa');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log('🚀 Running comprehensive audit on all shared pop cards...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const results = [];

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

    // Helper to evaluate pop card metrics
    async function evaluateCard(cardName, modalSelector, backdropSelector) {
      const modal = page.locator(modalSelector).first();
      await modal.waitFor({ state: 'visible', timeout: 7000 });
      const box = await modal.boundingBox();
      const center = box ? Math.round(box.x + box.width / 2) : 0;
      
      let blur = 'none';
      if (backdropSelector) {
        blur = await page.evaluate((sel) => {
          const el = document.querySelector(sel);
          if (!el) return 'not found';
          const style = window.getComputedStyle(el);
          return style.backdropFilter || style.webkitBackdropFilter || 'none';
        }, backdropSelector);
      }

      const zIndex = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        return el ? window.getComputedStyle(el).zIndex : 'auto';
      }, modalSelector);

      console.log(`\n📌 [${cardName}]`);
      console.log(`   Box: x=${Math.round(box.x)}, width=${Math.round(box.width)}, Center=${center}px (Target: 840px)`);
      console.log(`   Backdrop blur: ${blur}`);
      console.log(`   z-index: ${zIndex}`);

      const screenshotFile = `${cardName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.png`;
      const screenshotPath = path.join(SCREENSHOT_DIR, screenshotFile);
      await page.screenshot({ path: screenshotPath });
      console.log(`   📸 Screenshot saved: ${screenshotFile}`);

      results.push({ cardName, box, center, blur, zIndex, screenshotFile });
    }

    // ── BATCH 3, CARD 1: Payment Registry - Payment Receipt Voucher ──
    console.log('\nNavigating to Payment Registry...');
    await page.click('.nav-item:has-text("Payment Registry"), li:has-text("Payment Registry")');
    await page.waitForSelector('app-payments table', { timeout: 10000 });
    await page.waitForTimeout(800);

    const viewReceiptBtn = page.locator('app-payments .btn-action-icon.view-icon, app-payments button[title*="voucher" i]').first();
    if (await viewReceiptBtn.isVisible()) {
      await viewReceiptBtn.click();
      await page.waitForTimeout(600);
      await evaluateCard('Batch3_Card1_Payment_Receipt_Voucher', '.receipt-voucher-dialog', '.receipt-voucher-backdrop');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    }

    // ── BATCH 3, CARD 2: Payment Registry - Edit Payment Record ──
    const editPaymentBtn = page.locator('app-payments .btn-action-icon.edit-icon, app-payments button[title*="edit" i]').first();
    if (await editPaymentBtn.isVisible()) {
      await editPaymentBtn.click();
      await page.waitForTimeout(600);
      await evaluateCard('Batch3_Card2_Edit_Payment_Record', '.payments-modal-dialog', '.payments-modal-overlay');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    }

    // ── BATCH 3, CARD 3: Invoices - GST Tax Invoice Preview ──
    console.log('\nNavigating to Invoices...');
    await page.click('.nav-item:has-text("Invoices"), li:has-text("Invoices")');
    await page.waitForSelector('app-invoices table', { timeout: 10000 });
    await page.waitForTimeout(800);

    const viewInvoiceBtn = page.locator('app-invoices .btn-row-action.btn-view, app-invoices button[title*="preview" i], app-invoices .invoice-num-cell button').first();
    if (await viewInvoiceBtn.isVisible()) {
      await viewInvoiceBtn.click();
      await page.waitForTimeout(600);
      await evaluateCard('Batch3_Card3_GST_Tax_Invoice_Preview', '.invoice-modal-card', '.invoice-modal-overlay');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    }

    // ── BATCH 3, CARD 4: Bank Ledger - Transaction Receipt Voucher ──
    console.log('\nNavigating to Bank Ledger...');
    await page.click('.nav-item:has-text("Bank Ledger"), li:has-text("Bank Ledger")');
    await page.waitForSelector('app-bank table', { timeout: 10000 });
    await page.waitForTimeout(800);

    const viewBankVoucherBtn = page.locator('app-bank .btn-action-icon.view-icon, app-bank button[title*="voucher" i]').first();
    if (await viewBankVoucherBtn.isVisible()) {
      await viewBankVoucherBtn.click();
      await page.waitForTimeout(600);
      await evaluateCard('Batch3_Card4_Bank_Transaction_Receipt', '.voucher-modal-container', '.voucher-modal-backdrop');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    }

    // ── BATCH 3, CARD 5: Bank Ledger - Edit Bank Entry ──
    const editBankEntryBtn = page.locator('app-bank .btn-action-icon.edit-icon, app-bank button[title*="edit" i]').first();
    if (await editBankEntryBtn.isVisible()) {
      await editBankEntryBtn.click();
      await page.waitForTimeout(600);
      await evaluateCard('Batch3_Card5_Edit_Bank_Entry', '.enterprise-drawer', '.drawer-backdrop');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    }

    // ── BATCH 2, CARD 1: Transport - Consignment Waybill ──
    console.log('\nNavigating to Transport...');
    await page.click('.nav-item:has-text("Transport"), li:has-text("Transport")');
    await page.waitForSelector('app-transports table', { timeout: 10000 });
    await page.waitForTimeout(800);

    const waybillBtn = page.locator('app-transports .btn-row-action.btn-view').first();
    if (await waybillBtn.isVisible()) {
      await waybillBtn.click();
      await page.waitForTimeout(600);
      await evaluateCard('Batch2_Card1_Transport_Waybill', '.waybill-modal-dialog', '.modal-backdrop');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    }

    // ── BATCH 2, CARD 2: Transport - Edit Transport Record ──
    const editTripBtn = page.locator('app-transports .btn-row-action.btn-edit').first();
    if (await editTripBtn.isVisible()) {
      await editTripBtn.click();
      await page.waitForTimeout(600);
      await evaluateCard('Batch2_Card2_Edit_Transport_Drawer', '.slide-drawer', '.modal-backdrop');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    }

    // ── BATCH 2, CARD 3: Drivers - Edit Driver Profile ──
    console.log('\nNavigating to Drivers...');
    await page.click('.nav-item:has-text("Drivers"), li:has-text("Drivers")');
    await page.waitForSelector('app-drivers table', { timeout: 10000 });
    await page.waitForTimeout(800);

    const editDriverBtn = page.locator('app-drivers .btn-action-edit').first();
    if (await editDriverBtn.isVisible()) {
      await editDriverBtn.click();
      await page.waitForTimeout(600);
      await evaluateCard('Batch2_Card3_Edit_Driver_Profile', '.slide-drawer', '.drawer-backdrop');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    }

    // ── BATCH 2, CARD 4: Parties - Client Master Dossier ──
    console.log('\nNavigating to Parties...');
    await page.click('.nav-item:has-text("Parties"), li:has-text("Parties")');
    await page.waitForSelector('app-party table', { timeout: 10000 });
    await page.waitForTimeout(800);

    const dossierBtn = page.locator('app-party .btn-action-dossier, app-party button[title*="dossier" i]').first();
    if (await dossierBtn.isVisible()) {
      await dossierBtn.click();
      await page.waitForTimeout(600);
      await evaluateCard('Batch2_Card4_Party_Client_Dossier', '.dossier-modal-container', '.dossier-modal-overlay');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    }

    // ── BATCH 2, CARD 5: Parties - Edit Party Account ──
    const editPartyBtn = page.locator('app-party .btn-action-edit, app-party button[title*="edit" i]').first();
    if (await editPartyBtn.isVisible()) {
      await editPartyBtn.click();
      await page.waitForTimeout(600);
      await evaluateCard('Batch2_Card5_Edit_Party_Account', '.party-modal-dialog', '.party-modal-overlay');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    }

    // ── BATCH 1, CARD 4: Dispatch - Delivery Challan Dossier ──
    console.log('\nNavigating to Dispatch...');
    await page.click('.nav-item:has-text("Dispatch"), li:has-text("Dispatch")');
    await page.waitForSelector('app-dispatch table', { timeout: 10000 });
    await page.waitForTimeout(800);

    const challanBtn = page.locator('app-dispatch .btn-row-action.btn-view, app-dispatch button[title*="challan" i]').first();
    if (await challanBtn.isVisible()) {
      await challanBtn.click();
      await page.waitForTimeout(600);
      await evaluateCard('Batch1_Card4_Delivery_Challan_Dossier', '.dispatch-dossier-dialog', '.dispatch-modal-overlay');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    }

    // ── BATCH 1, CARD 5: Dispatch - Edit Dispatch Manifest ──
    const editDispatchBtn = page.locator('app-dispatch .btn-row-action.btn-edit, app-dispatch button[title*="edit" i]').first();
    if (await editDispatchBtn.isVisible()) {
      await editDispatchBtn.click();
      await page.waitForTimeout(600);
      await evaluateCard('Batch1_Card5_Edit_Dispatch_Manifest', '.dispatch-modal-dialog', '.dispatch-modal-overlay');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    }

    console.log('\n======================================================');
    console.log('✅ ALL TESTED POP CARDS SUMMARY:');
    console.table(results.map(r => ({
      Card: r.cardName,
      X: Math.round(r.box.x),
      Width: Math.round(r.box.width),
      Center: r.center,
      Target: 840,
      Delta: Math.abs(r.center - 840),
      Blur: r.blur.includes('blur'),
      ZIndex: r.zIndex
    })));

  } catch (err) {
    console.error('❌ Error during test execution:', err);
  } finally {
    await browser.close();
  }
}

run();
