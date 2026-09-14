const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/fdd0d5e2-b9ea-49ba-889e-e88204822640';

const tabsToAudit = [
  { key: 'dashboard', filename: 'audit_tab_dashboard.png' },
  { key: 'production', filename: 'audit_tab_production.png' },
  { key: 'inventory', filename: 'audit_tab_inventory.png' },
  { key: 'machines', filename: 'audit_tab_machines.png' },
  { key: 'raw-materials', filename: 'audit_tab_raw_materials.png' },
  { key: 'vendors', filename: 'audit_tab_vendors.png' },
  { key: 'sales', filename: 'audit_tab_sales.png' },
  { key: 'dispatch', filename: 'audit_tab_dispatch.png' },
  { key: 'transports', filename: 'audit_tab_transports.png' },
  { key: 'payments', filename: 'audit_tab_payments.png' },
  { key: 'invoices', filename: 'audit_tab_invoices.png' },
  { key: 'billing-hub', filename: 'audit_tab_billing_hub.png' },
  { key: 'bank', filename: 'audit_tab_bank.png' },
  { key: 'reports', filename: 'audit_tab_reports.png' }
];

async function captureAllTabs() {
  console.log('Launching browser for comprehensive tabs audit...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:4200...');
  await page.goto('http://localhost:4200', { waitUntil: 'domcontentloaded' });

  // Set Super Admin Auth in localStorage & sessionStorage
  await page.evaluate(() => {
    const mockUser = {
      id: 1,
      username: 'SUPER_ADMIN',
      name: 'Super Administrator',
      role: 'SUPER_ADMIN',
      email: 'admin@futaneagro.com'
    };
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('currentUser', JSON.stringify(mockUser));
    localStorage.setItem('jwtToken', 'mock-super-admin-token');
    localStorage.setItem('auth_token', 'mock-super-admin-token');
    sessionStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('theme', 'light');
  });

  for (const t of tabsToAudit) {
    console.log(`Capturing tab: ${t.key}...`);
    await page.evaluate((tabKey) => {
      localStorage.setItem('activeTab', tabKey);
      sessionStorage.setItem('activeTab', tabKey);
      const appComp = window['ng']?.getComponent?.(document.querySelector('app-root'));
      if (appComp && appComp.switchTab) {
        appComp.switchTab(tabKey);
      }
    }, t.key);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1800);

    const outPath = path.join(ARTIFACT_DIR, t.filename);
    await page.screenshot({ path: outPath, fullPage: false });
    console.log(`Saved screenshot to ${t.filename}`);
  }

  await browser.close();
  console.log('All tabs audit captured successfully!');
}

captureAllTabs().catch(err => {
  console.error('Audit capture failed:', err);
  process.exit(1);
});
