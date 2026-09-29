const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/b8360f7d-7d6d-4412-a236-7770e330ad5e';
const SHOTS_DIR = path.join(ARTIFACT_DIR, 'screenshots');

if (!fs.existsSync(SHOTS_DIR)) {
  fs.mkdirSync(SHOTS_DIR, { recursive: true });
}

const ALL_TABS = [
  { id: 'dashboard', name: 'Executive Overview' },
  { id: 'production', name: 'Daily Production (PPD)' },
  { id: 'monthly-production', name: 'Monthly Summary (PPM)' },
  { id: 'inventory', name: 'Finished Goods Inventory' },
  { id: 'machines', name: 'Molding Machines & OEE' },
  { id: 'raw-materials', name: 'Polymer Raw Materials' },
  { id: 'vendors', name: 'Polymer Vendors & Suppliers' },
  { id: 'sales', name: 'Commercial Sales Orders' },
  { id: 'dispatch', name: 'Dispatch & Gate Passes' },
  { id: 'transports', name: 'Freight Logistics Fleet' },
  { id: 'drivers', name: 'Commercial Drivers' },
  { id: 'parties', name: 'Parties & Customers' },
  { id: 'payments', name: 'Customer Receipts' },
  { id: 'invoices', name: 'GST Tax Invoices' },
  { id: 'billinghub', name: 'Billing Hub Document Center' },
  { id: 'bank', name: 'Bank & UPI Ledger' },
  { id: 'expenses', name: 'Factory Overhead Expenses' },
  { id: 'salaries', name: 'Payroll & Salary Vouchers' },
  { id: 'employees', name: 'Factory Staff Directory' },
  { id: 'reports', name: 'Executive Business Reports' },
  { id: 'analytics', name: 'PowerBI Analytics Suite' },
  { id: 'audit-logs', name: 'Security Audit & Telemetry' },
  { id: 'settings', name: 'Super Admin Control Center' }
];

async function captureAll() {
  console.log('Starting Playwright browser for screenshot capture...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
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
  });

  const page = await context.newPage();

  // Dismiss any alert dialogs
  page.on('dialog', async dialog => {
    console.log(`Dialog: ${dialog.message()}`);
    await dialog.dismiss().catch(() => {});
  });

  // Navigate to application
  console.log('Connecting to http://localhost:4200 ...');
  await page.goto('http://localhost:4200', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1000);

  // Hide toast popups from obscuring view
  await page.addStyleTag({
    content: `
      .swal2-container, .futane-toast-container-top { display: none !important; }
    `
  }).catch(() => {});

  for (let i = 0; i < ALL_TABS.length; i++) {
    const tab = ALL_TABS[i];
    console.log(`[${i + 1}/${ALL_TABS.length}] Capturing ${tab.id} (${tab.name})...`);

    // Switch tab
    await page.evaluate((tabId) => {
      sessionStorage.setItem('activeTab', tabId);
      localStorage.setItem('activeTab', tabId);
      // If there is an Angular component or navigation method on window
      const navItem = document.querySelector(`[data-tab="${tabId}"], .nav-item[href*="${tabId}"], [routerlink*="${tabId}"]`);
      if (navItem) navItem.click();
    }, tab.id).catch(() => {});

    await page.goto('http://localhost:4200', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(800);

    const shotPath = path.join(SHOTS_DIR, `${tab.id}_01_main_ledger.png`);
    await page.screenshot({ path: shotPath, fullPage: false });
    console.log(`Saved: ${tab.id}_01_main_ledger.png`);
  }

  // Also capture key popups/drawers centered
  const popupTabs = [
    { tabId: 'vendors', patterns: ['Register Supplier', 'Add Vendor', 'New Vendor'], name: 'vendors_02_add_drawer.png' },
    { tabId: 'production', patterns: ['Record Entry', 'Add Entry', 'New PPD'], name: 'production_02_add_drawer.png' },
    { tabId: 'expenses', patterns: ['Add Expense', 'New Expense'], name: 'expenses_02_add_drawer.png' },
    { tabId: 'bank', patterns: ['Add Transaction', 'New Entry'], name: 'bank_02_add_drawer.png' },
    { tabId: 'parties', patterns: ['Add Party', 'New Party'], name: 'parties_02_add_drawer.png' },
    { tabId: 'invoices', patterns: ['Create Invoice', 'New Invoice'], name: 'invoices_02_add_drawer.png' }
  ];

  for (const p of popupTabs) {
    try {
      console.log(`Capturing popup for ${p.tabId}...`);
      await page.evaluate((tabId) => {
        sessionStorage.setItem('activeTab', tabId);
        localStorage.setItem('activeTab', tabId);
      }, p.tabId);
      await page.goto('http://localhost:4200', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(900);

      // Try clicking the button matching text pattern
      const clicked = await page.evaluate((textPatterns) => {
        const allBtns = Array.from(document.querySelectorAll('button, .btn, a.btn'));
        for (const pattern of textPatterns) {
          const target = allBtns.find(b => b.textContent && b.textContent.toLowerCase().includes(pattern.toLowerCase()));
          if (target) {
            target.click();
            return true;
          }
        }
        return false;
      }, p.patterns);

      if (clicked) {
        await page.waitForTimeout(700);
        const popupShot = path.join(SHOTS_DIR, p.name);
        await page.screenshot({ path: popupShot, fullPage: false });
        console.log(`Saved popup: ${p.name}`);
      }
    } catch (err) {
      console.log(`Skipping popup for ${p.tabId}: ${err.message}`);
    }
  }

  await browser.close();
  console.log('\nAll screenshots captured successfully!');
}

captureAll().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
