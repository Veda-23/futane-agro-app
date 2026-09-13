const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/31dd588e-fd68-4426-9deb-3030e10b9d4e';

async function runAudit() {
  console.log('Starting Initial Analytics Baseline Inspection...');
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
  console.log('Analytics screen loaded!');

  // 1. Cockpit Top
  console.log('1. Baseline Cockpit Top...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'analytics_baseline_01_cockpit_top.png') });

  // 2. Cockpit Scroll (Machines & AI Insights)
  console.log('2. Baseline Cockpit Scrolled...');
  await page.evaluate(() => window.scrollBy(0, 480));
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'analytics_baseline_02_cockpit_scroll.png') });

  // 3. Switch to Reports Mode
  console.log('3. Baseline Reports Mode...');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  const reportsBtn = await page.$('#btn-view-reports');
  if (reportsBtn) {
    await reportsBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'analytics_baseline_03_reports_mode.png') });
  }

  // 4. Switch to Embed Mode
  console.log('4. Baseline Embed Mode...');
  const embedBtn = await page.$('#btn-view-embed');
  if (embedBtn) {
    await embedBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'analytics_baseline_04_embed_mode.png') });
  }

  await browser.close();
  console.log('Baseline screenshots captured successfully!');
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
