const { chromium } = require('@playwright/test');
const path = require('path');

const ARTIFACT_DIR = path.join(
  'C:', 'Users', 'Vedant', '.gemini', 'antigravity-ide', 'brain',
  '63ae1ca7-044a-4a77-a0c6-a06dc2558ecf'
);

const TABS = ['reports', 'analytics', 'audit-logs', 'settings'];

async function run() {
  const browser = await chromium.launch({ headless: true });
  
  for (const tab of TABS) {
    console.log(`Starting capture for ${tab}...`);
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1.5
    });

    await context.addInitScript((currentTab) => {
      const mockUser = {
        id: 1,
        username: 'SUPER_ADMIN',
        name: 'Super Administrator',
        role: 'SUPER_ADMIN',
        email: 'admin@futaneagro.com'
      };
      window.sessionStorage.setItem('user', JSON.stringify(mockUser));
      window.localStorage.setItem('user', JSON.stringify(mockUser));
      window.sessionStorage.setItem('jwtToken', 'test-jwt-token-valid');
      window.localStorage.setItem('jwtToken', 'test-jwt-token-valid');
      window.sessionStorage.setItem('loginTime', new Date().toString());
      window.sessionStorage.setItem('activeTab', currentTab);
    }, tab);

    const page = await context.newPage();
    try {
      await page.goto('http://localhost:4200/', { waitUntil: 'networkidle', timeout: 20000 });
      // wait for defer loading spinner to disappear
      try {
        await page.waitForSelector('.tab-loading-state', { state: 'detached', timeout: 6000 });
      } catch (e) {
        console.log('No .tab-loading-state or already detached');
      }
      // Wait for table/content rendering
      await page.waitForTimeout(3000);
      const shotPath = path.join(ARTIFACT_DIR, `${tab}_verified.png`);
      await page.screenshot({ path: shotPath, fullPage: false });
      console.log(`Saved screenshot to ${shotPath}`);
    } catch (err) {
      console.error(`Failed to capture ${tab}:`, err.message);
    } finally {
      await context.close();
    }
  }

  await browser.close();
  console.log('Verification captures complete!');
}

run().catch(console.error);
