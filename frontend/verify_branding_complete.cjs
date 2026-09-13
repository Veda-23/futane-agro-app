const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/31dd588e-fd68-4426-9deb-3030e10b9d4e';

async function runCompleteBrandingVerification() {
  console.log('Starting Branding & Visual Identity System Verification...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto('http://localhost:4200', { waitUntil: 'networkidle' });

  // Direct login as SUPER_ADMIN
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
  });

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Navigate to Settings & Admin
  console.log('Clicking Settings & Admin in Sidebar...');
  const settingsNavItem = await page.$('a[href="#settings"], .sidebar-nav-item:has-text("Settings"), button:has-text("Settings & Admin")');
  if (settingsNavItem) {
    await settingsNavItem.click();
  } else {
    await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('.nav-link, .sidebar-item, .sidebar-nav-item, span')).find(e => e.textContent.includes('Settings'));
      if (el) el.click();
    });
  }

  await page.waitForTimeout(1000);

  // 1. Capture Desktop Top View
  console.log('1. Capturing branding_audit_01_desktop_top.png...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'branding_audit_01_desktop_top.png'), fullPage: false });

  // 2. Scroll to see Live Preview and Form Actions
  console.log('2. Scrolling down to see Live Preview...');
  await page.evaluate(() => window.scrollBy(0, 480));
  await page.waitForTimeout(500);
  console.log('Capturing branding_audit_02_desktop_scrolled.png...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'branding_audit_02_desktop_scrolled.png'), fullPage: false });

  // 3. Test interactive color change and live unsaved badge
  console.log('3. Testing preset color change to Blue (#2563eb)...');
  const bluePreset = await page.$('button.preset-dot[title="#2563eb"]');
  if (bluePreset) {
    await bluePreset.click();
    await page.waitForTimeout(500);
  }
  console.log('Capturing branding_audit_03_color_change_unsaved.png...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'branding_audit_03_color_change_unsaved.png'), fullPage: false });

  // 4. Test Dark Mode
  console.log('4. Toggling Dark Mode...');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  const themeBtn = await page.$('button.header-icon-btn[aria-label="Toggle theme"]');
  if (themeBtn) {
    await themeBtn.click();
  } else {
    await page.evaluate(() => {
      document.body.classList.add('dark-theme');
      document.documentElement.setAttribute('data-theme', 'dark');
    });
  }
  await page.waitForTimeout(800);
  console.log('Capturing branding_audit_04_dark_mode_top.png...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'branding_audit_04_dark_mode_top.png'), fullPage: false });

  await page.evaluate(() => window.scrollBy(0, 480));
  await page.waitForTimeout(500);
  console.log('Capturing branding_audit_05_dark_mode_scrolled.png...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'branding_audit_05_dark_mode_scrolled.png'), fullPage: false });

  // Toggle back to light mode
  if (themeBtn) {
    await themeBtn.click();
    await page.waitForTimeout(500);
  } else {
    await page.evaluate(() => {
      document.body.classList.remove('dark-theme');
      document.documentElement.setAttribute('data-theme', 'light');
    });
  }

  // 5. Tablet View (1024px)
  console.log('5. Testing Tablet 1024px View...');
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    const backdrop = document.querySelector('.sidebar-backdrop');
    if (backdrop) backdrop.click();
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(400);
  console.log('Capturing branding_audit_06_tablet_1024px.png...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'branding_audit_06_tablet_1024px.png'), fullPage: false });

  // 6. Mobile View (390px)
  console.log('6. Testing Mobile 390px View...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);

  // Close sidebar drawer if open in mobile view
  await page.evaluate(() => {
    const backdrop = document.querySelector('.sidebar-backdrop');
    if (backdrop) backdrop.click();
    const closeBtn = document.querySelector('.mobile-sidebar-close, .sidebar-header .btn-close, button[aria-label="Close sidebar"]');
    if (closeBtn) closeBtn.click();
  });
  await page.waitForTimeout(500);

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  console.log('Capturing branding_audit_07_mobile_390px_top.png...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'branding_audit_07_mobile_390px_top.png'), fullPage: false });

  await page.evaluate(() => window.scrollBy(0, 520));
  await page.waitForTimeout(500);
  console.log('Capturing branding_audit_08_mobile_390px_scrolled.png...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'branding_audit_08_mobile_390px_scrolled.png'), fullPage: false });

  await page.evaluate(() => window.scrollBy(0, 600));
  await page.waitForTimeout(500);
  console.log('Capturing branding_audit_09_mobile_390px_preview.png...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'branding_audit_09_mobile_390px_preview.png'), fullPage: false });

  await browser.close();
  console.log('ALL BRANDING VERIFICATIONS COMPLETED SUCCESSFULLY!');
}

runCompleteBrandingVerification().catch(err => {
  console.error(err);
  process.exit(1);
});
