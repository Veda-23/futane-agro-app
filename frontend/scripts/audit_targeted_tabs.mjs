import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const AUDIT_OUT_DIR = 'c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/targeted_tabs_audit';
fs.mkdirSync(AUDIT_OUT_DIR, { recursive: true });

async function runTargetedAudit() {
  console.log('========================================================================');
  console.log('=== TARGETED AUDIT: RAW MATERIALS (06), INVENTORY (04), SALES (08)   ===');
  console.log('========================================================================\n');

  const browser = await chromium.launch({ headless: true });
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
  console.log('Navigating to http://localhost:4300...');
  await page.goto('http://localhost:4300', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.sidebar', { timeout: 20000 });
  await page.waitForTimeout(1000);

  const results = [];

  async function switchTab(tab) {
    await page.evaluate((t) => {
      const app = window.ng.getComponent(document.querySelector('app-root'));
      if (app) {
        app.switchTab(t);
        window.ng.applyChanges(app);
      }
    }, tab);
    await page.waitForTimeout(800);
  }

  async function measureElement(selector) {
    return await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const leftGap = rect.x - 240;
      const rightGap = window.innerWidth - (rect.x + rect.width);
      const asym = Math.abs(leftGap - rightGap);
      const inputs = Array.from(el.querySelectorAll('input:not([type="hidden"]), select, textarea'));
      const buttons = Array.from(el.querySelectorAll('button:not([disabled])'));
      return {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        leftGap: Math.round(leftGap),
        rightGap: Math.round(rightGap),
        asym: Math.round(asym),
        inputCount: inputs.length,
        buttonCount: buttons.length,
        isCentered: asym <= 6,
        isHeightSafe: rect.height <= (window.innerHeight - 30)
      };
    }, selector);
  }

  // -------------------------------------------------------------------------
  // 1. TAB 06: RAW MATERIALS
  // -------------------------------------------------------------------------
  console.log('--- 1. AUDITING TAB 06: RAW MATERIALS ---');
  await switchTab('raw-materials');
  await page.waitForSelector('app-raw-materials', { timeout: 10000 });
  await page.waitForTimeout(500);

  // 1A. Add Procurement Drawer
  console.log('Opening Log Procurement Batch Drawer...');
  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-raw-materials'));
    if (comp) {
      comp.isAddFormOpen = true;
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);
  const rmDrawerMetrics = await measureElement('.erp-drawer');
  await page.screenshot({ path: path.join(AUDIT_OUT_DIR, '01_raw_materials_procurement_drawer.png') });
  console.log('  -> Procurement Drawer:', rmDrawerMetrics);
  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-raw-materials'));
    if (comp) {
      comp.isAddFormOpen = false;
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);

  // 1B. GRN Inspection Voucher Modal
  console.log('Opening GRN Inspection Voucher Modal...');
  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-raw-materials'));
    if (comp) {
      comp.selectedMaterialForInspection = {
        id: 1,
        rawMaterialId: 'RM-2026-0044',
        materialName: 'Virgin HDPE Polymer Granules (Grade 100)',
        materialGrade: 'Food-Grade Blow/Injection Molding',
        vendor: { vendorName: 'Reliance Polymers Pvt Ltd', gstNumber: '27AAACR1234E1Z1', address: 'Plot 4, Turbhe MIDC, Navi Mumbai', mobile: '9822334455' },
        weight: 5000,
        rate: 94.50,
        amount: 472500,
        qcStatus: 'Passed & Accepted',
        date: '2026-10-10',
        purchaseBillPath: 'INV-REL-2026-8812',
        weightSlipPath: 'WB-SCALE-9014'
      };
      comp.showInspectionModal = true;
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);
  const rmGrnMetrics = await measureElement('.grn-voucher-dialog');
  await page.screenshot({ path: path.join(AUDIT_OUT_DIR, '02_raw_materials_grn_voucher_modal.png') });
  console.log('  -> GRN Voucher Modal:', rmGrnMetrics);
  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-raw-materials'));
    if (comp) {
      comp.showInspectionModal = false;
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);

  // -------------------------------------------------------------------------
  // 2. TAB 04: INVENTORY
  // -------------------------------------------------------------------------
  console.log('\n--- 2. AUDITING TAB 04: INVENTORY ---');
  await switchTab('inventory');
  await page.waitForSelector('app-inventory', { timeout: 10000 });
  await page.waitForTimeout(500);

  // 2A. Stock Adjustment Modal
  console.log('Opening Inventory Stock Adjustment Modal...');
  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-inventory'));
    if (comp) {
      comp.adjustItem = {
        id: 1,
        inventoryId: 1,
        crateType: '50-Liter Reinforced Harvest Crate (Red)',
        warehouseZone: 'Zone A - Vegetable Crate Staging',
        currentStock: 480
      };
      comp.adjustMode = 'add';
      comp.adjustQuantity = 50;
      comp.adjustReason = 'Physical stocktake audit';
      comp.isAdjustmentOpen = true;
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);
  const invAdjustMetrics = await measureElement('.modal-dialog-box');
  await page.screenshot({ path: path.join(AUDIT_OUT_DIR, '03_inventory_stock_adjustment_modal.png') });
  console.log('  -> Stock Adjustment Modal:', invAdjustMetrics);
  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-inventory'));
    if (comp) {
      comp.closeAdjustmentModal();
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);

  // 2B. SKU Details Slide-in Drawer
  console.log('Opening SKU View Details Drawer...');
  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-inventory'));
    if (comp) {
      comp.selectedItem = {
        id: 1,
        inventoryId: 1,
        crateType: '50-Liter Reinforced Harvest Crate (Red)',
        materialType: 'Virgin HDPE Polymer Grade 100',
        warehouseZone: 'Zone A - Vegetable Crate Staging',
        currentStock: 480,
        unitPrice: 450
      };
      comp.isDetailsOpen = true;
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);
  const invDetailsMetrics = await measureElement('.drawer-panel-wide');
  await page.screenshot({ path: path.join(AUDIT_OUT_DIR, '04_inventory_sku_details_drawer.png') });
  console.log('  -> SKU Details Drawer:', invDetailsMetrics);
  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-inventory'));
    if (comp) {
      comp.closeDetails();
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);

  // -------------------------------------------------------------------------
  // 3. TAB 08: SALES
  // -------------------------------------------------------------------------
  console.log('\n--- 3. AUDITING TAB 08: SALES ---');
  await switchTab('sales');
  await page.waitForSelector('app-sales', { timeout: 10000 });
  await page.waitForTimeout(500);

  // 3A. New Sales Order Form Card
  console.log('Opening New Sales Order Form Card...');
  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-sales'));
    if (comp) {
      comp.isFormVisible = true;
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);
  const salesFormMetrics = await measureElement('.sales-form-card, .form-card, app-sales .card');
  await page.screenshot({ path: path.join(AUDIT_OUT_DIR, '05_sales_new_order_card.png') });
  console.log('  -> New Order Form Card:', salesFormMetrics);
  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-sales'));
    if (comp) {
      comp.isFormVisible = false;
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);

  // 3B. Commercial Contract Dossier Modal
  console.log('Opening Commercial Contract Dossier Modal...');
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
  await page.waitForTimeout(400);
  const salesDossierMetrics = await measureElement('.sales-dossier-dialog');
  await page.screenshot({ path: path.join(AUDIT_OUT_DIR, '06_sales_commercial_dossier_modal.png') });
  console.log('  -> Sales Dossier Modal:', salesDossierMetrics);
  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-sales'));
    if (comp) {
      comp.closeSalesDossier();
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);

  // 3C. Outward Gate-Pass Dispatch Modal
  console.log('Opening Outward Gate-Pass Dispatch Modal...');
  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-sales'));
    if (comp) {
      comp.openOutwardModal({
        id: 101,
        saleId: 'SO-2026-0089',
        crateType: 'Tomato Harvest Crates (Standard)',
        quantity: 250,
        party: { partyName: 'Sahyadri Farmers Producer Co.' }
      });
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);
  const salesOutwardMetrics = await measureElement('.outward-modal-dialog, .modal-dialog-custom, .modal-content');
  await page.screenshot({ path: path.join(AUDIT_OUT_DIR, '07_sales_outward_dispatch_modal.png') });
  console.log('  -> Outward Dispatch Modal:', salesOutwardMetrics);
  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-sales'));
    if (comp) {
      comp.closeOutwardModal();
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);

  await browser.close();

  console.log('\n========================================================================');
  console.log('TARGETED AUDIT COMPLETE! All screenshots saved to:');
  console.log(AUDIT_OUT_DIR);
  console.log('========================================================================\n');
}

runTargetedAudit().catch(console.error);
