const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/c1c6338c-1671-4e87-b480-7a9ae9928b58';

const TABS = [
  { id: 'dashboard', name: '01_dashboard', label: 'Dashboard' },
  { id: 'production', name: '02_production', label: 'Production' },
  { id: 'monthly-production', name: '03_monthly_production', label: 'Monthly Summary' },
  { id: 'parties', name: '04_parties', label: 'Parties' },
  { id: 'sales', name: '05_sales', label: 'Sales' },
  { id: 'payments', name: '06_payments', label: 'Payment Registry' },
  { id: 'raw-materials', name: '07_raw_materials', label: 'Raw Materials' },
  { id: 'vendors', name: '08_vendors', label: 'Vendors' },
  { id: 'inventory', name: '09_inventory', label: 'Inventory' },
  { id: 'employees', name: '10_employees', label: 'Employees' },
  { id: 'salaries', name: '11_salaries', label: 'Salaries' },
  { id: 'transports', name: '12_transports', label: 'Transport' },
  { id: 'drivers', name: '13_drivers', label: 'Drivers' },
  { id: 'invoices', name: '14_invoices', label: 'Invoices' },
  { id: 'billinghub', name: '15_billinghub', label: 'Billing Hub' },
  { id: 'machines', name: '16_machines', label: 'Machines' },
  { id: 'dispatch', name: '17_dispatch', label: 'Dispatch' },
  { id: 'expenses', name: '18_expenses', label: 'Expenses' },
  { id: 'bank', name: '19_bank', label: 'Bank Ledger' },
  { id: 'analytics', name: '20_analytics', label: 'Analytics' },
  { id: 'reports', name: '21_reports', label: 'Reports' },
  { id: 'audit-logs', name: '22_audit_logs', label: 'Audit Logs' },
  { id: 'settings', name: '23_settings', label: 'Settings' }
];

async function captureAllTabs() {
  console.log('Launching browser for tab-by-tab captures...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto('http://localhost:8081', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Login
  const usernameInput = await page.$('input[placeholder*="Username" i], input[type="text"]');
  if (usernameInput) {
    console.log('Logging in as super admin...');
    await page.fill('input[placeholder*="Username" i], input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
    await page.waitForTimeout(2000);
  }

  for (const tab of TABS) {
    console.log(`Processing Tab: ${tab.label} (${tab.id})...`);
    
    // Switch tab by clicking sidebar nav or using root component
    const clicked = await page.evaluate((tabId) => {
      const root = document.querySelector('app-root');
      if (root) {
        // Try finding angular component instance
        const comp = (window.ng && window.ng.getComponent) ? window.ng.getComponent(root) : null;
        if (comp && comp.switchTab) {
          comp.switchTab(tabId);
          return true;
        }
      }
      return false;
    }, tab.id);

    if (!clicked) {
      // Click via sidebar menu item
      const selector = `.sidebar-nav li:has-text("${tab.label}")`;
      const navItem = await page.$(selector);
      if (navItem) {
        await navItem.click();
      } else {
        // Fallback search
        await page.evaluate((tabId) => {
          const links = Array.from(document.querySelectorAll('.sidebar-nav li'));
          for (const l of links) {
            if (l.getAttribute('title')?.toLowerCase().includes(tabId) || l.textContent?.toLowerCase().includes(tabId)) {
              l.click();
              break;
            }
          }
        }, tab.id);
      }
    }

    await page.waitForTimeout(1000);

    const screenshotPath = path.join(ARTIFACT_DIR, `tab_${tab.name}.png`);
    await page.screenshot({ path: screenshotPath });
    console.log(`Saved screenshot: tab_${tab.name}.png`);
  }

  await browser.close();
  console.log('All tab screenshots captured successfully!');
}

captureAllTabs().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
