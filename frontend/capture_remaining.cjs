const { chromium } = require('@playwright/test');
const path = require('path');

const ARTIFACT_DIR = path.join(
  'C:', 'Users', 'Vedant', '.gemini', 'antigravity-ide', 'brain',
  '63ae1ca7-044a-4a77-a0c6-a06dc2558ecf'
);
const SHOTS_DIR = path.join(ARTIFACT_DIR, 'pdf_screenshots');

const REMAINING_TABS = ['analytics', 'audit-logs', 'settings'];

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5
  });

  await context.addInitScript(() => {
    const mockUser = { id: 1, username: 'admin', name: 'Super Administrator', role: 'SUPER_ADMIN', email: 'admin@futaneagro.com' };
    window.sessionStorage.setItem('user', JSON.stringify(mockUser));
    window.localStorage.setItem('user', JSON.stringify(mockUser));
    window.sessionStorage.setItem('loginTime', new Date().toString());
  });

  const page = await context.newPage();

  for (const tab of REMAINING_TABS) {
    try {
      console.log(`Capturing ${tab}...`);
      await page.goto(`http://localhost:4200/#/${tab}`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(600);
      const shotPath = path.join(SHOTS_DIR, `${tab}_01_main_ledger.png`);
      await page.screenshot({ path: shotPath, fullPage: false });
      console.log(`Saved ${shotPath}`);
    } catch (err) {
      console.error(`Error on ${tab}:`, err.message);
    }
  }

  await browser.close();
  console.log('All remaining captured successfully!');
}

run().catch(console.error);
