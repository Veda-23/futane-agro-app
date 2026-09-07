import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';
import { PDFDocument, rgb } from 'pdf-lib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const SNAP_DIR = path.join(__dirname, 'all_31_real_snapshots');
const OUTPUT_PDF_SCRATCH = path.join(__dirname, 'Futane_Agro_ERP_All_31_Tabs_Visual_Report.pdf');
const OUTPUT_PDF_ROOT = path.join(__dirname, '..', 'Futane_Agro_ERP_All_31_Tabs_Visual_Report.pdf');
const OUTPUT_PDF_ARTIFACT = 'C:\\Users\\Vedant\\.gemini\\antigravity-ide\\brain\\fdd0d5e2-b9ea-49ba-889e-e88204822640\\Futane_Agro_ERP_All_31_Tabs_Visual_Report.pdf';

if (!fs.existsSync(SNAP_DIR)) {
  fs.mkdirSync(SNAP_DIR, { recursive: true });
}

async function getAuthToken() {
  console.log('🔑 Authenticating via Backend UAT API (SUPER_ADMIN)...');
  const loginRes = await fetch('http://localhost:8081/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'SUPER_ADMIN', password: 'superadmin123' })
  }).then(r => r.json());

  let userObj;
  if (loginRes.status === 'OTP_REQUIRED' || loginRes.status === 'OTP_SENT') {
    const otp = loginRes.tempOtp || '654321';
    const verifyRes = await fetch('http://localhost:8081/api/users/login/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'SUPER_ADMIN', otp: otp })
    }).then(r => r.json());
    userObj = verifyRes;
  } else {
    userObj = loginRes;
  }

  console.log('✅ Authenticated User:', userObj.username, 'Role:', userObj.role);
  return userObj;
}

const ALL_MAIN_TABS = [
  { tab: 'dashboard', name: '1. Executive KPI Command Center', file: '01_dashboard' },
  { tab: 'production', name: '2. Daily Manufacturing & Shift Production', file: '02_production' },
  { tab: 'monthly-production', name: '3. Monthly Production Performance', file: '03_monthly_production' },
  { tab: 'parties', name: '4. Parties, Wholesalers & Distributors Directory', file: '04_parties' },
  { tab: 'sales', name: '5. Sales Orders & Material Outward', file: '05_sales' },
  { tab: 'payments', name: '6. Customer Receipts & Payment Collections', file: '06_payments' },
  { tab: 'raw-materials', name: '7. Polymer Raw Materials & PP Granules', file: '07_raw_materials' },
  { tab: 'vendors', name: '8. Polymer Suppliers & Vendor Directory', file: '08_vendors' },
  { tab: 'inventory', name: '9. Finished Goods Crates Warehouse Stock', file: '09_inventory' },
  { tab: 'employees', name: '10. Factory Personnel & Staff Directory', file: '10_employees' },
  { tab: 'salaries', name: '11. Payroll & Staff Salary Vouchers', file: '11_salaries' },
  { tab: 'transports', name: '12. Freight & Logistics Transport Agencies', file: '12_transports' },
  { tab: 'drivers', name: '13. Commercial Vehicle Drivers Directory', file: '13_drivers' },
  { tab: 'invoices', name: '14. GST Billing Hub & Tax Invoices', file: '14_invoices' },
  { tab: 'reports', name: '15. Comprehensive Executive Business Reports', file: '15_reports' },
  { tab: 'machines', name: '16. Injection Molding Machines & OEE Metrics', file: '16_machines' },
  { tab: 'dispatch', name: '17. Outward Dispatches & Vehicle Gate Passes', file: '17_dispatch' },
  { tab: 'expenses', name: '18. Factory Operational Overhead Expenses', file: '18_expenses' },
  { tab: 'bank', name: '19. Bank Accounts, RTGS & Ledger Settlement', file: '19_bank' },
  { tab: 'analytics', name: '20. PowerBI Executive Analytics Suite', file: '20_analytics' },
  { tab: 'audit-logs', name: '21. Security Audit Trail & System Telemetry', file: '21_audit_logs' }
];

const ALL_SETTINGS_SUBTABS = [
  { sub: 'branding', name: 'Settings 1: Branding & Visual Identity System', file: 'settings_01_branding' },
  { sub: 'business-rules', name: 'Settings 2: Multi-Company ERP, Banking & Invoice Designer', file: 'settings_02_business_rules' },
  { sub: 'teams', name: 'Settings 3: Department Directory & Teams Structure', file: 'settings_03_teams' },
  { sub: 'custom_fields', name: 'Settings 4: Extensible Dynamic Schema Fields', file: 'settings_04_custom_fields' },
  { sub: 'notifications', name: 'Settings 5: WhatsApp & SMS Dispatch Engine', file: 'settings_05_notifications' },
  { sub: 'users', name: 'Settings 6: User Directory & Granular RBAC Matrix', file: 'settings_06_users' },
  { sub: 'features', name: 'Settings 7: Enterprise Feature Flags & AI Copilot', file: 'settings_07_features' },
  { sub: 'developer', name: 'Settings 8: Developer Hub, API Keys & Webhooks', file: 'settings_08_developer' },
  { sub: 'governance', name: 'Settings 9: JVM Telemetry, Cache & Backup', file: 'settings_09_governance' },
  { sub: 'password', name: 'Settings 10: Security & Master Password Reset', file: 'settings_10_password' }
];

async function run() {
  const userSession = await getAuthToken();

  console.log('🚀 Launching Microsoft Edge (Headless)...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    protocolTimeout: 120000,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1440,920']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 920, deviceScaleFactor: 1.5 });

  console.log('🌐 Loading Futane Agro ERP & Injecting Session...');
  await page.goto('http://localhost:4200/', { waitUntil: 'domcontentloaded' });

  // Inject authentication into storage
  await page.evaluate((user) => {
    localStorage.setItem('user', JSON.stringify(user));
    sessionStorage.setItem('user', JSON.stringify(user));
    if (user.token) {
      localStorage.setItem('jwtToken', user.token);
      sessionStorage.setItem('jwtToken', user.token);
      document.cookie = `erp_session_cookie=${user.token}; path=/; SameSite=Strict`;
    }
    sessionStorage.setItem('activeTab', 'dashboard');
    window.location.href = 'http://localhost:4200/';
  }, userSession);

  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
  await page.waitForSelector('.app-container', { timeout: 15000 });
  console.log('🎉 SUCCESS: Authenticated & Inside ERP Application!');

  const screens = [];

  console.log('\n======================================================');
  console.log('📸 CAPTURING ALL 21 PRIMARY ERP OPERATIONAL SCREENS');
  console.log('======================================================');

  for (let i = 0; i < ALL_MAIN_TABS.length; i++) {
    const item = ALL_MAIN_TABS[i];
    console.log(`📸 [${i + 1}/${ALL_MAIN_TABS.length}] Switching Tab -> ${item.name}...`);

    try {
      await page.evaluate((tabKey) => {
        try {
          const root = document.querySelector('app-root');
          if (window.ng && root) {
            const comp = window.ng.getComponent(root);
            if (comp && comp.switchTab) {
              comp.switchTab(tabKey);
              return;
            }
          }
        } catch (e) {}

        const links = Array.from(document.querySelectorAll('app-sidebar .nav-item, app-sidebar button, app-sidebar a, .nav-link'));
        const target = links.find(l => l.textContent.toLowerCase().includes(tabKey.replace('-', ' ')) || l.textContent.toLowerCase().includes(tabKey));
        if (target) target.click();
      }, item.tab);

      await new Promise(r => setTimeout(r, 1000));

      const imgPath = path.join(SNAP_DIR, `${item.file}.png`);
      await page.screenshot({ path: imgPath, fullPage: false, timeout: 15000 });
      screens.push({ name: item.name, imgPath });
      console.log(`   ✅ Saved: ${path.basename(imgPath)}`);
    } catch (err) {
      console.warn(`   ⚠️ Warning on ${item.name}: ${err.message}`);
    }
  }

  console.log('\n======================================================');
  console.log('⚙️ SWITCHING TO SYSTEM SETTINGS & CAPTURING 10 SUBTABS');
  console.log('======================================================');

  // Switch to settings
  await page.evaluate(() => {
    try {
      const root = document.querySelector('app-root');
      if (window.ng && root) {
        const comp = window.ng.getComponent(root);
        if (comp && comp.switchTab) {
          comp.switchTab('settings');
          return;
        }
      }
    } catch (e) {}
    const links = Array.from(document.querySelectorAll('app-sidebar .nav-item, app-sidebar button, app-sidebar a'));
    const s = links.find(l => l.textContent.toLowerCase().includes('setting'));
    if (s) s.click();
  });

  await new Promise(r => setTimeout(r, 1800));

  for (let i = 0; i < ALL_SETTINGS_SUBTABS.length; i++) {
    const item = ALL_SETTINGS_SUBTABS[i];
    console.log(`📸 [${i + 1}/${ALL_SETTINGS_SUBTABS.length}] Settings Subtab -> ${item.name}...`);

    await page.evaluate((subKey) => {
      try {
        const sComp = document.querySelector('app-settings');
        if (window.ng && sComp) {
          const comp = window.ng.getComponent(sComp);
          if (comp && comp.switchSubNav) {
            comp.switchSubNav(subKey);
            return;
          }
        }
      } catch (e) {}

      // Fallback DOM selector
      const subBtns = Array.from(document.querySelectorAll('.subnav-item-btn'));
      const target = subBtns.find(b => b.textContent.toLowerCase().includes(subKey.replace('_', ' ').replace('-', ' ')));
      if (target) target.click();
    }, item.sub);

    await new Promise(r => setTimeout(r, 1000));

    const imgPath = path.join(SNAP_DIR, `${item.file}.png`);
    await page.screenshot({ path: imgPath, fullPage: false });
    screens.push({ name: item.name, imgPath });
    console.log(`   ✅ Saved: ${path.basename(imgPath)}`);
  }

  await browser.close();
  console.log(`\n🎉 ALL ${screens.length} REAL SCREENS CAPTURED! Compiling Visual PDF Report...`);

  // Build PDF Document
  const pdfDoc = await PDFDocument.create();

  // 1. Cover Page
  const coverPage = pdfDoc.addPage([842, 595]); // A4 Landscape
  coverPage.drawRectangle({
    x: 0,
    y: 0,
    width: 842,
    height: 595,
    color: rgb(0.06, 0.09, 0.16) // #0f172a
  });

  coverPage.drawText('FUTANE AGRO ERP [UAT 2026]', {
    x: 60,
    y: 450,
    size: 28,
    color: rgb(0.96, 0.62, 0.07) // #f59e0b
  });

  coverPage.drawText('Complete Enterprise Visual Inspection Report (All 31 Screens)', {
    x: 60,
    y: 400,
    size: 18,
    color: rgb(0.97, 0.98, 0.99)
  });

  coverPage.drawText(`Generated on: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`, {
    x: 60,
    y: 340,
    size: 12,
    color: rgb(0.58, 0.64, 0.72)
  });

  coverPage.drawText(`Total Captured Views: ${screens.length} Screens (21 Operational Modules + 10 System Settings Subtabs)`, {
    x: 60,
    y: 310,
    size: 12,
    color: rgb(0.58, 0.64, 0.72)
  });

  coverPage.drawText('Visual Coverage Overview:', {
    x: 60,
    y: 260,
    size: 13,
    color: rgb(0.97, 0.98, 0.99)
  });

  coverPage.drawText('• Operations (21): Dashboard, Production, Monthly Prod, Parties, Sales, Payments, Raw Materials, Vendors, Inventory, HR Employees, Salaries, Transports, Drivers, Invoices, Reports, Machines, Dispatch, Expenses, Banking, PowerBI Analytics, Audit Trail', {
    x: 60,
    y: 235,
    size: 9.5,
    color: rgb(0.79, 0.83, 0.88)
  });

  coverPage.drawText('• Settings (10): Branding & Themes, Multi-Company & Invoice Designer, Teams & Depts, Custom Fields, WhatsApp Engine, Users & RBAC Matrix, Feature Flags, Developer Hub, JVM Governance, Password Reset', {
    x: 60,
    y: 215,
    size: 9.5,
    color: rgb(0.79, 0.83, 0.88)
  });

  // 2. Add each authentic screenshot as an A4 Landscape page
  for (let i = 0; i < screens.length; i++) {
    const item = screens[i];
    if (fs.existsSync(item.imgPath)) {
      const page = pdfDoc.addPage([842, 595]);
      
      // Top header banner
      page.drawRectangle({
        x: 0,
        y: 545,
        width: 842,
        height: 50,
        color: rgb(0.06, 0.09, 0.16)
      });

      page.drawText(`[${i + 1}/${screens.length}] ${item.name}`, {
        x: 30,
        y: 563,
        size: 13,
        color: rgb(0.97, 0.98, 0.99)
      });

      page.drawText('Futane Agro ERP', {
        x: 720,
        y: 563,
        size: 11,
        color: rgb(0.96, 0.62, 0.07)
      });

      const imgBytes = fs.readFileSync(item.imgPath);
      const embeddedImg = await pdfDoc.embedPng(imgBytes);
      
      const imgWidth = 782;
      const imgHeight = 495;

      page.drawImage(embeddedImg, {
        x: 30,
        y: 30,
        width: imgWidth,
        height: imgHeight
      });
    }
  }

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(OUTPUT_PDF_SCRATCH, pdfBytes);
  fs.writeFileSync(OUTPUT_PDF_ROOT, pdfBytes);
  try {
    fs.writeFileSync(OUTPUT_PDF_ARTIFACT, pdfBytes);
  } catch (e) {}
  console.log(`\n🎉 PDF GENERATED SUCCESSFULLY: ${OUTPUT_PDF_ROOT} (${(pdfBytes.length / (1024 * 1024)).toFixed(2)} MB)`);
}

run().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
