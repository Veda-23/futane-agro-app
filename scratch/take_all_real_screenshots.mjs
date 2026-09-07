import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';
import { PDFDocument, rgb } from 'pdf-lib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const SNAP_DIR = path.join(__dirname, 'real_snapshots');
const OUTPUT_PDF = path.join(__dirname, 'Futane_Agro_ERP_All_Tabs_Visual_Report.pdf');

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

  console.log('📱 Login Step 1 Status:', loginRes.status);

  let userObj;
  if (loginRes.status === 'OTP_REQUIRED' || loginRes.status === 'OTP_SENT') {
    const otp = loginRes.tempOtp || '654321';
    console.log(`🔐 Verifying 2-Step OTP (${otp})...`);
    const verifyRes = await fetch('http://localhost:8081/api/users/login/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'SUPER_ADMIN', otp: otp })
    }).then(r => r.json());
    userObj = verifyRes;
  } else {
    userObj = loginRes;
  }

  console.log('✅ Received Valid User Session:', userObj.username, 'Role:', userObj.role);
  return userObj;
}

async function run() {
  const userSession = await getAuthToken();

  console.log('🚀 Launching Microsoft Edge (Headless)...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
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
  console.log('🎉 SUCCESS: Authenticated & Inside ERP Dashboard!');

  const screens = [];

  // Define All Main Tabs to capture
  const MAIN_TABS = [
    { name: '1. Executive Dashboard & KPI Hub', selectorText: 'Dashboard', id: '01_dashboard' },
    { name: '2. Manufacturing & Injection Molding Operations', selectorText: 'Production', id: '02_production' },
    { name: '3. Inventory & Raw Materials Warehouse', selectorText: 'Inventory', id: '03_inventory' },
    { name: '4. Parties, Suppliers & Customer Directory', selectorText: 'Parties', id: '04_parties' },
    { name: '5. Sales, Dispatches & Logistics', selectorText: 'Sales', id: '05_sales' },
    { name: '6. Invoices, GST Billing Hub & e-Way Bills', selectorText: 'Invoices', id: '06_invoices' },
    { name: '7. Financial Accounting, Ledgers & Banking', selectorText: 'Accounting', id: '07_accounting' },
    { name: '8. Quality Assurance & Lab Inspection', selectorText: 'Quality', id: '08_quality' },
    { name: '9. Security Audit Trail & Telemetry Logs', selectorText: 'Audit Logs', id: '09_audit_logs' }
  ];

  console.log('\n=============================================');
  console.log('📸 CAPTURING MAIN APPLICATION TABS');
  console.log('=============================================');

  for (let i = 0; i < MAIN_TABS.length; i++) {
    const tab = MAIN_TABS[i];
    console.log(`📸 [${i + 1}/${MAIN_TABS.length}] Navigating to: ${tab.name}...`);

    await page.evaluate((text) => {
      const items = Array.from(document.querySelectorAll('app-sidebar .nav-item, app-sidebar button, app-sidebar a, .nav-link'));
      const target = items.find(el => el.textContent.trim().toLowerCase().includes(text.toLowerCase()));
      if (target) target.click();
    }, tab.selectorText);

    await new Promise(r => setTimeout(r, 1500));

    const imgPath = path.join(SNAP_DIR, `${tab.id}.png`);
    await page.screenshot({ path: imgPath, fullPage: false });
    screens.push({ name: tab.name, imgPath });
    console.log(`   ✅ Saved: ${path.basename(imgPath)}`);
  }

  // Navigate to System Settings
  console.log('\n=============================================');
  console.log('⚙️ NAVIGATING TO SYSTEM SETTINGS');
  console.log('=============================================');

  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('app-sidebar .nav-item, app-sidebar button, app-sidebar a, .nav-link'));
    const settings = items.find(el => el.textContent.trim().toLowerCase().includes('setting'));
    if (settings) settings.click();
  });

  await new Promise(r => setTimeout(r, 2000));

  // Define All 11 Settings Subtabs
  const SETTINGS_SUBTABS = [
    { index: 0, name: 'Settings 1: Branding & Visual Identity System', id: 'settings_01_branding' },
    { index: 1, name: 'Settings 2: Multi-Company ERP, Banking & Invoice Designer', id: 'settings_02_billing' },
    { index: 2, name: 'Settings 3: ERP Business Rules, Tolerances & Round-off', id: 'settings_03_business_rules' },
    { index: 3, name: 'Settings 4: Department Directory & Teams', id: 'settings_04_teams' },
    { index: 4, name: 'Settings 5: Dynamic Extensible Custom Fields', id: 'settings_05_custom_fields' },
    { index: 5, name: 'Settings 6: Automated WhatsApp & Alert Dispatch Engine', id: 'settings_06_notifications' },
    { index: 6, name: 'Settings 7: Users Directory & Granular RBAC Permissions', id: 'settings_07_users' },
    { index: 7, name: 'Settings 8: Enterprise Feature Flags & AI Copilot', id: 'settings_08_feature_flags' },
    { index: 8, name: 'Settings 9: Developer Hub, API Gateways & SRE Wallboards', id: 'settings_09_developer' },
    { index: 9, name: 'Settings 10: JVM Telemetry, Cache & Database Backups', id: 'settings_10_governance' },
    { index: 10, name: 'Settings 11: Security & Change Password', id: 'settings_11_security' }
  ];

  console.log('📸 CAPTURING ALL 11 SETTINGS SUBTABS...');

  for (let i = 0; i < SETTINGS_SUBTABS.length; i++) {
    const sub = SETTINGS_SUBTABS[i];
    console.log(`📸 [${i + 1}/${SETTINGS_SUBTABS.length}] Navigating to: ${sub.name}...`);

    await page.evaluate((idx) => {
      const subBtns = Array.from(document.querySelectorAll('.subnav-item-btn'));
      if (subBtns[idx]) subBtns[idx].click();
    }, sub.index);

    await new Promise(r => setTimeout(r, 1200));

    const imgPath = path.join(SNAP_DIR, `${sub.id}.png`);
    await page.screenshot({ path: imgPath, fullPage: false });
    screens.push({ name: sub.name, imgPath });
    console.log(`   ✅ Saved: ${path.basename(imgPath)}`);
  }

  await browser.close();
  console.log('\n🎉 ALL REAL SCREENS CAPTURED! Compiling Visual PDF Report...');

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

  coverPage.drawText('Complete Enterprise Visual Layout & Tab Inspection Report', {
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

  coverPage.drawText(`Total Captured Views: ${screens.length} Screens (9 Core ERP Modules + 11 System Settings Subtabs)`, {
    x: 60,
    y: 310,
    size: 12,
    color: rgb(0.58, 0.64, 0.72)
  });

  coverPage.drawText('Visual Inspection Coverage:', {
    x: 60,
    y: 260,
    size: 13,
    color: rgb(0.97, 0.98, 0.99)
  });

  coverPage.drawText('• Main Modules: Dashboard, Production, Inventory, Parties, Sales, Invoices, Accounting, Quality, Audit Logs', {
    x: 60,
    y: 235,
    size: 10.5,
    color: rgb(0.79, 0.83, 0.88)
  });

  coverPage.drawText('• Settings Subtabs: Branding, Multi-Company, Business Rules, Teams, Custom Fields, WhatsApp Engine, Users, Feature Flags, Developer Hub, Governance, Password', {
    x: 60,
    y: 215,
    size: 10.5,
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
  fs.writeFileSync(OUTPUT_PDF, pdfBytes);
  console.log(`\n🎉 PDF GENERATED SUCCESSFULLY: ${OUTPUT_PDF} (${(pdfBytes.length / (1024 * 1024)).toFixed(2)} MB)`);
}

run().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
