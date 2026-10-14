import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_BASE_DIR = 'c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/tab_popcards_audit';
fs.mkdirSync(SCREENSHOT_BASE_DIR, { recursive: true });

async function runTabByTabAudit() {
  console.log('========================================================================');
  console.log('=== FUTANE AGRO ERP — TAB-BY-TAB POP CARDS & MODALS EMPIRICAL AUDIT  ===');
  console.log('========================================================================\n');

  const browser = await chromium.launch({ headless: true });
  // Standard enterprise desktop viewport
  const context = await browser.newContext({ viewport: { width: 1339, height: 720 } });
  await context.addInitScript(() => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ sub: 'SUPER_ADMIN', role: 'SUPER_ADMIN', exp: 2000000000 }));
    const dummyJwt = header + '.' + payload + '.signature';
    const userObj = JSON.stringify({ username: 'SUPER_ADMIN', role: 'SUPER_ADMIN', name: 'Super Administrator' });
    sessionStorage.setItem('jwtToken', dummyJwt);
    sessionStorage.setItem('user', userObj);
    localStorage.setItem('user', userObj);
    sessionStorage.setItem('activeTab', 'dashboard');
  });

  const page = await context.newPage();

  console.log('1. Navigating to http://localhost:4300 with pre-authenticated session...');
  await page.goto('http://localhost:4300', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.sidebar', { timeout: 25000 });
  await page.waitForTimeout(1000);
  console.log('Application loaded and session active!\n');

  const auditReport = [];

  async function switchTab(tabName) {
    await page.evaluate((tab) => {
      const app = window.ng.getComponent(document.querySelector('app-root'));
      if (app) {
        app.switchTab(tab);
        window.ng.applyChanges(app);
      }
    }, tabName);
    await page.waitForTimeout(800);
  }

  async function auditPopCard({ tabName, componentSelector, cardId, cardTitle, triggerBtnSelector, triggerFn, dialogSelector, closeFn }) {
    console.log(`Auditing [Tab: ${tabName}] -> Card: ${cardTitle}...`);
    const tabDir = path.join(SCREENSHOT_BASE_DIR, tabName);
    fs.mkdirSync(tabDir, { recursive: true });

    // Ensure we are on the tab
    await switchTab(tabName);

    // Ensure component element is attached to DOM
    const tag = componentSelector || `app-${tabName === 'parties' ? 'party' : tabName}`;
    await page.waitForSelector(tag, { state: 'attached', timeout: 12000 }).catch(() => {});
    await page.waitForTimeout(500);

    // Trigger opening
    try {
      if (triggerFn) {
        await triggerFn();
      } else if (triggerBtnSelector) {
        const btn = page.locator(triggerBtnSelector).first();
        await btn.scrollIntoViewIfNeeded().catch(() => {});
        await btn.click({ timeout: 5000 }).catch(e => console.warn(`Trigger click warning: ${e.message}`));
      }
    } catch (err) {
      console.warn(`[WARN] Failed to trigger modal for ${cardId}:`, err.message);
    }
    await page.waitForTimeout(600);

    // Wait for dialog selector
    let isVisible = false;
    try {
      await page.waitForSelector(dialogSelector, { state: 'visible', timeout: 4000 });
      isVisible = true;
    } catch (e) {
      console.warn(`[WARN] Dialog not visible with selector: ${dialogSelector}`);
    }

    // Measure metrics and field count
    const metrics = await page.evaluate(({ dlgSel, sidebarWidth = 240 }) => {
      const dlg = document.querySelector(dlgSel);
      if (!dlg) return null;
      const dlgRect = dlg.getBoundingClientRect();
      const leftGap = dlgRect.x - sidebarWidth;
      const rightGap = window.innerWidth - (dlgRect.x + dlgRect.width);
      const asymmetry = Math.abs(leftGap - rightGap);

      // Check fields count & types
      const inputs = Array.from(dlg.querySelectorAll('input:not([type="hidden"]), select, textarea'));
      const buttons = Array.from(dlg.querySelectorAll('button, a.btn, input[type="submit"]'));
      
      // Check action button fold visibility
      const actionBtn = buttons[buttons.length - 1];
      const btnRect = actionBtn ? actionBtn.getBoundingClientRect() : null;
      const actionBtnAboveFold = btnRect ? (btnRect.bottom <= window.innerHeight + 25 && btnRect.top >= 0) : true;

      return {
        width: Math.round(dlgRect.width),
        height: Math.round(dlgRect.height),
        x: Math.round(dlgRect.x),
        y: Math.round(dlgRect.y),
        leftGap: Math.round(leftGap),
        rightGap: Math.round(rightGap),
        asymmetry: Math.round(asymmetry),
        isCentered: asymmetry <= 8,
        actionBtnAboveFold,
        inputCount: inputs.length,
        buttonCount: buttons.length,
        hasHorizontalOverflow: dlg.scrollWidth > dlg.clientWidth + 2
      };
    }, { dlgSel: dialogSelector });

    // Capture screenshot
    const screenshotName = `${cardId}.png`;
    const screenshotPath = path.join(tabDir, screenshotName);
    await page.screenshot({ path: screenshotPath });

    const passed = isVisible && metrics && metrics.actionBtnAboveFold && !metrics.hasHorizontalOverflow;
    const resultItem = {
      tabName,
      cardId,
      cardTitle,
      status: passed ? 'PASS' : 'FLAGGED',
      dialogSelector,
      screenshot: screenshotPath,
      metrics
    };
    auditReport.push(resultItem);

    console.log(`  -> Result: ${resultItem.status} | Size: ${metrics?.width}x${metrics?.height}px | Inputs: ${metrics?.inputCount} | Buttons: ${metrics?.buttonCount} | AboveFold: ${metrics?.actionBtnAboveFold} | Screenshot: ${screenshotName}`);

    // Close dialog
    if (closeFn) {
      await closeFn();
    } else {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }
    await page.waitForTimeout(300);
  }

  // =========================================================================
  // TAB 01: DASHBOARD (Header Flyouts & Global Modals)
  // =========================================================================
  console.log('\n--- SECTION 1: TAB 01 - DASHBOARD ---');
  await auditPopCard({
    tabName: 'dashboard',
    cardId: '01_dashboard_telemetry_hud_popover',
    cardTitle: 'Infrastructure Telemetry Popover',
    triggerBtnSelector: '.telemetry-health-btn',
    dialogSelector: '.telemetry-popover-menu',
    closeFn: async () => { await page.click('.telemetry-health-btn').catch(() => {}); }
  });

  await auditPopCard({
    tabName: 'dashboard',
    cardId: '02_dashboard_notifications_popover',
    cardTitle: 'Notification & Alerts Drawer Menu',
    triggerBtnSelector: '.notif-btn',
    dialogSelector: '.notif-dropdown',
    closeFn: async () => { await page.click('.notif-btn').catch(() => {}); }
  });

  // =========================================================================
  // TAB 02: PRODUCTION (Daily Production Log)
  // =========================================================================
  console.log('\n--- SECTION 2: TAB 02 - PRODUCTION ---');
  await auditPopCard({
    tabName: 'production',
    cardId: '03_production_qc_inspection_dossier',
    cardTitle: 'Batch QC Inspection Slip & Quality Dossier Modal',
    triggerFn: async () => {
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
    },
    dialogSelector: '.dossier-modal-container',
    closeFn: async () => {
      await page.evaluate(() => {
        const comp = window.ng.getComponent(document.querySelector('app-production'));
        if (comp) {
          comp.closePpdDossier();
          window.ng.applyChanges(comp);
        }
      });
    }
  });

  // =========================================================================
  // TAB 04: INVENTORY (Finished Goods Inventory)
  // =========================================================================
  console.log('\n--- SECTION 3: TAB 04 - INVENTORY ---');
  await auditPopCard({
    tabName: 'inventory',
    cardId: '04_inventory_warehouse_stock_adjustment',
    cardTitle: 'Warehouse Stock Adjustment Modal',
    triggerFn: async () => {
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
          comp.adjustReason = 'Physical warehouse cycle count adjustment';
          comp.isAdjustmentOpen = true;
          window.ng.applyChanges(comp);
        }
      });
    },
    dialogSelector: '.modal-dialog-box',
    closeFn: async () => {
      await page.evaluate(() => {
        const comp = window.ng.getComponent(document.querySelector('app-inventory'));
        if (comp) {
          comp.closeAdjustmentModal();
          window.ng.applyChanges(comp);
        }
      });
    }
  });

  // =========================================================================
  // TAB 05: MACHINES (Machines & Equipment Registry)
  // =========================================================================
  console.log('\n--- SECTION 4: TAB 05 - MACHINES ---');
  await auditPopCard({
    tabName: 'machines',
    cardId: '05_machines_register_equipment_drawer',
    cardTitle: 'Register Machine & Asset Profile Drawer',
    triggerFn: async () => {
      await page.evaluate(() => {
        const comp = window.ng.getComponent(document.querySelector('app-machines'));
        if (comp) {
          comp.isMachineFormOpen = true;
          window.ng.applyChanges(comp);
        }
      });
    },
    dialogSelector: '.erp-drawer',
    closeFn: async () => {
      await page.evaluate(() => {
        const comp = window.ng.getComponent(document.querySelector('app-machines'));
        if (comp) {
          comp.isMachineFormOpen = false;
          window.ng.applyChanges(comp);
        }
      });
    }
  });

  // =========================================================================
  // TAB 06: RAW MATERIALS (Polymer Procurement & GRN)
  // =========================================================================
  console.log('\n--- SECTION 5: TAB 06 - RAW MATERIALS ---');
  await auditPopCard({
    tabName: 'raw-materials',
    cardId: '06_raw_materials_grn_inspection_voucher',
    cardTitle: 'Material Inward & Inspection Note (GRN) Voucher Modal',
    triggerFn: async () => {
      await page.evaluate(() => {
        const comp = window.ng.getComponent(document.querySelector('app-raw-materials'));
        if (comp) {
          comp.selectedMaterialForDossier = {
            id: 1,
            batchNo: 'RM-2026-0044',
            materialName: 'Virgin HDPE Polymer Granules (Grade 100)',
            materialGrade: 'Food-Grade Blow/Injection Molding',
            supplierName: 'Reliance Polymers Pvt Ltd',
            netWeightKg: 5000,
            ratePerKg: 94.50,
            totalBatchCost: 472500,
            qcStatus: 'Passed & Accepted',
            purchaseDate: '2026-10-10'
          };
          comp.showInspectionModal = true;
          window.ng.applyChanges(comp);
        }
      });
    },
    dialogSelector: '.grn-voucher-dialog, .modal-content, .dossier-voucher-dialog',
    closeFn: async () => {
      await page.evaluate(() => {
        const comp = window.ng.getComponent(document.querySelector('app-raw-materials'));
        if (comp) {
          comp.showInspectionModal = false;
          window.ng.applyChanges(comp);
        }
      });
    }
  });

  // =========================================================================
  // TAB 07: VENDORS (Suppliers & Vendor Registry)
  // =========================================================================
  console.log('\n--- SECTION 6: TAB 07 - VENDORS ---');
  await auditPopCard({
    tabName: 'vendors',
    cardId: '07_vendors_supplier_dossier_modal',
    cardTitle: 'Vendor Dossier & Compliance Inspector Modal',
    triggerFn: async () => {
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
    },
    dialogSelector: '.dossier-voucher-dialog',
    closeFn: async () => {
      await page.evaluate(() => {
        const comp = window.ng.getComponent(document.querySelector('app-vendors'));
        if (comp) {
          comp.closeDossierModal();
          window.ng.applyChanges(comp);
        }
      });
    }
  });

  // =========================================================================
  // TAB 08: SALES (Commercial Sales Orders & Outward)
  // =========================================================================
  console.log('\n--- SECTION 7: TAB 08 - SALES ---');
  await auditPopCard({
    tabName: 'sales',
    cardId: '08_sales_commercial_contract_dossier',
    cardTitle: 'Official Commercial Sales Contract Dossier Modal',
    triggerFn: async () => {
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
    },
    dialogSelector: '.sales-dossier-dialog',
    closeFn: async () => {
      await page.evaluate(() => {
        const comp = window.ng.getComponent(document.querySelector('app-sales'));
        if (comp) {
          comp.closeSalesDossier();
          window.ng.applyChanges(comp);
        }
      });
    }
  });

  // =========================================================================
  // TAB 09: DISPATCH (Logistics & Manifest Dossiers)
  // =========================================================================
  console.log('\n--- SECTION 8: TAB 09 - DISPATCH ---');
  await auditPopCard({
    tabName: 'dispatch',
    cardId: '09_dispatch_waybill_manifest_dossier',
    cardTitle: 'Outward Logistics Waybill Manifest Dossier Modal',
    triggerFn: async () => {
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
    },
    dialogSelector: '.dispatch-dossier-dialog',
    closeFn: async () => {
      await page.evaluate(() => {
        const comp = window.ng.getComponent(document.querySelector('app-dispatch'));
        if (comp) {
          comp.closeDispatchDossier();
          window.ng.applyChanges(comp);
        }
      });
    }
  });

  // =========================================================================
  // TAB 10: TRANSPORTS (Freight Waybill)
  // =========================================================================
  console.log('\n--- SECTION 9: TAB 10 - TRANSPORTS ---');
  await auditPopCard({
    tabName: 'transports',
    cardId: '10_transports_freight_waybill_modal',
    cardTitle: 'Freight Consignment Waybill Modal',
    triggerFn: async () => {
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
    },
    dialogSelector: '.waybill-modal-dialog',
    closeFn: async () => {
      await page.evaluate(() => {
        const comp = window.ng.getComponent(document.querySelector('app-transports'));
        if (comp) {
          comp.closeViewModal();
          window.ng.applyChanges(comp);
        }
      });
    }
  });

  // =========================================================================
  // TAB 12: PARTIES (Customers & Party Directory Dossier)
  // =========================================================================
  console.log('\n--- SECTION 10: TAB 12 - PARTIES ---');
  await auditPopCard({
    tabName: 'parties',
    cardId: '11_parties_client_dossier_modal',
    cardTitle: 'Customer / Party KYC Dossier Modal',
    triggerFn: async () => {
      await page.evaluate(() => {
        const comp = window.ng.getComponent(document.querySelector('app-party'));
        if (comp) {
          comp.selectedPartyForDossier = {
            id: 1,
            partyName: 'Futane Farms Agro Pvt Ltd',
            city: 'Baramati',
            phone: '9822001122',
            gstNumber: '27AABCF1234G1Z8'
          };
          comp.showDossierModal = true;
          window.ng.applyChanges(comp);
        }
      });
    },
    dialogSelector: '.dossier-modal-container',
    closeFn: async () => {
      await page.evaluate(() => {
        const comp = window.ng.getComponent(document.querySelector('app-party'));
        if (comp) {
          comp.showDossierModal = false;
          window.ng.applyChanges(comp);
        }
      });
    }
  });

  // =========================================================================
  // TAB 14: INVOICES (Tax Invoice Preview Modal)
  // =========================================================================
  console.log('\n--- SECTION 11: TAB 14 - INVOICES ---');
  await auditPopCard({
    tabName: 'invoices',
    cardId: '12_invoices_tax_invoice_preview_modal',
    cardTitle: 'Official Printable Tax Invoice Preview Modal',
    triggerFn: async () => {
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
    },
    dialogSelector: '.invoice-modal-card',
    closeFn: async () => {
      await page.evaluate(() => {
        const comp = window.ng.getComponent(document.querySelector('app-invoices'));
        if (comp) {
          comp.closeInvoiceModal();
          window.ng.applyChanges(comp);
        }
      });
    }
  });

  // =========================================================================
  // TAB 17: EXPENSES (Payment Voucher Modal)
  // =========================================================================
  console.log('\n--- SECTION 12: TAB 17 - EXPENSES ---');
  await auditPopCard({
    tabName: 'expenses',
    cardId: '13_expenses_payment_voucher_modal',
    cardTitle: 'Operating Expense Payment Voucher Modal',
    triggerFn: async () => {
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
    },
    dialogSelector: '.voucher-modal-dialog',
    closeFn: async () => {
      await page.evaluate(() => {
        const comp = window.ng.getComponent(document.querySelector('app-expenses'));
        if (comp) {
          comp.closeVoucherModal();
          window.ng.applyChanges(comp);
        }
      });
    }
  });

  // =========================================================================
  // TAB 18: SALARIES (Salary Slip Modal)
  // =========================================================================
  console.log('\n--- SECTION 13: TAB 18 - SALARIES ---');
  await auditPopCard({
    tabName: 'salaries',
    cardId: '14_salaries_salary_slip_modal',
    cardTitle: 'Official Employee Salary Slip Modal',
    triggerFn: async () => {
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
    },
    dialogSelector: '.modal-dialog-voucher',
    closeFn: async () => {
      await page.evaluate(() => {
        const comp = window.ng.getComponent(document.querySelector('app-salaries'));
        if (comp) {
          comp.closeViewModal();
          window.ng.applyChanges(comp);
        }
      });
    }
  });

  // =========================================================================
  // TAB 22: AUDIT LOGS (Forensic IP Inspector)
  // =========================================================================
  console.log('\n--- SECTION 14: TAB 22 - AUDIT LOGS ---');
  await auditPopCard({
    tabName: 'audit-logs',
    cardId: '15_audit_logs_forensic_inspector_modal',
    cardTitle: 'Forensic Audit Log & IP Inspector Modal',
    triggerFn: async () => {
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
    },
    dialogSelector: '.audit-modal-content',
    closeFn: async () => {
      await page.evaluate(() => {
        const comp = window.ng.getComponent(document.querySelector('app-audit-logs'));
        if (comp) {
          comp.closeLogDetail();
          window.ng.applyChanges(comp);
        }
      });
    }
  });

  // =========================================================================
  // TAB 23: SETTINGS (Enterprise Settings 13 Pop Cards)
  // =========================================================================
  console.log('\n--- SECTION 15: TAB 23 - SETTINGS ---');
  await auditPopCard({
    tabName: 'settings',
    cardId: '16_settings_company_profile_modal',
    cardTitle: 'Company Legal Entity & Billing Profile Modal',
    triggerFn: async () => {
      await page.evaluate(() => {
        const comp = window.ng.getComponent(document.querySelector('app-settings'));
        if (comp) {
          comp.openAddCompanyModal();
          window.ng.applyChanges(comp);
        }
      });
    },
    dialogSelector: '.modal-content',
    closeFn: async () => {
      await page.evaluate(() => {
        const comp = window.ng.getComponent(document.querySelector('app-settings'));
        if (comp) {
          comp.showCompanyModal = false;
          window.ng.applyChanges(comp);
        }
      });
    }
  });

  await auditPopCard({
    tabName: 'settings',
    cardId: '17_settings_dynamic_schema_field_modal',
    cardTitle: 'Dynamic Schema Field Definition Modal',
    triggerFn: async () => {
      await page.evaluate(() => {
        const comp = window.ng.getComponent(document.querySelector('app-settings'));
        if (comp) {
          comp.openAddCustomFieldModal();
          window.ng.applyChanges(comp);
        }
      });
    },
    dialogSelector: '.cf-modal-dialog',
    closeFn: async () => {
      await page.evaluate(() => {
        const comp = window.ng.getComponent(document.querySelector('app-settings'));
        if (comp) {
          comp.showCustomFieldModal = false;
          window.ng.applyChanges(comp);
        }
      });
    }
  });

  await browser.close();

  console.log('\n========================================================================');
  console.log(`TOTAL POP CARDS EMPIRICALLY AUDITED: ${auditReport.length}`);
  const passCount = auditReport.filter(r => r.status === 'PASS').length;
  const flagCount = auditReport.filter(r => r.status === 'FLAGGED').length;
  console.log(`PASSED: ${passCount} / ${auditReport.length} | FLAGGED: ${flagCount}`);
  console.log(`Screenshots saved to: ${SCREENSHOT_BASE_DIR}`);
  console.log('========================================================================\n');

  fs.writeFileSync(path.join(SCREENSHOT_BASE_DIR, 'audit_report.json'), JSON.stringify(auditReport, null, 2));
}

runTabByTabAudit().catch(console.error);
