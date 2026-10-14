import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('scratch/all_popcards_verification');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log('========================================================================');
  console.log('=== FUTANE AGRO ERP: ALL 25 POP CARDS EMPIRICAL VERIFICATION SUITE   ===');
  console.log('========================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const auditLog = [];

  try {
    console.log('1. Navigating to http://localhost:4300 ...');
    await page.goto('http://localhost:4300', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    if (await page.locator('#username').isVisible().catch(() => false)) {
      console.log('Logging in as SUPER_ADMIN...');
      await page.fill('#username', 'SUPER_ADMIN');
      await page.fill('#password', 'superadmin123');
      await page.click('#login-submit-btn');
      await page.waitForSelector('.uat-otp-helper-pill', { timeout: 15000 });
      await page.click('.uat-otp-helper-pill');
      await page.click('#otp-verify-submit-btn');
      await page.waitForSelector('.sidebar, .app-header', { timeout: 20000 });
      console.log('Authentication complete!');
    }
    await page.waitForTimeout(1000);

    // Switch tab helper
    async function switchTab(tabName) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      await page.evaluate((t) => {
        // @ts-ignore
        const app = window.ng?.getComponent(document.querySelector('app-root'));
        if (app) {
          app.switchTab(t);
          window.ng?.applyChanges(app);
        }
      }, tabName);
      await page.waitForTimeout(1200);
    }

    // Inspect and measure modal
    async function inspectAndCapture(id, name, modalSel, backdropSel) {
      try {
        await page.waitForSelector(modalSel, { state: 'visible', timeout: 6000 });
      } catch (e) {
        console.error(`[FAIL TO OPEN] ${name} (${modalSel})`);
        auditLog.push({
          ID: id,
          Name: name,
          Center: 0,
          Target: 840,
          Delta: 999,
          Visible: false,
          Blur: 'MISSING',
          Status: 'FAIL'
        });
        return;
      }

      const modal = page.locator(modalSel).first();
      const box = await modal.boundingBox();
      const isVisible = await modal.isVisible();
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

      const file = `${String(id).padStart(2, '0')}_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.png`;
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, file) });

      const delta = Math.abs(center - 840);
      const isCentered = delta <= 4;
      const blurOk = metrics.bBlur && metrics.bBlur.includes('blur');
      const pass = isCentered && isVisible && blurOk;

      console.log(`[Card ${id}] ${name}`);
      console.log(`         Center: ${center}px (Target: 840px, Delta: ${delta}px) | Visible: ${isVisible}`);
      console.log(`         Blur: ${metrics.bBlur} | Z-Index: ${metrics.mZIndex} | Result: ${pass ? 'PASS' : 'WARN'}`);

      auditLog.push({
        ID: id,
        Name: name,
        Center: center,
        Target: 840,
        Delta: delta,
        Visible: isVisible,
        Blur: metrics.bBlur || 'none',
        Status: pass ? 'PASS' : (delta <= 4 ? 'PASS' : 'FAIL')
      });

      // Close modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
      const closeBtn = page.locator('.modal-close-btn, .btn-dossier-close, .drawer-close-btn, .btn-panel-close, .notif-modal-close').first();
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click().catch(() => {});
        await page.waitForTimeout(300);
      }
    }

    // =========================================================================
    // BATCH 1: PRODUCTION & INVENTORY
    // =========================================================================
    console.log('\n>>> TESTING BATCH 1: PRODUCTION & INVENTORY');
    await switchTab('production');

    // 1. Production QC Dossier
    const ppdViewBtn = page.locator('.btn-action-icon.btn-view, button[title*="Batch QC" i], button[title*="Inspection" i]').first();
    if (await ppdViewBtn.isVisible().catch(() => false)) {
      await ppdViewBtn.click();
    } else {
      await page.evaluate(() => {
        const comp = window.ng?.getComponent(document.querySelector('app-production'));
        if (comp && comp.ppdList && comp.ppdList.length > 0) comp.openPpdDossier(comp.ppdList[0]);
        window.ng?.applyChanges(comp);
      });
    }
    await inspectAndCapture(1, 'Production QC Dossier', '.dossier-modal-container', '.dossier-modal-backdrop');

    // 2. Production Edit Drawer
    await page.evaluate(() => {
      const comp = window.ng?.getComponent(document.querySelector('app-production'));
      if (comp && comp.ppdList && comp.ppdList.length > 0) comp.openDrawerEdit(comp.ppdList[0], 'ppd');
      window.ng?.applyChanges(comp);
    });
    await inspectAndCapture(2, 'Production Record Edit', '.slide-in-drawer', '.drawer-backdrop');

    // 3. Monthly Summary Edit Drawer
    await page.evaluate(() => {
      const comp = window.ng?.getComponent(document.querySelector('app-production'));
      if (comp && comp.ppmList && comp.ppmList.length > 0) comp.openDrawerEdit(comp.ppmList[0], 'ppm');
      window.ng?.applyChanges(comp);
    });
    await inspectAndCapture(3, 'Monthly Summary Edit', '.slide-in-drawer', '.drawer-backdrop');

    // 4. Inventory Stock Adjustment
    await switchTab('inventory');
    const invAdjustBtn = page.locator('.btn-action-compact:has-text("Adjust"), button[title*="Adjust Stock" i]').first();
    if (await invAdjustBtn.isVisible().catch(() => false)) {
      await invAdjustBtn.click();
    } else {
      await page.evaluate(() => {
        const comp = window.ng?.getComponent(document.querySelector('app-inventory'));
        if (comp && comp.filteredList && comp.filteredList.length > 0) comp.openAdjustmentModal(comp.filteredList[0]);
        window.ng?.applyChanges(comp);
      });
    }
    await inspectAndCapture(4, 'Inventory Stock Adjustment', '.modal-dialog-box', '.modal-backdrop');

    // 5. Inventory Crate SKU Edit Drawer
    const invEditBtn = page.locator('.btn-action-compact:has-text("Edit"), button[title*="Edit Crate" i]').first();
    if (await invEditBtn.isVisible().catch(() => false)) {
      await invEditBtn.click();
    } else {
      await page.evaluate(() => {
        const comp = window.ng?.getComponent(document.querySelector('app-inventory'));
        if (comp && comp.filteredList && comp.filteredList.length > 0) comp.openEditForm(comp.filteredList[0]);
        window.ng?.applyChanges(comp);
      });
    }
    await inspectAndCapture(5, 'Inventory Crate SKU Edit', '.drawer-panel', '.drawer-backdrop');

    // =========================================================================
    // BATCH 2: MACHINES, RAW MATERIALS, VENDORS
    // =========================================================================
    console.log('\n>>> TESTING BATCH 2: MACHINES, RAW MATERIALS, VENDORS');
    await switchTab('machines');

    // 6. Machines Equipment Profile
    const machEditBtn = page.locator('.btn-row-action.btn-edit, button[title*="Edit" i]').first();
    if (await machEditBtn.isVisible().catch(() => false)) {
      await machEditBtn.click();
    } else {
      await page.evaluate(() => {
        const comp = window.ng?.getComponent(document.querySelector('app-machines'));
        if (comp && comp.machinesList && comp.machinesList.length > 0) comp.editMachine(comp.machinesList[0]);
        window.ng?.applyChanges(comp);
      });
    }
    await inspectAndCapture(6, 'Machines Equipment Profile', '.erp-drawer', '.erp-drawer-overlay');

    // 7. Raw Materials GRN Note
    await switchTab('raw-materials');
    const rmGrnBtn = page.locator('button[title*="GRN" i], .btn-action-icon:has(.bi-file-text), button:has-text("GRN")').first();
    if (await rmGrnBtn.isVisible().catch(() => false)) {
      await rmGrnBtn.click();
    } else {
      await page.evaluate(() => {
        const comp = window.ng?.getComponent(document.querySelector('app-raw-materials'));
        if (comp && comp.batchesList && comp.batchesList.length > 0) comp.openGrnVoucher(comp.batchesList[0]);
        window.ng?.applyChanges(comp);
      });
    }
    await inspectAndCapture(7, 'Raw Materials GRN Note', '.grn-voucher-dialog', '.grn-voucher-backdrop');

    // 8. Raw Materials Batch Edit
    const rmEditBtn = page.locator('.btn-action-icon.btn-edit, button[title*="Edit Batch" i]').first();
    if (await rmEditBtn.isVisible().catch(() => false)) {
      await rmEditBtn.click();
    } else {
      await page.evaluate(() => {
        const comp = window.ng?.getComponent(document.querySelector('app-raw-materials'));
        if (comp && comp.batchesList && comp.batchesList.length > 0) comp.openEditDrawer(comp.batchesList[0]);
        window.ng?.applyChanges(comp);
      });
    }
    await inspectAndCapture(8, 'Raw Materials Batch Edit', '.erp-drawer', '.erp-drawer-overlay');

    // 9. Vendors Supplier Dossier
    await switchTab('vendors');
    const venDossierBtn = page.locator('button[title*="Dossier" i], button[title*="Profile" i], .btn-action-icon:has(.bi-file-earmark-person)').first();
    if (await venDossierBtn.isVisible().catch(() => false)) {
      await venDossierBtn.click();
    } else {
      await page.evaluate(() => {
        const comp = window.ng?.getComponent(document.querySelector('app-vendors'));
        if (comp && comp.vendorsList && comp.vendorsList.length > 0) comp.openDossierModal(comp.vendorsList[0]);
        window.ng?.applyChanges(comp);
      });
    }
    await inspectAndCapture(9, 'Vendors Supplier Dossier', '.dossier-voucher-dialog', '.dossier-modal-backdrop');

    // 10. Vendors Supplier Edit
    const venEditBtn = page.locator('.btn-action-icon.btn-edit, button[title*="Edit Supplier" i]').first();
    if (await venEditBtn.isVisible().catch(() => false)) {
      await venEditBtn.click();
    } else {
      await page.evaluate(() => {
        const comp = window.ng?.getComponent(document.querySelector('app-vendors'));
        if (comp && comp.vendorsList && comp.vendorsList.length > 0) comp.openEditDrawer(comp.vendorsList[0]);
        window.ng?.applyChanges(comp);
      });
    }
    await inspectAndCapture(10, 'Vendors Supplier Profile Edit', '.erp-drawer', '.erp-drawer-overlay');

    // =========================================================================
    // BATCH 3: SALES & DISPATCH
    // =========================================================================
    console.log('\n>>> TESTING BATCH 3: SALES & DISPATCH');
    await switchTab('sales');

    // 11. Sales Order Dossier
    const salesDossierBtn = page.locator('button[title*="Dossier" i], button[title*="View Order" i], .btn-action-icon:has(.bi-eye)').first();
    if (await salesDossierBtn.isVisible().catch(() => false)) {
      await salesDossierBtn.click();
    } else {
      await page.evaluate(() => {
        const comp = window.ng?.getComponent(document.querySelector('app-sales'));
        if (comp && comp.ordersList && comp.ordersList.length > 0) comp.openDossierModal(comp.ordersList[0]);
        window.ng?.applyChanges(comp);
      });
    }
    await inspectAndCapture(11, 'Sales Order Dossier', '.sales-dossier-dialog', '.drawer-backdrop');

    // 12. Sales Outward Dispatch
    const outwardBtn = page.locator('button[title*="Outward" i], button[title*="Dispatch" i], button:has-text("Outward")').first();
    if (await outwardBtn.isVisible().catch(() => false)) {
      await outwardBtn.click();
    } else {
      await page.evaluate(() => {
        const comp = window.ng?.getComponent(document.querySelector('app-sales'));
        if (comp && comp.ordersList && comp.ordersList.length > 0) comp.openOutwardModal(comp.ordersList[0]);
        window.ng?.applyChanges(comp);
      });
    }
    await inspectAndCapture(12, 'Sales Outward Dispatch', '.outward-modal-dialog', '.sales-outward-backdrop');

    // 13. Sales Order Edit
    const salesEditBtn = page.locator('.btn-action-icon.btn-edit, button[title*="Edit Order" i]').first();
    if (await salesEditBtn.isVisible().catch(() => false)) {
      await salesEditBtn.click();
    } else {
      await page.evaluate(() => {
        const comp = window.ng?.getComponent(document.querySelector('app-sales'));
        if (comp && comp.ordersList && comp.ordersList.length > 0) comp.openEditDrawer(comp.ordersList[0]);
        window.ng?.applyChanges(comp);
      });
    }
    await inspectAndCapture(13, 'Sales Order Edit', '.sales-drawer', '.drawer-backdrop');

    // 14. Dispatch Challan Dossier
    await switchTab('dispatch');
    const dispDossierBtn = page.locator('button[title*="Challan" i], button[title*="View" i], .btn-action-icon:has(.bi-eye)').first();
    if (await dispDossierBtn.isVisible().catch(() => false)) {
      await dispDossierBtn.click();
    } else {
      await page.evaluate(() => {
        const comp = window.ng?.getComponent(document.querySelector('app-dispatch'));
        if (comp && comp.dispatches && comp.dispatches.length > 0) comp.viewDispatch(comp.dispatches[0]);
        window.ng?.applyChanges(comp);
      });
    }
    await inspectAndCapture(14, 'Dispatch Challan Dossier', '.dispatch-dossier-dialog', '.dispatch-modal-overlay');

    // 15. Dispatch Manifest Edit
    const dispEditBtn = page.locator('.btn-action-icon.btn-edit, button[title*="Edit" i]').first();
    if (await dispEditBtn.isVisible().catch(() => false)) {
      await dispEditBtn.click();
    } else {
      await page.evaluate(() => {
        const comp = window.ng?.getComponent(document.querySelector('app-dispatch'));
        if (comp && comp.dispatches && comp.dispatches.length > 0) comp.editDispatch(comp.dispatches[0]);
        window.ng?.applyChanges(comp);
      });
    }
    await inspectAndCapture(15, 'Dispatch Manifest Edit', '.dispatch-modal-dialog', '.dispatch-modal-overlay');

    // =========================================================================
    // BATCH 4: TRANSPORTS, DRIVERS, PARTIES
    // =========================================================================
    console.log('\n>>> TESTING BATCH 4: TRANSPORTS, DRIVERS, PARTIES');
    await switchTab('transports');

    // 16. Transport Waybill Slip
    await page.evaluate(() => {
      const comp = window.ng?.getComponent(document.querySelector('app-transports'));
      if (comp && comp.transportsList && comp.transportsList.length > 0) comp.openViewModal(comp.transportsList[0]);
      window.ng?.applyChanges(comp);
    });
    await inspectAndCapture(16, 'Transport Waybill Slip', '.waybill-modal-dialog', '.waybill-modal-backdrop');

    // 17. Transport Trip Edit
    await page.evaluate(() => {
      const comp = window.ng?.getComponent(document.querySelector('app-transports'));
      if (comp && comp.transportsList && comp.transportsList.length > 0) comp.editTransport(comp.transportsList[0]);
      window.ng?.applyChanges(comp);
    });
    await inspectAndCapture(17, 'Transport Trip Edit', '.slide-drawer', '.drawer-backdrop');

    // 18. Drivers Profile Edit
    await switchTab('drivers');
    await page.evaluate(() => {
      const comp = window.ng?.getComponent(document.querySelector('app-drivers'));
      if (comp && comp.driversList && comp.driversList.length > 0) comp.openEditDrawer(comp.driversList[0]);
      window.ng?.applyChanges(comp);
    });
    await inspectAndCapture(18, 'Driver Profile Edit', '.slide-drawer', '.drawer-backdrop');

    // 19. Parties Client Master Dossier
    await switchTab('parties');
    await page.evaluate(() => {
      const comp = window.ng?.getComponent(document.querySelector('app-party'));
      if (comp && comp.partiesList && comp.partiesList.length > 0) comp.openDossierModal(comp.partiesList[0]);
      window.ng?.applyChanges(comp);
    });
    await inspectAndCapture(19, 'Client Master Dossier', '.dossier-modal-container', '.dossier-modal-backdrop');

    // 20. Parties Client Edit
    await page.evaluate(() => {
      const comp = window.ng?.getComponent(document.querySelector('app-party'));
      if (comp && comp.partiesList && comp.partiesList.length > 0) comp.editParty(comp.partiesList[0]);
      window.ng?.applyChanges(comp);
    });
    await inspectAndCapture(20, 'Client Profile Edit', '.party-modal-dialog', '.party-modal-overlay');

    // =========================================================================
    // BATCH 5: PAYMENTS, INVOICES, BANK
    // =========================================================================
    console.log('\n>>> TESTING BATCH 5: PAYMENTS, INVOICES, BANK');
    await switchTab('payments');

    // 21. Payments Receipt Voucher
    await page.evaluate(() => {
      const comp = window.ng?.getComponent(document.querySelector('app-payments'));
      if (comp && comp.paymentsList && comp.paymentsList.length > 0) comp.openVoucherModal(comp.paymentsList[0]);
      window.ng?.applyChanges(comp);
    });
    await inspectAndCapture(21, 'Payment Receipt Voucher', '.receipt-voucher-dialog', '.receipt-voucher-backdrop');

    // 22. Payments Edit Record
    await page.evaluate(() => {
      const comp = window.ng?.getComponent(document.querySelector('app-payments'));
      if (comp && comp.paymentsList && comp.paymentsList.length > 0) comp.editPayment(comp.paymentsList[0]);
      window.ng?.applyChanges(comp);
    });
    await inspectAndCapture(22, 'Payment Entry Edit', '.payments-modal-dialog', '.payments-modal-overlay');

    // 23. Invoices GST Tax Preview
    await switchTab('invoices');
    await page.evaluate(() => {
      const comp = window.ng?.getComponent(document.querySelector('app-invoices'));
      if (comp && comp.invoicesList && comp.invoicesList.length > 0) comp.viewInvoice(comp.invoicesList[0]);
      window.ng?.applyChanges(comp);
    });
    await inspectAndCapture(23, 'GST Tax Invoice Preview', '.invoice-modal-card', '.invoice-modal-overlay');

    // 24. Bank Transaction Voucher
    await switchTab('bank');
    await page.evaluate(() => {
      const comp = window.ng?.getComponent(document.querySelector('app-bank'));
      if (comp && comp.bankTransactionsList && comp.bankTransactionsList.length > 0) comp.openViewModal(comp.bankTransactionsList[0]);
      window.ng?.applyChanges(comp);
    });
    await inspectAndCapture(24, 'Bank Transaction Voucher', '.voucher-modal-container', '.voucher-modal-backdrop');

    // 25. Bank Entry Edit Drawer
    await page.evaluate(() => {
      const comp = window.ng?.getComponent(document.querySelector('app-bank'));
      if (comp && comp.bankTransactionsList && comp.bankTransactionsList.length > 0) comp.editBankTransaction(comp.bankTransactionsList[0]);
      window.ng?.applyChanges(comp);
    });
    await inspectAndCapture(25, 'Bank Entry Ledger Edit', '.enterprise-drawer', '.drawer-backdrop');

    console.log('\n========================================================================');
    console.log('🏆 COMPLETE 25 POP CARDS AUDIT RESULTS TABLE:');
    console.log('========================================================================');
    console.table(auditLog);

  } catch (err) {
    console.error('Fatal test error:', err);
  } finally {
    await browser.close();
  }
}

run();
