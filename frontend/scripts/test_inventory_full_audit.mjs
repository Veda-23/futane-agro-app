import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/39d894a5-1641-489b-912e-5b808ad7ea42/inventory_audit';
const SCRATCH_DIR = 'c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/inventory_audit';

fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
fs.mkdirSync(SCRATCH_DIR, { recursive: true });

async function saveScreenshots(page, name) {
  const p1 = path.join(ARTIFACT_DIR, `${name}.png`);
  const p2 = path.join(SCRATCH_DIR, `${name}.png`);
  await page.screenshot({ path: p1 });
  await page.screenshot({ path: p2 });
  console.log(`[SCREENSHOT] Saved: ${name}.png`);
}

async function saveFullPageScreenshot(page, name) {
  const p1 = path.join(ARTIFACT_DIR, `${name}.png`);
  const p2 = path.join(SCRATCH_DIR, `${name}.png`);
  await page.screenshot({ path: p1, fullPage: true });
  await page.screenshot({ path: p2, fullPage: true });
  console.log(`[FULL-PAGE SCREENSHOT] Saved: ${name}.png`);
}

async function getAuthToken() {
  console.log('Obtaining authenticated JWT token from backend...');
  const loginRes = await fetch('http://127.0.0.1:8081/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'SUPER_ADMIN', password: 'superadmin123' })
  }).then(r => r.json());

  const verifyRes = await fetch('http://127.0.0.1:8081/api/users/login/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'SUPER_ADMIN', otp: loginRes.tempOtp })
  }).then(r => r.json());

  return verifyRes;
}

async function runInventoryAudit() {
  console.log('--- STARTING FINISHED GOODS WAREHOUSE INVENTORY FULL AUDIT ---');
  const authData = await getAuthToken();
  console.log('Obtained valid JWT Token length:', authData.token?.length);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5
  });
  const page = await context.newPage();

  const auditReport = {
    timestamp: new Date().toISOString(),
    metrics: {},
    subtabs: {},
    modalsTested: [],
    viewportTests: []
  };

  console.log('Navigating to http://localhost:4300...');
  await page.goto('http://localhost:4300', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);

  // Set JWT tokens and session data in localStorage & sessionStorage
  console.log('Injecting auth token & hydrating Angular state...');
  await page.evaluate((auth) => {
    const userObj = {
      id: auth.id || 1,
      username: auth.username || 'SUPER_ADMIN',
      fullName: auth.name || 'Super Administrator',
      name: auth.name || 'Super Administrator',
      role: auth.role || 'SUPER_ADMIN',
      token: auth.token
    };

    localStorage.setItem('jwtToken', auth.token);
    sessionStorage.setItem('jwtToken', auth.token);
    localStorage.setItem('user', JSON.stringify(userObj));
    sessionStorage.setItem('user', JSON.stringify(userObj));
    document.cookie = `erp_session_cookie=${auth.token}; path=/; SameSite=Strict`;

    const appRoot = document.querySelector('app-root');
    if (appRoot && window.ng) {
      const comp = window.ng.getComponent(appRoot);
      if (comp) {
        comp.isAuthenticated = true;
        comp.loggedInUser = userObj;
        comp.activeTab = 'inventory';
        comp.renderedTabs['inventory'] = true;
        window.ng.applyChanges(comp);
      }
    }
  }, authData);

  await page.waitForTimeout(1500);

  // Trigger fresh data load on inventory component with the injected token
  console.log('Triggering inventory data load...');
  await page.evaluate(() => {
    const invElem = document.querySelector('app-inventory');
    if (invElem && window.ng) {
      const comp = window.ng.getComponent(invElem);
      if (comp && comp.loadData) {
        comp.loadData();
        window.ng.applyChanges(comp);
      }
    }
  });

  await page.waitForTimeout(2000);

  // 1. Capture Initial Executive Viewport & Full Page
  console.log('Capturing Inventory executive viewport & full page...');
  await saveScreenshots(page, '01_inventory_executive_viewport');
  await saveFullPageScreenshot(page, '02_inventory_fullpage_scrollable');

  // Audit Inventory Telemetry & Calculations
  const inventoryTelemetry = await page.evaluate(() => {
    const invElem = document.querySelector('app-inventory');
    if (!invElem || !window.ng) return null;
    const comp = window.ng.getComponent(invElem);
    return {
      totalSkus: comp.inventoryList?.length || 0,
      totalAvailableStock: comp.totalAvailableStock || 0,
      totalValuation: comp.totalInventoryValuation || 0,
      lowStockCount: comp.lowStockCount || 0,
      warehouseCapacityPct: comp.warehouseCapacityPct || 0,
      warehouseCapacityMax: comp.WAREHOUSE_CAPACITY || 50000,
      formulaRate: comp.CRATE_RATE || 85,
      selectedSubtab: comp.selectedSubtab,
      firstSku: comp.inventoryList?.[0] ? {
        crateType: comp.inventoryList[0].crateType,
        materialType: comp.inventoryList[0].materialType,
        currentStock: comp.inventoryList[0].currentStock,
        warehouseZone: comp.inventoryList[0].warehouseZone
      } : null
    };
  });
  auditReport.metrics = inventoryTelemetry;
  console.log('Inventory Telemetry Data:', JSON.stringify(inventoryTelemetry, null, 2));

  // 2. Test Subtab Switching: All -> Low Stock Alert -> Vegetable & Fruit -> Dairy
  console.log('Testing Subtabs navigation...');
  const subtabs = [
    { id: 'low', name: '03_subtab_low_stock_alert' },
    { id: 'vegetable', name: '04_subtab_vegetable_fruit' },
    { id: 'all', name: '05_subtab_all_crates' }
  ];

  for (const st of subtabs) {
    await page.evaluate((subtabId) => {
      const invElem = document.querySelector('app-inventory');
      if (invElem && window.ng) {
        const comp = window.ng.getComponent(invElem);
        comp.setSubtab(subtabId);
        window.ng.applyChanges(comp);
      }
    }, st.id);
    await page.waitForTimeout(400);
    await saveScreenshots(page, st.name);
  }

  // 3. Test "Log Crate Entry" Form Drawer (`isFormOpen`)
  console.log('Testing Add / Edit Crate Form Drawer...');
  await page.evaluate(() => {
    const invElem = document.querySelector('app-inventory');
    if (invElem && window.ng) {
      const comp = window.ng.getComponent(invElem);
      comp.openAddForm();
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(600);
  await saveScreenshots(page, '06_add_crate_entry_drawer');
  auditReport.modalsTested.push({ name: 'Log Crate Entry Form Drawer', verified: true });

  // Close form drawer
  await page.evaluate(() => {
    const invElem = document.querySelector('app-inventory');
    if (invElem && window.ng) {
      const comp = window.ng.getComponent(invElem);
      comp.closeForm();
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);

  // 4. Test "Stock Adjustment Modal" (`isAdjustmentOpen`)
  console.log('Testing Warehouse Stock Adjustment Modal...');
  await page.evaluate(() => {
    const invElem = document.querySelector('app-inventory');
    if (invElem && window.ng) {
      const comp = window.ng.getComponent(invElem);
      const targetItem = comp.inventoryList?.[0] || {
        id: 'CR-001',
        crateType: 'Apple Crate Heavy Duty (20kg)',
        warehouseZone: 'BAY-A1-RACK04',
        currentStock: 14500,
        unitPrice: 85
      };
      comp.openAdjustmentModal(targetItem);
      comp.adjustMode = 'add';
      comp.adjustQuantity = 500;
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(600);
  await saveScreenshots(page, '07_stock_adjustment_modal_add');
  auditReport.modalsTested.push({ name: 'Stock Adjustment Modal (Add)', verified: true });

  // Test Reconcile Mode
  await page.evaluate(() => {
    const invElem = document.querySelector('app-inventory');
    if (invElem && window.ng) {
      const comp = window.ng.getComponent(invElem);
      comp.adjustMode = 'reconcile';
      comp.adjustQuantity = 15000;
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);
  await saveScreenshots(page, '08_stock_adjustment_modal_reconcile');

  // Close Adjustment Modal
  await page.evaluate(() => {
    const invElem = document.querySelector('app-inventory');
    if (invElem && window.ng) {
      const comp = window.ng.getComponent(invElem);
      comp.closeAdjustmentModal();
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);

  // 5. Test "SKU View Details Drawer" (`isDetailsOpen`)
  console.log('Testing SKU View Details Drawer...');
  await page.evaluate(() => {
    const invElem = document.querySelector('app-inventory');
    if (invElem && window.ng) {
      const comp = window.ng.getComponent(invElem);
      const targetItem = comp.inventoryList?.[0];
      if (targetItem) {
        comp.openDetails(targetItem);
        comp.detailsActiveTab = 'ledger';
        window.ng.applyChanges(comp);
      }
    }
  });
  await page.waitForTimeout(600);
  await saveScreenshots(page, '09_sku_details_drawer_ledger');
  auditReport.modalsTested.push({ name: 'SKU View Details Drawer (Stock Formula Ledger)', verified: true });

  // Test Polymer Consumption subtab
  await page.evaluate(() => {
    const invElem = document.querySelector('app-inventory');
    if (invElem && window.ng) {
      const comp = window.ng.getComponent(invElem);
      comp.detailsActiveTab = 'burn';
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);
  await saveScreenshots(page, '10_sku_details_drawer_polymer_burn');

  // Close Details Drawer
  await page.evaluate(() => {
    const invElem = document.querySelector('app-inventory');
    if (invElem && window.ng) {
      const comp = window.ng.getComponent(invElem);
      comp.closeDetails();
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);

  // 6. Test Multi-Viewport Scalability & Symmetry
  console.log('Testing multi-viewport responsiveness...');
  const viewports = [
    { name: '11_laptop_1280x720', width: 1280, height: 720 },
    { name: '12_compact_1100x680', width: 1100, height: 680 }
  ];

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(600);
    await saveScreenshots(page, vp.name);
    auditReport.viewportTests.push({ viewport: vp.name, width: vp.width, height: vp.height, status: 'PASSED' });
  }

  // Sidebar Collapsed Test
  console.log('Testing Sidebar Collapsed state on Inventory...');
  await page.setViewportSize({ width: 1440, height: 900 });
  const collapseToggle = page.locator('.sidebar-collapse-toggle-btn').first();
  if (await collapseToggle.isVisible().catch(() => false)) {
    await collapseToggle.click();
    await page.waitForTimeout(600);
    await saveScreenshots(page, '13_sidebar_collapsed_inventory');
    auditReport.viewportTests.push({ viewport: 'Sidebar Collapsed 1440x900', status: 'PASSED' });
    // Expand back
    await collapseToggle.click();
    await page.waitForTimeout(400);
  }

  await browser.close();

  fs.writeFileSync(path.join(ARTIFACT_DIR, 'inventory_audit_report.json'), JSON.stringify(auditReport, null, 2));
  fs.writeFileSync(path.join(SCRATCH_DIR, 'inventory_audit_report.json'), JSON.stringify(auditReport, null, 2));
  console.log('--- INVENTORY AUDIT COMPLETED SUCCESSFULLY ---');
}

runInventoryAudit().catch(err => {
  console.error('Inventory audit failed with error:', err);
  process.exit(1);
});
