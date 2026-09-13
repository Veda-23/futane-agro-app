const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/31dd588e-fd68-4426-9deb-3030e10b9d4e';

async function auditBranding() {
  console.log('Navigating to Settings -> Branding...');
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

  // Click Settings & Admin in Sidebar
  console.log('Clicking Settings & Admin in Sidebar...');
  const settingsNavItem = await page.$('a[href="#settings"], .sidebar-nav-item:has-text("Settings"), button:has-text("Settings & Admin")');
  if (settingsNavItem) {
    await settingsNavItem.click();
  } else {
    // Fallback trigger
    await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('.nav-link, .sidebar-item, .sidebar-nav-item, span')).find(e => e.textContent.includes('Settings'));
      if (el) el.click();
    });
  }

  await page.waitForTimeout(1200);

  console.log('Capturing current branding screen...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'branding_initial_desktop.png'), fullPage: false });

  await browser.close();
  console.log('Done!');
}

auditBranding().catch(err => {
  console.error(err);
  process.exit(1);
});
