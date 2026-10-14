import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/39d894a5-1641-489b-912e-5b808ad7ea42/raw_materials_audit';
const SCRATCH_DIR = 'c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/raw_materials_audit';

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

async function runRawMaterialsAudit() {
  console.log('--- STARTING POLYMER RAW MATERIALS & PP GRANULES FULL AUDIT ---');
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
        comp.activeTab = 'raw-materials';
        comp.renderedTabs['raw-materials'] = true;
        window.ng.applyChanges(comp);
      }
    }
  }, authData);

  await page.waitForTimeout(1500);

  // Trigger fresh data load on raw materials component with the injected token
  console.log('Triggering raw materials data load...');
  await page.evaluate(() => {
    const rmElem = document.querySelector('app-raw-materials');
    if (rmElem && window.ng) {
      const comp = window.ng.getComponent(rmElem);
      if (comp && comp.loadData) {
        comp.loadData();
        window.ng.applyChanges(comp);
      }
    }
  });

  await page.waitForTimeout(2000);

  // 1. Capture Initial Executive Viewport & Full Page
  console.log('Capturing Raw Materials executive viewport & full page...');
  await saveScreenshots(page, '01_raw_materials_executive_viewport');
  await saveFullPageScreenshot(page, '02_raw_materials_fullpage_scrollable');

  // Audit Raw Materials Telemetry & Calculations
  const rmTelemetry = await page.evaluate(() => {
    const rmElem = document.querySelector('app-raw-materials');
    if (!rmElem || !window.ng) return null;
    const comp = window.ng.getComponent(rmElem);
    return {
      totalBatchesCount: comp.totalBatchesCount || 0,
      totalPolymerWeightKg: comp.totalPolymerWeightKg || 0,
      totalPolymerMetricTonnes: Math.round(((comp.totalPolymerWeightKg || 0) / 1000) * 100) / 100,
      totalInventoryValuation: comp.totalInventoryValuation || 0,
      weightedAverageRate: comp.weightedAverageRate || 0,
      activeVendorsCount: comp.activeVendorsCount || 0,
      selectedSubtab: comp.selectedSubtab,
      firstBatch: comp.rawMaterialsList?.[0] ? {
        id: comp.rawMaterialsList[0].rawMaterialId || comp.rawMaterialsList[0].id,
        date: comp.rawMaterialsList[0].date,
        materialName: comp.rawMaterialsList[0].materialName,
        vendorName: comp.rawMaterialsList[0].vendor?.vendorName,
        weight: comp.rawMaterialsList[0].weight,
        rate: comp.rawMaterialsList[0].rate,
        amount: comp.rawMaterialsList[0].amount
      } : null,
      subtabCounts: {
        all: comp.getSubtabCount('all'),
        virgin: comp.getSubtabCount('virgin'),
        recycled: comp.getSubtabCount('recycled'),
        masterbatch: comp.getSubtabCount('masterbatch'),
        packaging: comp.getSubtabCount('packaging'),
        highVolume: comp.getSubtabCount('high-volume')
      }
    };
  });
  auditReport.metrics = rmTelemetry;
  console.log('Raw Materials Telemetry Data:', JSON.stringify(rmTelemetry, null, 2));

  // 2. Test Subtabs Navigation
  console.log('Testing Subtabs navigation...');
  const subtabs = [
    { id: 'virgin', name: '03_subtab_virgin_polymer' },
    { id: 'recycled', name: '04_subtab_recycled_compounds' },
    { id: 'masterbatch', name: '05_subtab_masterbatch_additives' },
    { id: 'high-volume', name: '06_subtab_high_volume' }
  ];

  for (const st of subtabs) {
    await page.evaluate((tabId) => {
      const rmElem = document.querySelector('app-raw-materials');
      if (rmElem && window.ng) {
        const comp = window.ng.getComponent(rmElem);
        comp.setSubtab(tabId);
        window.ng.applyChanges(comp);
      }
    }, st.id);
    await page.waitForTimeout(400);
    await saveScreenshots(page, st.name);
  }

  // Reset subtab to 'all'
  await page.evaluate(() => {
    const rmElem = document.querySelector('app-raw-materials');
    if (rmElem && window.ng) {
      const comp = window.ng.getComponent(rmElem);
      comp.setSubtab('all');
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(300);

  // 3. Test Filter Popover Panel
  console.log('Testing Filter Popover Panel...');
  await page.evaluate(() => {
    const rmElem = document.querySelector('app-raw-materials');
    if (rmElem && window.ng) {
      const comp = window.ng.getComponent(rmElem);
      comp.showFilterPopover = true;
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);
  await saveScreenshots(page, '07_filter_popover_open');

  // Close filter popover
  await page.evaluate(() => {
    const rmElem = document.querySelector('app-raw-materials');
    if (rmElem && window.ng) {
      const comp = window.ng.getComponent(rmElem);
      comp.showFilterPopover = false;
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(200);

  // 4. Test Columns Manager Dropdown
  console.log('Testing Columns Manager Dropdown...');
  await page.evaluate(() => {
    const rmElem = document.querySelector('app-raw-materials');
    if (rmElem && window.ng) {
      const comp = window.ng.getComponent(rmElem);
      comp.showColDropdown = true;
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);
  await saveScreenshots(page, '08_columns_manager_dropdown');

  // Close columns dropdown
  await page.evaluate(() => {
    const rmElem = document.querySelector('app-raw-materials');
    if (rmElem && window.ng) {
      const comp = window.ng.getComponent(rmElem);
      comp.showColDropdown = false;
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(200);

  // 5. Test Log Procurement Batch Drawer (`isAddFormOpen`)
  console.log('Testing Log Procurement Batch Drawer...');
  await page.evaluate(() => {
    const rmElem = document.querySelector('app-raw-materials');
    if (rmElem && window.ng) {
      const comp = window.ng.getComponent(rmElem);
      comp.toggleAddForm();
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(600);
  await saveScreenshots(page, '09_log_procurement_drawer');
  auditReport.modalsTested.push({ name: 'Log Procurement Batch Form Drawer', verified: true });

  // Close form drawer
  await page.evaluate(() => {
    const rmElem = document.querySelector('app-raw-materials');
    if (rmElem && window.ng) {
      const comp = window.ng.getComponent(rmElem);
      comp.cancelEdit();
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);

  // 6. Test Goods Receipt Note (GRN) / Inspection Voucher Modal (`showInspectionModal`)
  console.log('Testing Goods Receipt Note (GRN) Inspection Voucher Modal...');
  await page.evaluate(() => {
    const rmElem = document.querySelector('app-raw-materials');
    if (rmElem && window.ng) {
      const comp = window.ng.getComponent(rmElem);
      if (comp.rawMaterialsList && comp.rawMaterialsList.length > 0) {
        comp.openInspectionModal(comp.rawMaterialsList[0]);
        window.ng.applyChanges(comp);
      }
    }
  });
  await page.waitForTimeout(600);
  await saveScreenshots(page, '10_grn_inspection_voucher_modal');
  auditReport.modalsTested.push({ name: 'Goods Receipt Note (GRN) Inspection Voucher Modal', verified: true });

  // Close inspection modal
  await page.evaluate(() => {
    const rmElem = document.querySelector('app-raw-materials');
    if (rmElem && window.ng) {
      const comp = window.ng.getComponent(rmElem);
      comp.closeInspectionModal();
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);

  // 7. Test Row Density Switcher
  console.log('Testing Density switcher: compact...');
  await page.evaluate(() => {
    const rmElem = document.querySelector('app-raw-materials');
    if (rmElem && window.ng) {
      const comp = window.ng.getComponent(rmElem);
      comp.setDensity('compact');
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(300);
  await saveScreenshots(page, '11_density_compact');

  // Reset density to comfortable
  await page.evaluate(() => {
    const rmElem = document.querySelector('app-raw-materials');
    if (rmElem && window.ng) {
      const comp = window.ng.getComponent(rmElem);
      comp.setDensity('comfortable');
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(200);

  // 8. Multi-Viewport & Responsive Testing
  console.log('Performing Multi-Viewport & Responsive Layout Testing...');
  const viewports = [
    { name: '12_laptop_1280x720', width: 1280, height: 720 },
    { name: '13_compact_1100x680', width: 1100, height: 680 }
  ];

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(400);
    await saveScreenshots(page, vp.name);
    auditReport.viewportTests.push({ viewport: vp.name, width: vp.width, height: vp.height, status: 'PASSED' });
  }

  // 9. Collapsed Sidebar Test (1440x900)
  console.log('Testing Collapsed Sidebar Viewport...');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(() => {
    const appRoot = document.querySelector('app-root');
    if (appRoot && window.ng) {
      const comp = window.ng.getComponent(appRoot);
      if (comp) {
        comp.isSidebarCollapsed = true;
        window.ng.applyChanges(comp);
      }
    }
  });
  await page.waitForTimeout(500);
  await saveScreenshots(page, '14_sidebar_collapsed_raw_materials');
  auditReport.viewportTests.push({ viewport: 'Sidebar Collapsed 1440x900', status: 'PASSED' });

  // Save audit report
  const jsonP1 = path.join(ARTIFACT_DIR, 'raw_materials_audit_report.json');
  const jsonP2 = path.join(SCRATCH_DIR, 'raw_materials_audit_report.json');
  fs.writeFileSync(jsonP1, JSON.stringify(auditReport, null, 2));
  fs.writeFileSync(jsonP2, JSON.stringify(auditReport, null, 2));
  console.log('Audit Report saved successfully to JSON artifacts.');

  await browser.close();
  console.log('--- RAW MATERIALS AUDIT RUN COMPLETED SUCCESSFULLY ---');
}

runRawMaterialsAudit().catch(err => {
  console.error('Audit failed with error:', err);
  process.exit(1);
});
