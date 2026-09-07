import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const SNAP_DIR = path.join(__dirname, 'all_31_scrollable_snapshots');
const OUTPUT_PDF_SCRATCH = path.join(__dirname, 'Futane_Agro_ERP_All_31_Tabs_Scrollable_Visual_Report.pdf');
const OUTPUT_PDF_DOCS = path.join(__dirname, '..', 'docs', 'reports', 'Futane_Agro_ERP_All_31_Tabs_Scrollable_Visual_Report.pdf');
const OUTPUT_PDF_ARTIFACT = 'C:\\Users\\Vedant\\.gemini\\antigravity-ide\\brain\\c1c6338c-1671-4e87-b480-7a9ae9928b58\\Futane_Agro_ERP_All_31_Tabs_Scrollable_Visual_Report.pdf';
const ARTIFACT_DIR = 'C:\\Users\\Vedant\\.gemini\\antigravity-ide\\brain\\c1c6338c-1671-4e87-b480-7a9ae9928b58';
const BASE_URL = 'http://localhost:8081';

if (!fs.existsSync(SNAP_DIR)) {
  fs.mkdirSync(SNAP_DIR, { recursive: true });
}

async function getAuthToken() {
  console.log(`🔑 Authenticating via Backend UAT API at ${BASE_URL} (SUPER_ADMIN)...`);
  const loginRes = await fetch(`${BASE_URL}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'SUPER_ADMIN', password: 'superadmin123' })
  }).then(r => r.json());

  let userObj;
  if (loginRes.status === 'OTP_REQUIRED' || loginRes.status === 'OTP_SENT') {
    const otp = loginRes.tempOtp || '654321';
    const verifyRes = await fetch(`${BASE_URL}/api/users/login/verify`, {
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
    protocolTimeout: 180000,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1500,1000']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1500, height: 1000, deviceScaleFactor: 1.5 });

  console.log(`🌐 Loading Futane Agro ERP at ${BASE_URL} & Injecting Session...`);
  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });

  // Inject authentication into storage
  await page.evaluate((user, baseUrl) => {
    localStorage.setItem('user', JSON.stringify(user));
    sessionStorage.setItem('user', JSON.stringify(user));
    if (user.token) {
      localStorage.setItem('jwtToken', user.token);
      sessionStorage.setItem('jwtToken', user.token);
      document.cookie = `erp_session_cookie=${user.token}; path=/; SameSite=Strict`;
    }
    sessionStorage.setItem('activeTab', 'dashboard');
    window.location.href = `${baseUrl}/`;
  }, userSession, BASE_URL);

  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
  await page.waitForSelector('.app-container', { timeout: 15000 });
  console.log('🎉 SUCCESS: Authenticated & Inside ERP Application!');

  const screens = [];

  console.log('\n======================================================');
  console.log('📸 CAPTURING ALL 21 PRIMARY ERP OPERATIONAL SCREENS (FULL SCROLLABLE HEIGHT)');
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

        const links = Array.from(document.querySelectorAll('app-sidebar .nav-item, app-sidebar button, app-sidebar a, .nav-link, app-sidebar li'));
        const target = links.find(l => l.textContent.toLowerCase().includes(tabKey.replace('-', ' ')) || l.textContent.toLowerCase().includes(tabKey));
        if (target) target.click();
      }, item.tab);

      // Wait for animations and data rendering
      await new Promise(r => setTimeout(r, 1200));

      // Scroll to trigger any lazy views and ensure full layout height
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await new Promise(r => setTimeout(r, 400));
      await page.evaluate(() => {
        window.scrollTo(0, 0);
      });
      await new Promise(r => setTimeout(r, 300));

      const imgPath = path.join(SNAP_DIR, `${item.file}.png`);
      await page.screenshot({ path: imgPath, fullPage: true });
      screens.push({ name: item.name, imgPath });
      console.log(`   ✅ Saved Full-Page: ${path.basename(imgPath)}`);
    } catch (err) {
      console.warn(`   ⚠️ Warning on ${item.name}: ${err.message}`);
    }
  }

  console.log('\n======================================================');
  console.log('⚙️ SWITCHING TO SYSTEM SETTINGS & CAPTURING 10 SUBTABS (FULL SCROLLABLE HEIGHT)');
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
    const links = Array.from(document.querySelectorAll('app-sidebar .nav-item, app-sidebar button, app-sidebar a, app-sidebar li'));
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

      const subBtns = Array.from(document.querySelectorAll('.settings-nav-pill, .subnav-item-btn'));
      const target = subBtns.find(b => b.textContent.toLowerCase().includes(subKey.replace('_', ' ').replace('-', ' ')));
      if (target) target.click();
    }, item.sub);

    await new Promise(r => setTimeout(r, 1200));

    // Scroll to bottom and top
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await new Promise(r => setTimeout(r, 400));
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await new Promise(r => setTimeout(r, 300));

    const imgPath = path.join(SNAP_DIR, `${item.file}.png`);
    await page.screenshot({ path: imgPath, fullPage: true });
    screens.push({ name: item.name, imgPath });
    console.log(`   ✅ Saved Full-Page: ${path.basename(imgPath)}`);
  }

  await browser.close();
  console.log(`\n🎉 ALL ${screens.length} FULL-PAGE REAL SCREENS CAPTURED! Compiling Visual PDF Report...`);

  // Build Adaptive Multi-Height PDF Document
  const pdfDoc = await PDFDocument.create();
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // 1. Cover Page
  const coverPage = pdfDoc.addPage([1000, 700]);
  coverPage.drawRectangle({
    x: 0,
    y: 0,
    width: 1000,
    height: 700,
    color: rgb(0.06, 0.09, 0.16) // #0f172a
  });

  // Top accent bar
  coverPage.drawRectangle({
    x: 0,
    y: 690,
    width: 1000,
    height: 10,
    color: rgb(0.96, 0.62, 0.07) // #f59e0b
  });

  coverPage.drawText('FUTANE AGRO ERP [UAT 2026]', {
    x: 60,
    y: 580,
    size: 32,
    font: helveticaBold,
    color: rgb(0.96, 0.62, 0.07)
  });

  coverPage.drawText('Complete Full-Page Scrollable Visual Inspection Report', {
    x: 60,
    y: 530,
    size: 22,
    font: helveticaBold,
    color: rgb(0.97, 0.98, 0.99)
  });

  coverPage.drawText('Comprehensive Top-to-Bottom Verification of All 31 ERP Screens & Subtabs', {
    x: 60,
    y: 495,
    size: 14,
    font: helveticaFont,
    color: rgb(0.58, 0.64, 0.72)
  });

  // Info Box
  coverPage.drawRectangle({
    x: 60,
    y: 280,
    width: 880,
    height: 180,
    color: rgb(0.12, 0.16, 0.23)
  });

  coverPage.drawText(`Generated on: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`, {
    x: 80,
    y: 420,
    size: 12,
    font: helveticaFont,
    color: rgb(0.85, 0.90, 0.95)
  });

  coverPage.drawText(`Total Captured Views: ${screens.length} Screens (21 Operational Modules + 10 System Settings Subtabs)`, {
    x: 80,
    y: 390,
    size: 12,
    font: helveticaBold,
    color: rgb(0.96, 0.62, 0.07)
  });

  coverPage.drawText('Full Scrollable Capture Mode: Entire DOM scroll height captured without clipping.', {
    x: 80,
    y: 360,
    size: 12,
    font: helveticaFont,
    color: rgb(0.85, 0.90, 0.95)
  });

  coverPage.drawText('Visual Coverage Overview:', {
    x: 60,
    y: 240,
    size: 14,
    font: helveticaBold,
    color: rgb(0.97, 0.98, 0.99)
  });

  coverPage.drawText('• Operations (21): Dashboard, Daily Production, Monthly Prod, Parties, Sales Orders, Payments, Raw Materials, Vendors, Crates Inventory, Employees, Salaries, Transports, Drivers, Invoices, Reports, Machines, Dispatch, Expenses, Banking, PowerBI Analytics, Audit Logs', {
    x: 60,
    y: 210,
    size: 10,
    font: helveticaFont,
    color: rgb(0.79, 0.83, 0.88)
  });

  coverPage.drawText('• Settings (10): Branding & Themes, Business Rules & Invoices, Teams & Depts, Extensible Fields, WhatsApp & Alerts, Users & RBAC Matrix, Feature Flags, Developer Hub, Governance & Cache, Security / Password Reset', {
    x: 60,
    y: 180,
    size: 10,
    font: helveticaFont,
    color: rgb(0.79, 0.83, 0.88)
  });

  // 2. Add each authentic full-page screenshot
  for (let i = 0; i < screens.length; i++) {
    const item = screens[i];
    if (fs.existsSync(item.imgPath)) {
      const imgBytes = fs.readFileSync(item.imgPath);
      const embeddedImg = await pdfDoc.embedPng(imgBytes);
      
      const imgNaturalWidth = embeddedImg.width;
      const imgNaturalHeight = embeddedImg.height;

      // Fit into a clean standard width (e.g. 1000pt)
      const pdfPageWidth = 1000;
      const margin = 24;
      const bannerHeight = 44;
      const contentWidth = pdfPageWidth - (margin * 2);
      
      // Calculate scaled height based on natural aspect ratio
      const contentHeight = contentWidth * (imgNaturalHeight / imgNaturalWidth);
      const pdfPageHeight = contentHeight + bannerHeight + (margin * 2);

      const page = pdfDoc.addPage([pdfPageWidth, pdfPageHeight]);

      // Top header banner
      page.drawRectangle({
        x: 0,
        y: pdfPageHeight - bannerHeight,
        width: pdfPageWidth,
        height: bannerHeight,
        color: rgb(0.06, 0.09, 0.16)
      });

      page.drawText(`[${i + 1}/${screens.length}] ${item.name}`, {
        x: margin,
        y: pdfPageHeight - bannerHeight + 15,
        size: 14,
        font: helveticaBold,
        color: rgb(0.97, 0.98, 0.99)
      });

      page.drawText('Futane Agro ERP [Full-Page Capture]', {
        x: pdfPageWidth - 230,
        y: pdfPageHeight - bannerHeight + 15,
        size: 11,
        font: helveticaFont,
        color: rgb(0.96, 0.62, 0.07)
      });

      // Draw the full scrollable screenshot
      page.drawImage(embeddedImg, {
        x: margin,
        y: margin,
        width: contentWidth,
        height: contentHeight
      });
    }
  }

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(OUTPUT_PDF_SCRATCH, pdfBytes);
  try {
    fs.mkdirSync(path.dirname(OUTPUT_PDF_DOCS), { recursive: true });
    fs.writeFileSync(OUTPUT_PDF_DOCS, pdfBytes);
  } catch (e) {}
  try {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
    fs.writeFileSync(OUTPUT_PDF_ARTIFACT, pdfBytes);
  } catch (e) {}

  // Also copy all screenshots to artifact directory
  for (const s of screens) {
    try {
      const dest = path.join(ARTIFACT_DIR, path.basename(s.imgPath));
      fs.copyFileSync(s.imgPath, dest);
    } catch (e) {}
  }

  console.log(`\n🎉 PDF GENERATED SUCCESSFULLY:`);
  console.log(`   📄 Scratch : ${OUTPUT_PDF_SCRATCH} (${(pdfBytes.length / (1024 * 1024)).toFixed(2)} MB)`);
  console.log(`   📄 Docs    : ${OUTPUT_PDF_DOCS}`);
  console.log(`   📄 Artifact: ${OUTPUT_PDF_ARTIFACT}`);
}

run().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
