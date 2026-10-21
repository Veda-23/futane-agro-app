import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('../frontend/node_modules/playwright');
import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

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
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(dataStr);
    req.end();
  });
}

const TABS = [
  { key: 'dashboard', file: '02_dashboard_overview.png', title: 'Executive Operations Dashboard' },
  { key: 'production', file: '03_production_ppd.png', title: 'Daily Production PPD (500ml, 1L, 2L)' },
  { key: 'monthly-production', file: '04_monthly_production_ppm.png', title: 'Monthly Production PPM Targets' },
  { key: 'inventory', file: '05_inventory_management.png', title: 'Finished Goods Crate Inventory' },
  { key: 'machines', file: '06_machine_maintenance.png', title: 'Injection Molding Machines & Molds' },
  { key: 'raw-materials', file: '07_raw_materials.png', title: 'Raw Materials & Polymer Granules' },
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

async function run() {
  console.log('=== FUTANE AGRO VERIFIED TAB CAPTURE ENGINE ===');

  // 1. Authenticate with backend REST API
  console.log('Authenticating with backend REST API...');
  const l1 = await httpPost('/api/users/login', { username: 'SUPER_ADMIN', password: 'superadmin123' });
  const auth = await httpPost('/api/users/login/verify', { username: l1.username, otp: l1.tempOtp });
  console.log('✓ Token acquired for SUPER_ADMIN');

  // Prepare storage state
  const storageState = {
    cookies: [
      {
        name: 'erp_session_cookie',
        value: auth.token,
        domain: '127.0.0.1',
        path: '/'
      }
    ],
    origins: [
      {
        origin: 'http://127.0.0.1:4300',
        localStorage: [
          { name: 'user', value: JSON.stringify(auth) },
          { name: 'jwtToken', value: auth.token }
        ]
      }
    ]
  };

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--disable-web-security']
  });

  // Capture Login Screen First
  console.log('[0/23] Capturing 01_login_portal.png...');
  const blankContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const loginPage = await blankContext.newPage();
  await loginPage.goto('http://127.0.0.1:4300', { waitUntil: 'domcontentloaded' });
  await loginPage.waitForTimeout(600);
  await loginPage.screenshot({ path: path.join(SCREENSHOT_DIR, '01_login_portal.png') });
  console.log('✓ 01_login_portal.png saved');
  await blankContext.close();

  // Create single authenticated context for all tabs
  console.log('Initializing Authenticated Browser Session...');
  const authContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    storageState
  });

  const page = await authContext.newPage();
  await page.goto('http://127.0.0.1:4300', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  const hashes = new Map();
  const captured = [];

  for (let i = 0; i < TABS.length; i++) {
    const tab = TABS[i];
    console.log(`[${i + 1}/${TABS.length}] Navigating to: ${tab.key} (${tab.title})...`);

    try {
      // Click tab element directly
      await page.evaluate((tabKey) => {
        const item = document.querySelector(`li[data-tab="${tabKey}"]`);
        if (item) {
          item.click();
        }
      }, tab.key);

      // Wait for table / DOM render
      await page.waitForTimeout(1200);

      const activeTabFound = await page.evaluate(() => {
        const active = document.querySelector('li.active');
        return active ? active.getAttribute('data-tab') : 'unknown';
      });

      const outPath = path.join(SCREENSHOT_DIR, tab.file);
      await page.screenshot({ path: outPath });

      const buf = fs.readFileSync(outPath);
      const hash = crypto.createHash('md5').update(buf).digest('hex');

      console.log(`✓ ${tab.file} (${buf.length} bytes, activeInDom: ${activeTabFound}, md5: ${hash.substring(0, 8)})`);

      if (hashes.has(hash)) {
        console.warn(`⚠️ WARNING: Duplicate screenshot detected! Matches ${hashes.get(hash)}`);
      } else {
        hashes.set(hash, tab.file);
      }
      captured.push({ file: tab.file, size: buf.length, active: activeTabFound, hash });
    } catch (err) {
      console.error(`Error on ${tab.key}:`, err.message);
    }
  }

  await authContext.close();
  await browser.close();

  console.log(`\n========================================`);
  console.log(`ALL TABS CAPTURED!`);
  console.log(`Total tabs captured: ${captured.length} of ${TABS.length}`);
  console.log(`Unique hashes: ${hashes.size} of ${captured.length}`);
  console.log(`========================================`);
}

run().catch(console.error);
