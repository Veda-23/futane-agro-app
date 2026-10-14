import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const AUDIT_OUT_DIR = 'c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/targeted_tabs_audit';

if (!fs.existsSync(AUDIT_OUT_DIR)) {
  fs.mkdirSync(AUDIT_OUT_DIR, { recursive: true });
}

async function verifyAllPopcards() {
  console.log('========================================================================');
  console.log('=== FUTANE AGRO ERP: POP CARDS & MODALS ENTERPRISE AUDIT RUNNER      ===');
  console.log('========================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const viewport = { width: 1339, height: 720 };
  const context = await browser.newContext({ viewport });

  // Session & JWT Auth Bypass
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
  await page.goto('http://localhost:4300', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.sidebar', { timeout: 20000 });
  console.log('App loaded & authenticated as SUPER_ADMIN.\n');

  const auditResults = [];

  // Helper to switch tab deterministically
  async function switchToTab(tabName, selector) {
    await page.evaluate((tab) => {
      const root = window.ng.getComponent(document.querySelector('app-root'));
      if (root) {
        root.switchTab(tab);
        window.ng.applyChanges(root);
      }
    }, tabName);
    await page.waitForSelector(selector, { state: 'attached', timeout: 15000 });
    await page.waitForTimeout(600);
  }

  // Helper to audit element geometry
  async function auditElement(selector, title, screenshotName) {
    const el = page.locator(selector).first();
    await el.waitFor({ state: 'visible', timeout: 5000 });
    const box = await el.boundingBox();

    const leftGap = box ? Math.round(box.x) : 0;
    const rightGap = box ? Math.round(viewport.width - (box.x + box.width)) : 0;
    const asymmetry = Math.abs(leftGap - rightGap);
    const isCentered = asymmetry <= 2;
    const isHeightSafe = box ? (box.y + box.height <= viewport.height + 5) : false;

    const inputCount = await el.locator('input:visible, select:visible, textarea:visible').count();
    const buttonCount = await el.locator('button:visible, .btn:visible, a.btn:visible').count();

    // Ensure CSS scale/fade animations have fully settled before taking screenshot
    await page.waitForTimeout(450);

    const shotPath = path.join(AUDIT_OUT_DIR, screenshotName);
    await page.screenshot({ path: shotPath });

    const result = {
      title,
      screenshot: screenshotName,
      width: Math.round(box.width),
      height: Math.round(box.height),
      x: Math.round(box.x),
      y: Math.round(box.y),
      leftGap,
      rightGap,
      asymmetry,
      isCentered,
      isHeightSafe,
      inputCount,
      buttonCount
    };
    auditResults.push(result);
    console.log(`[PASS] ${title}`);
    console.log(`       Size: ${result.width}x${result.height}px | Centered: ${isCentered} (Asym: ${asymmetry}px) | HeightSafe: ${isHeightSafe} | Controls: ${inputCount} inputs, ${buttonCount} buttons`);
    console.log(`       Screenshot saved: ${screenshotName}\n`);
    return result;
  }

  // -------------------------------------------------------------------------
  // 1. TAB 06: RAW MATERIALS
  // -------------------------------------------------------------------------
  console.log('--- AUDITING TAB 06: RAW MATERIALS ---');
  await switchToTab('raw-materials', 'app-raw-materials');

  // Modal 1: Procurement Batch Drawer
  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-raw-materials'));
    if (comp) {
      comp.isAddFormOpen = true;
      window.ng.applyChanges(comp);
    }
  });
  await auditElement('.erp-drawer', 'Raw Materials: Log Procurement Batch Drawer', '01_raw_materials_procurement_drawer.png');

  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-raw-materials'));
    if (comp) {
      comp.isAddFormOpen = false;
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);

  // Modal 2: GRN Inspection Voucher Modal
  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-raw-materials'));
    if (comp) {
      comp.selectedMaterialForInspection = {
        id: 1,
        materialName: 'Virgin HDPE Granules Grade 100',
        weight: 5000,
        rate: 95,
        totalAmount: 475000,
        vendor: { name: 'Reliance Polymers Petrochemicals', phone: '022-22863000' },
        date: '2026-10-11'
      };
      comp.showInspectionModal = true;
      window.ng.applyChanges(comp);
    }
  });
  await auditElement('.grn-voucher-dialog', 'Raw Materials: GRN Inspection Voucher Modal', '02_raw_materials_grn_voucher_modal.png');

  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-raw-materials'));
    if (comp) {
      comp.closeInspectionModal();
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);

  // -------------------------------------------------------------------------
  // 2. TAB 04: INVENTORY
  // -------------------------------------------------------------------------
  console.log('--- AUDITING TAB 04: FINISHED GOODS INVENTORY ---');
  await switchToTab('inventory', 'app-inventory');

  // Modal 1: Stock Adjustment Modal
  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-inventory'));
    if (comp) {
      comp.adjustItem = {
        id: 1,
        inventoryId: 1,
        crateType: '50-Liter Reinforced Harvest Crate (Red)',
        warehouseZone: 'Zone A - Vegetable Bay (Racks 01-12)',
        currentStock: 480
      };
      comp.adjustMode = 'add';
      comp.adjustQuantity = 50;
      comp.adjustReason = 'Physical stock audit';
      comp.adjustNotes = 'LOT-2026-OCT-014 / Pallet #7';
      comp.isAdjustmentOpen = true;
      window.ng.applyChanges(comp);
    }
  });
  await auditElement('.modal-dialog-box', 'Inventory: Warehouse Stock Adjustment Modal', '03_inventory_stock_adjustment_modal.png');

  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-inventory'));
    if (comp) {
      comp.closeAdjustmentModal();
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);

  // Modal 2: SKU View Details Drawer
  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-inventory'));
    if (comp) {
      comp.selectedItem = {
        id: 1,
        inventoryId: 1,
        crateType: '50-Liter Reinforced Harvest Crate (Red)',
        materialType: 'Virgin HDPE Polymer Grade 100',
        warehouseZone: 'Zone A - Vegetable Bay (Racks 01-12)',
        currentStock: 480,
        openingStock: 200,
        producedStock: 400,
        soldStock: 120,
        unitPrice: 450,
        lastUpdated: '2026-10-11'
      };
      comp.detailsActiveTab = 'overview';
      comp.isDetailsOpen = true;
      window.ng.applyChanges(comp);
    }
  });
  await auditElement('.drawer-panel-wide', 'Inventory: SKU View Details Drawer', '04_inventory_sku_details_drawer.png');

  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-inventory'));
    if (comp) {
      comp.closeDetails();
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);

  // -------------------------------------------------------------------------
  // 3. TAB 08: COMMERCIAL SALES
  // -------------------------------------------------------------------------
  console.log('--- AUDITING TAB 08: COMMERCIAL SALES ORDERS ---');
  await switchToTab('sales', 'app-sales');

  // Modal 1: Material Outward & Dispatch Modal
  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-sales'));
    if (comp) {
      const mockSale = {
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
      };
      comp.openOutwardModal(mockSale);
      window.ng.applyChanges(comp);
    }
  });
  await auditElement('.outward-modal-dialog', 'Sales: Material Outward & Dispatch Modal', '05_sales_material_outward_modal.png');

  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-sales'));
    if (comp) {
      comp.closeOutwardModal();
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);

  // Modal 2: Commercial Sales Contract Dossier Modal
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
  await auditElement('.sales-dossier-dialog', 'Sales: Commercial Sales Order Dossier Modal', '06_sales_order_dossier_modal.png');

  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-sales'));
    if (comp) {
      comp.closeSalesDossier();
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);

  // -------------------------------------------------------------------------
  // 4. TAB 14: TAX INVOICES & BILLING
  // -------------------------------------------------------------------------
  console.log('--- AUDITING TAB 14: TAX INVOICES & BILLING ---');
  await switchToTab('invoices', 'app-invoices');

  // Modal 1: GST Tax Invoice Preview Modal
  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-invoices'));
    if (comp) {
      comp.selectedInvoice = {
        id: 201,
        invoiceNo: 'INV-2026-0412',
        date: '2026-10-11',
        createdDate: '2026-10-11',
        sale: {
          id: 101,
          crateType: 'Jumbo Perforated Crate (600x400x325mm)',
          crateMaterial: 'Virgin HDPE (Food Grade)',
          quantity: 250,
          rate: 450,
          totalAmount: 132750,
          paid: 132750,
          remaining: 0,
          cgst: 10125,
          sgst: 10125,
          party: {
            partyName: 'Sahyadri Farmers Producer Co.',
            gstNumber: '27AABCS1234F1Z5',
            city: 'Nashik',
            address: 'Plot 45, Dindori Agro Park, Nashik - 422007',
            phone: '+91 98220 12345'
          }
        }
      };
      window.ng.applyChanges(comp);
    }
  });
  await auditElement('.invoice-modal-card', 'Invoices: GST Tax Invoice Preview Modal', '07_invoices_tax_invoice_preview_modal.png');

  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-invoices'));
    if (comp) {
      comp.closeInvoiceModal();
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);

  // Modal 2: Create Tax Invoice Slide-Over Drawer
  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-invoices'));
    if (comp) {
      comp.isCreateDrawerOpen = true;
      window.ng.applyChanges(comp);
    }
  });
  await auditElement('.invoice-drawer-panel', 'Invoices: Create Tax Invoice Drawer', '08_invoices_create_tax_invoice_drawer.png');

  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-invoices'));
    if (comp) {
      comp.closeCreateDrawer();
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);

  // -------------------------------------------------------------------------
  // 5. TAB 02: DAILY PRODUCTION & QUALITY DOSSIER
  // -------------------------------------------------------------------------
  console.log('--- AUDITING TAB 02: DAILY PRODUCTION ---');
  await switchToTab('production', 'app-production');

  // Modal 1: Batch QC Inspection & Manufacturing Release Dossier Modal
  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-production'));
    if (comp) {
      comp.selectedPpdForDossier = {
        id: 104,
        date: '2026-10-12',
        crateType: 'Apple Crate (20kg Ventilated)',
        shift: 'Morning Shift (06:00 - 14:00)',
        totalProduction: 450,
        successful: 438,
        rejected: 12
      };
      comp.showPpdDossierModal = true;
      window.ng.applyChanges(comp);
    }
  });
  await auditElement('.dossier-modal-container', 'Production: Batch QC Inspection Dossier Modal', '09_production_qc_dossier_modal.png');

  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-production'));
    if (comp) {
      comp.closePpdDossier();
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);

  // Modal 2: Production Add/Edit Batch Entry Modal
  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-production'));
    if (comp) {
      comp.ppdForm = {
        id: 'PPD-2026-104',
        date: '2026-10-12',
        crateType: 'Apple Crate',
        shift: 'Morning Shift',
        successful: 438,
        rejected: 12,
        totalProduction: 450
      };
      comp.isFormVisible = true;
      window.ng.applyChanges(comp);
    }
  });
  await auditElement('.production-modal-dialog', 'Production: Add/Edit Production Batch Modal', '10_production_batch_entry_modal.png');

  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-production'));
    if (comp) {
      comp.isFormVisible = false;
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);

  // -------------------------------------------------------------------------
  // 6. TAB 05: INJECTION MOULDING MACHINES & BREAKDOWN LEDGER
  // -------------------------------------------------------------------------
  console.log('--- AUDITING TAB 05: MACHINES & BREAKDOWNS ---');
  await switchToTab('machines', 'app-machines');

  // Modal 1: Register Machine Unit Drawer
  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-machines'));
    if (comp) {
      comp.isMachineFormOpen = true;
      window.ng.applyChanges(comp);
    }
  });
  await auditElement('.erp-drawer', 'Machines: Register Machine Unit Drawer', '11_machines_register_drawer.png');

  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-machines'));
    if (comp) {
      comp.cancelEditMachine();
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);

  // Modal 2: Log Breakdown Incident Drawer
  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-machines'));
    if (comp) {
      comp.switchSubTab('breakdowns');
      comp.isBreakdownFormOpen = true;
      window.ng.applyChanges(comp);
    }
  });
  await auditElement('.erp-drawer', 'Machines: Log Breakdown Incident Drawer', '12_machines_breakdown_drawer.png');

  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-machines'));
    if (comp) {
      comp.cancelEditBreakdown();
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);

  // -------------------------------------------------------------------------
  // 7. TAB 07: APPROVED VENDORS & SUPPLIERS DIRECTORY
  // -------------------------------------------------------------------------
  console.log('--- AUDITING TAB 07: VENDORS & SUPPLIERS ---');
  await switchToTab('vendors', 'app-vendors');

  // Modal 1: Vendor Registration / Profile Editor Drawer
  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-vendors'));
    if (comp) {
      comp.openAddForm();
      window.ng.applyChanges(comp);
    }
  });
  await auditElement('.erp-drawer', 'Vendors: Register Supplier Profile Drawer', '13_vendors_register_drawer.png');

  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-vendors'));
    if (comp) {
      comp.cancelEdit();
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);

  // Modal 2: Supplier Commercial Dossier Modal
  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-vendors'));
    if (comp) {
      comp.selectedVendorForDossier = {
        id: '101',
        vendorId: 101,
        vendorName: 'Reliance Polymers Industries Ltd',
        mobile: '+91 98220 99881',
        address: 'Plot A-12, MIDC Patalganga Industrial Area, Khalapur - 410220',
        gstNumber: '27AABCR1234F1Z8',
        contactPerson: 'Vikram Singhania (VP Sales)'
      };
      comp.showDossierModal = true;
      window.ng.applyChanges(comp);
    }
  });
  await auditElement('.dossier-voucher-dialog', 'Vendors: Supplier Commercial Dossier Modal', '14_vendors_commercial_dossier_modal.png');

  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-vendors'));
    if (comp) {
      comp.closeDossierModal();
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);

  // -------------------------------------------------------------------------
  // 8. TAB 09: DISPATCH & CONSIGNMENT OUTWARD
  // -------------------------------------------------------------------------
  console.log('--- AUDITING TAB 09: DISPATCH HUB ---');
  await switchToTab('dispatch', 'app-dispatch');

  // Modal 1: Create Dispatch Manifest Dialog
  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-dispatch'));
    if (comp) {
      comp.isFormOpen = true;
      window.ng.applyChanges(comp);
    }
  });
  await auditElement('.dispatch-modal-dialog', 'Dispatch: Create Dispatch Manifest Modal', '15_dispatch_create_manifest_modal.png');

  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-dispatch'));
    if (comp) {
      comp.isFormOpen = false;
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);

  // Modal 2: Delivery Challan & Dispatch Gate Pass Dossier Modal
  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-dispatch'));
    if (comp) {
      comp.selectedDispatchForDossier = {
        id: 304,
        dispatchDate: '2026-10-12',
        vehicleNumber: 'MH-12-RN-9921',
        driverName: 'Suresh Shinde',
        deliveryAddress: 'Plot 45, Dindori Agro Park, Nashik - 422007',
        dispatchStatus: 'Dispatched',
        sale: {
          id: 501,
          date: '2026-10-11',
          party: {
            partyName: 'Sahyadri Farmers Producer Co.'
          },
          crateType: 'Jumbo Perforated Crate (600x400x325mm)',
          quantity: 250
        }
      };
      comp.showDispatchDossierModal = true;
      window.ng.applyChanges(comp);
    }
  });
  await auditElement('.dispatch-dossier-dialog', 'Dispatch: Gate Pass Clearance & Delivery Challan Modal', '16_dispatch_gatepass_dossier_modal.png');

  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-dispatch'));
    if (comp) {
      comp.closeDispatchDossier();
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);

  // -------------------------------------------------------------------------
  // 9. TAB 10: TRANSPORTS (FREIGHT & LOGISTICS)
  // -------------------------------------------------------------------------
  console.log('--- AUDITING TAB 10: FREIGHT TRANSPORTS ---');
  await switchToTab('transports', 'app-transports');

  // Modal 1: Register Freight Trip Drawer
  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-transports'));
    if (comp) {
      comp.transportsForm = {
        date: '2026-10-12',
        truckNumber: 'MH-12-TR-8821',
        driverId: 1,
        rent: 18500,
        advance: 5000,
        truckPhotoPath: '/uploads/trucks/mh12tr8821.jpg',
        driverLicensePath: '/uploads/licenses/dl_santosh.pdf'
      };
      comp.isFormDrawerOpen = true;
      window.ng.applyChanges(comp);
    }
  });
  await auditElement('app-transports .slide-drawer', 'Transports: Register Freight Trip Drawer', '17_transports_register_drawer.png');

  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-transports'));
    if (comp) {
      comp.closeFormDrawer();
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);

  // Modal 2: Consignment Waybill & Freight Slip Modal
  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-transports'));
    if (comp) {
      comp.selectedTrip = {
        id: 701,
        date: '2026-10-12',
        truckNumber: 'MH-12-TR-8821',
        rent: 18500,
        advance: 5000,
        remaining: 13500,
        driver: {
          id: 1,
          driverName: 'Santosh Jadhav',
          mobile: '+91 98220 54321',
          licenseNumber: 'MH-12-2015-004567',
          address: 'Kolhapur Central Logistics Depot'
        }
      };
      comp.isViewModalOpen = true;
      window.ng.applyChanges(comp);
    }
  });
  await auditElement('.waybill-modal-dialog', 'Transports: Consignment Waybill & Freight Slip Modal', '18_transports_waybill_modal.png');

  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-transports'));
    if (comp) {
      comp.closeViewModal();
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);

  // -------------------------------------------------------------------------
  // 10. TAB 11: DRIVERS FLEET ROSTER
  // -------------------------------------------------------------------------
  console.log('--- AUDITING TAB 11: DRIVERS ROSTER ---');
  await switchToTab('drivers', 'app-drivers');

  // Modal 1: Enroll Commercial Driver Drawer
  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-drivers'));
    if (comp) {
      comp.driverForm = {
        id: 101,
        driverName: 'Sanjay B. Shinde',
        mobile: '9822012345',
        licenseNumber: 'MH-12-2018-0012345',
        address: 'Plot 4, MIDC Shiroli, Kolhapur'
      };
      comp.isFormDrawerOpen = true;
      window.ng.applyChanges(comp);
    }
  });
  await auditElement('app-drivers .slide-drawer', 'Drivers: Enroll Commercial Driver Drawer', '19_drivers_enroll_drawer.png');

  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-drivers'));
    if (comp) {
      comp.closeFormDrawer();
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);

  // -------------------------------------------------------------------------
  // 11. TAB 12: PARTIES (CUSTOMER & CLIENT DIRECTORY)
  // -------------------------------------------------------------------------
  console.log('--- AUDITING TAB 12: PARTIES DIRECTORY ---');
  await switchToTab('parties', 'app-party');

  // Modal 1: Client Profile Registration / Edit Drawer
  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-party'));
    if (comp) {
      comp.openEditDrawer({
        id: '201',
        partyId: 201,
        partyName: 'Sahyadri Farmers Producer Co.',
        partyContact: '+91 98220 12345',
        gstNumber: '27AABCS1234F1Z5',
        city: 'Nashik',
        state: 'Maharashtra',
        partyAddress: 'Plot 45, Dindori Agro Park, Nashik - 422007',
        email: 'procurement@sahyadrifarms.com',
        isActive: true
      });
      window.ng.applyChanges(comp);
    }
  });
  await auditElement('app-party .party-drawer', 'Parties: Register Client Profile Drawer', '20_parties_register_drawer.png');

  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-party'));
    if (comp) {
      comp.closeEditDrawer();
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);

  // Modal 2: Official Client Dossier Inspection Modal
  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-party'));
    if (comp) {
      comp.openPartyDossier({
        id: '201',
        partyId: 201,
        partyName: 'Sahyadri Farmers Producer Co.',
        partyContact: '+91 98220 12345',
        gstNumber: '27AABCS1234F1Z5',
        city: 'Nashik',
        state: 'Maharashtra',
        partyAddress: 'Plot 45, Dindori Agro Park, Nashik - 422007',
        email: 'procurement@sahyadrifarms.com',
        isActive: true
      });
      window.ng.applyChanges(comp);
    }
  });
  await auditElement('.dossier-modal-container', 'Parties: Client Commercial Dossier Modal', '21_parties_dossier_modal.png');

  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-party'));
    if (comp) {
      comp.closePartyDossier();
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);

  // -------------------------------------------------------------------------
  // 12. TAB 13: PAYMENTS & FINANCIAL SETTLEMENTS
  // -------------------------------------------------------------------------
  console.log('--- AUDITING TAB 13: PAYMENTS & SETTLEMENTS ---');
  await switchToTab('payments', 'app-payments');

  // Modal 1: Payment Receipt Voucher Modal
  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-payments'));
    if (comp) {
      comp.openVoucherModal({
        id: 401,
        paymentDate: '2026-10-12',
        amountReceived: 132750,
        paymentMode: 'Bank Transfer (NEFT/RTGS)',
        referenceNo: 'HDFC-N2610129841',
        invoiceNo: 'INV-2026-0412',
        party: {
          id: 201,
          partyName: 'Sahyadri Farmers Producer Co.',
          gstNumber: '27AABCS1234F1Z5',
          city: 'Nashik',
          address: 'Plot 45, Dindori Agro Park, Nashik - 422007'
        }
      });
      window.ng.applyChanges(comp);
    }
  });
  await auditElement('.receipt-voucher-dialog', 'Payments: Official Payment Receipt Voucher Modal', '22_payments_receipt_voucher_modal.png');

  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-payments'));
    if (comp) {
      comp.closeVoucherModal();
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);

  // -------------------------------------------------------------------------
  // 13. TAB 15: EXPENSES REGISTRY & COST CENTER
  // -------------------------------------------------------------------------
  console.log('--- AUDITING TAB 15: EXPENSES & COST CENTER ---');
  await switchToTab('expenses', 'app-expenses');

  // Modal 1: Log Operational Expense Voucher Drawer
  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-expenses'));
    if (comp) {
      comp.expenseForm = {
        category: 'Factory Utilities',
        expenseDate: '2026-10-12',
        amount: 48500,
        description: 'Monthly Substation Power & Electricity Tariff Settlement',
        paidBy: 'Treasury Officer (Shinde)',
        paymentMode: 'Bank Transfer (NEFT)'
      };
      comp.isDrawerOpen = true;
      window.ng.applyChanges(comp);
    }
  });
  await auditElement('app-expenses .enterprise-drawer', 'Expenses: Log Expense Voucher Drawer', '23_expenses_register_drawer.png');

  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-expenses'));
    if (comp) {
      comp.cancelEdit();
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);

  // Modal 2: Expense Voucher & Disbursement Slip Modal
  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-expenses'));
    if (comp) {
      comp.selectedExpenseForVoucher = {
        id: 101,
        expenseDate: '2026-10-12',
        category: 'Factory Utilities',
        amount: 48500,
        description: 'Monthly Substation Power & Electricity Tariff Settlement',
        paymentMode: 'Bank Transfer (NEFT)',
        paidBy: 'Treasury Officer (Shinde)'
      };
      comp.showVoucherModal = true;
      window.ng.applyChanges(comp);
    }
  });
  await auditElement('.voucher-modal-dialog', 'Expenses: Expense Voucher & Disbursement Slip Modal', '24_expenses_voucher_modal.png');

  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-expenses'));
    if (comp) {
      comp.closeVoucherModal();
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);

  // -------------------------------------------------------------------------
  // 14. TAB 16: SALARIES & PAYROLL VOUCHERS
  // -------------------------------------------------------------------------
  console.log('--- AUDITING TAB 16: SALARIES & PAYROLL ---');
  await switchToTab('salaries', 'app-salaries');

  // Modal 1: Create / Edit Salary Voucher Drawer
  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-salaries'));
    if (comp) {
      comp.salariesForm = {
        month: 'October',
        year: 2026,
        employeeId: 105,
        salaryAmount: 32000,
        status: 'Paid',
        paidDate: '2026-10-12'
      };
      comp.isFormDrawerOpen = true;
      window.ng.applyChanges(comp);
    }
  });
  await auditElement('app-salaries .slide-drawer', 'Salaries: Create / Edit Salary Voucher Drawer', '25_salaries_disburse_drawer.png');

  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-salaries'));
    if (comp) {
      comp.closeFormDrawer();
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);

  // Modal 2: View Salary Voucher Slip Modal
  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-salaries'));
    if (comp) {
      comp.selectedVoucher = {
        id: 801,
        month: 'October',
        year: 2026,
        salaryAmount: 32000,
        status: 'Paid',
        paidDate: '2026-10-12',
        employee: {
          id: 105,
          empName: 'Ramesh Patil',
          designation: 'Senior IMM Machine Operator'
        }
      };
      comp.isViewModalOpen = true;
      window.ng.applyChanges(comp);
    }
  });
  await auditElement('.modal-dialog-voucher', 'Salaries: Staff Salary Payment Voucher Slip Modal', '26_salaries_voucher_modal.png');

  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-salaries'));
    if (comp) {
      comp.closeViewModal();
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);

  // -------------------------------------------------------------------------
  // 15. TAB 10b: EMPLOYEES & WORKFORCE DIRECTORY
  // -------------------------------------------------------------------------
  console.log('--- AUDITING TAB 10b: EMPLOYEES DIRECTORY ---');
  await switchToTab('employees', 'app-employees');

  // Modal 1: Enroll / Edit Staff Member Drawer
  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-employees'));
    if (comp) {
      comp.employeeForm = {
        empName: 'Ramesh Patil',
        empContact: '9822012345',
        designation: 'Senior Machine Operator',
        salary: 32000,
        joiningDate: '2024-03-15',
        aadhaarNo: '123456789012',
        bankAccount: 'HDFC0001234 / 501002345678'
      };
      comp.isFormOpen = true;
      window.ng.applyChanges(comp);
    }
  });
  await auditElement('app-employees .drawer-panel:not(.drawer-panel-wide)', 'Employees: Enroll Staff Member Drawer', '27_employees_enroll_drawer.png');

  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-employees'));
    if (comp) {
      comp.closeDrawer();
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);

  // Modal 2: View Staff Details Drawer
  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-employees'));
    if (comp) {
      comp.selectedEmployee = {
        id: 105,
        empName: 'Ramesh Patil',
        empContact: '9822012345',
        designation: 'Senior IMM Machine Operator',
        salary: 32000,
        joiningDate: '2024-03-15',
        aadhaarNo: '123456789012',
        bankAccount: 'HDFC0001234 / 501002345678',
        address: 'Plot 12, Kagal MIDC Industrial Area, Kolhapur'
      };
      comp.isDetailsOpen = true;
      comp.detailsActiveTab = 'overview';
      window.ng.applyChanges(comp);
    }
  });
  await auditElement('app-employees .drawer-panel-wide', 'Employees: View Staff Details Drawer', '28_employees_details_drawer.png');

  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-employees'));
    if (comp) {
      comp.closeDetails();
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);

  // -------------------------------------------------------------------------
  // 16. TAB 18: AUDIT LOGS & SECURITY TELEMETRY
  // -------------------------------------------------------------------------
  console.log('--- AUDITING TAB 18: AUDIT LOGS ---');
  await switchToTab('audit-logs', 'app-audit-logs');

  // Modal 1: Forensic Event Inspector Modal
  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-audit-logs'));
    if (comp) {
      comp.selectedLogForDetail = {
        id: 901,
        auditId: 901,
        timestamp: new Date().toISOString(),
        username: 'SUPER_ADMIN',
        userRole: 'SUPER_ADMIN',
        action: 'UPDATE',
        tableName: 'PRODUCTION_BATCH',
        ipAddress: '192.168.1.45',
        details: '{\n  "batchNumber": "BATCH-2026-10-12-01",\n  "machineId": 4,\n  "status": "QC_RELEASED",\n  "qcScore": 99.4,\n  "unitsProduced": 450\n}'
      };
      window.ng.applyChanges(comp);
    }
  });
  await auditElement('.audit-modal-content', 'Audit: Forensic Event Inspector Modal', '29_audit_forensic_modal.png');

  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-audit-logs'));
    if (comp) {
      comp.closeLogDetail();
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);

  // -------------------------------------------------------------------------
  // 17. TAB 19/23: SYSTEM CONFIGURATION & DEVELOPER HUB
  // -------------------------------------------------------------------------
  console.log('--- AUDITING TAB 19: SETTINGS & DEVELOPER HUB ---');
  await switchToTab('settings', 'app-settings');

  // Modal 1: Department & Operational Unit Modal
  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-settings'));
    if (comp) {
      comp.teamForm = {
        name: 'Precision Injection Moulding',
        code: 'PIM-D1',
        description: 'High-tonnage injection moulding, cavity maintenance, cycle time telemetry',
        color: '#059669',
        icon: 'bi-gear-wide-connected',
        sidebarOrder: 4,
        showInSidebar: true
      };
      comp.editingTeam = null;
      comp.showTeamModal = true;
      window.ng.applyChanges(comp);
    }
  });
  await auditElement('app-settings .dept-modal-content', 'Settings: Department & Operational Unit Modal', '30_settings_team_modal.png');

  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-settings'));
    if (comp) {
      comp.showTeamModal = false;
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);

  // Modal 2: Webhook Delivery & Payload Inspector Modal
  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-settings'));
    if (comp) {
      comp.selectedWebhookForDetail = {
        id: 'whk_01',
        name: 'SAP S/4HANA Inventory Sync Stream',
        endpointUrl: 'https://gateway.futaneagro.com/integrations/sap/v2/events',
        eventType: 'inventory.adjusted',
        secretToken: 'whsec_7f9b8c2d1e0a98b7c6d5e4f3a2b1c0',
        lastStatusCode: 200
      };
      comp.showWebhookDetailModal = true;
      window.ng.applyChanges(comp);
    }
  });
  await auditElement('app-settings .modal-content', 'Settings: Webhook Delivery & Payload Inspector Modal', '31_settings_webhook_modal.png');

  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-settings'));
    if (comp) {
      comp.closeWebhookDetailModal();
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);

  await browser.close();

  console.log('========================================================================');
  console.log(`=== AUDIT COMPLETE: ${auditResults.length} POP CARDS AUDITED & CAPTURED ===`);
  console.log('========================================================================');
  console.table(auditResults.map(r => ({
    Title: r.title,
    Dimensions: `${r.width}x${r.height}`,
    Centered: r.isCentered ? 'YES (0-2px)' : 'NO (Drawer)',
    SafeHeight: r.isHeightSafe ? 'SAFE' : 'CLIPPED',
    Inputs: r.inputCount,
    Buttons: r.buttonCount
  })));
}

verifyAllPopcards().catch(err => {
  console.error('Audit runner error:', err);
  process.exit(1);
});
