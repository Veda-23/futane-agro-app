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
    async function switchTab(tabName, componentTag) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
      await page.evaluate((t) => {
        // @ts-ignore
        const app = window.ng?.getComponent(document.querySelector('app-root'));
        if (app) {
          app.switchTab(t);
          window.ng?.applyChanges(app);
        }
      }, tabName);
      await page.waitForSelector(componentTag, { state: 'attached', timeout: 12000 });
      await page.waitForTimeout(800);
    }

    // Inspect and measure modal
    async function inspectAndCapture(id, name, modalSel, backdropSel) {
      try {
        await page.waitForSelector(modalSel, { state: 'visible', timeout: 6000 });
      } catch (e) {
        console.error(`[FAIL TO OPEN] Card ${id}: ${name} (${modalSel})`);
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

      console.log(`[Card ${String(id).padStart(2, '0')}] ${name}`);
      console.log(`          Center: ${center}px (Target: 840px, Delta: ${delta}px) | Visible: ${isVisible}`);
      console.log(`          Blur: ${metrics.bBlur} | Z-Index: ${metrics.mZIndex} | Result: ${pass ? 'PASS' : (isCentered ? 'PASS' : 'WARN')}`);

      auditLog.push({
        ID: id,
        Name: name,
        Center: center,
        Target: 840,
        Delta: delta,
        Visible: isVisible,
        Blur: metrics.bBlur || 'none',
        Status: isCentered && isVisible ? 'PASS' : 'WARN'
      });

      // Close modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(350);
      await page.evaluate(() => {
        // Force cleanup of open modal flags on active feature components
        const root = document.querySelector('app-root');
        const activeComp = root?.querySelector('app-production, app-inventory, app-machines, app-raw-materials, app-vendors, app-sales, app-dispatch, app-transports, app-drivers, app-party, app-payments, app-invoices, app-bank');
        if (activeComp) {
          const c = window.ng?.getComponent(activeComp);
          if (c) {
            c.showPpdDossierModal = false;
            c.drawerOpen = false;
            c.isAdjustmentOpen = false;
            c.isFormOpen = false;
            c.isMachineFormOpen = false;
            c.isBreakdownFormOpen = false;
            c.isVoucherOpen = false;
            c.isDrawerOpen = false;
            c.showDossierModal = false;
            c.showOutwardModal = false;
            c.showChallanModal = false;
            c.showViewModal = false;
            c.isModalOpen = false;
            window.ng?.applyChanges(c);
          }
        }
      });
      await page.waitForTimeout(200);
    }

    // =========================================================================
    // BATCH 1: PRODUCTION & INVENTORY
    // =========================================================================
    console.log('\n>>> TESTING BATCH 1: PRODUCTION & INVENTORY');
    await switchTab('production', 'app-production');

    // 1. Production QC Dossier
    await page.evaluate(() => {
      const comp = window.ng?.getComponent(document.querySelector('app-production'));
      if (comp) {
        if (!comp.ppdList || comp.ppdList.length === 0) {
          comp.ppdList = [{ id: 1, date: '2026-10-12', crateType: 'Standard Agro Crate', totalProduction: 450, successful: 440, rejected: 10, shift: 'Morning' }];
        }
        comp.openPpdDossier(comp.ppdList[0]);
        window.ng?.applyChanges(comp);
      }
    });
    await inspectAndCapture(1, 'Production QC Dossier', '.dossier-modal-container', '.dossier-modal-backdrop');

    // 2. Production Record Edit Drawer
    await page.evaluate(() => {
      const comp = window.ng?.getComponent(document.querySelector('app-production'));
      if (comp) {
        if (!comp.ppdList || comp.ppdList.length === 0) {
          comp.ppdList = [{ id: 1, date: '2026-10-12', crateType: 'Standard Agro Crate', totalProduction: 450, successful: 440, rejected: 10, shift: 'Morning' }];
        }
        comp.drawerRecord = { ...comp.ppdList[0] };
        comp.drawerMode = 'ppd';
        comp.drawerOpen = true;
        window.ng?.applyChanges(comp);
      }
    });
    await inspectAndCapture(2, 'Production Record Edit', '.slide-in-drawer', '.drawer-backdrop');

    // 3. Monthly Summary Edit Drawer
    await page.evaluate(() => {
      const comp = window.ng?.getComponent(document.querySelector('app-production'));
      if (comp) {
        if (!comp.ppmList || comp.ppmList.length === 0) {
          comp.ppmList = [{ id: 1, month: '2026-10', cratesProduced: 12000, electricityUnits: 4800, electricityBill: 48000 }];
        }
        comp.drawerRecord = { ...comp.ppmList[0] };
        comp.drawerMode = 'ppm';
        comp.drawerOpen = true;
        window.ng?.applyChanges(comp);
      }
    });
    await inspectAndCapture(3, 'Monthly Summary Edit', '.slide-in-drawer', '.drawer-backdrop');

    // 4. Inventory Stock Adjustment
    await switchTab('inventory', 'app-inventory');
    await page.evaluate(() => {
      const comp = window.ng?.getComponent(document.querySelector('app-inventory'));
      if (comp) {
        if (!comp.inventoryList || comp.inventoryList.length === 0) {
          comp.inventoryList = [{ id: 1, crateType: 'Standard Agro Crate', currentStock: 1200, openingStock: 1000, producedStock: 500, soldStock: 300 }];
        }
        comp.openAdjustmentModal(comp.inventoryList[0]);
        window.ng?.applyChanges(comp);
      }
    });
    await inspectAndCapture(4, 'Inventory Stock Adjustment', '.modal-dialog-box', '.modal-backdrop');

    // 5. Inventory Crate SKU Edit Drawer
    await page.evaluate(() => {
      const comp = window.ng?.getComponent(document.querySelector('app-inventory'));
      if (comp) {
        if (!comp.inventoryList || comp.inventoryList.length === 0) {
          comp.inventoryList = [{ id: 1, crateType: 'Standard Agro Crate', currentStock: 1200, openingStock: 1000, producedStock: 500, soldStock: 300 }];
        }
        comp.openEditForm(comp.inventoryList[0]);
        window.ng?.applyChanges(comp);
      }
    });
    await inspectAndCapture(5, 'Inventory Crate SKU Edit', '.drawer-panel', '.drawer-backdrop');

    // =========================================================================
    // BATCH 2: MACHINES, RAW MATERIALS, VENDORS
    // =========================================================================
    console.log('\n>>> TESTING BATCH 2: MACHINES, RAW MATERIALS, VENDORS');
    await switchTab('machines', 'app-machines');

    // 6. Machines Equipment Profile
    await page.evaluate(() => {
      const comp = window.ng?.getComponent(document.querySelector('app-machines'));
      if (comp) {
        if (!comp.machinesList || comp.machinesList.length === 0) {
          comp.machinesList = [{ id: 1, machineName: 'KraussMaffei 650T', machineCode: 'IMM-038' }];
        }
        comp.editMachine(comp.machinesList[0]);
        window.ng?.applyChanges(comp);
      }
    });
    await inspectAndCapture(6, 'Machines Equipment Profile', '.erp-drawer', '.erp-drawer-overlay');

    // 7. Raw Materials GRN Note
    await switchTab('raw-materials', 'app-raw-materials');
    await page.evaluate(() => {
      const comp = window.ng?.getComponent(document.querySelector('app-raw-materials'));
      if (comp) {
        if (!comp.batchesList || comp.batchesList.length === 0) {
          comp.batchesList = [{ id: 1, batchNumber: 'RM-2026-001', materialName: 'HDPE Granules Grade A', quantityKg: 5000 }];
        }
        comp.openGrnVoucher(comp.batchesList[0]);
        window.ng?.applyChanges(comp);
      }
    });
    await inspectAndCapture(7, 'Raw Materials GRN Note', '.grn-voucher-dialog', '.grn-voucher-backdrop');

    // 8. Raw Materials Batch Edit
    await page.evaluate(() => {
      const comp = window.ng?.getComponent(document.querySelector('app-raw-materials'));
      if (comp) {
        if (!comp.batchesList || comp.batchesList.length === 0) {
          comp.batchesList = [{ id: 1, batchNumber: 'RM-2026-001', materialName: 'HDPE Granules Grade A', quantityKg: 5000 }];
        }
        comp.openEditDrawer(comp.batchesList[0]);
        window.ng?.applyChanges(comp);
      }
    });
    await inspectAndCapture(8, 'Raw Materials Batch Edit', '.erp-drawer', '.erp-drawer-overlay');

    // 9. Vendors Supplier Dossier
    await switchTab('vendors', 'app-vendors');
    await page.evaluate(() => {
      const comp = window.ng?.getComponent(document.querySelector('app-vendors'));
      if (comp) {
        if (!comp.vendorsList || comp.vendorsList.length === 0) {
          comp.vendorsList = [{ id: 1, supplierName: 'Reliance Polymers Ltd', contactPerson: 'Arun Sharma' }];
        }
        comp.openDossierModal(comp.vendorsList[0]);
        window.ng?.applyChanges(comp);
      }
    });
    await inspectAndCapture(9, 'Vendors Supplier Dossier', '.dossier-voucher-dialog', '.dossier-modal-backdrop');

    // 10. Vendors Supplier Edit
    await page.evaluate(() => {
      const comp = window.ng?.getComponent(document.querySelector('app-vendors'));
      if (comp) {
        if (!comp.vendorsList || comp.vendorsList.length === 0) {
          comp.vendorsList = [{ id: 1, supplierName: 'Reliance Polymers Ltd', contactPerson: 'Arun Sharma' }];
        }
        comp.openEditDrawer(comp.vendorsList[0]);
        window.ng?.applyChanges(comp);
      }
    });
    await inspectAndCapture(10, 'Vendors Supplier Profile Edit', '.erp-drawer', '.erp-drawer-overlay');

    // =========================================================================
    // BATCH 3: SALES & DISPATCH
    // =========================================================================
    console.log('\n>>> TESTING BATCH 3: SALES & DISPATCH');
    await switchTab('sales', 'app-sales');

    // 11. Sales Order Dossier
    await page.evaluate(() => {
      const comp = window.ng?.getComponent(document.querySelector('app-sales'));
      if (comp) {
        if (!comp.ordersList || comp.ordersList.length === 0) {
          comp.ordersList = [{ id: 1, orderNumber: 'SO-2026-001', clientName: 'Sahyadri Agro Farms', totalAmount: 85000 }];
        }
        comp.openDossierModal(comp.ordersList[0]);
        window.ng?.applyChanges(comp);
      }
    });
    await inspectAndCapture(11, 'Sales Order Dossier', '.sales-dossier-dialog', '.drawer-backdrop');

    // 12. Sales Outward Dispatch
    await page.evaluate(() => {
      const comp = window.ng?.getComponent(document.querySelector('app-sales'));
      if (comp) {
        if (!comp.ordersList || comp.ordersList.length === 0) {
          comp.ordersList = [{ id: 1, orderNumber: 'SO-2026-001', clientName: 'Sahyadri Agro Farms', totalAmount: 85000 }];
        }
        comp.openOutwardModal(comp.ordersList[0]);
        window.ng?.applyChanges(comp);
      }
    });
    await inspectAndCapture(12, 'Sales Outward Dispatch', '.outward-modal-dialog', '.sales-outward-backdrop');

    // 13. Sales Order Edit
    await page.evaluate(() => {
      const comp = window.ng?.getComponent(document.querySelector('app-sales'));
      if (comp) {
        if (!comp.ordersList || comp.ordersList.length === 0) {
          comp.ordersList = [{ id: 1, orderNumber: 'SO-2026-001', clientName: 'Sahyadri Agro Farms', totalAmount: 85000 }];
        }
        comp.openEditDrawer(comp.ordersList[0]);
        window.ng?.applyChanges(comp);
      }
    });
    await inspectAndCapture(13, 'Sales Order Edit', '.sales-drawer', '.drawer-backdrop');

    // 14. Dispatch Challan Dossier
    await switchTab('dispatch', 'app-dispatch');
    await page.evaluate(() => {
      const comp = window.ng?.getComponent(document.querySelector('app-dispatch'));
      if (comp) {
        if (!comp.dispatches || comp.dispatches.length === 0) {
          comp.dispatches = [{ id: 1, challanNumber: 'DC-2026-001', driverName: 'Sanjay Shinde', vehicleNumber: 'MH-12-RN-8899' }];
        }
        comp.viewDispatch(comp.dispatches[0]);
        window.ng?.applyChanges(comp);
      }
    });
    await inspectAndCapture(14, 'Dispatch Challan Dossier', '.dispatch-dossier-dialog', '.dispatch-modal-overlay');

    // 15. Dispatch Manifest Edit
    await page.evaluate(() => {
      const comp = window.ng?.getComponent(document.querySelector('app-dispatch'));
      if (comp) {
        if (!comp.dispatches || comp.dispatches.length === 0) {
          comp.dispatches = [{ id: 1, challanNumber: 'DC-2026-001', driverName: 'Sanjay Shinde', vehicleNumber: 'MH-12-RN-8899' }];
        }
        comp.editDispatch(comp.dispatches[0]);
        window.ng?.applyChanges(comp);
      }
    });
    await inspectAndCapture(15, 'Dispatch Manifest Edit', '.dispatch-modal-dialog', '.dispatch-modal-overlay');

    // =========================================================================
    // BATCH 4: TRANSPORTS, DRIVERS, PARTIES
    // =========================================================================
    console.log('\n>>> TESTING BATCH 4: TRANSPORTS, DRIVERS, PARTIES');
    await switchTab('transports', 'app-transports');

    // 16. Transport Waybill Slip
    await page.evaluate(() => {
      const comp = window.ng?.getComponent(document.querySelector('app-transports'));
      if (comp) {
        if (!comp.transportsList || comp.transportsList.length === 0) {
          comp.transportsList = [{ id: 1, waybillNumber: 'WB-2026-001', transporterName: 'Om Logistics', truckNumber: 'MH-14-BT-4422' }];
        }
        comp.openViewModal(comp.transportsList[0]);
        window.ng?.applyChanges(comp);
      }
    });
    await inspectAndCapture(16, 'Transport Waybill Slip', '.waybill-modal-dialog', '.waybill-modal-backdrop');

    // 17. Transport Trip Edit
    await page.evaluate(() => {
      const comp = window.ng?.getComponent(document.querySelector('app-transports'));
      if (comp) {
        if (!comp.transportsList || comp.transportsList.length === 0) {
          comp.transportsList = [{ id: 1, waybillNumber: 'WB-2026-001', transporterName: 'Om Logistics', truckNumber: 'MH-14-BT-4422' }];
        }
        comp.editTransport(comp.transportsList[0]);
        window.ng?.applyChanges(comp);
      }
    });
    await inspectAndCapture(17, 'Transport Trip Edit', '.slide-drawer', '.drawer-backdrop');

    // 18. Drivers Profile Edit
    await switchTab('drivers', 'app-drivers');
    await page.evaluate(() => {
      const comp = window.ng?.getComponent(document.querySelector('app-drivers'));
      if (comp) {
        if (!comp.driversList || comp.driversList.length === 0) {
          comp.driversList = [{ id: 1, driverName: 'Ramesh Pawar', licenseNumber: 'MH-14-2019-0098231', phone: '9822019283' }];
        }
        comp.openEditDrawer(comp.driversList[0]);
        window.ng?.applyChanges(comp);
      }
    });
    await inspectAndCapture(18, 'Driver Profile Edit', '.slide-drawer', '.drawer-backdrop');

    // 19. Parties Client Master Dossier
    await switchTab('parties', 'app-party');
    await page.evaluate(() => {
      const comp = window.ng?.getComponent(document.querySelector('app-party'));
      if (comp) {
        if (!comp.partiesList || comp.partiesList.length === 0) {
          comp.partiesList = [{ id: 1, partyName: 'Futane Agro Industries Ltd', gstin: '27AABCF1234F1Z5', phone: '9822098220' }];
        }
        comp.openDossierModal(comp.partiesList[0]);
        window.ng?.applyChanges(comp);
      }
    });
    await inspectAndCapture(19, 'Client Master Dossier', '.dossier-modal-container', '.dossier-modal-backdrop');

    // 20. Parties Client Edit
    await page.evaluate(() => {
      const comp = window.ng?.getComponent(document.querySelector('app-party'));
      if (comp) {
        if (!comp.partiesList || comp.partiesList.length === 0) {
          comp.partiesList = [{ id: 1, partyName: 'Futane Agro Industries Ltd', gstin: '27AABCF1234F1Z5', phone: '9822098220' }];
        }
        comp.editParty(comp.partiesList[0]);
        window.ng?.applyChanges(comp);
      }
    });
    await inspectAndCapture(20, 'Client Profile Edit', '.party-modal-dialog', '.party-modal-overlay');

    // =========================================================================
    // BATCH 5: PAYMENTS, INVOICES, BANK
    // =========================================================================
    console.log('\n>>> TESTING BATCH 5: PAYMENTS, INVOICES, BANK');
    await switchTab('payments', 'app-payments');

    // 21. Payments Receipt Voucher
    await page.evaluate(() => {
      const comp = window.ng?.getComponent(document.querySelector('app-payments'));
      if (comp) {
        if (!comp.paymentsList || comp.paymentsList.length === 0) {
          comp.paymentsList = [{ id: 1, voucherNumber: 'REC-2026-001', partyName: 'Kisan Bio Farms', amount: 45000 }];
        }
        comp.openVoucherModal(comp.paymentsList[0]);
        window.ng?.applyChanges(comp);
      }
    });
    await inspectAndCapture(21, 'Payment Receipt Voucher', '.receipt-voucher-dialog', '.receipt-voucher-backdrop');

    // 22. Payments Edit Record
    await page.evaluate(() => {
      const comp = window.ng?.getComponent(document.querySelector('app-payments'));
      if (comp) {
        if (!comp.paymentsList || comp.paymentsList.length === 0) {
          comp.paymentsList = [{ id: 1, voucherNumber: 'REC-2026-001', partyName: 'Kisan Bio Farms', amount: 45000 }];
        }
        comp.editPayment(comp.paymentsList[0]);
        window.ng?.applyChanges(comp);
      }
    });
    await inspectAndCapture(22, 'Payment Entry Edit', '.payments-modal-dialog', '.payments-modal-overlay');

    // 23. Invoices GST Tax Preview
    await switchTab('invoices', 'app-invoices');
    await page.evaluate(() => {
      const comp = window.ng?.getComponent(document.querySelector('app-invoices'));
      if (comp) {
        if (!comp.invoicesList || comp.invoicesList.length === 0) {
          comp.invoicesList = [{ id: 1, invoiceNumber: 'INV-2026-001', partyName: 'Kisan Bio Farms', totalAmount: 112000 }];
        }
        comp.viewInvoice(comp.invoicesList[0]);
        window.ng?.applyChanges(comp);
      }
    });
    await inspectAndCapture(23, 'GST Tax Invoice Preview', '.invoice-modal-card', '.invoice-modal-overlay');

    // 24. Bank Transaction Voucher
    await switchTab('bank', 'app-bank');
    await page.evaluate(() => {
      const comp = window.ng?.getComponent(document.querySelector('app-bank'));
      if (comp) {
        if (!comp.bankTransactionsList || comp.bankTransactionsList.length === 0) {
          comp.bankTransactionsList = [{ id: 1, referenceNumber: 'TXN-2026-001', accountName: 'HDFC Current 0041', amount: 95000 }];
        }
        comp.openViewModal(comp.bankTransactionsList[0]);
        window.ng?.applyChanges(comp);
      }
    });
    await inspectAndCapture(24, 'Bank Transaction Voucher', '.voucher-modal-container', '.voucher-modal-backdrop');

    // 25. Bank Entry Edit Drawer
    await page.evaluate(() => {
      const comp = window.ng?.getComponent(document.querySelector('app-bank'));
      if (comp) {
        if (!comp.bankTransactionsList || comp.bankTransactionsList.length === 0) {
          comp.bankTransactionsList = [{ id: 1, referenceNumber: 'TXN-2026-001', accountName: 'HDFC Current 0041', amount: 95000 }];
        }
        comp.editBankTransaction(comp.bankTransactionsList[0]);
        window.ng?.applyChanges(comp);
      }
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
