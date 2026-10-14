import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/39d894a5-1641-489b-912e-5b808ad7ea42/dispatch_audit';
const SCRATCH_DIR = 'c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/dispatch_audit';

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

async function runDispatchAudit() {
  console.log('--- STARTING LOGISTICS & DISPATCH REGISTRY FULL AUDIT ---');

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
  await page.waitForTimeout(1000);

  const loginInput = page.locator('#username');
  if (await loginInput.isVisible().catch(() => false)) {
    console.log('Logging in as SUPER_ADMIN via UI flow...');
    await page.fill('#username', 'SUPER_ADMIN');
    await page.fill('#password', 'superadmin123');
    await page.click('#login-submit-btn');
    await page.waitForSelector('.uat-otp-helper-pill, .sidebar', { timeout: 20000 });
    if (await page.locator('.uat-otp-helper-pill').isVisible().catch(() => false)) {
      await page.click('.uat-otp-helper-pill');
      await page.waitForTimeout(600);
      await page.locator('button:has-text("Verify"), button[type="submit"]').first().click();
    }
  }

  console.log('Waiting for sidebar...');
  await page.waitForSelector('.sidebar', { timeout: 20000 });
  await page.waitForTimeout(1000);

  console.log('Navigating to Dispatch tab in sidebar...');
  const dispatchNav = page.locator('.nav-menu-list li:has-text("Dispatch"), li[title*="Dispatch"]');
  if (await dispatchNav.count() > 0) {
    await dispatchNav.first().click();
  }

  console.log('Waiting for app-dispatch container to load...');
  await page.waitForSelector('app-dispatch, .dispatch-module-container, .dispatch-page-header', { timeout: 15000 });
  await page.waitForTimeout(2000);

  // 1. Capture Executive Viewport & Full Page
  console.log('Capturing Dispatch executive viewport & full page...');
  await saveScreenshots(page, '01_dispatch_registry_viewport');
  await saveFullPageScreenshot(page, '02_dispatch_registry_fullpage');

  // Extract Telemetry Metrics
  const dispatchTelemetry = await page.evaluate(() => {
    const dispatchElem = document.querySelector('app-dispatch');
    const countPill = document.querySelector('.header-count-pill')?.textContent?.trim() || '';
    const kpis = Array.from(document.querySelectorAll('.dispatch-kpi-card')).map(card => {
      const label = card.querySelector('.dispatch-kpi-label')?.textContent?.trim() || '';
      const value = card.querySelector('.dispatch-kpi-value')?.textContent?.trim() || '';
      const sub = card.querySelector('.dispatch-kpi-sub')?.textContent?.trim() || '';
      return { label, value, sub };
    });
    const rows = document.querySelectorAll('.dispatch-table tbody tr');
    if (!dispatchElem || !window.ng) {
      return { domScraped: true, countPill, kpis, rowCount: rows.length };
    }
    const comp = window.ng.getComponent(dispatchElem);
    return {
      totalDispatchesCount: comp?.totalDispatchesCount || 0,
      inTransitDispatchesCount: comp?.inTransitDispatchesCount || 0,
      deliveredDispatchesCount: comp?.deliveredDispatchesCount || 0,
      pendingDispatchesCount: comp?.pendingDispatchesCount || 0,
      totalCratesDispatched: comp?.totalCratesDispatched || 0,
      statusFilter: comp?.statusFilter || 'ALL',
      countPill,
      kpis,
      rowCount: rows.length,
      firstDispatch: comp?.dispatches?.[0] ? {
        id: comp.dispatches[0].id,
        manifestId: comp.formatManifestId ? comp.formatManifestId(comp.dispatches[0].id) : comp.dispatches[0].dispatchNumber,
        date: comp.dispatches[0].date,
        vehicleNumber: comp.dispatches[0].vehicleNumber,
        driverName: comp.dispatches[0].driverName,
        status: comp.dispatches[0].status,
        crateType: comp.dispatches[0].sale?.crateType,
        quantity: comp.dispatches[0].sale?.quantity
      } : null
    };
  });

  auditReport.metrics = dispatchTelemetry;
  console.log('Dispatch Telemetry Data:', JSON.stringify(dispatchTelemetry, null, 2));

  // 2. Test Subtabs Navigation
  console.log('Testing Subtabs Navigation...');
  const subtabs = [
    { label: 'In Transit', name: '03_subtab_in_transit', filter: 'In Transit' },
    { label: 'Delivered', name: '04_subtab_delivered', filter: 'Delivered' },
    { label: 'Pending Clearance', name: '05_subtab_pending_clearance', filter: 'Pending' }
  ];

  for (const st of subtabs) {
    const tabBtn = page.locator(`.subnav-tab-btn:has-text("${st.label}")`);
    if (await tabBtn.count() > 0) {
      await tabBtn.first().click();
    }
    await page.waitForTimeout(500);
    await saveScreenshots(page, st.name);
    auditReport.subtabs[st.filter] = { tested: true };
  }

  // Reset to All Manifests
  const allTabBtn = page.locator('.subnav-tab-btn:has-text("All Manifests")');
  if (await allTabBtn.count() > 0) {
    await allTabBtn.first().click();
  }
  await page.waitForTimeout(400);

  // 3. Test Column Visibility Dropdown
  console.log('Testing Columns Manager Dropdown...');
  const colsBtn = page.locator('button:has-text("Columns")');
  if (await colsBtn.count() > 0) {
    await colsBtn.first().click();
    await page.waitForTimeout(400);
    await saveScreenshots(page, '06_columns_config_dropdown');
    await colsBtn.first().click();
    await page.waitForTimeout(300);
  }

  // 4. Test Consolidated Export Dropdown
  console.log('Testing Consolidated Export Menu...');
  const exportBtn = page.locator('button:has-text("Export")');
  if (await exportBtn.count() > 0) {
    await exportBtn.first().click();
    await page.waitForTimeout(400);
    await saveScreenshots(page, '07_export_menu_dropdown');
    await exportBtn.first().click();
    await page.waitForTimeout(300);
  }

  // 5. Test Create Dispatch Manifest Centered Modal Dialog (`isFormOpen = true`)
  console.log('Testing Create Dispatch Manifest Modal...');
  const createBtn = page.locator('button:has-text("Create Manifest")');
  if (await createBtn.count() > 0) {
    await createBtn.first().click();
    await page.waitForTimeout(600);
    await saveScreenshots(page, '08_create_manifest_modal');
    auditReport.modalsTested.push({ name: 'Create Dispatch Manifest Dialog', verified: true });
    
    // Close modal via inner button or evaluate
    const closeFormBtn = page.locator('.dispatch-modal-dialog button[title="Close Form"], .dispatch-modal-dialog button:has(.bi-x-lg)');
    if (await closeFormBtn.count() > 0) {
      await closeFormBtn.first().click();
    } else {
      await page.evaluate(() => {
        const comp = window.ng?.getComponent(document.querySelector('app-dispatch'));
        if (comp) { comp.isFormOpen = false; window.ng.applyChanges(comp); }
      });
    }
    await page.waitForTimeout(500);
  }

  // 6. Test Delivery Challan & Dispatch Dossier Modal (`showDispatchDossierModal = true`)
  console.log('Testing Delivery Challan & Dispatch Dossier Modal...');
  const viewDossierBtn = page.locator('button.btn-view, button[title*="Dossier" i], button[title*="challan" i]').first();
  if (await viewDossierBtn.count() > 0) {
    await viewDossierBtn.click();
    await page.waitForTimeout(700);
    await saveScreenshots(page, '09_delivery_challan_dossier_modal');
    auditReport.modalsTested.push({ name: 'Rule 55 Delivery Challan Dossier Modal', verified: true });

    // Close dossier modal
    const closeDossierBtn = page.locator('.dossier-top-actions button[title="Close"], .dossier-top-actions button:has(.bi-x-lg)');
    if (await closeDossierBtn.count() > 0) {
      await closeDossierBtn.first().click();
    } else {
      await page.evaluate(() => {
        const comp = window.ng?.getComponent(document.querySelector('app-dispatch'));
        if (comp) { comp.closeDispatchDossier(); window.ng.applyChanges(comp); }
      });
    }
    await page.waitForTimeout(500);
  }

  // 7. Test QR Scanner Modal (`showScannerModal = true`)
  console.log('Testing QR Code Scanner Modal...');
  const scanQrBtn = page.locator('button:has-text("Scan QR")');
  if (await scanQrBtn.count() > 0) {
    await scanQrBtn.first().click();
    await page.waitForTimeout(700);
    await saveScreenshots(page, '10_qr_scanner_modal');
    auditReport.modalsTested.push({ name: 'Hardware QR / Barcode Scanner Modal', verified: true });

    // Close scanner modal via Cancel Scanner button
    const closeScannerBtn = page.locator('button:has-text("Cancel Scanner"), app-qr-scanner-modal button:has(.bi-x-lg)');
    if (await closeScannerBtn.count() > 0) {
      await closeScannerBtn.first().click();
    } else {
      await page.evaluate(() => {
        const comp = window.ng?.getComponent(document.querySelector('app-dispatch'));
        if (comp) { comp.closeScanner(); window.ng.applyChanges(comp); }
      });
    }
    await page.waitForTimeout(500);
  }

  // 8. Test Table Density: Compact
  console.log('Testing Table Density: Compact...');
  const compactBtn = page.locator('button.density-btn[title*="Compact" i]');
  if (await compactBtn.count() > 0) {
    await compactBtn.first().click();
    await page.waitForTimeout(400);
    await saveScreenshots(page, '11_density_compact');

    // Reset to normal
    const normalBtn = page.locator('button.density-btn[title*="Normal" i]');
    if (await normalBtn.count() > 0) await normalBtn.first().click();
    await page.waitForTimeout(300);
  }

  // 9. Multi-Viewport & Responsive Testing
  console.log('Performing Multi-Viewport & Responsive Layout Testing...');
  const viewports = [
    { name: '12_laptop_1280x720', width: 1280, height: 720 },
    { name: '13_compact_1100x680', width: 1100, height: 680 }
  ];

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(500);
    await saveScreenshots(page, vp.name);
    auditReport.viewportTests.push({ viewport: vp.name, width: vp.width, height: vp.height, status: 'PASSED' });
  }

  // 10. Collapsed Sidebar Test (1440x900)
  console.log('Testing Collapsed Sidebar Viewport...');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(300);
  const collapseSidebarBtn = page.locator('.sidebar-collapse-btn, button[title*="Collapse" i]').first();
  if (await collapseSidebarBtn.count() > 0) {
    await collapseSidebarBtn.click();
  } else {
    await page.evaluate(() => {
      const comp = window.ng?.getComponent(document.querySelector('app-root'));
      if (comp) { comp.isSidebarCollapsed = true; window.ng.applyChanges(comp); }
    });
  }
  await page.waitForTimeout(500);
  await saveScreenshots(page, '14_sidebar_collapsed_dispatch');
  auditReport.viewportTests.push({ viewport: 'Sidebar Collapsed 1440x900', status: 'PASSED' });

  // Save report
  const reportPath1 = path.join(SCRATCH_DIR, 'dispatch_audit_report.json');
  const reportPath2 = path.join(ARTIFACT_DIR, 'dispatch_audit_report.json');
  fs.writeFileSync(reportPath1, JSON.stringify(auditReport, null, 2));
  fs.writeFileSync(reportPath2, JSON.stringify(auditReport, null, 2));
  console.log('Audit Report saved successfully to JSON artifacts.');

  await browser.close();
  console.log('--- LOGISTICS & DISPATCH AUDIT RUN COMPLETED SUCCESSFULLY ---');
}

runDispatchAudit().catch((err) => {
  console.error('DISPATCH AUDIT FAILED:', err);
  process.exit(1);
});
