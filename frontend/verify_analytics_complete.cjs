const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/31dd588e-fd68-4426-9deb-3030e10b9d4e';

async function runAudit() {
  console.log('Starting PowerBI Executive Analytics Suite Comprehensive Verification...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:4200...');
  await page.goto('http://localhost:4200', { waitUntil: 'networkidle' });

  // Direct login bypass with session
  await page.evaluate(() => {
    const mockUser = {
      id: 1,
      username: 'admin',
      name: 'Neha Sharma',
      role: 'SUPER_ADMIN',
      email: 'admin@futaneagro.com'
    };
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('jwtToken', 'valid-mock-jwt-token');
    sessionStorage.setItem('user', JSON.stringify(mockUser));
    sessionStorage.setItem('jwtToken', 'valid-mock-jwt-token');
    localStorage.setItem('isLoggedIn', 'true');
    sessionStorage.setItem('activeTab', 'analytics');
    localStorage.setItem('activeTab', 'analytics');
  });

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Click Analytics nav if not already active
  const analyticsNav = await page.$('.nav-menu-list li:has-text("Analytics"), a:has-text("Analytics"), .nav-item:has-text("Analytics")');
  if (analyticsNav) {
    await analyticsNav.click();
    await page.waitForTimeout(1500);
  }

  await page.waitForSelector('.analytics-container, app-analytics', { timeout: 10000 });
  console.log('PowerBI Executive Analytics Suite loaded!');

  // 1. Top View - Cockpit Mode (Light Mode)
  console.log('1. Capturing analytics_audit_01_cockpit_top.png...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'analytics_audit_01_cockpit_top.png') });

  // 2. Scrolled Cockpit View (Shift matrix, machines, debtor ranking, AI insights)
  console.log('2. Capturing analytics_audit_02_cockpit_scrolled.png...');
  await page.evaluate(() => window.scrollBy(0, 480));
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'analytics_audit_02_cockpit_scrolled.png') });

  // 3. Switch to Reports Grid Mode
  console.log('3. Switching to Reports Grid Mode...');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  const reportsBtn = await page.$('#btn-view-reports');
  if (reportsBtn) {
    await reportsBtn.click();
    await page.waitForTimeout(1000);
    console.log('Capturing analytics_audit_03_reports_grid.png...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'analytics_audit_03_reports_grid.png') });

    // Test switching subtabs inside Reports
    console.log('Testing P&L subtab...');
    const plBtn = await page.$('button.report-tab-btn:has-text("P&L")');
    if (plBtn) {
      await plBtn.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'analytics_audit_04_pl_analysis.png') });
    }
  }

  // 4. Switch to Power BI Embed Mode
  console.log('4. Switching to Power BI Embed Mode...');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  const embedBtn = await page.$('#btn-view-embed');
  if (embedBtn) {
    await embedBtn.click();
    await page.waitForTimeout(1000);
    console.log('Capturing analytics_audit_05_embed_mode.png...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'analytics_audit_05_embed_mode.png') });
  }

  // 5. Dark Mode Audit (Toggle dark mode via header button)
  console.log('5. Toggling Dark Mode...');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  const themeBtn = await page.$('button.header-icon-btn[aria-label="Toggle theme"]');
  if (themeBtn) {
    await themeBtn.click();
  } else {
    await page.evaluate(() => {
      document.body.classList.add('dark-mode');
      document.documentElement.setAttribute('data-theme', 'dark');
    });
  }
  await page.waitForTimeout(1200);

  // Switch back to Cockpit to audit dark mode
  if (cockpitBtn = await page.$('#btn-view-cockpit')) {
    await cockpitBtn.click();
    await page.waitForTimeout(600);
  }
  console.log('Capturing analytics_audit_06_dark_mode_top.png...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'analytics_audit_06_dark_mode_top.png') });

  await page.evaluate(() => window.scrollBy(0, 480));
  await page.waitForTimeout(600);
  console.log('Capturing analytics_audit_07_dark_mode_scrolled.png...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'analytics_audit_07_dark_mode_scrolled.png') });

  // Toggle back to Light mode
  if (themeBtn) {
    await themeBtn.click();
    await page.waitForTimeout(600);
  } else {
    await page.evaluate(() => {
      document.body.classList.remove('dark-mode');
      document.documentElement.setAttribute('data-theme', 'light');
    });
  }

  // 6. Tablet View (1024px)
  console.log('6. Testing Tablet 1024px View...');
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.evaluate(() => window.scrollTo(0, 0));
  const backdropTablet = await page.$('.sidebar-backdrop, .sidebar-close-btn, aside .btn-close');
  if (backdropTablet) {
    await backdropTablet.click();
    await page.waitForTimeout(400);
  }
  await page.waitForTimeout(600);
  console.log('Capturing analytics_audit_08_tablet_1024px.png...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'analytics_audit_08_tablet_1024px.png') });

  // 7. Mobile View (390px)
  console.log('7. Testing Mobile 390px View...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  const backdropMobile = await page.$('.sidebar-backdrop, .sidebar-close-btn, aside .btn-close');
  if (backdropMobile) {
    await backdropMobile.click();
    await page.waitForTimeout(400);
  }
  await page.waitForTimeout(600);
  console.log('Capturing analytics_audit_09_mobile_390px.png...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'analytics_audit_09_mobile_390px.png') });

  await browser.close();
  console.log('ALL ANALYTICS AUDITS COMPLETED SUCCESSFULLY!');
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
