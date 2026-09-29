const { chromium } = require('@playwright/test');
const path = require('path');

const ARTIFACT_DIR = path.join(
  'C:', 'Users', 'Vedant', '.gemini', 'antigravity-ide', 'brain',
  '63ae1ca7-044a-4a77-a0c6-a06dc2558ecf'
);

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5
  });

  await context.addInitScript(() => {
    const mockUser = { id: 1, username: 'SUPER_ADMIN', name: 'Super Administrator', role: 'SUPER_ADMIN', email: 'admin@futaneagro.com' };
    window.sessionStorage.setItem('user', JSON.stringify(mockUser));
    window.localStorage.setItem('user', JSON.stringify(mockUser));
    window.sessionStorage.setItem('jwtToken', 'test-jwt-token-valid');
    window.localStorage.setItem('jwtToken', 'test-jwt-token-valid');
    window.sessionStorage.setItem('loginTime', new Date().toString());
    window.sessionStorage.setItem('activeTab', 'invoices');
  });

  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4200/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  try {
    await page.waitForSelector('.tab-loading-state', { state: 'detached', timeout: 6000 });
  } catch (e) {}
  await page.waitForTimeout(3000);

  const shotPath = path.join(ARTIFACT_DIR, 'invoices_verified.png');
  await page.screenshot({ path: shotPath, fullPage: false });
  console.log(`Saved screenshot to ${shotPath}`);

  await browser.close();
}

run().catch(console.error);
