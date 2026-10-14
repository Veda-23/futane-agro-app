import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('scratch/all_shared_images_qa');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log('🚀 Running Playwright visual & architectural audit on all shared pop cards...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const auditLog = [];

  try {
    // 1. Login flow
    await page.goto('http://localhost:4300', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    if (await page.locator('#username').isVisible()) {
      await page.fill('#username', 'SUPER_ADMIN');
      await page.fill('#password', 'superadmin123');
      await page.click('#login-submit-btn');
      await page.waitForSelector('.uat-otp-helper-pill', { timeout: 10000 });
      await page.click('.uat-otp-helper-pill');
      await page.click('#otp-verify-submit-btn');
      await page.waitForSelector('app-sidebar', { timeout: 15000 });
      console.log('✅ Logged in successfully!');
    }
    await page.waitForTimeout(1200);

    async function inspectAndCapture(name, modalSel, backdropSel) {
      await page.waitForSelector(modalSel, { state: 'visible', timeout: 8000 });
      await page.waitForTimeout(400); // allow spring animation to finish
      const modal = page.locator(modalSel).first();
      const box = await modal.boundingBox();
      const center = box ? Math.round(box.x + box.width / 2) : 0;
      
      const metrics = await page.evaluate(({ mSel, bSel }) => {
        const mEl = document.querySelector(mSel);
        const bEl = bSel ? document.querySelector(bSel) : null;
        const mStyle = mEl ? window.getComputedStyle(mEl) : null;
        const bStyle = bEl ? window.getComputedStyle(bEl) : null;
        return {
          mZIndex: mStyle ? mStyle.zIndex : null,
          bBlur: bStyle ? (bStyle.backdropFilter || bStyle.webkitBackdropFilter) : null,
          bZIndex: bStyle ? bStyle.zIndex : null
        };
      }, { mSel: modalSel, bSel: backdropSel });

      const file = `${name}.png`;
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, file) });

      const delta = Math.abs(center - 840);
      const isPerfect = delta <= 2;
      console.log(`[${name}] X=${Math.round(box.x)} W=${Math.round(box.width)} Center=${center}px (Target: 840px, Delta: ${delta}px) | Blur: ${metrics.bBlur} | Z: ${metrics.mZIndex} | ${isPerfect ? '✅ PASS' : '⚠️ CHECK'}`);
      
      auditLog.push({
        Name: name,
        X: Math.round(box.x),
        Width: Math.round(box.width),
        Center: center,
        Target: 840,
        Delta: delta,
        Blur: metrics.bBlur || 'N/A',
        ZIndex: metrics.mZIndex,
        Status: isPerfect ? 'PASS' : 'WARN'
      });
    }

    // ── 1. Payment Registry — Image 1 (Payment Receipt Voucher) ──
    console.log('\nNavigating to Payment Registry...');
    await page.locator('app-sidebar li:has-text("Payment Registry")').click();
    await page.waitForTimeout(1200);

    console.log('Testing Image 1: Payment Receipt Voucher...');
    const voucherBtn = page.locator('app-payments .btn-action-voucher').first();
    if (await voucherBtn.isVisible()) {
      await voucherBtn.click();
      await inspectAndCapture('01_payment_receipt_voucher', '.receipt-voucher-dialog', '.receipt-voucher-backdrop');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    // ── 2. Payment Registry — Image 2 (Edit Payment Record) ──
    console.log('Testing Image 2: Edit Payment Record...');
    const editPaymentBtn = page.locator('app-payments .btn-action-edit').first();
    if (await editPaymentBtn.isVisible()) {
      await editPaymentBtn.click();
      await inspectAndCapture('02_edit_payment_record', '.payments-modal-dialog', '.payments-modal-overlay');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    // ── 3. Invoices — Image 3 (GST Tax Invoice Preview) ──
    console.log('\nNavigating to Invoices...');
    await page.locator('app-sidebar li:has-text("Invoices")').click();
    await page.waitForTimeout(1200);

    console.log('Testing Image 3: GST Tax Invoice Preview...');
    const viewInvBtn = page.locator('app-invoices .btn-icon-action.btn-view').first();
    if (await viewInvBtn.isVisible()) {
      await viewInvBtn.click();
      await inspectAndCapture('03_gst_tax_invoice_preview', '.invoice-modal-card', '.invoice-modal-overlay');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    // ── 4. Bank Ledger — Image 4 (Bank Transaction Receipt) ──
    console.log('\nNavigating to Bank Ledger...');
    await page.locator('app-sidebar li:has-text("Bank Ledger")').click();
    await page.waitForTimeout(1200);

    console.log('Testing Image 4: Bank Transaction Receipt Voucher...');
    const viewBankBtn = page.locator('app-bank .btn-action-icon.view-icon').first();
    if (await viewBankBtn.isVisible()) {
      await viewBankBtn.click();
      await inspectAndCapture('04_bank_transaction_receipt', '.voucher-modal-container', '.voucher-modal-backdrop');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    // ── 5. Bank Ledger — Image 5 (Edit Bank Entry Drawer) ──
    console.log('Testing Image 5: Edit Bank Entry Drawer...');
    const editBankBtn = page.locator('app-bank .btn-action-icon.edit-icon').first();
    if (await editBankBtn.isVisible()) {
      await editBankBtn.click();
      await inspectAndCapture('05_edit_bank_entry_drawer', '.enterprise-drawer', '.drawer-backdrop');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    // ── 6. Transport — Batch 2 Image 1 (Waybill Slip) ──
    console.log('\nNavigating to Transport...');
    await page.locator('app-sidebar li:has-text("Transport")').click();
    await page.waitForTimeout(1200);

    const waybillBtn = page.locator('app-transports .btn-row-action.btn-view').first();
    if (await waybillBtn.isVisible()) {
      await waybillBtn.click();
      await inspectAndCapture('06_transport_waybill_slip', '.waybill-modal-dialog', '.modal-backdrop');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    // ── 7. Transport — Batch 2 Image 2 (Edit Transport Record) ──
    const editTripBtn = page.locator('app-transports .btn-row-action.btn-edit').first();
    if (await editTripBtn.isVisible()) {
      await editTripBtn.click();
      await inspectAndCapture('07_edit_transport_drawer', '.slide-drawer', '.modal-backdrop');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    // ── 8. Drivers — Batch 2 Image 3 (Edit Driver Profile) ──
    console.log('\nNavigating to Drivers...');
    await page.locator('app-sidebar li:has-text("Drivers")').click();
    await page.waitForTimeout(1200);

    const editDriverBtn = page.locator('app-drivers .btn-action-edit').first();
    if (await editDriverBtn.isVisible()) {
      await editDriverBtn.click();
      await inspectAndCapture('08_edit_driver_drawer', '.slide-drawer', '.drawer-backdrop');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    // ── 9. Parties — Batch 2 Image 4 (Client Master Dossier) ──
    console.log('\nNavigating to Parties...');
    await page.locator('app-sidebar li:has-text("Parties")').click();
    await page.waitForTimeout(1200);

    const dossierBtn = page.locator('app-party .btn-action-dossier').first();
    if (await dossierBtn.isVisible()) {
      await dossierBtn.click();
      await inspectAndCapture('09_client_master_dossier', '.dossier-modal-container', '.dossier-modal-overlay');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    // ── 10. Parties — Batch 2 Image 5 (Edit Party Account) ──
    const editPartyBtn = page.locator('app-party .btn-action-edit').first();
    if (await editPartyBtn.isVisible()) {
      await editPartyBtn.click();
      await inspectAndCapture('10_edit_party_modal', '.party-modal-dialog', '.party-modal-overlay');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    // ── 11. Dispatch — Batch 1 Image 4 (Delivery Challan Dossier) ──
    console.log('\nNavigating to Dispatch...');
    await page.locator('app-sidebar li:has-text("Dispatch")').click();
    await page.waitForTimeout(1200);

    const challanBtn = page.locator('app-dispatch .btn-row-action.btn-view').first();
    if (await challanBtn.isVisible()) {
      await challanBtn.click();
      await inspectAndCapture('11_dispatch_challan_dossier', '.dispatch-dossier-dialog', '.dispatch-modal-overlay');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    // ── 12. Dispatch — Batch 1 Image 5 (Edit Dispatch Manifest) ──
    const editDispatchBtn = page.locator('app-dispatch .btn-row-action.btn-edit').first();
    if (await editDispatchBtn.isVisible()) {
      await editDispatchBtn.click();
      await inspectAndCapture('12_edit_dispatch_manifest', '.dispatch-modal-dialog', '.dispatch-modal-overlay');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    console.log('\n======================================================');
    console.log('🏆 COMPREHENSIVE EMPIRICAL VERIFICATION RESULTS:');
    console.table(auditLog);

  } catch (err) {
    console.error('❌ Error during test execution:', err);
  } finally {
    await browser.close();
  }
}

run();
