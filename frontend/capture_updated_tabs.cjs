const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/fdd0d5e2-b9ea-49ba-889e-e88204822640';

async function captureTabs() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Load app and authenticate as Super Admin
  await page.goto('http://localhost:4200', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    const mockUser = {
      id: 1,
      username: 'admin',
      name: 'Super Administrator',
      role: 'SUPER_ADMIN',
      email: 'admin@futaneagro.com'
    };
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('currentUser', JSON.stringify(mockUser));
    localStorage.setItem('jwtToken', 'mock-token');
    localStorage.setItem('auth_token', 'mock-token');
    sessionStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('isLoggedIn', 'true');
  });

  const tabs = [
    { key: 'expenses', name: 'expenses_harmonized.png' },
    { key: 'bank', name: 'bank_harmonized.png' },
    { key: 'invoices', name: 'invoices_harmonized.png' },
    { key: 'billinghub', name: 'billinghub_harmonized.png' },
    { key: 'reports', name: 'reports_harmonized.png' },
    { key: 'analytics', name: 'analytics_harmonized.png' }
  ];

  for (const t of tabs) {
    console.log(`Capturing ${t.key} tab...`);
    await page.evaluate((tabKey) => {
      sessionStorage.setItem('activeTab', tabKey);
      localStorage.setItem('activeTab', tabKey);
    }, t.key);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    const savePath = path.join(ARTIFACT_DIR, t.name);
    await page.screenshot({ path: savePath, fullPage: false });
    console.log(`Saved screenshot to ${savePath}`);
  }

  await browser.close();
  console.log('All 5 tabs captured successfully!');
}

captureTabs().catch(err => {
  console.error('Error capturing tabs:', err);
  process.exit(1);
});
