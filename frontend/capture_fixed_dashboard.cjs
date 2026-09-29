const { chromium } = require('@playwright/test');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1336, height: 720 },
    deviceScaleFactor: 1.5
  });

  // Inject Super Admin session
  await context.addInitScript(() => {
    const mockUser = {
      id: 1,
      username: 'admin',
      name: 'Super Administrator',
      role: 'SUPER_ADMIN',
      email: 'admin@futaneagro.com'
    };
    window.sessionStorage.setItem('user', JSON.stringify(mockUser));
    window.localStorage.setItem('user', JSON.stringify(mockUser));
    window.localStorage.setItem('currentUser', JSON.stringify(mockUser));
    window.localStorage.setItem('jwtToken', 'mock-token');
    window.localStorage.setItem('auth_token', 'mock-token');
    window.localStorage.setItem('isLoggedIn', 'true');
    window.sessionStorage.setItem('loginTime', new Date().toString());
    window.sessionStorage.setItem('activeTab', 'dashboard');
    window.localStorage.setItem('activeTab', 'dashboard');
  });

  const page = await context.newPage();
  page.on('console', msg => console.log('PAGE:', msg.text()));

  await page.goto('http://127.0.0.1:4200', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Wait for dashboard header to render
  await page.waitForSelector('.command-center-header', { timeout: 15000 });
  await page.waitForTimeout(2500);

  const outPath = 'audit_screenshots/dashboard_fixed_view.png';
  await page.screenshot({ path: outPath });
  console.log(`SUCCESS: Captured ${outPath}`);

  // Also save directly to brain artifacts directory so view_file can read it immediately
  const brainPath = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/85ad973d-5ffe-43f1-ade7-7d1725289be5/dashboard_fixed_verified.png';
  await page.screenshot({ path: brainPath });
  console.log(`SUCCESS: Captured ${brainPath}`);

  await browser.close();
})();
