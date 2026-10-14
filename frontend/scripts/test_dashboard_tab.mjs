import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const BRAIN_ARTIFACT_DIR = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/bcf88ada-31d6-4941-94ae-1b3daf5a2f4d';
const SCRATCH_ARTIFACT_DIR = 'c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch';

fs.mkdirSync(BRAIN_ARTIFACT_DIR, { recursive: true });
fs.mkdirSync(SCRATCH_ARTIFACT_DIR, { recursive: true });

async function testDashboard() {
  console.log('Launching headless browser to test Dashboard tab...');
  const browser = await chromium.launch({
    headless: true
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:4300...');
  await page.goto('http://localhost:4300', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // Check if login form is present
  const loginInput = page.locator('#username');
  if (await loginInput.isVisible().catch(() => false)) {
    console.log('Logging in as SUPER_ADMIN...');
    await page.fill('#username', 'SUPER_ADMIN');
    await page.fill('#password', 'superadmin123');
    await page.click('#login-submit-btn');

    // Wait for OTP pill or sidebar
    console.log('Waiting for OTP challenge or sidebar...');
    await page.waitForSelector('.uat-otp-helper-pill, .sidebar', { timeout: 15000 });
    
    if (await page.locator('.uat-otp-helper-pill').isVisible().catch(() => false)) {
      console.log('Clicking UAT OTP helper pill...');
      await page.click('.uat-otp-helper-pill');
      await page.waitForTimeout(600);
      
      console.log('Submitting OTP verification...');
      const verifyBtn = page.locator('button:has-text("Verify"), button[type="submit"]');
      await verifyBtn.first().click();
    }
  }

  console.log('Waiting for main application sidebar...');
  await page.waitForSelector('.sidebar', { timeout: 20000 });
  await page.waitForTimeout(1500);

  // Click Dashboard navigation item if needed
  const dashboardItem = page.locator('.nav-menu-list li:has-text("Dashboard"), .nav-item:has-text("Dashboard"), a:has-text("Dashboard")');
  if (await dashboardItem.first().isVisible().catch(() => false)) {
    console.log('Ensuring Dashboard tab is active...');
    await dashboardItem.first().click();
    await page.waitForTimeout(1500);
  }

  console.log('Waiting for Dashboard screen to render...');
  await page.waitForSelector('.dashboard-container, app-dashboard, .kpi-card', { timeout: 20000 });
  await page.waitForTimeout(2000);

  // Extract dashboard statistics & metrics
  const dashboardData = await page.evaluate(() => {
    // HUD telemetry
    const hudItems = Array.from(document.querySelectorAll('.cch-hud-item')).map(el => el.textContent.replace(/\s+/g, ' ').trim());

    // Alerts
    const alertItems = Array.from(document.querySelectorAll('.alert-pill')).map(el => {
      const text = el.querySelector('.alert-text')?.textContent?.replace(/\s+/g, ' ').trim() || '';
      const sub = el.querySelector('.alert-gauge-sub')?.textContent?.replace(/\s+/g, ' ').trim() || '';
      return `${text} | ${sub}`;
    });

    // Executive KPI Cards
    const kpiCards = Array.from(document.querySelectorAll('.kpi-card, .executive-kpi-card')).map(card => {
      const title = card.querySelector('.kpi-label, .kpi-title, .label, h4, h5, .card-label, .kpi-name')?.textContent?.trim() || '';
      const value = card.querySelector('.kpi-val, .kpi-value, .value, .stat-value, h2, h3, .number')?.textContent?.trim() || '';
      const trend = card.querySelector('.kpi-badge-trend, .trend, .subtext, .kpi-sub')?.textContent?.trim() || '';
      return { title, value, trend };
    }).filter(k => k.title || k.value);

    // Quick Action buttons
    const quickActions = Array.from(document.querySelectorAll('.qa-buttons-wrap button')).map(b => b.textContent.trim());

    // Charts & tables
    const charts = Array.from(document.querySelectorAll('canvas, .chart-wrapper, .chart-container')).length;
    const tables = Array.from(document.querySelectorAll('table')).length;

    return {
      hudTelemetry: hudItems,
      alerts: alertItems,
      quickActions,
      kpis: kpiCards,
      chartsCount: charts,
      tablesCount: tables
    };
  });

  console.log('=== Extracted Dashboard Telemetry & Metrics ===');
  console.log(JSON.stringify(dashboardData, null, 2));

  // Capture viewport and full-page screenshots
  const scratchScreenshot = path.join(SCRATCH_ARTIFACT_DIR, 'dashboard_active_screenshot.png');
  const brainScreenshot = path.join(BRAIN_ARTIFACT_DIR, 'dashboard_screenshot.png');
  const fullPageScreenshot = path.join(SCRATCH_ARTIFACT_DIR, 'dashboard_fullpage_screenshot.png');

  await page.screenshot({ path: scratchScreenshot });
  await page.screenshot({ path: brainScreenshot });
  await page.screenshot({ path: fullPageScreenshot, fullPage: true });

  console.log('Screenshots saved:');
  console.log(' -', scratchScreenshot);
  console.log(' -', brainScreenshot);
  console.log(' -', fullPageScreenshot);

  await browser.close();
}

testDashboard().catch(err => {
  console.error('Dashboard test failed:', err);
  process.exit(1);
});
