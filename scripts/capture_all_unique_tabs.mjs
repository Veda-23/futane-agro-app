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
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ raw: data });
        }
      });
    });
    req.on('error', reject);
    req.write(dataStr);
    req.end();
  });
}

async function captureAllTabs() {
  console.log('1. Authenticating as SUPER_ADMIN to ensure all tabs are accessible...');
  const l1 = await httpPost('/api/users/login', { username: 'SUPER_ADMIN', password: 'superadmin123' });
  const authSession = await httpPost('/api/users/login/verify', { username: l1.username, otp: l1.tempOtp });
  console.log('✓ Authenticated as:', authSession.username, authSession.role);

  console.log('2. Launching Chromium...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    deviceScaleFactor: 1
  });
  const page = await context.newPage();

  // 1. Login screen
  console.log('Capturing login screen...');
  await page.goto('http://127.0.0.1:4300', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_login_portal.png') });
  console.log('✓ 01_login_portal.png');

  // Inject session
  await page.evaluate((auth) => {
    localStorage.setItem('user', JSON.stringify(auth));
    localStorage.setItem('jwtToken', auth.token);
    sessionStorage.setItem('user', JSON.stringify(auth));
    sessionStorage.setItem('jwtToken', auth.token);
    document.cookie = `erp_session_cookie=${auth.token}; path=/; SameSite=Strict`;
  }, authSession);

  // Reload to Dashboard
  await page.goto('http://127.0.0.1:4300', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_dashboard_overview.png') });
  console.log('✓ 02_dashboard_overview.png');

  // Exact list of all tabs matching sidebar.component.html
  const tabs = [
    { key: 'billinghub', file: '03_billing_hub.png', name: 'Billing Hub' },
    { key: 'invoices', file: '04_gst_invoices.png', name: 'GST Invoices' },
    { key: 'sales', file: '05_sales_orders.png', name: 'Sales Orders' },
    { key: 'inventory', file: '06_inventory_management.png', name: 'Finished Inventory' },
    { key: 'raw-materials', file: '07_raw_materials.png', name: 'Raw Materials' },
    { key: 'production', file: '08_production_center.png', name: 'Daily Production PPD' },
    { key: 'monthly-production', file: '08b_monthly_production.png', name: 'Monthly Production PPM' },
    { key: 'machines', file: '09_machine_maintenance.png', name: 'Injection Machines' },
    { key: 'dispatch', file: '10_dispatch_logistics.png', name: 'Dispatch & Gate Pass' },
    { key: 'transports', file: '11_fleet_transports.png', name: 'Fleet Transports' },
    { key: 'drivers', file: '11b_driver_registry.png', name: 'Drivers Registry' },
    { key: 'parties', file: '12_crm_customers.png', name: 'Customer Directory' },
    { key: 'vendors', file: '13_vendor_suppliers.png', name: 'Polymer Vendors' },
    { key: 'payments', file: '13b_payments_collections.png', name: 'Payments Collection' },
    { key: 'expenses', file: '13c_expense_tracker.png', name: 'Expense Vouchers' },
    { key: 'bank', file: '13d_bank_accounts.png', name: 'Bank Accounts' },
    { key: 'employees', file: '14_hr_employees.png', name: 'Employees Directory' },
    { key: 'salaries', file: '15_payroll_salaries.png', name: 'Payroll & Salaries' },
    { key: 'reports', file: '15b_executive_reports.png', name: 'Executive Reports' },
    { key: 'analytics', file: '15c_production_analytics.png', name: 'Analytics & KPIs' },
    { key: 'audit-logs', file: '15d_security_audit_logs.png', name: 'Security Audit Trail' },
    { key: 'settings', file: '16_settings_control_center.png', name: 'Settings & Branding' }
  ];

  for (const t of tabs) {
    console.log(`Navigating to tab: ${t.key} (${t.name})...`);
    try {
      // Direct click on sidebar li[data-tab="..."]
      const clicked = await page.evaluate((key) => {
        const item = document.querySelector(`li[data-tab="${key}"]`);
        if (item) {
          item.click();
          return true;
        }
        // Fallback: search text
        const allLis = Array.from(document.querySelectorAll('.sidebar li, .sidebar a, .sidebar button'));
        const matched = allLis.find(el => el.textContent && el.textContent.toLowerCase().includes(key.replace('-', ' ')));
        if (matched) {
          matched.click();
          return true;
        }
        return false;
      }, t.key);

      if (!clicked) {
        console.log(`[WARN] Could not find li[data-tab="${t.key}"], trying page.click`);
        await page.click(`li[data-tab="${t.key}"]`, { timeout: 3000 }).catch(() => {});
      }

      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, t.file) });
      console.log(`✓ Saved ${t.file}`);
    } catch (e) {
      console.log(`Error snapping ${t.key}: ${e.message}`);
    }
  }

  // Also capture database UI
  console.log('Capturing PostgreSQL Database Studio...');
  const dbPage = await context.newPage();
  try {
    const { spawn } = require('child_process');
    const dbServer = spawn('node', ['scripts/postgres-ui-server.mjs'], { stdio: 'ignore' });
    await page.waitForTimeout(1500);
    await dbPage.goto('http://127.0.0.1:5433', { waitUntil: 'domcontentloaded' });
    await dbPage.waitForTimeout(1200);
    await dbPage.screenshot({ path: path.join(SCREENSHOT_DIR, '17_database_studio.png') });
    console.log('✓ 17_database_studio.png');
    dbServer.kill();
  } catch (e) {
    console.log('Database studio capture note:', e.message);
  }

  await browser.close();
  console.log('All unique tab snapshots captured successfully!');
}

captureAllTabs().catch(console.error);
