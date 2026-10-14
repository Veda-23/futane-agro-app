import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUT_DIR = path.resolve('scratch/all_popcards_verification');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function run() {
  console.log('========================================================================');
  console.log('=== FUTANE AGRO ERP: ALL 25 POP CARDS EMPIRICAL VERIFICATION         ===');
  console.log('========================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const auditLog = [];

  try {
    console.log('1. Connecting to http://127.0.0.1:4300 ...');
    await page.goto('http://127.0.0.1:4300', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const loginInput = await page.$('#username');
    if (loginInput) {
      console.log('Logging in as SUPER_ADMIN...');
      await page.fill('#username', 'SUPER_ADMIN');
      await page.fill('#password', 'superadmin123');
      await page.click('#login-submit-btn');

      await page.waitForSelector('.uat-otp-helper-pill, .sidebar', { timeout: 15000 }).catch(() => null);
      const otpPill = await page.$('.uat-otp-helper-pill');
      if (otpPill) {
        await otpPill.click();
        await page.waitForTimeout(300);
        const otpSubmit = await page.$('#otp-verify-submit-btn');
        if (otpSubmit) await otpSubmit.click();
      }
    }

    await page.waitForSelector('.sidebar, .app-header', { timeout: 20000 });
    console.log('Authenticated and layout ready!\n');
    await page.waitForTimeout(1000);

    // Switch tab helper
    async function switchTab(tab, tag) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(150);
      await page.evaluate((t) => {
        // @ts-ignore
        const root = document.querySelector('app-root');
        // @ts-ignore
        if (root && window.ng) {
          const c = window.ng.getComponent(root);
          if (c) {
            c.renderedTabs[t] = true;
            c.switchTab(t);
            window.ng.applyChanges(c);
          }
        }
      }, tab);
      if (tag) {
        await page.waitForSelector(tag, { state: 'attached', timeout: 15000 }).catch(() => null);
      }
      await page.waitForTimeout(800);
    }

    // Modal Verification Core Function
    async function verifyPopCard(id, title, triggerFn, dialogSel, backdropSel, closeFn) {
      console.log(`Testing [${String(id).padStart(2, '0')}] ${title} ...`);
      
      const opened = await page.evaluate(triggerFn).catch(e => {
        console.warn(`  ⚠️ Trigger error: ${e.message}`);
        return false;
      });
      await page.waitForTimeout(600);

      const metrics = await page.evaluate(({ dSel, bSel }) => {
        const dialog = document.querySelector(dSel);
        const backdrop = bSel ? document.querySelector(bSel) : null;
        if (!dialog) return null;
        const rect = dialog.getBoundingClientRect();
        const dStyle = window.getComputedStyle(dialog);
        const bStyle = backdrop ? window.getComputedStyle(backdrop) : null;
        return {
          top: Math.round(rect.top),
          left: Math.round(rect.left),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          zIndex: dStyle.zIndex,
          backdropBlur: bStyle ? (bStyle.backdropFilter || bStyle.webkitBackdropFilter || 'none') : 'none'
        };
      }, { dSel: dialogSel, bSel: backdropSel });

      if (!metrics) {
        console.error(`  ❌ Modal did not render in DOM: ${dialogSel}`);
        auditLog.push({ ID: id, Title: title, Center: 0, Target: 840, Delta: 999, Visible: false, Blur: 'N/A', Status: 'FAIL' });
        return;
      }

      const center = Math.round(metrics.left + metrics.width / 2);
      const delta = Math.abs(center - 840);
      const isCentered = delta <= 4;
      const isVisible = metrics.width > 100 && metrics.height > 100;
      const hasBlur = metrics.backdropBlur.includes('blur');

      console.log(`  Center: ${center}px (Delta: ${delta}px) | WxH: ${metrics.width}x${metrics.height}px | Blur: ${metrics.backdropBlur} | Z: ${metrics.zIndex}`);
      console.log(`  Status: ${isCentered && isVisible ? '✅ PASS' : '⚠️ CHECK'}\n`);

      const fileName = `${String(id).padStart(2, '0')}_${title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.png`;
      const shotPath = path.join(OUT_DIR, fileName);
      try {
        await page.waitForTimeout(300);
        await page.screenshot({ path: shotPath, timeout: 6000 });
      } catch (err) {
        console.warn(`  ⚠️ Screenshot notice: ${err.message}`);
      }

      auditLog.push({
        ID: id,
        Title: title,
        Center: center,
        Target: 840,
        Delta: delta,
        Visible: isVisible,
        Blur: metrics.backdropBlur,
        Status: isCentered && isVisible ? 'PASS' : 'FAIL'
      });

      // Close modal cleanly via provided closeFn and Escape key
      if (closeFn) {
        await page.evaluate(closeFn).catch(() => null);
        await page.waitForTimeout(200);
      }
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }

    // =========================================================================
    // BATCH 1: PRODUCTION & INVENTORY (5 Cards)
    // =========================================================================
    console.log('>>> BATCH 1: PRODUCTION & INVENTORY');
    await switchTab('production', 'app-production');

    // 1. Production QC Dossier
    await verifyPopCard(1, 'Production QC Dossier', () => {
      const el = document.querySelector('app-production');
      if (!el) return false;
      const comp = window.ng?.getComponent(el);
      if (comp) {
        if (!comp.ppdList || comp.ppdList.length === 0) {
          comp.ppdList = [{ id: 1, date: '2026-10-12', crateType: 'Standard Agro Crate', totalProduction: 450, successful: 440, rejected: 10, shift: 'Morning' }];
        }
        comp.openPpdDossier(comp.ppdList[0]);
        window.ng?.applyChanges(comp);
        return true;
      }
      return false;
    }, '.dossier-modal-container', '.dossier-modal-backdrop', () => {
      const comp = window.ng?.getComponent(document.querySelector('app-production'));
      if (comp) { comp.closePpdDossier(); window.ng?.applyChanges(comp); }
    });

    // 2. Production Record Edit Drawer
    await verifyPopCard(2, 'Production Record Edit', () => {
      const el = document.querySelector('app-production');
      if (!el) return false;
      const comp = window.ng?.getComponent(el);
      if (comp) {
        if (!comp.ppdList || comp.ppdList.length === 0) {
          comp.ppdList = [{ id: 1, date: '2026-10-12', crateType: 'Standard Agro Crate', totalProduction: 450, successful: 440, rejected: 10, shift: 'Morning' }];
        }
        comp.openDrawerEdit('ppd', comp.ppdList[0]);
        window.ng?.applyChanges(comp);
        return true;
      }
      return false;
    }, '.slide-in-drawer', '.drawer-backdrop', () => {
      const comp = window.ng?.getComponent(document.querySelector('app-production'));
      if (comp) { comp.closeDrawerEdit(); window.ng?.applyChanges(comp); }
    });

    // 3. Monthly Summary Edit Drawer
    await verifyPopCard(3, 'Monthly Summary Edit', () => {
      const el = document.querySelector('app-production');
      if (!el) return false;
      const comp = window.ng?.getComponent(el);
      if (comp) {
        if (!comp.ppmList || comp.ppmList.length === 0) {
          comp.ppmList = [{ id: 1, month: '2026-10', cratesProduced: 12000, electricityUnits: 4800, electricityBill: 48000 }];
        }
        comp.openDrawerEdit('ppm', comp.ppmList[0]);
        window.ng?.applyChanges(comp);
        return true;
      }
      return false;
    }, '.slide-in-drawer', '.drawer-backdrop', () => {
      const comp = window.ng?.getComponent(document.querySelector('app-production'));
      if (comp) { comp.closeDrawerEdit(); window.ng?.applyChanges(comp); }
    });

    // 4. Inventory Stock Adjustment
    await switchTab('inventory', 'app-inventory');
    await verifyPopCard(4, 'Inventory Stock Adjustment', () => {
      const el = document.querySelector('app-inventory');
      if (!el) return false;
      const comp = window.ng?.getComponent(el);
      if (comp) {
        comp.openAdjustmentModal();
        window.ng?.applyChanges(comp);
        return true;
      }
      return false;
    }, '.modal-dialog-box', '.modal-backdrop', () => {
      const comp = window.ng?.getComponent(document.querySelector('app-inventory'));
      if (comp) { comp.closeAdjustmentModal(); window.ng?.applyChanges(comp); }
    });

    // 5. Inventory Crate SKU Edit Drawer
    await verifyPopCard(5, 'Inventory Crate SKU Edit', () => {
      const el = document.querySelector('app-inventory');
      if (!el) return false;
      const comp = window.ng?.getComponent(el);
      if (comp) {
        if (!comp.filteredList || comp.filteredList.length === 0) {
          comp.filteredList = [{ id: 1, crateType: 'Standard Agro Crate', currentStock: 1200, openingStock: 1000, producedStock: 500, soldStock: 300 }];
        }
        comp.openEditForm(comp.filteredList[0]);
        window.ng?.applyChanges(comp);
        return true;
      }
      return false;
    }, '.drawer-panel', '.drawer-backdrop', () => {
      const comp = window.ng?.getComponent(document.querySelector('app-inventory'));
      if (comp) { comp.closeForm(); window.ng?.applyChanges(comp); }
    });

    // =========================================================================
    // BATCH 2: MACHINES, RAW MATERIALS, VENDORS (5 Cards)
    // =========================================================================
    console.log('>>> BATCH 2: MACHINES, RAW MATERIALS, VENDORS');
    await switchTab('machines', 'app-machines');

    // 6. Machines Equipment Profile
    await verifyPopCard(6, 'Machines Equipment Profile', () => {
      const el = document.querySelector('app-machines');
      if (!el) return false;
      const comp = window.ng?.getComponent(el);
      if (comp) {
        if (!comp.machinesList || comp.machinesList.length === 0) {
          comp.machinesList = [{ id: 1, machineName: 'KraussMaffei 650T', machineCode: 'IMM-038' }];
        }
        comp.editMachine(comp.machinesList[0]);
        window.ng?.applyChanges(comp);
        return true;
      }
      return false;
    }, '.erp-drawer', '.erp-drawer-overlay', () => {
      const comp = window.ng?.getComponent(document.querySelector('app-machines'));
      if (comp) { comp.cancelEditMachine(); window.ng?.applyChanges(comp); }
    });

    // 7. Raw Materials GRN Note
    await switchTab('raw-materials', 'app-raw-materials');
    await verifyPopCard(7, 'Raw Materials GRN Note', () => {
      const el = document.querySelector('app-raw-materials');
      if (!el) return false;
      const comp = window.ng?.getComponent(el);
      if (comp) {
        const item = (comp.rawMaterialsList && comp.rawMaterialsList[0]) || { id: 1, rawMaterialId: 1, materialName: 'HDPE Granules Grade A', quantityKg: 5000, supplierName: 'Reliance Polymers' };
        comp.openInspectionModal(item);
        window.ng?.applyChanges(comp);
        return true;
      }
      return false;
    }, '.grn-voucher-dialog', '.grn-voucher-backdrop', () => {
      const comp = window.ng?.getComponent(document.querySelector('app-raw-materials'));
      if (comp) { comp.closeInspectionModal(); window.ng?.applyChanges(comp); }
    });

    // 8. Raw Materials Batch Edit
    await verifyPopCard(8, 'Raw Materials Batch Edit', () => {
      const el = document.querySelector('app-raw-materials');
      if (!el) return false;
      const comp = window.ng?.getComponent(el);
      if (comp) {
        comp.openAddForm();
        window.ng?.applyChanges(comp);
        return true;
      }
      return false;
    }, '.erp-drawer', '.erp-drawer-overlay', () => {
      const comp = window.ng?.getComponent(document.querySelector('app-raw-materials'));
      if (comp) { comp.cancelEdit(); window.ng?.applyChanges(comp); }
    });

    // 9. Vendors Supplier Dossier
    await switchTab('vendors', 'app-vendors');
    await verifyPopCard(9, 'Vendors Supplier Dossier', () => {
      const el = document.querySelector('app-vendors');
      if (!el) return false;
      const comp = window.ng?.getComponent(el);
      if (comp) {
        if (!comp.vendorsList || comp.vendorsList.length === 0) {
          comp.vendorsList = [{ id: 1, vendorName: 'Reliance Polymers Ltd', contactPerson: 'Arun Sharma', category: 'Polymer & Granules' }];
        }
        comp.openDossierModal(comp.vendorsList[0]);
        window.ng?.applyChanges(comp);
        return true;
      }
      return false;
    }, '.dossier-voucher-dialog', '.dossier-modal-backdrop', () => {
      const comp = window.ng?.getComponent(document.querySelector('app-vendors'));
      if (comp) { comp.closeDossierModal(); window.ng?.applyChanges(comp); }
    });

    // 10. Vendors Supplier Edit
    await verifyPopCard(10, 'Vendors Supplier Profile Edit', () => {
      const el = document.querySelector('app-vendors');
      if (!el) return false;
      const comp = window.ng?.getComponent(el);
      if (comp) {
        comp.openAddForm();
        window.ng?.applyChanges(comp);
        return true;
      }
      return false;
    }, '.erp-drawer', '.erp-drawer-overlay', () => {
      const comp = window.ng?.getComponent(document.querySelector('app-vendors'));
      if (comp) { comp.cancelEdit(); window.ng?.applyChanges(comp); }
    });

    // =========================================================================
    // BATCH 3: SALES & DISPATCH (5 Cards)
    // =========================================================================
    console.log('>>> BATCH 3: SALES & DISPATCH');
    await switchTab('sales', 'app-sales');

    // 11. Sales Order Dossier
    await verifyPopCard(11, 'Sales Order Dossier', () => {
      const el = document.querySelector('app-sales');
      if (!el) return false;
      const comp = window.ng?.getComponent(el);
      if (comp) {
        if (!comp.salesList || comp.salesList.length === 0) {
          comp.salesList = [{ id: 1, saleId: 'SO-2026-001', party: { partyName: 'Sahyadri Agro Farms' }, totalAmount: 85000, quantity: 500, rate: 170 }];
        }
        comp.openSalesDossier(comp.salesList[0]);
        window.ng?.applyChanges(comp);
        return true;
      }
      return false;
    }, '.sales-dossier-dialog', '.sales-dossier-backdrop, .drawer-backdrop', () => {
      const comp = window.ng?.getComponent(document.querySelector('app-sales'));
      if (comp) { comp.closeSalesDossier(); window.ng?.applyChanges(comp); }
    });

    // 12. Sales Outward Dispatch
    await verifyPopCard(12, 'Sales Outward Dispatch', () => {
      const el = document.querySelector('app-sales');
      if (!el) return false;
      const comp = window.ng?.getComponent(el);
      if (comp) {
        if (!comp.salesList || comp.salesList.length === 0) {
          comp.salesList = [{ id: 1, saleId: 'SO-2026-001', party: { partyName: 'Sahyadri Agro Farms' }, totalAmount: 85000, quantity: 500, rate: 170 }];
        }
        comp.openOutwardModal(comp.salesList[0]);
        window.ng?.applyChanges(comp);
        return true;
      }
      return false;
    }, '.outward-modal-dialog', '.sales-outward-backdrop', () => {
      const comp = window.ng?.getComponent(document.querySelector('app-sales'));
      if (comp) { comp.closeOutwardModal(); window.ng?.applyChanges(comp); }
    });

    // 13. Sales Order Edit
    await verifyPopCard(13, 'Sales Order Edit', () => {
      const el = document.querySelector('app-sales');
      if (!el) return false;
      const comp = window.ng?.getComponent(el);
      if (comp) {
        if (!comp.salesList || comp.salesList.length === 0) {
          comp.salesList = [{ id: 1, saleId: 'SO-2026-001', party: { partyName: 'Sahyadri Agro Farms' }, totalAmount: 85000, quantity: 500, rate: 170 }];
        }
        comp.openDrawer(comp.salesList[0]);
        window.ng?.applyChanges(comp);
        return true;
      }
      return false;
    }, '.sales-drawer', '.drawer-backdrop', () => {
      const comp = window.ng?.getComponent(document.querySelector('app-sales'));
      if (comp) { comp.closeDrawer(); window.ng?.applyChanges(comp); }
    });

    // 14. Dispatch Challan Dossier
    await switchTab('dispatch', 'app-dispatch');
    await verifyPopCard(14, 'Dispatch Challan Dossier', () => {
      const el = document.querySelector('app-dispatch');
      if (!el) return false;
      const comp = window.ng?.getComponent(el);
      if (comp) {
        if (!comp.dispatches || comp.dispatches.length === 0) {
          comp.dispatches = [{ id: 1, sale: { party: { partyName: 'Sahyadri Agro' } }, vehicleNumber: 'MH-12-RN-8899', driverName: 'Sanjay Shinde', deliveryAddress: 'Hadapsar, Pune' }];
        }
        comp.openDispatchDossier(comp.dispatches[0]);
        window.ng?.applyChanges(comp);
        return true;
      }
      return false;
    }, '.dispatch-dossier-dialog', '.dispatch-dossier-overlay', () => {
      const comp = window.ng?.getComponent(document.querySelector('app-dispatch'));
      if (comp) { comp.closeDispatchDossier(); window.ng?.applyChanges(comp); }
    });

    // 15. Dispatch Manifest Edit
    await verifyPopCard(15, 'Dispatch Manifest Edit', () => {
      const el = document.querySelector('app-dispatch');
      if (!el) return false;
      const comp = window.ng?.getComponent(el);
      if (comp) {
        if (!comp.dispatches || comp.dispatches.length === 0) {
          comp.dispatches = [{ id: 1, sale: { party: { partyName: 'Sahyadri Agro' } }, vehicleNumber: 'MH-12-RN-8899', driverName: 'Sanjay Shinde', deliveryAddress: 'Hadapsar, Pune' }];
        }
        comp.editDispatch(comp.dispatches[0]);
        window.ng?.applyChanges(comp);
        return true;
      }
      return false;
    }, '.dispatch-modal-dialog', '.dispatch-modal-overlay', () => {
      const comp = window.ng?.getComponent(document.querySelector('app-dispatch'));
      if (comp) { comp.cancelEditDispatch(); window.ng?.applyChanges(comp); }
    });

    // =========================================================================
    // BATCH 4: TRANSPORTS, DRIVERS, PARTIES (5 Cards)
    // =========================================================================
    console.log('>>> BATCH 4: TRANSPORTS, DRIVERS, PARTIES');
    await switchTab('transports', 'app-transports');

    // 16. Transport Waybill Slip
    await verifyPopCard(16, 'Transport Waybill Slip', () => {
      const el = document.querySelector('app-transports');
      if (!el) return false;
      const comp = window.ng?.getComponent(el);
      if (comp) {
        if (!comp.transportsList || comp.transportsList.length === 0) {
          comp.transportsList = [{ id: 1, waybillNumber: 'WB-2026-001', truckNumber: 'MH-14-BT-4422', rent: 14000, advance: 4000 }];
        }
        comp.openViewModal(comp.transportsList[0]);
        window.ng?.applyChanges(comp);
        return true;
      }
      return false;
    }, '.waybill-modal-dialog', '.waybill-modal-backdrop', () => {
      const comp = window.ng?.getComponent(document.querySelector('app-transports'));
      if (comp) { comp.closeViewModal(); window.ng?.applyChanges(comp); }
    });

    // 17. Transport Trip Edit
    await verifyPopCard(17, 'Transport Trip Edit', () => {
      const el = document.querySelector('app-transports');
      if (!el) return false;
      const comp = window.ng?.getComponent(el);
      if (comp) {
        comp.openAddDrawer();
        window.ng?.applyChanges(comp);
        return true;
      }
      return false;
    }, '.slide-drawer', '.drawer-backdrop', () => {
      const comp = window.ng?.getComponent(document.querySelector('app-transports'));
      if (comp) { comp.closeFormDrawer(); window.ng?.applyChanges(comp); }
    });

    // 18. Drivers Profile Edit
    await switchTab('drivers', 'app-drivers');
    await verifyPopCard(18, 'Driver Profile Edit', () => {
      const el = document.querySelector('app-drivers');
      if (!el) return false;
      const comp = window.ng?.getComponent(el);
      if (comp) {
        if (!comp.drivers || comp.drivers.length === 0) {
          comp.drivers = [{ id: 1, driverName: 'Ramesh Pawar', licenseNumber: 'MH-14-2019-0098231', mobile: '9822019283' }];
        }
        comp.openEditDrawer(comp.drivers[0]);
        window.ng?.applyChanges(comp);
        return true;
      }
      return false;
    }, '.slide-drawer', '.drawer-backdrop', () => {
      const comp = window.ng?.getComponent(document.querySelector('app-drivers'));
      if (comp) { comp.closeFormDrawer(); window.ng?.applyChanges(comp); }
    });

    // 19. Parties Client Master Dossier
    await switchTab('parties', 'app-party');
    await verifyPopCard(19, 'Client Master Dossier', () => {
      const el = document.querySelector('app-party');
      if (!el) return false;
      const comp = window.ng?.getComponent(el);
      if (comp) {
        if (!comp.parties || comp.parties.length === 0) {
          comp.parties = [{ id: 1, partyName: 'Futane Agro Industries Ltd', gstNumber: '27AABCF1234F1Z5', partyContact: '9822098220' }];
        }
        comp.openPartyDossier(comp.parties[0]);
        window.ng?.applyChanges(comp);
        return true;
      }
      return false;
    }, '.dossier-modal-container', '.dossier-modal-backdrop', () => {
      const comp = window.ng?.getComponent(document.querySelector('app-party'));
      if (comp) { comp.closePartyDossier(); window.ng?.applyChanges(comp); }
    });

    // 20. Parties Client Edit
    await verifyPopCard(20, 'Client Profile Edit', () => {
      const el = document.querySelector('app-party');
      if (!el) return false;
      const comp = window.ng?.getComponent(el);
      if (comp) {
        comp.openForm();
        window.ng?.applyChanges(comp);
        return true;
      }
      return false;
    }, '.party-modal-dialog', '.party-modal-overlay', () => {
      const comp = window.ng?.getComponent(document.querySelector('app-party'));
      if (comp) { comp.cancelEditParty(); window.ng?.applyChanges(comp); }
    });

    // =========================================================================
    // BATCH 5: PAYMENTS, INVOICES, BANK (5 Cards)
    // =========================================================================
    console.log('>>> BATCH 5: PAYMENTS, INVOICES, BANK');
    await switchTab('payments', 'app-payments');

    // 21. Payments Receipt Voucher
    await verifyPopCard(21, 'Payment Receipt Voucher', () => {
      const el = document.querySelector('app-payments');
      if (!el) return false;
      const comp = window.ng?.getComponent(el);
      if (comp) {
        if (!comp.paymentsList || comp.paymentsList.length === 0) {
          comp.paymentsList = [{ id: 1, paymentId: 'REC-2026-001', party: { partyName: 'Kisan Bio Farms' }, amountReceived: 45000, paymentMode: 'UPI' }];
        }
        comp.openVoucherModal(comp.paymentsList[0]);
        window.ng?.applyChanges(comp);
        return true;
      }
      return false;
    }, '.receipt-voucher-dialog', '.receipt-voucher-backdrop', () => {
      const comp = window.ng?.getComponent(document.querySelector('app-payments'));
      if (comp) { comp.closeVoucherModal(); window.ng?.applyChanges(comp); }
    });

    // 22. Payments Edit Record
    await verifyPopCard(22, 'Payment Entry Edit', () => {
      const el = document.querySelector('app-payments');
      if (!el) return false;
      const comp = window.ng?.getComponent(el);
      if (comp) {
        comp.openForm();
        window.ng?.applyChanges(comp);
        return true;
      }
      return false;
    }, '.payments-modal-dialog', '.payments-modal-overlay', () => {
      const comp = window.ng?.getComponent(document.querySelector('app-payments'));
      if (comp) { comp.cancelEditPayment(); window.ng?.applyChanges(comp); }
    });

    // 23. Invoices GST Tax Preview
    await switchTab('invoices', 'app-invoices');
    await verifyPopCard(23, 'GST Tax Invoice Preview', () => {
      const el = document.querySelector('app-invoices');
      if (!el) return false;
      const comp = window.ng?.getComponent(el);
      if (comp) {
        if (!comp.invoicesList || comp.invoicesList.length === 0) {
          comp.invoicesList = [{ id: 1, invoiceNo: 'INV-2026-001', sale: { party: { partyName: 'Kisan Bio Farms' }, quantity: 500, rate: 200, cgst: 9000, sgst: 9000 } }];
        }
        comp.viewInvoice(comp.invoicesList[0]);
        window.ng?.applyChanges(comp);
        return true;
      }
      return false;
    }, '.invoice-modal-card', '.invoice-modal-overlay', () => {
      const comp = window.ng?.getComponent(document.querySelector('app-invoices'));
      if (comp) { comp.closeInvoiceModal(); window.ng?.applyChanges(comp); }
    });

    // 24. Bank Transaction Voucher
    await switchTab('bank', 'app-bank');
    await verifyPopCard(24, 'Bank Transaction Voucher', () => {
      const el = document.querySelector('app-bank');
      if (!el) return false;
      const comp = window.ng?.getComponent(el);
      if (comp) {
        if (!comp.bankTransactionsList || comp.bankTransactionsList.length === 0) {
          comp.bankTransactionsList = [{ id: 1, referenceNo: 'TXN-2026-001', transactionType: 'Credit', amount: 95000, description: 'Client RTGS Advance' }];
        }
        comp.openViewModal(comp.bankTransactionsList[0]);
        window.ng?.applyChanges(comp);
        return true;
      }
      return false;
    }, '.voucher-modal-container', '.voucher-modal-backdrop', () => {
      const comp = window.ng?.getComponent(document.querySelector('app-bank'));
      if (comp) { comp.closeViewModal(); window.ng?.applyChanges(comp); }
    });

    // 25. Bank Entry Edit Drawer
    await verifyPopCard(25, 'Bank Entry Ledger Edit', () => {
      const el = document.querySelector('app-bank');
      if (!el) return false;
      const comp = window.ng?.getComponent(el);
      if (comp) {
        if (!comp.bankTransactionsList || comp.bankTransactionsList.length === 0) {
          comp.bankTransactionsList = [{ id: 1, referenceNo: 'TXN-2026-001', transactionType: 'Credit', amount: 95000, description: 'Client RTGS Advance' }];
        }
        comp.editBankTransaction(comp.bankTransactionsList[0]);
        window.ng?.applyChanges(comp);
        return true;
      }
      return false;
    }, '.enterprise-drawer', '.drawer-backdrop', () => {
      const comp = window.ng?.getComponent(document.querySelector('app-bank'));
      if (comp) { comp.cancelEdit(); window.ng?.applyChanges(comp); }
    });

    console.log('\n========================================================================');
    console.log('🏆 COMPLETE 25 POP CARDS AUDIT RESULTS TABLE:');
    console.log('========================================================================');
    console.table(auditLog);

    const failCount = auditLog.filter(x => x.Status === 'FAIL').length;
    console.log(`Summary: ${auditLog.length - failCount} Passed, ${failCount} Failed.`);

  } catch (err) {
    console.error('Fatal audit error:', err);
  } finally {
    await browser.close();
  }
}

run();
