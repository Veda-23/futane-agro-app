const { chromium } = require('@playwright/test');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\Vedant\\.gemini\\antigravity-ide\\brain\\63ae1ca7-044a-4a77-a0c6-a06dc2558ecf';

const TABS = [
  { id: 'raw-materials', name: 'Raw Materials', selector: 'li[title*="raw" i], .sidebar-nav li:has-text("Raw Materials")' },
  { id: 'vendors', name: 'Vendors', selector: 'li[title*="vendor" i], .sidebar-nav li:has-text("Vendors")' },
  { id: 'sales', name: 'Sales Orders', selector: 'li[title*="sales" i], .sidebar-nav li:has-text("Sales")' },
  { id: 'dispatch', name: 'Dispatch', selector: 'li[title*="dispatch" i], .sidebar-nav li:has-text("Dispatch")' },
  { id: 'transports', name: 'Transport', selector: 'li[title*="transport" i], .sidebar-nav li:has-text("Transport")' },
  { id: 'drivers', name: 'Drivers', selector: 'li[title*="driver" i], .sidebar-nav li:has-text("Drivers")' }
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1336, height: 750 } });
  
  await context.addInitScript(() => {
    const mockUser = { id: 1, username: 'admin', name: 'Super Administrator', role: 'SUPER_ADMIN' };
    window.sessionStorage.setItem('user', JSON.stringify(mockUser));
    window.localStorage.setItem('user', JSON.stringify(mockUser));
  });

  const page = await context.newPage();
  await page.goto('http://localhost:4200', { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(2500);

  for (const tab of TABS) {
    try {
      const tabEl = await page.$(tab.selector);
      if (tabEl) {
        await tabEl.click();
        await page.waitForSelector('.tab-loading-state', { state: 'detached', timeout: 15000 }).catch(() => {});
        await page.waitForTimeout(2000);
        const shotPath = path.join(ARTIFACT_DIR, `${tab.id}_audit.png`);
        await page.screenshot({ path: shotPath });
        console.log(`Captured ${tab.id}_audit.png`);

        // If dispatch, also capture the form open state
        if (tab.id === 'dispatch') {
          const createBtn = await page.$('button:has-text("Create Manifest")');
          if (createBtn) {
            await createBtn.click();
            await page.waitForTimeout(1000);
            const formShotPath = path.join(ARTIFACT_DIR, `dispatch_form_open_audit.png`);
            await page.screenshot({ path: formShotPath });
            console.log(`Captured dispatch_form_open_audit.png`);
            // Close form again
            const closeBtn = await page.$('button:has-text("Close Form")');
            if (closeBtn) await closeBtn.click();
          }
        }
      } else {
        console.log(`Could not find selector for ${tab.id}`);
      }
    } catch (err) {
      console.error(`Error on ${tab.id}:`, err.message);
    }
  }

  await browser.close();
  console.log('Supply chain capture complete.');
})();
