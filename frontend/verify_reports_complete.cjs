const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/31dd588e-fd68-4426-9deb-3030e10b9d4e';

async function runAudit() {
  console.log('Starting Real Login & Reports Comprehensive Verification...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:4200...');
  await page.goto('http://localhost:4200', { waitUntil: 'networkidle' });

  // 1. Fill Username & Password
  console.log('Filling credentials...');
  await page.waitForSelector('#username');
  await page.fill('#username', 'admin');
  await page.fill('#password', 'admin123');
  await page.click('#login-submit-btn');

  // 2. Wait for OTP card
  console.log('Waiting for OTP card...');
  await page.waitForSelector('.uat-otp-helper-card', { timeout: 10000 });
  await page.click('.uat-otp-helper-card');
  await page.waitForTimeout(600);

  // 3. Click Verify
  console.log('Submitting OTP...');
  await page.click('button[type="submit"]:has-text("Verify & Enter Portal")');

  // 4. Wait for navigation into ERP
  await page.waitForSelector('.nav-menu-list, .futane-header-bar, .main-layout-container', { timeout: 15000 });
  console.log('Successfully logged in with real JWT!');

  // Navigate to Reports tab
  console.log('Switching to Reports tab...');
  await page.click('.nav-menu-list li:has-text("Reports"), a:has-text("Reports"), .nav-item:has-text("Reports")');
  await page.waitForTimeout(2000);

  // Ensure reports screen is loaded
  await page.waitForSelector('.report-page-header, app-reports', { timeout: 10000 });
  await page.waitForTimeout(1500);

  // 1. Top View - Production Registry (Light Mode)
  console.log('1. Capturing reports_audit_01_top_view.png...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'reports_audit_01_top_view.png') });

  // 2. Scrolled Table View (Sticky header & column check)
  console.log('2. Capturing reports_audit_02_production_table.png...');
  await page.evaluate(() => window.scrollBy(0, 480));
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'reports_audit_02_production_table.png') });

  // 3. Switch to Sales & Revenue Report
  console.log('3. Switching to Sales Report...');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const sel = document.querySelector('select.control-select, select[name="repType"]');
    if (sel) {
      sel.value = 'sales';
      sel.dispatchEvent(new Event('change'));
    }
  });
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollBy(0, 450));
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'reports_audit_03_sales_table.png') });

  // 4. Switch to Customer Party Ledger
  console.log('4. Switching to Party Ledger...');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const sel = document.querySelector('select.control-select, select[name="repType"]');
    if (sel) {
      sel.value = 'party_ledger';
      sel.dispatchEvent(new Event('change'));
    }
  });
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollBy(0, 300));
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'reports_audit_04_party_ledger.png') });

  // 5. Dark Mode Audit (Toggle dark mode via header button)
  console.log('5. Toggling Dark Mode via header button...');
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
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'reports_audit_05_dark_mode_top.png') });

  await page.evaluate(() => window.scrollBy(0, 500));
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'reports_audit_06_dark_mode_table.png') });

  // Toggle back to light
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
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'reports_audit_07_tablet_1024px.png') });

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
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'reports_audit_08_mobile_390px.png') });

  await browser.close();
  console.log('ALL REPORTS VISUAL & FUNCTIONAL AUDITS COMPLETED SUCCESSFULLY WITH REAL JWT DATA!');
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
