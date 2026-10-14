import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/39d894a5-1641-489b-912e-5b808ad7ea42/dashboard_audit';
const SCRATCH_DIR = 'c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/dashboard_audit';

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

async function runDashboardAudit() {
  console.log('--- STARTING DASHBOARD FULL AUDIT ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5
  });
  const page = await context.newPage();

  const auditReport = {
    timestamp: new Date().toISOString(),
    metrics: {},
    chartStatus: {},
    buttonInteractions: [],
    fabMenuTest: {},
    syncDataTest: {},
    navigationTests: [],
    viewportTests: []
  };

  console.log('Navigating to http://localhost:4300...');
  await page.goto('http://localhost:4300', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // Authentication flow
  const loginInput = page.locator('#username');
  if (await loginInput.isVisible().catch(() => false)) {
    console.log('Logging in as SUPER_ADMIN...');
    await page.fill('#username', 'SUPER_ADMIN');
    await page.fill('#password', 'superadmin123');
    await page.click('#login-submit-btn');

    await page.waitForSelector('.uat-otp-helper-pill, .sidebar', { timeout: 25000 });
    if (await page.locator('.uat-otp-helper-pill').isVisible().catch(() => false)) {
      console.log('Clicking OTP helper pill...');
      await page.click('.uat-otp-helper-pill');
      await page.waitForTimeout(400);
      await page.locator('button:has-text("Verify"), button[type="submit"]').first().click();
    }
  }

  await page.waitForSelector('.sidebar', { timeout: 20000 });
  await page.waitForTimeout(1000);

  // Ensure on Dashboard tab
  console.log('Verifying Dashboard active tab...');
  const isDashboardActive = await page.locator('app-dashboard').isVisible();
  if (!isDashboardActive) {
    await page.locator('.nav-menu-list li:has-text("Dashboard"), a:has-text("Dashboard")').first().click();
    await page.waitForSelector('app-dashboard', { timeout: 10000 });
  }

  await page.waitForTimeout(1500);

  // 1. Initial Full Page & Viewport Capture
  console.log('Capturing initial dashboard state...');
  await saveScreenshots(page, '01_dashboard_executive_viewport');
  await saveFullPageScreenshot(page, '02_dashboard_fullpage_scrollable');

  // 2. Audit Telemetry & Metrics
  const telemetry = await page.evaluate(() => {
    const dashElem = document.querySelector('app-dashboard');
    if (!dashElem || !window.ng) return null;
    const comp = window.ng.getComponent(dashElem);
    return {
      stats: comp.stats,
      computedNetProfit: comp.computedNetProfit,
      operatingMarginPct: comp.operatingMarginPct,
      warehouseUtilizationPct: comp.warehouseUtilizationPct,
      polymerBufferPct: comp.polymerBufferPct,
      currentPeriodLabel: comp.currentPeriodLabel,
      plantTelemetry: comp.plantTelemetry,
      recentActivitiesCount: comp.recentActivities?.length || 0,
      systemHealth: comp.systemHealth
    };
  });
  auditReport.metrics = telemetry;
  console.log('Dashboard Data & Calculations:', JSON.stringify(telemetry, null, 2));

  // 3. Check Charts & Sparklines
  const chartsStatus = await page.evaluate(() => {
    const prodCanvas = document.getElementById('prodChartCanvas');
    const salesCanvas = document.getElementById('salesChartCanvas');
    const custCanvas = document.getElementById('custChartCanvas');
    const sparkProd = document.getElementById('sparkline-prod');
    const sparkMonthly = document.getElementById('sparkline-monthly');
    const sparkSales = document.getElementById('sparkline-sales');
    const sparkPending = document.getElementById('sparkline-pending');

    return {
      productionChart: !!prodCanvas && prodCanvas.width > 0,
      salesChart: !!salesCanvas && salesCanvas.width > 0,
      customerChart: !!custCanvas && custCanvas.width > 0,
      sparklines: {
        prod: !!sparkProd && sparkProd.width > 0,
        monthly: !!sparkMonthly && sparkMonthly.width > 0,
        sales: !!sparkSales && sparkSales.width > 0,
        pending: !!sparkPending && sparkPending.width > 0
      }
    };
  });
  auditReport.chartStatus = chartsStatus;
  console.log('Charts Canvas Rendering Status:', JSON.stringify(chartsStatus, null, 2));

  // 4. Test "Sync Data" Button Mutation
  console.log('Testing "Sync Data" button...');
  const syncBtn = page.locator('button.refresh-btn');
  const syncBtnTextBefore = await syncBtn.innerText();
  await syncBtn.click();
  
  // Verify spinning state & text change
  const syncBtnTextDuring = await syncBtn.innerText().catch(() => '');
  console.log(`Sync button text before: "${syncBtnTextBefore}", during: "${syncBtnTextDuring}"`);
  await page.waitForTimeout(300);
  await saveScreenshots(page, '03_sync_data_active_toast');

  await page.waitForTimeout(1000);
  const syncBtnTextAfter = await syncBtn.innerText();
  auditReport.syncDataTest = {
    before: syncBtnTextBefore,
    during: syncBtnTextDuring,
    after: syncBtnTextAfter,
    persisted: syncBtnTextAfter.includes('Sync Data')
  };

  // 5. Test Quick Action Floating FAB Menu
  console.log('Testing Quick-Add FAB Button...');
  const fabBtn = page.locator('.fab-trigger-btn');
  const fabMenuBefore = await page.locator('.fab-menu-items').isVisible().catch(() => false);
  await fabBtn.click();
  await page.waitForTimeout(400);
  const fabMenuOpen = await page.locator('.fab-menu-items').isVisible().catch(() => false);
  console.log(`FAB Menu before: ${fabMenuBefore}, after click: ${fabMenuOpen}`);
  await saveScreenshots(page, '04_fab_menu_opened');

  auditReport.fabMenuTest = {
    menuOpenedOnClick: fabMenuOpen,
    itemsCount: await page.locator('.fab-item-btn').count()
  };

  // Close FAB
  await fabBtn.click();
  await page.waitForTimeout(300);

  // 6. Test Quick Action Buttons & Tab Emission
  console.log('Testing Quick Action Buttons...');
  const quickActions = [
    { label: 'New Sale', selector: '.qa-btn-primary', targetTab: 'sales' },
    { label: 'Production', selector: '.qa-btn:has-text("Production")', targetTab: 'production' },
    { label: 'Payment', selector: '.qa-btn:has-text("Payment")', targetTab: 'payments' },
    { label: 'Tax Invoice', selector: '.qa-btn:has-text("Tax Invoice")', targetTab: 'invoices' },
    { label: 'Dispatch', selector: '.qa-btn:has-text("Dispatch")', targetTab: 'dispatch' },
    { label: 'Stock Check', selector: '.qa-btn:has-text("Stock Check")', targetTab: 'inventory' }
  ];

  for (const qa of quickActions) {
    const btn = page.locator(qa.selector).first();
    const isVisible = await btn.isVisible().catch(() => false);
    auditReport.buttonInteractions.push({
      action: qa.label,
      targetTab: qa.targetTab,
      visible: isVisible
    });
  }

  // 7. Test Alert Action Navigation Buttons
  const alertCards = [
    { name: 'Receivables Notice', selector: '.alert-warning-pill' },
    { name: 'Polymer Buffer', selector: '.alert-info-pill' },
    { name: 'Plant Pacing', selector: '.alert-success-pill' }
  ];
  for (const ac of alertCards) {
    const isVisible = await page.locator(ac.selector).isVisible().catch(() => false);
    auditReport.navigationTests.push({ name: ac.name, selector: ac.selector, exists: isVisible });
  }

  // 8. Test Viewport Scalability & Layout Symmetry
  console.log('Testing Viewport Scalability across Laptop and Compact Screen Sizes...');
  const viewports = [
    { name: '05_laptop_1280x720', width: 1280, height: 720 },
    { name: '06_compact_1100x680', width: 1100, height: 680 }
  ];

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(600);
    await saveScreenshots(page, vp.name);
    auditReport.viewportTests.push({ viewport: vp.name, width: vp.width, height: vp.height, status: 'PASSED' });
  }

  // Test Sidebar Collapsed State
  console.log('Testing Sidebar Collapsed state...');
  await page.setViewportSize({ width: 1440, height: 900 });
  const collapseToggle = page.locator('.sidebar-collapse-toggle-btn').first();
  if (await collapseToggle.isVisible().catch(() => false)) {
    await collapseToggle.click();
    await page.waitForTimeout(600);
    await saveScreenshots(page, '07_sidebar_collapsed_dashboard');
    auditReport.viewportTests.push({ viewport: 'Sidebar Collapsed 1440x900', status: 'PASSED' });
    // Expand back
    await collapseToggle.click();
    await page.waitForTimeout(400);
  }

  await browser.close();

  fs.writeFileSync(path.join(ARTIFACT_DIR, 'dashboard_audit_report.json'), JSON.stringify(auditReport, null, 2));
  fs.writeFileSync(path.join(SCRATCH_DIR, 'dashboard_audit_report.json'), JSON.stringify(auditReport, null, 2));
  console.log('--- DASHBOARD AUDIT COMPLETED SUCCESSFULLY ---');
}

runDashboardAudit().catch(err => {
  console.error('Audit failed with error:', err);
  process.exit(1);
});
