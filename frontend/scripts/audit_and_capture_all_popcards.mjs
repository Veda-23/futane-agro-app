import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = 'c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/all_popcards_audit';
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function runComprehensiveAudit() {
  console.log('======================================================================');
  console.log('=== UNIVERSAL ERP POP CARD AUDIT, VISUAL REGRESSION & VERIFICATION ===');
  console.log('======================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1339, height: 720 } });
  const page = await context.newPage();

  console.log('Connecting to http://localhost:4300...');
  await page.goto('http://localhost:4300', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#username, .sidebar', { timeout: 30000 });

  const loginInput = page.locator('#username');
  if (await loginInput.isVisible().catch(() => false)) {
    console.log('Authenticating as SUPER_ADMIN...');
    await page.fill('#username', 'SUPER_ADMIN');
    await page.fill('#password', 'superadmin123');
    await page.click('#login-submit-btn');
    await page.waitForSelector('.uat-otp-helper-pill, .sidebar', { timeout: 25000 });
    if (await page.locator('.uat-otp-helper-pill').isVisible().catch(() => false)) {
      await page.click('.uat-otp-helper-pill');
      await page.waitForTimeout(400);
      await page.locator('button:has-text("Verify"), button[type="submit"]').first().click();
    }
  }

  await page.waitForSelector('.sidebar', { timeout: 20000 });
  await page.waitForTimeout(800);

  const report = [];

  async function switchTab(tabName) {
    await page.evaluate((tab) => {
      const app = window.ng.getComponent(document.querySelector('app-root'));
      if (app) {
        app.switchTab(tab);
        window.ng.applyChanges(app);
      }
    }, tabName);
    await page.waitForTimeout(600);
  }

  async function measureAndScreenshot(name, selector) {
    try {
      await page.waitForSelector(selector, { state: 'visible', timeout: 4000 });
    } catch (e) {
      console.warn(`[WARN] Selector not immediately visible: ${selector} for ${name}`);
    }
    await page.waitForTimeout(300);

    const metrics = await page.evaluate((sel) => {
      const dlg = document.querySelector(sel);
      const sb = document.querySelector('.sidebar');
      if (!dlg) return null;
      const dlgRect = dlg.getBoundingClientRect();
      const sbRect = sb ? sb.getBoundingClientRect() : null;
      const sbWidth = sbRect ? sbRect.width : 240;

      const leftGap = dlgRect.x - sbWidth;
      const rightGap = window.innerWidth - (dlgRect.x + dlgRect.width);
      const asymmetry = Math.abs(leftGap - rightGap);

      // Check button visibility
      const buttons = Array.from(dlg.querySelectorAll('button:not(.modal-close-btn):not(.cf-modal-close-btn):not(.btn-dossier-close)'));
      const actionBtn = buttons[buttons.length - 1];
      const btnRect = actionBtn ? actionBtn.getBoundingClientRect() : null;
      const btnVisible = btnRect ? (btnRect.bottom <= window.innerHeight + 25 && btnRect.top >= 0) : true;
      const hasHorizontalOverflow = dlg.scrollWidth > dlg.clientWidth + 2;

      return {
        dlgWidth: Math.round(dlgRect.width),
        dlgHeight: Math.round(dlgRect.height),
        dlgX: Math.round(dlgRect.x),
        dlgY: Math.round(dlgRect.y),
        leftGap: Math.round(leftGap * 10) / 10,
        rightGap: Math.round(rightGap * 10) / 10,
        asymmetry: Math.round(asymmetry * 10) / 10,
        isCentered: asymmetry <= 3.0,
        hasRightCollision: (dlgRect.x + dlgRect.width) >= window.innerWidth - 10,
        actionBtnVisibleAboveFold: btnVisible,
        hasHorizontalOverflow
      };
    }, selector);

    const filename = `${name}.png`;
    const filepath = path.join(SCREENSHOT_DIR, filename);
    await page.screenshot({ path: filepath });

    const passed = metrics && metrics.isCentered && !metrics.hasRightCollision && metrics.actionBtnVisibleAboveFold;
    const status = passed ? 'PASS' : 'FAIL';
    console.log(`[${status}] ${name.padEnd(42)} | W=${metrics?.dlgWidth}px | Left=${metrics?.leftGap}px | Right=${metrics?.rightGap}px | Asym=${metrics?.asymmetry}px | Collision=${metrics?.hasRightCollision}`);

    report.push({
      name,
      selector,
      status,
      filename,
      metrics
    });
  }

  // =========================================================================
  // 1. SETTINGS DOMAIN POP CARDS (ALL 13 DOMAINS & MODALS)
  // =========================================================================
  console.log('\n--- SECTION 1: SETTINGS POP CARDS ---');
  await switchTab('settings');
  await page.waitForSelector('app-settings', { timeout: 15000 });

  const settingsModals = [
    {
      name: '01_Settings_Company_Profile_Modal',
      open: async () => {
        await page.evaluate(() => {
          const comp = window.ng.getComponent(document.querySelector('app-settings'));
          if (comp) {
            comp.openAddCompanyModal();
            window.ng.applyChanges(comp);
          }
        });
      },
      close: async () => {
        await page.evaluate(() => {
          const comp = window.ng.getComponent(document.querySelector('app-settings'));
          if (comp) {
            comp.showCompanyModal = false;
            window.ng.applyChanges(comp);
          }
        });
      },
      selector: '.modal-content'
    },
    {
      name: '02_Settings_Bank_Account_Modal',
      open: async () => {
        await page.evaluate(() => {
          const comp = window.ng.getComponent(document.querySelector('app-settings'));
          if (comp) {
            comp.openAddBankModal();
            window.ng.applyChanges(comp);
          }
        });
      },
      close: async () => {
        await page.evaluate(() => {
          const comp = window.ng.getComponent(document.querySelector('app-settings'));
          if (comp) {
            comp.showBankModal = false;
            window.ng.applyChanges(comp);
          }
        });
      },
      selector: '.modal-content'
    },
    {
      name: '03_Settings_Team_Department_Modal',
      open: async () => {
        await page.evaluate(() => {
          const comp = window.ng.getComponent(document.querySelector('app-settings'));
          if (comp) {
            comp.openAddTeamModal();
            window.ng.applyChanges(comp);
          }
        });
      },
      close: async () => {
        await page.evaluate(() => {
          const comp = window.ng.getComponent(document.querySelector('app-settings'));
          if (comp) {
            comp.showTeamModal = false;
            window.ng.applyChanges(comp);
          }
        });
      },
      selector: '.modal-content'
    },
    {
      name: '04_Settings_Dynamic_Schema_Field_Modal',
      open: async () => {
        await page.evaluate(() => {
          const comp = window.ng.getComponent(document.querySelector('app-settings'));
          if (comp) {
            comp.openAddCustomFieldModal();
            window.ng.applyChanges(comp);
          }
        });
      },
      close: async () => {
        await page.evaluate(() => {
          const comp = window.ng.getComponent(document.querySelector('app-settings'));
          if (comp) {
            comp.showCustomFieldModal = false;
            window.ng.applyChanges(comp);
          }
        });
      },
      selector: '.cf-modal-dialog'
    },
    {
      name: '05_Settings_Notification_Template_Modal',
      open: async () => {
        await page.evaluate(() => {
          const comp = window.ng.getComponent(document.querySelector('app-settings'));
          if (comp) {
            comp.openAddTemplateModal();
            window.ng.applyChanges(comp);
          }
        });
      },
      close: async () => {
        await page.evaluate(() => {
          const comp = window.ng.getComponent(document.querySelector('app-settings'));
          if (comp) {
            comp.showAddTemplateModal = false;
            window.ng.applyChanges(comp);
          }
        });
      },
      selector: '.notif-modal-dialog, .modal-content'
    },
    {
      name: '06_Settings_Invite_User_Modal',
      open: async () => {
        await page.evaluate(() => {
          const comp = window.ng.getComponent(document.querySelector('app-settings'));
          if (comp) {
            comp.openInviteUserModal();
            window.ng.applyChanges(comp);
          }
        });
      },
      close: async () => {
        await page.evaluate(() => {
          const comp = window.ng.getComponent(document.querySelector('app-settings'));
          if (comp) {
            comp.showInviteUserModal = false;
            window.ng.applyChanges(comp);
          }
        });
      },
      selector: '.modal-content'
    },
    {
      name: '07_Settings_Edit_User_Modal',
      open: async () => {
        await page.evaluate(() => {
          const comp = window.ng.getComponent(document.querySelector('app-settings'));
          if (comp) {
            const user = comp.usersList?.[0] || { username: 'MANAGER_1', email: 'manager@futaneagro.com', role: 'MANAGER', isActive: true };
            comp.openEditUserModal(user);
            window.ng.applyChanges(comp);
          }
        });
      },
      close: async () => {
        await page.evaluate(() => {
          const comp = window.ng.getComponent(document.querySelector('app-settings'));
          if (comp) {
            comp.showEditUserModal = false;
            window.ng.applyChanges(comp);
          }
        });
      },
      selector: '.modal-content'
    },
    {
      name: '08_Settings_RBAC_Permissions_Matrix_Modal',
      open: async () => {
        await page.evaluate(() => {
          const comp = window.ng.getComponent(document.querySelector('app-settings'));
          if (comp) {
            const user = comp.usersList?.[0] || { username: 'SUPER_ADMIN', role: 'SUPER_ADMIN' };
            comp.openUserAccessModal(user);
            window.ng.applyChanges(comp);
          }
        });
      },
      close: async () => {
        await page.evaluate(() => {
          const comp = window.ng.getComponent(document.querySelector('app-settings'));
          if (comp) {
            comp.showUserAccessModal = false;
            window.ng.applyChanges(comp);
          }
        });
      },
      selector: '.modal-content'
    },
    {
      name: '09_Settings_Feature_Flag_Detail_Modal',
      open: async () => {
        await page.evaluate(() => {
          const comp = window.ng.getComponent(document.querySelector('app-settings'));
          if (comp) {
            const flag = comp.featureFlags?.[0] || { key: 'ENABLE_GST_EWAY_BILL', name: 'GST E-Way Bill Auto Generation', enabled: true };
            comp.selectedFlagForDetail = { ...flag };
            comp.showFlagDetailModal = true;
            window.ng.applyChanges(comp);
          }
        });
      },
      close: async () => {
        await page.evaluate(() => {
          const comp = window.ng.getComponent(document.querySelector('app-settings'));
          if (comp) {
            comp.showFlagDetailModal = false;
            comp.selectedFlagForDetail = null;
            window.ng.applyChanges(comp);
          }
        });
      },
      selector: '.modal-content'
    },
    {
      name: '10_Settings_Generate_API_Key_Modal',
      open: async () => {
        await page.evaluate(() => {
          const comp = window.ng.getComponent(document.querySelector('app-settings'));
          if (comp) {
            comp.openCreateApiKeyModal();
            window.ng.applyChanges(comp);
          }
        });
      },
      close: async () => {
        await page.evaluate(() => {
          const comp = window.ng.getComponent(document.querySelector('app-settings'));
          if (comp) {
            comp.showApiKeyModal = false;
            window.ng.applyChanges(comp);
          }
        });
      },
      selector: '.modal-content'
    },
    {
      name: '11_Settings_Register_Webhook_Modal',
      open: async () => {
        await page.evaluate(() => {
          const comp = window.ng.getComponent(document.querySelector('app-settings'));
          if (comp) {
            comp.openCreateWebhookModal();
            window.ng.applyChanges(comp);
          }
        });
      },
      close: async () => {
        await page.evaluate(() => {
          const comp = window.ng.getComponent(document.querySelector('app-settings'));
          if (comp) {
            comp.showWebhookModal = false;
            window.ng.applyChanges(comp);
          }
        });
      },
      selector: '.modal-content'
    },
    {
      name: '12_Settings_Database_Restore_Modal',
      open: async () => {
        await page.evaluate(() => {
          const comp = window.ng.getComponent(document.querySelector('app-settings'));
          if (comp) {
            comp.activeSubTab = 'governance';
            comp.selectedBackupForRestore = { fileName: 'backup_prod_20261011.sql', date: '11 Oct 2026', size: '14.2 MB' };
            comp.showRestoreConfirmModal = true;
            window.ng.applyChanges(comp);
          }
        });
      },
      close: async () => {
        await page.evaluate(() => {
          const comp = window.ng.getComponent(document.querySelector('app-settings'));
          if (comp) {
            comp.showRestoreConfirmModal = false;
            window.ng.applyChanges(comp);
          }
        });
      },
      selector: '.restore-modal-content, .modal-content'
    },
    {
      name: '13_Settings_Security_Master_Password_Modal',
      open: async () => {
        await page.evaluate(() => {
          const comp = window.ng.getComponent(document.querySelector('app-settings'));
          if (comp) {
            comp.showMasterPasswordConfirmModal = true;
            window.ng.applyChanges(comp);
          }
        });
      },
      close: async () => {
        await page.evaluate(() => {
          const comp = window.ng.getComponent(document.querySelector('app-settings'));
          if (comp) {
            comp.showMasterPasswordConfirmModal = false;
            window.ng.applyChanges(comp);
          }
        });
      },
      selector: '.sec-confirm-modal, .modal-content'
    }
  ];

  for (const m of settingsModals) {
    try {
      await m.open();
      await page.waitForTimeout(350);
      await measureAndScreenshot(m.name, m.selector);
      await m.close();
      await page.waitForTimeout(250);
    } catch (e) {
      console.error(`Failed ${m.name}:`, e.message);
    }
  }

  // =========================================================================
  // 2. OPERATIONAL MODULE POP CARDS & DOSSIERS
  // =========================================================================
  console.log('\n--- SECTION 2: OPERATIONAL MODULE POP CARDS ---');

  // 14. Party: Client Dossier Modal
  try {
    await switchTab('parties');
    await page.waitForSelector('app-party', { timeout: 15000 });
    await page.evaluate(() => {
      const comp = window.ng.getComponent(document.querySelector('app-party'));
      if (comp) {
        comp.selectedPartyForDossier = comp.parties?.[0] || { id: 1, partyName: 'Futane Farms Agro Pvt Ltd', city: 'Baramati', phone: '9822001122' };
        comp.showDossierModal = true;
        window.ng.applyChanges(comp);
      }
    });
    await measureAndScreenshot('14_Party_Client_Dossier_Modal', '.dossier-modal-container');
    await page.evaluate(() => {
      const comp = window.ng.getComponent(document.querySelector('app-party'));
      if (comp) {
        comp.showDossierModal = false;
        window.ng.applyChanges(comp);
      }
    });
  } catch (e) { console.error('Party Dossier error:', e.message); }

  // 15. Sales: Commercial Outward Dossier Modal
  try {
    await switchTab('sales');
    await page.waitForSelector('app-sales', { timeout: 15000 });
    await page.evaluate(() => {
      const comp = window.ng.getComponent(document.querySelector('app-sales'));
      if (comp) {
        comp.openSalesDossier({
          id: 101,
          saleId: 'SO-2026-0089',
          date: '2026-10-11',
          crateType: 'Tomato Harvest Crates (Standard)',
          crateMaterial: 'Food-Grade Virgin HDPE',
          quantity: 250,
          rate: 450,
          totalAmount: 112500,
          paid: 112500,
          remaining: 0,
          party: { partyName: 'Sahyadri Farmers Producer Co.', city: 'Nashik', gstNumber: '27AABCS1234F1Z5' }
        });
        window.ng.applyChanges(comp);
      }
    });
    await measureAndScreenshot('15_Sales_Outward_Dossier_Modal', '.sales-dossier-dialog');
    await page.evaluate(() => {
      const comp = window.ng.getComponent(document.querySelector('app-sales'));
      if (comp) {
        comp.closeSalesDossier();
        window.ng.applyChanges(comp);
      }
    });
  } catch (e) { console.error('Sales Dossier error:', e.message); }

  // 16. Invoices: Tax Invoice Preview Modal
  try {
    await switchTab('invoices');
    await page.waitForSelector('app-invoices', { timeout: 15000 });
    await page.evaluate(() => {
      const comp = window.ng.getComponent(document.querySelector('app-invoices'));
      if (comp) {
        comp.selectedInvoice = {
          id: 'INV-2026-0014',
          invoiceNo: 'FA-GST-2026-0014',
          date: '2026-10-11',
          customerName: 'Sahyadri Agro Processing Ltd',
          party: { partyName: 'Sahyadri Agro Processing Ltd', gstNumber: '27AABCS1234F1Z5', city: 'Nashik' },
          items: [
            { name: 'HDPE Agricultural Crates', hsnCode: '3923', quantity: 200, unitPrice: 450, total: 90000, gstRate: 18, gstAmount: 16200, grandTotal: 106200 }
          ],
          subtotal: 90000,
          cgstAmount: 8100,
          sgstAmount: 8100,
          totalAmount: 106200,
          paymentStatus: 'PAID'
        };
        window.ng.applyChanges(comp);
      }
    });
    await measureAndScreenshot('16_Invoices_Tax_Invoice_Preview_Modal', '.invoice-modal-card');
    await page.evaluate(() => {
      const comp = window.ng.getComponent(document.querySelector('app-invoices'));
      if (comp) {
        comp.closeInvoiceModal();
        window.ng.applyChanges(comp);
      }
    });
  } catch (e) { console.error('Invoices Modal error:', e.message); }

  // 17. Salaries: View Salary Slip Modal
  try {
    await switchTab('salaries');
    await page.waitForSelector('app-salaries', { timeout: 15000 });
    await page.evaluate(() => {
      const comp = window.ng.getComponent(document.querySelector('app-salaries'));
      if (comp) {
        comp.openViewModal({
          id: 1,
          employeeId: 'FA-EMP-004',
          employeeName: 'Sunil Rao More',
          department: 'Precision Moulding & Extrusion',
          month: 'October 2026',
          basicSalary: 28000,
          hra: 5000,
          specialAllowance: 4000,
          pfDeduction: 1800,
          esicDeduction: 250,
          netSalary: 34950,
          status: 'PAID',
          disbursementDate: '2026-10-05',
          paymentMode: 'NEFT'
        });
        window.ng.applyChanges(comp);
      }
    });
    await measureAndScreenshot('17_Salaries_Salary_Slip_Modal', '.modal-dialog-voucher');
    await page.evaluate(() => {
      const comp = window.ng.getComponent(document.querySelector('app-salaries'));
      if (comp) {
        comp.closeViewModal();
        window.ng.applyChanges(comp);
      }
    });
  } catch (e) { console.error('Salaries Modal error:', e.message); }

  // 18. Inventory: Warehouse Stock Adjustment Modal
  try {
    await switchTab('inventory');
    await page.waitForSelector('app-inventory', { timeout: 15000 });
    await page.evaluate(() => {
      const comp = window.ng.getComponent(document.querySelector('app-inventory'));
      if (comp) {
        comp.adjustItem = {
          id: 1,
          itemCode: 'FG-CRATE-50L-RED',
          itemName: '50-Liter Reinforced Harvest Crate (Red)',
          category: 'Finished Goods',
          currentStock: 480,
          unit: 'PCS'
        };
        comp.adjustMode = 'add';
        comp.adjustQuantity = 50;
        comp.adjustReason = 'Physical stock audit';
        comp.isAdjustmentOpen = true;
        window.ng.applyChanges(comp);
      }
    });
    await measureAndScreenshot('18_Inventory_Stock_Adjustment_Modal', '.modal-dialog-box');
    await page.evaluate(() => {
      const comp = window.ng.getComponent(document.querySelector('app-inventory'));
      if (comp) {
        comp.closeAdjustmentModal();
        window.ng.applyChanges(comp);
      }
    });
  } catch (e) { console.error('Inventory Adjustment error:', e.message); }

  // 19. Vendors: Vendor Dossier Modal
  try {
    await switchTab('vendors');
    await page.waitForSelector('app-vendors', { timeout: 15000 });
    await page.evaluate(() => {
      const comp = window.ng.getComponent(document.querySelector('app-vendors'));
      if (comp) {
        comp.selectedVendorForDossier = {
          id: 1,
          vendorName: 'Reliance Polymers Pvt Ltd',
          category: 'Raw Polymer Granules',
          phone: '9822334455',
          city: 'Mumbai',
          gstNumber: '27AAACR1234E1Z1'
        };
        comp.showDossierModal = true;
        window.ng.applyChanges(comp);
      }
    });
    await measureAndScreenshot('19_Vendors_Vendor_Dossier_Modal', '.dossier-voucher-dialog');
    await page.evaluate(() => {
      const comp = window.ng.getComponent(document.querySelector('app-vendors'));
      if (comp) {
        comp.closeDossierModal();
        window.ng.applyChanges(comp);
      }
    });
  } catch (e) { console.error('Vendors Dossier error:', e.message); }

  // 20. Production: Batch QC Inspection Slip Modal
  try {
    await switchTab('production');
    await page.waitForSelector('app-production', { timeout: 15000 });
    await page.evaluate(() => {
      const comp = window.ng.getComponent(document.querySelector('app-production'));
      if (comp) {
        comp.selectedPpdForDossier = {
          id: 101,
          batchNo: 'PRD-2026-OCT-014',
          machineName: 'Toshiba 450T Injection Moulder',
          operatorName: 'Ramesh Kadam',
          crateType: 'Reinforced 50L Agri Crate',
          producedQuantity: 350,
          rejectedQuantity: 3,
          cycleTimeSeconds: 42,
          qualityStatus: 'APPROVED',
          shiftDate: '2026-10-11'
        };
        comp.showPpdDossierModal = true;
        window.ng.applyChanges(comp);
      }
    });
    await measureAndScreenshot('20_Production_QC_Inspection_Slip_Modal', '.dossier-modal-container');
    await page.evaluate(() => {
      const comp = window.ng.getComponent(document.querySelector('app-production'));
      if (comp) {
        comp.closePpdDossier();
        window.ng.applyChanges(comp);
      }
    });
  } catch (e) { console.error('Production Dossier error:', e.message); }

  // 21. Dispatch: Waybill Manifest Dossier Modal
  try {
    await switchTab('dispatch');
    await page.waitForSelector('app-dispatch', { timeout: 15000 });
    await page.evaluate(() => {
      const comp = window.ng.getComponent(document.querySelector('app-dispatch'));
      if (comp) {
        comp.openDispatchDossier({
          id: 201,
          dispatchNo: 'DSP-2026-0044',
          destination: 'Nashik Agro Center',
          transporterName: 'Sahyadri Logistics Fleet',
          vehicleNo: 'MH-12-FA-8899',
          driverName: 'Balasaheb Shinde',
          driverPhone: '9822445566',
          status: 'DISPATCHED',
          items: [
            { productName: 'Standard Harvest Crates (Green)', quantity: 400, unit: 'PCS' }
          ],
          totalQuantity: 400,
          dispatchDate: '2026-10-11'
        });
        window.ng.applyChanges(comp);
      }
    });
    await measureAndScreenshot('21_Dispatch_Manifest_Dossier_Modal', '.dispatch-dossier-dialog');
    await page.evaluate(() => {
      const comp = window.ng.getComponent(document.querySelector('app-dispatch'));
      if (comp) {
        comp.closeDispatchDossier();
        window.ng.applyChanges(comp);
      }
    });
  } catch (e) { console.error('Dispatch Dossier error:', e.message); }

  // 22. Transports: Waybill Dossier Modal
  try {
    await switchTab('transports');
    await page.waitForSelector('app-transports', { timeout: 15000 });
    await page.evaluate(() => {
      const comp = window.ng.getComponent(document.querySelector('app-transports'));
      if (comp) {
        comp.openViewModal({
          id: 1,
          transporterName: 'Omkar Freight Carriers',
          vehicleNo: 'MH-14-BT-1122',
          driverName: 'Mahesh Patil',
          source: 'Baramati Factory Unit 1',
          destination: 'Pune APMC Market Yard',
          freightAmount: 8500,
          advancePaid: 3000,
          balanceAmount: 5500,
          status: 'COMPLETED'
        });
        window.ng.applyChanges(comp);
      }
    });
    await measureAndScreenshot('22_Transports_Waybill_Modal', '.waybill-modal-dialog');
    await page.evaluate(() => {
      const comp = window.ng.getComponent(document.querySelector('app-transports'));
      if (comp) {
        comp.closeViewModal();
        window.ng.applyChanges(comp);
      }
    });
  } catch (e) { console.error('Transports Waybill error:', e.message); }

  // 23. Expenses: Payment Voucher Modal
  try {
    await switchTab('expenses');
    await page.waitForSelector('app-expenses', { timeout: 15000 });
    await page.evaluate(() => {
      const comp = window.ng.getComponent(document.querySelector('app-expenses'));
      if (comp) {
        comp.openVoucherModal({
          id: 1,
          voucherNo: 'VCH-EXP-2026-0033',
          expenseCategory: 'Factory Plant Maintenance',
          paidTo: 'Apex Hydraulic Works',
          amount: 14500,
          paymentMode: 'NEFT / RTGS',
          expenseDate: '2026-10-10',
          approvedBy: 'Works Director',
          notes: 'Preventive overhaul for Moulding Machine #3 Hydraulic Cylinders'
        });
        window.ng.applyChanges(comp);
      }
    });
    await measureAndScreenshot('23_Expenses_Payment_Voucher_Modal', '.voucher-modal-dialog');
    await page.evaluate(() => {
      const comp = window.ng.getComponent(document.querySelector('app-expenses'));
      if (comp) {
        comp.closeVoucherModal();
        window.ng.applyChanges(comp);
      }
    });
  } catch (e) { console.error('Expenses Voucher error:', e.message); }

  // 24. Audit Forensic Inspector Modal
  try {
    await switchTab('audit-logs');
    await page.waitForSelector('app-audit-logs', { timeout: 15000 });
    await page.evaluate(() => {
      const comp = window.ng.getComponent(document.querySelector('app-audit-logs'));
      if (comp) {
        comp.selectedLogForDetail = {
          id: 'LOG-2026-9988',
          timestamp: '2026-10-11T09:45:00',
          username: 'SUPER_ADMIN',
          action: 'UPDATE_COMPANY_GST_CONFIG',
          ipAddress: '192.168.1.105',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          status: 'SUCCESS',
          details: 'Updated Maharashtra GST State Code and Bank Settlement IFSC'
        };
        window.ng.applyChanges(comp);
      }
    });
    await measureAndScreenshot('24_Audit_Forensic_Inspector_Modal', '.audit-modal-content');
    await page.evaluate(() => {
      const comp = window.ng.getComponent(document.querySelector('app-audit-logs'));
      if (comp) {
        comp.closeLogDetail();
        window.ng.applyChanges(comp);
      }
    });
  } catch (e) { console.error('Audit Inspector error:', e.message); }

  await browser.close();

  console.log('\n======================================================');
  console.log(`TOTAL POP CARDS AUDITED: ${report.length}`);
  const passCount = report.filter(r => r.status === 'PASS').length;
  const failCount = report.filter(r => r.status === 'FAIL').length;
  console.log(`PASSED: ${passCount} / ${report.length} | FAILED: ${failCount}`);
  console.log('======================================================\n');

  fs.writeFileSync(path.join(SCREENSHOT_DIR, 'audit_report.json'), JSON.stringify(report, null, 2));
}

runComprehensiveAudit().catch(console.error);
