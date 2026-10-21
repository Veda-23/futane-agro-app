import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('../frontend/node_modules/playwright');
import http from 'http';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('docs', 'screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function httpPost(urlPath, body) {
  return new Promise((resolve, reject) => {
    const dataStr = JSON.stringify(body);
    const req = http.request(`http://127.0.0.1:4300${urlPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataStr)
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(dataStr);
    req.end();
  });
}

let browserInstance = null;
async function getBrowser() {
  if (!browserInstance || !browserInstance.isConnected()) {
    browserInstance = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--disable-web-security']
    });
  }
  return browserInstance;
}

async function captureAllClean() {
  console.log('1. Authenticating as SUPER_ADMIN...');
  const l1 = await httpPost('/api/users/login', { username: 'SUPER_ADMIN', password: 'superadmin123' });
  const auth = await httpPost('/api/users/login/verify', { username: l1.username, otp: l1.tempOtp });
  console.log('✓ Authenticated as:', auth.username);

  const tabList = [
    { key: 'dashboard', file: '02_dashboard_overview.png', name: 'Executive Dashboard' },
    { key: 'billinghub', file: '03_billing_hub.png', name: 'Billing Hub' },
    { key: 'invoices', file: '04_gst_invoices.png', name: 'GST Invoices' },
    { key: 'sales', file: '05_sales_orders.png', name: 'Sales Orders' },
    { key: 'inventory', file: '06_inventory_management.png', name: 'Finished Inventory' },
    { key: 'raw-materials', file: '07_raw_materials.png', name: 'Raw Materials Granules' },
    { key: 'production', file: '08_production_ppd.png', name: 'Daily Production PPD' },
    { key: 'monthly-production', file: '09_monthly_production_ppm.png', name: 'Monthly Production PPM' },
    { key: 'machines', file: '10_machine_maintenance.png', name: 'Injection Machines' },
    { key: 'dispatch', file: '11_dispatch_logistics.png', name: 'Dispatch & Gate Passes' },
    { key: 'transports', file: '12_fleet_transports.png', name: 'Fleet Transports' },
    { key: 'drivers', file: '13_driver_registry.png', name: 'Driver Registry' },
    { key: 'parties', file: '14_crm_customers.png', name: 'Customer Directory' },
    { key: 'vendors', file: '15_vendor_suppliers.png', name: 'Polymer Vendors' },
    { key: 'payments', file: '16_payments_collections.png', name: 'Payment Receipts' },
    { key: 'expenses', file: '17_expense_tracker.png', name: 'Expense Vouchers' },
    { key: 'bank', file: '18_bank_accounts.png', name: 'Treasury Banking' },
    { key: 'employees', file: '19_hr_employees.png', name: 'Employee Staff' },
    { key: 'salaries', file: '20_payroll_salaries.png', name: 'Payroll & Salaries' },
    { key: 'reports', file: '21_executive_reports.png', name: 'Executive Reports' },
    { key: 'analytics', file: '22_production_analytics.png', name: 'Analytics & KPIs' },
    { key: 'audit-logs', file: '23_security_audit_logs.png', name: 'Security Audit Trail' },
    { key: 'settings', file: '24_settings_control_center.png', name: 'Settings & White-Label' }
  ];

  for (const t of tabList) {
    let page;
    try {
      console.log(`[SNAP] Capturing tab: ${t.key} (${t.name})...`);
      const browser = await getBrowser();
      page = await browser.newPage({ viewport: { width: 1366, height: 768 } });

      await page.goto('http://127.0.0.1:4300', { waitUntil: 'domcontentloaded' });
      await page.evaluate(({ a, tabKey }) => {
        localStorage.setItem('user', JSON.stringify(a));
        localStorage.setItem('jwtToken', a.token);
        sessionStorage.setItem('user', JSON.stringify(a));
        sessionStorage.setItem('jwtToken', a.token);
        sessionStorage.setItem('activeTab', tabKey);
        document.cookie = `erp_session_cookie=${a.token}; path=/; SameSite=Strict`;
      }, { a: auth, tabKey: t.key });

      await page.goto('http://127.0.0.1:4300', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      // Trigger tab click
      await page.evaluate((tabKey) => {
        const item = document.querySelector(`li[data-tab="${tabKey}"]`);
        if (item) item.click();
      }, t.key);

      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, t.file) });
      console.log(`✓ ${t.file} SAVED`);
    } catch (err) {
      console.log(`Error on ${t.key}: ${err.message}`);
    } finally {
      if (page) await page.close().catch(() => {});
    }
  }

  if (browserInstance && browserInstance.isConnected()) {
    await browserInstance.close();
  }
  console.log('ALL TABS CAPTURED CLEANLY!');
}

captureAllClean().catch(console.error);
