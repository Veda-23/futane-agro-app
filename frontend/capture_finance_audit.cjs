const { chromium } = require('@playwright/test');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\Vedant\\.gemini\\antigravity-ide\\brain\\63ae1ca7-044a-4a77-a0c6-a06dc2558ecf';

const TABS = [
  { id: 'parties', selector: 'li[title*="parties" i], .sidebar-nav li:has-text("Parties")' },
  { id: 'invoices', selector: 'li[title*="invoices" i], .sidebar-nav li:has-text("Invoices")' },
  { id: 'billinghub', selector: 'li[title*="billing" i], .sidebar-nav li:has-text("Billing Hub")' },
  { id: 'bank', selector: 'li[title*="bank" i], .sidebar-nav li:has-text("Bank")' },
  { id: 'expenses', selector: 'li[title*="expenses" i], .sidebar-nav li:has-text("Expenses")' },
  { id: 'salaries', selector: 'li[title*="salaries" i], .sidebar-nav li:has-text("Salaries")' }
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
        const shotPath = path.join(ARTIFACT_DIR, `${tab.id}_pre_audit.png`);
        await page.screenshot({ path: shotPath });
        console.log(`Captured ${tab.id}_pre_audit.png`);
      } else {
        console.log(`Could not find selector for ${tab.id}`);
      }
    } catch (err) {
      console.error(`Error on ${tab.id}:`, err.message);
    }
  }

  await browser.close();
  console.log('Finance capture complete.');
})();
