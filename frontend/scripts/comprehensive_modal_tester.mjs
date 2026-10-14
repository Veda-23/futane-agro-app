import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('scratch/comprehensive_audit_screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log('🚀 Starting Universal Modal Audit...');
  const browser = await chromium.launch({ headless: true });
  // Test at standard desktop 1440x900 viewport
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // 1. Login
  console.log('Navigating to http://localhost:4300...');
  await page.goto('http://localhost:4300', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  if (await page.locator('#username').isVisible()) {
    console.log('Logging in as SUPER_ADMIN...');
    await page.fill('#username', 'SUPER_ADMIN');
    await page.fill('#password', 'superadmin123');
    await page.click('#login-submit-btn');
    await page.waitForSelector('.uat-otp-helper-pill', { timeout: 10000 });
    await page.click('.uat-otp-helper-pill');
    await page.click('#otp-verify-submit-btn');
    await page.waitForSelector('.sidebar', { timeout: 15000 });
    console.log('✅ Logged in successfully!');
  }

  const results = [];

  async function checkModal(tabName, cardName, triggerFn, modalSelector, backdropSelector) {
    console.log(`\n--------------------------------------------------`);
    console.log(`🔍 Checking [${tabName}] -> [${cardName}]`);
    try {
      // Trigger modal open
      await triggerFn();
      await page.waitForTimeout(600);

      // Check modal visibility
      const modal = page.locator(modalSelector).first();
      const isVisible = await modal.isVisible();

      const box = isVisible ? await modal.boundingBox() : null;
      const center = box ? Math.round(box.x + box.width / 2) : null;
      
      let computedStyles = null;
      if (isVisible) {
        computedStyles = await page.evaluate((sel) => {
          const el = document.querySelector(sel);
          if (!el) return null;
          const s = window.getComputedStyle(el);
          return {
            position: s.position,
            left: s.left,
            top: s.top,
            transform: s.transform,
            zIndex: s.zIndex,
            display: s.display,
            visibility: s.visibility,
            opacity: s.opacity
          };
        }, modalSelector);
      }

      let backdropBlur = null;
      if (backdropSelector) {
        backdropBlur = await page.evaluate((sel) => {
          const el = document.querySelector(sel);
          if (!el) return 'none (not found)';
          const s = window.getComputedStyle(el);
          return s.backdropFilter || s.webkitBackdropFilter || 'none';
        }, backdropSelector);
      }

      console.log(`   Visible: ${isVisible}`);
      console.log(`   Box:`, box);
      console.log(`   Center: ${center}px (Target for 1440w is 840px)`);
      console.log(`   Backdrop blur: ${backdropBlur}`);
      console.log(`   Computed styles:`, computedStyles);

      const shotName = `${tabName}_${cardName}.png`.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      const shotPath = path.join(SCREENSHOT_DIR, shotName);
      await page.screenshot({ path: shotPath });
      console.log(`   📸 Screenshot: ${shotName}`);

      results.push({
        tab: tabName,
        card: cardName,
        visible: isVisible,
        box,
        center,
        delta: center !== null ? Math.abs(center - 840) : 999,
        blur: backdropBlur,
        styles: computedStyles,
        shotName
      });

      // Close modal with Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);

      // If still open, try clicking backdrop or close button
      if (await modal.isVisible()) {
        const closeBtn = page.locator(`${modalSelector} .btn-close, ${modalSelector} button[aria-label="Close"], ${modalSelector} .header-close-btn`).first();
        if (await closeBtn.isVisible()) {
          await closeBtn.click();
        } else if (backdropSelector) {
          await page.click(backdropSelector, { position: { x: 50, y: 50 } }).catch(() => {});
        }
        await page.waitForTimeout(400);
      }
    } catch (e) {
      console.error(`   ❌ Error checking ${cardName}:`, e.message);
      results.push({
        tab: tabName,
        card: cardName,
        visible: false,
        error: e.message
      });
    }
  }

  // Tab switcher helper
  async function goToTab(tabKey, selector) {
    console.log(`\nNavigating to tab: ${tabKey}...`);
    await page.evaluate((key) => {
      // @ts-ignore
      const appRoot = document.querySelector('app-root');
      // @ts-ignore
      if (appRoot && window.ng) window.ng.getComponent(appRoot)?.switchTab(key);
    }, tabKey);
    await page.waitForSelector(selector, { timeout: 10000 });
    await page.waitForTimeout(600);
  }

  // ==========================================
  // BATCH 4 & 5 PRIORITY CHECKS
  // ==========================================

  // 1. Parties tab
  await goToTab('parties', 'app-party table');
  await checkModal('parties', 'client_master_dossier', async () => {
    const btn = page.locator('app-party .btn-action-dossier, app-party button[title*="dossier" i]').first();
    await btn.click();
  }, '.dossier-modal-container', '.dossier-modal-backdrop');

  await checkModal('parties', 'edit_party_account', async () => {
    const btn = page.locator('app-party .btn-action-edit, app-party button[title*="edit" i]').first();
    await btn.click();
  }, '.party-modal-dialog', '.party-modal-overlay');

  // 2. Dispatch tab
  await goToTab('dispatch', 'app-dispatch table');
  await checkModal('dispatch', 'delivery_challan_dossier', async () => {
    const btn = page.locator('app-dispatch .btn-row-action.btn-view, app-dispatch button[title*="challan" i]').first();
    await btn.click();
  }, '.dispatch-dossier-dialog', '.dispatch-modal-overlay');

  await checkModal('dispatch', 'edit_dispatch_manifest', async () => {
    const btn = page.locator('app-dispatch .btn-row-action.btn-edit, app-dispatch button[title*="edit" i]').first();
    await btn.click();
  }, '.dispatch-modal-dialog', '.dispatch-modal-overlay');

  // 3. Payments tab
  await goToTab('payments', 'app-payments table');
  await checkModal('payments', 'payment_receipt_voucher', async () => {
    const btn = page.locator('app-payments .btn-action-icon.view-icon, app-payments button[title*="voucher" i]').first();
    await btn.click();
  }, '.receipt-voucher-dialog', '.receipt-voucher-backdrop');

  await checkModal('payments', 'edit_payment_record', async () => {
    const btn = page.locator('app-payments .btn-action-icon.edit-icon, app-payments button[title*="edit" i]').first();
    await btn.click();
  }, '.payments-modal-dialog', '.payments-modal-overlay');

  // 4. Invoices tab
  await goToTab('invoices', 'app-invoices table');
  await checkModal('invoices', 'gst_tax_invoice_preview', async () => {
    const btn = page.locator('app-invoices .btn-row-action.btn-view, app-invoices button[title*="preview" i]').first();
    await btn.click();
  }, '.invoice-modal-card', '.invoice-modal-overlay');

  // 5. Bank tab
  await goToTab('bank', 'app-bank table');
  await checkModal('bank', 'bank_transaction_receipt', async () => {
    const btn = page.locator('app-bank .btn-action-icon.view-icon, app-bank button[title*="voucher" i]').first();
    await btn.click();
  }, '.voucher-modal-container', '.voucher-modal-backdrop');

  await checkModal('bank', 'edit_bank_entry', async () => {
    const btn = page.locator('app-bank .btn-action-icon.edit-icon, app-bank button[title*="edit" i]').first();
    await btn.click();
  }, '.enterprise-drawer', '.drawer-backdrop');

  // 6. Transport tab
  await goToTab('transports', 'app-transports table');
  await checkModal('transport', 'consignment_waybill', async () => {
    const btn = page.locator('app-transports .btn-row-action.btn-view').first();
    await btn.click();
  }, '.waybill-modal-dialog', '.modal-backdrop');

  await checkModal('transport', 'edit_transport_record', async () => {
    const btn = page.locator('app-transports .btn-row-action.btn-edit').first();
    await btn.click();
  }, '.slide-drawer', '.modal-backdrop');

  // 7. Drivers tab
  await goToTab('drivers', 'app-drivers table');
  await checkModal('drivers', 'edit_driver_profile', async () => {
    const btn = page.locator('app-drivers .btn-action-edit').first();
    await btn.click();
  }, '.slide-drawer', '.drawer-backdrop');

  // 8. Vendors tab
  await goToTab('vendors', 'app-vendors table');
  await checkModal('vendors', 'supplier_commercial_dossier', async () => {
    const btn = page.locator('app-vendors .btn-action-dossier, app-vendors button[title*="dossier" i]').first();
    await btn.click();
  }, '.dossier-modal-container', '.dossier-modal-backdrop');

  await checkModal('vendors', 'edit_supplier_profile', async () => {
    const btn = page.locator('app-vendors .btn-action-edit, app-vendors button[title*="edit" i]').first();
    await btn.click();
  }, '.modal-dialog-custom, .vendors-modal-dialog, [role="dialog"]', '.modal-backdrop-custom, .vendors-modal-overlay');

  // 9. Raw Materials tab
  await goToTab('raw-materials', 'app-raw-materials table');
  await checkModal('raw_materials', 'grn_material_inward', async () => {
    const btn = page.locator('app-raw-materials .btn-action-icon.view-icon, app-raw-materials button[title*="GRN" i]').first();
    await btn.click();
  }, '.grn-voucher-dialog', '.grn-voucher-backdrop');

  // 10. Production tab
  await goToTab('production', 'app-production table');
  await checkModal('production', 'batch_qc_dossier', async () => {
    const btn = page.locator('app-production .btn-action-icon.view-icon, app-production button[title*="dossier" i]').first();
    await btn.click();
  }, '.dossier-modal-container', '.dossier-modal-backdrop');

  console.log('\n===============================================================');
  console.log('🏁 AUDIT REPORT SUMMARY:');
  console.log(JSON.stringify(results, null, 2));

  await browser.close();
}

run().catch(console.error);
