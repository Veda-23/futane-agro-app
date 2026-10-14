import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('scratch/all_shared_images_qa');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log('🚀 Running robust empirical verification on all user pop cards...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const auditLog = [];

  try {
    // 1. Login flow
    await page.goto('http://localhost:4300', { waitUntil: 'networkidle' });
    if (await page.locator('#username').isVisible()) {
      await page.fill('#username', 'SUPER_ADMIN');
      await page.fill('#password', 'superadmin123');
      await page.click('#login-submit-btn');
      await page.waitForSelector('.uat-otp-helper-pill', { timeout: 10000 });
      await page.click('.uat-otp-helper-pill');
      await page.click('#otp-verify-submit-btn');
      await page.waitForSelector('.sidebar, .app-header', { timeout: 15000 });
      console.log('✅ Logged in successfully!');
    }
    await page.waitForTimeout(1000);

    // Helper to switch tab
    async function switchTab(tabName) {
      await page.evaluate((t) => {
        // @ts-ignore
        const app = window.ng?.getComponent(document.querySelector('app-root'));
        if (app) app.switchTab(t);
      }, tabName);
      await page.waitForTimeout(1000);
    }

    // Helper to evaluate and capture pop card
    async function inspectAndCapture(name, modalSel, backdropSel) {
      await page.waitForSelector(modalSel, { state: 'visible', timeout: 5000 });
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
      console.log(`[${name}] Center=${center}px (Delta: ${delta}px) | Blur: ${metrics.bBlur} | Z: ${metrics.mZIndex} | ${isPerfect ? '✅ PERFECT' : '⚠️ CHECK'}`);
      
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

    // ── BATCH 3: CARD 1 - Payment Receipt Voucher ──
    console.log('\n--- BATCH 3: PAYMENT REGISTRY ---');
    await switchTab('payments');
    await page.evaluate(() => {
      // @ts-ignore
      const comp = window.ng?.getComponent(document.querySelector('app-payments'));
      if (comp && comp.paymentsList && comp.paymentsList.length > 0) {
        comp.openVoucherModal(comp.paymentsList[0]);
      }
    });
    await inspectAndCapture('01_payment_receipt_voucher', '.receipt-voucher-dialog', '.receipt-voucher-backdrop');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // ── BATCH 3: CARD 2 - Edit Payment Record ──
    await page.evaluate(() => {
      // @ts-ignore
      const comp = window.ng?.getComponent(document.querySelector('app-payments'));
      if (comp && comp.paymentsList && comp.paymentsList.length > 0) {
        comp.editPayment(comp.paymentsList[0]);
      }
    });
    await inspectAndCapture('02_edit_payment_record', '.payments-modal-dialog', '.payments-modal-overlay');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // ── BATCH 3: CARD 3 - GST Tax Invoice Preview ──
    console.log('\n--- BATCH 3: INVOICES ---');
    await switchTab('invoices');
    await page.evaluate(() => {
      // @ts-ignore
      const comp = window.ng?.getComponent(document.querySelector('app-invoices'));
      if (comp && comp.invoicesList && comp.invoicesList.length > 0) {
        comp.viewInvoice(comp.invoicesList[0]);
      }
    });
    await inspectAndCapture('03_gst_tax_invoice_preview', '.invoice-modal-card', '.invoice-modal-overlay');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // ── BATCH 3: CARD 4 - Bank Transaction Receipt Voucher ──
    console.log('\n--- BATCH 3: BANK LEDGER ---');
    await switchTab('bank');
    await page.evaluate(() => {
      // @ts-ignore
      const comp = window.ng?.getComponent(document.querySelector('app-bank'));
      if (comp && comp.bankTransactionsList && comp.bankTransactionsList.length > 0) {
        comp.openViewModal(comp.bankTransactionsList[0]);
      }
    });
    await inspectAndCapture('04_bank_transaction_receipt', '.voucher-modal-container', '.voucher-modal-backdrop');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // ── BATCH 3: CARD 5 - Edit Bank Entry Drawer ──
    await page.evaluate(() => {
      // @ts-ignore
      const comp = window.ng?.getComponent(document.querySelector('app-bank'));
      if (comp && comp.bankTransactionsList && comp.bankTransactionsList.length > 0) {
        comp.editBankTransaction(comp.bankTransactionsList[0]);
      }
    });
    await inspectAndCapture('05_edit_bank_entry_drawer', '.enterprise-drawer', '.drawer-backdrop');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // ── BATCH 2: CARD 1 - Transport Waybill ──
    console.log('\n--- BATCH 2: TRANSPORT & LOGISTICS ---');
    await switchTab('transports');
    await page.evaluate(() => {
      // @ts-ignore
      const comp = window.ng?.getComponent(document.querySelector('app-transports'));
      if (comp && comp.transportsList && comp.transportsList.length > 0) {
        comp.openViewModal(comp.transportsList[0]);
      }
    });
    await inspectAndCapture('06_transport_waybill_slip', '.waybill-modal-dialog', '.modal-backdrop');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // ── BATCH 2: CARD 2 - Edit Transport Drawer ──
    await page.evaluate(() => {
      // @ts-ignore
      const comp = window.ng?.getComponent(document.querySelector('app-transports'));
      if (comp && comp.transportsList && comp.transportsList.length > 0) {
        comp.editTransport(comp.transportsList[0]);
      }
    });
    await inspectAndCapture('07_edit_transport_drawer', '.slide-drawer', '.modal-backdrop');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // ── BATCH 2: CARD 3 - Edit Driver Profile Drawer ──
    console.log('\n--- BATCH 2: DRIVERS ---');
    await switchTab('drivers');
    await page.evaluate(() => {
      // @ts-ignore
      const comp = window.ng?.getComponent(document.querySelector('app-drivers'));
      if (comp && comp.driversList && comp.driversList.length > 0) {
        comp.openEditDrawer(comp.driversList[0]);
      }
    });
    await inspectAndCapture('08_edit_driver_drawer', '.slide-drawer', '.drawer-backdrop');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // ── BATCH 2: CARD 4 - Client Master Dossier ──
    console.log('\n--- BATCH 2: PARTIES ---');
    await switchTab('parties');
    await page.evaluate(() => {
      // @ts-ignore
      const comp = window.ng?.getComponent(document.querySelector('app-party'));
      if (comp && comp.partiesList && comp.partiesList.length > 0) {
        comp.openDossierModal(comp.partiesList[0]);
      }
    });
    await inspectAndCapture('09_client_master_dossier', '.dossier-modal-container', '.dossier-modal-overlay');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // ── BATCH 2: CARD 5 - Edit Party Account Modal ──
    await page.evaluate(() => {
      // @ts-ignore
      const comp = window.ng?.getComponent(document.querySelector('app-party'));
      if (comp && comp.partiesList && comp.partiesList.length > 0) {
        comp.editParty(comp.partiesList[0]);
      }
    });
    await inspectAndCapture('10_edit_party_modal', '.party-modal-dialog', '.party-modal-overlay');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // ── BATCH 1: CARD 4 - Delivery Challan Dossier ──
    console.log('\n--- BATCH 1: DISPATCH ---');
    await switchTab('dispatch');
    await page.evaluate(() => {
      // @ts-ignore
      const comp = window.ng?.getComponent(document.querySelector('app-dispatch'));
      if (comp && comp.dispatches && comp.dispatches.length > 0) {
        comp.viewDispatch(comp.dispatches[0]);
      }
    });
    await inspectAndCapture('11_dispatch_challan_dossier', '.dispatch-dossier-dialog', '.dispatch-modal-overlay');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // ── BATCH 1: CARD 5 - Edit Dispatch Manifest ──
    await page.evaluate(() => {
      // @ts-ignore
      const comp = window.ng?.getComponent(document.querySelector('app-dispatch'));
      if (comp && comp.dispatches && comp.dispatches.length > 0) {
        comp.editDispatch(comp.dispatches[0]);
      }
    });
    await inspectAndCapture('12_edit_dispatch_manifest', '.dispatch-modal-dialog', '.dispatch-modal-overlay');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    console.log('\n======================================================');
    console.log('🏆 COMPREHENSIVE VERIFICATION RESULTS TABLE:');
    console.table(auditLog);

  } catch (err) {
    console.error('❌ Error during test execution:', err);
  } finally {
    await browser.close();
  }
}

run();
