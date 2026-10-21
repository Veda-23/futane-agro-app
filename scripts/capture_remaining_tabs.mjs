import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('../frontend/node_modules/playwright');
import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const SCREENSHOT_DIR = path.resolve('docs', 'screenshots');

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

const REMAINING_TABS = [
  { key: 'vendors', file: '08_vendor_suppliers.png', title: 'Polymer Raw Material Suppliers' },
  { key: 'sales', file: '09_sales_orders.png', title: 'Sales Orders & Dispatch Planning' },
  { key: 'dispatch', file: '10_dispatch_logistics.png', title: 'Logistics Dispatch & Gate Pass' },
  { key: 'transports', file: '11_fleet_transports.png', title: 'Fleet Transport & Freight Registry' },
  { key: 'drivers', file: '12_driver_registry.png', title: 'Commercial Driver Registry' },
  { key: 'parties', file: '13_crm_customers.png', title: 'Customer & Distributor Directory' },
  { key: 'payments', file: '14_payments_collections.png', title: 'Customer Payments & Receipts' },
  { key: 'invoices', file: '15_gst_invoices.png', title: 'GST Tax Invoices & E-Way Bills' },
  { key: 'billinghub', file: '16_billing_hub.png', title: 'Consolidated Billing Hub' },
  { key: 'bank', file: '17_bank_accounts.png', title: 'Treasury Banking & Cash Ledger' },
  { key: 'expenses', file: '18_expense_tracker.png', title: 'Factory Expense Vouchers' },
  { key: 'salaries', file: '19_payroll_salaries.png', title: 'Workforce Payroll & Salaries' },
  { key: 'employees', file: '20_hr_employees.png', title: 'HR Employee Directory' },
  { key: 'reports', file: '21_executive_reports.png', title: 'Executive BI Management Reports' },
  { key: 'analytics', file: '22_production_analytics.png', title: 'Power BI Style Executive Analytics' },
  { key: 'audit-logs', file: '23_security_audit_logs.png', title: 'Zero-Trust Security Audit Trail' },
  { key: 'settings', file: '24_settings_control_center.png', title: 'Settings & Multi-Tenant White-Label' }
];

async function captureOne(auth, tab) {
  const storageState = {
    cookies: [{ name: 'erp_session_cookie', value: auth.token, domain: '127.0.0.1', path: '/' }],
    origins: [{
      origin: 'http://127.0.0.1:4300',
      localStorage: [
        { name: 'user', value: JSON.stringify(auth) },
        { name: 'jwtToken', value: auth.token }
      ]
    }]
  };

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--disable-web-security']
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      storageState
    });

    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4300', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Switch tab
    await page.evaluate((k) => {
      const item = document.querySelector(`li[data-tab="${k}"]`);
      if (item) item.click();
    }, tab.key);

    await page.waitForTimeout(1400);

    const outPath = path.join(SCREENSHOT_DIR, tab.file);
    await page.screenshot({ path: outPath });
    const buf = fs.readFileSync(outPath);
    const hash = crypto.createHash('md5').update(buf).digest('hex').substring(0, 8);
    console.log(`✓ ${tab.file} (${buf.length} bytes, md5: ${hash})`);
    return { file: tab.file, hash, size: buf.length };
  } finally {
    await browser.close().catch(() => {});
  }
}

async function run() {
  console.log('Authenticating...');
  const l1 = await httpPost('/api/users/login', { username: 'SUPER_ADMIN', password: 'superadmin123' });
  const auth = await httpPost('/api/users/login/verify', { username: l1.username, otp: l1.tempOtp });
  console.log('✓ Auth ready');

  for (let i = 0; i < REMAINING_TABS.length; i++) {
    const tab = REMAINING_TABS[i];
    console.log(`[${i + 7}/23] Capturing: ${tab.key}...`);
    try {
      await captureOne(auth, tab);
    } catch (e) {
      console.warn(`Retry on ${tab.key}: ${e.message}`);
      await new Promise(r => setTimeout(r, 1000));
      try {
        await captureOne(auth, tab);
      } catch (e2) {
        console.error(`Failed ${tab.key}: ${e2.message}`);
      }
    }
  }

  console.log('=== REMAINING TABS COMPLETE ===');
}

run().catch(console.error);
