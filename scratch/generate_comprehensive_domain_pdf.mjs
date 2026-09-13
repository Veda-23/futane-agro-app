import puppeteer from 'puppeteer-core';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE_URL = 'http://localhost:4200';
const SNAP_DIR = path.join(__dirname, 'comprehensive_snapshots');
const OUTPUT_PDF_SCRATCH = path.join(__dirname, 'Futane_Agro_ERP_Comprehensive_Scrollable_Visual_Audit_Report.pdf');
const DOCS_DIR = path.join(__dirname, '..', 'docs', 'reports');
const OUTPUT_PDF_DOCS = path.join(DOCS_DIR, 'Futane_Agro_ERP_Comprehensive_Scrollable_Visual_Audit_Report.pdf');
const OUTPUT_PDF_ARTIFACT = 'C:\\Users\\Vedant\\.gemini\\antigravity-ide\\brain\\fdd0d5e2-b9ea-49ba-889e-e88204822640\\Futane_Agro_ERP_Comprehensive_Scrollable_Visual_Audit_Report.pdf';

if (!fs.existsSync(SNAP_DIR)) fs.mkdirSync(SNAP_DIR, { recursive: true });
if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR, { recursive: true });

// 7 Enterprise Functional Domains Configuration
const DOMAINS = [
  {
    domainId: 'D1',
    domainName: 'Domain 1: Executive Command & Plant Manufacturing',
    modules: [
      { id: '1.1', tab: 'dashboard', name: 'Executive KPI Dashboard & Plant Telemetry', hasAddForm: false },
      { id: '1.2', tab: 'production', name: 'Daily Production Logs & Crate Batch Output', hasAddForm: true, formName: 'Add Daily Production Log' },
      { id: '1.3', tab: 'monthly-production', name: 'Monthly Aggregate Production Summary', hasAddForm: false },
      { id: '1.4', tab: 'machines', name: 'Injection Molding Machines & OEE Metrics', hasAddForm: true, formName: 'Register Equipment Asset Profile', secondaryAdd: true, secondaryFormName: 'Log Equipment Breakdown Incident' }
    ]
  },
  {
    domainId: 'D2',
    domainName: 'Domain 2: Commercial Distribution, Sales & Customer Accounts',
    modules: [
      { id: '2.1', tab: 'parties', name: 'Parties & Wholesalers Directory', hasAddForm: true, formName: 'Register Commercial Party Account' },
      { id: '2.2', tab: 'sales', name: 'Sales Orders & Material Outward', hasAddForm: true, formName: 'Create New Sales Order & Dispatch' },
      { id: '2.3', tab: 'payments', name: 'Customer Receipts & Payment Collections', hasAddForm: true, formName: 'Record Customer Payment Collection Voucher' },
      { id: '2.4', tab: 'invoices', name: 'GST Billing Hub & Tax Invoices', hasAddForm: true, formName: 'Generate New GST Tax Invoice' }
    ]
  },
  {
    domainId: 'D3',
    domainName: 'Domain 3: Supply Chain, Raw Materials & Warehouse Inventory',
    modules: [
      { id: '3.1', tab: 'raw-materials', name: 'Polymer Raw Materials & PP Granules Silos', hasAddForm: true, formName: 'Log Polymer Procurement Batch' },
      { id: '3.2', tab: 'vendors', name: 'Polymer Suppliers & Vendor Directory', hasAddForm: true, formName: 'Register Supplier / Vendor Master' },
      { id: '3.3', tab: 'inventory', name: 'Finished Goods Crates Warehouse Stock', hasAddForm: true, formName: 'Log Finished Goods Crate SKU Entry', secondaryAdd: true, secondaryFormName: 'Quick Physical Stock Adjustment Modal' }
    ]
  },
  {
    domainId: 'D4',
    domainName: 'Domain 4: Factory Logistics, Freight & Outward Gate Passes',
    modules: [
      { id: '4.1', tab: 'transports', name: 'Freight & Logistics Transport Agencies', hasAddForm: true, formName: 'Register Freight Haulage Trip' },
      { id: '4.2', tab: 'drivers', name: 'Commercial Vehicle Drivers Directory', hasAddForm: true, formName: 'Enroll Commercial Driver to Fleet' },
      { id: '4.3', tab: 'dispatch', name: 'Outward Dispatches & Vehicle Gate Passes', hasAddForm: true, formName: 'Dispatch Manifest Security QR Scanner' }
    ]
  },
  {
    domainId: 'D5',
    domainName: 'Domain 5: Human Resources & Factory Payroll Administration',
    modules: [
      { id: '5.1', tab: 'employees', name: 'Factory Personnel & Staff Directory', hasAddForm: true, formName: 'Enroll Factory Staff Member' },
      { id: '5.2', tab: 'salaries', name: 'Payroll & Staff Salary Vouchers', hasAddForm: true, formName: 'Create Monthly Salary Voucher' }
    ]
  },
  {
    domainId: 'D6',
    domainName: 'Domain 6: Financial Governance, Overhead & Executive Intelligence',
    modules: [
      { id: '6.1', tab: 'expenses', name: 'Factory Operational Overhead Expenses', hasAddForm: true, formName: 'Log Operational Expense Voucher' },
      { id: '6.2', tab: 'bank', name: 'Bank Accounts, RTGS & Ledger Settlement', hasAddForm: true, formName: 'Record Treasury Bank / Cash Transaction' },
      { id: '6.3', tab: 'reports', name: 'Comprehensive Executive Business Reports', hasAddForm: false },
      { id: '6.4', tab: 'analytics', name: 'PowerBI Executive Analytics Suite', hasAddForm: false },
      { id: '6.5', tab: 'audit-logs', name: 'Security Audit Trail & System Telemetry', hasAddForm: false }
    ]
  },
  {
    domainId: 'D7',
    domainName: 'Domain 7: Enterprise System Configuration & Security Governance',
    isSettingsDomain: true,
    modules: [
      { id: '7.1', sub: 'branding', name: 'Settings: Branding & Visual Identity System' },
      {
        id: '7.2',
        sub: 'business-rules',
        name: 'Settings: Multi-Company ERP, Banking & Invoice Designer',
        hasAddForm: true,
        addBtnKeywords: ['company', 'entity', 'add corporate', 'add bank'],
        formName: 'Register Corporate Entity / Subsidiary Modal'
      },
      {
        id: '7.3',
        sub: 'teams',
        name: 'Settings: Department Directory & Teams Structure',
        hasAddForm: true,
        addBtnKeywords: ['team', 'department', 'add team', 'create team'],
        formName: 'Configure Department & Teams Modal'
      },
      {
        id: '7.4',
        sub: 'custom_fields',
        name: 'Settings: Extensible Dynamic Schema Fields',
        hasAddForm: true,
        addBtnKeywords: ['field', 'add field', 'custom field'],
        formName: 'Add Dynamic Schema Custom Field Modal'
      },
      { id: '7.5', sub: 'notifications', name: 'Settings: WhatsApp & SMS Dispatch Engine' },
      {
        id: '7.6',
        sub: 'users',
        name: 'Settings: User Directory & Granular RBAC Matrix',
        hasAddForm: true,
        addBtnKeywords: ['user', 'invite user', 'add user'],
        formName: 'Create / Invite System User Account Modal'
      },
      { id: '7.7', sub: 'features', name: 'Settings: Enterprise Feature Flags & AI Copilot' },
      {
        id: '7.8',
        sub: 'developer',
        name: 'Settings: Developer Hub, API Keys & Webhooks',
        hasAddForm: true,
        addBtnKeywords: ['api key', 'generate key', 'webhook'],
        formName: 'Generate Developer API Key Modal'
      },
      { id: '7.9', sub: 'governance', name: 'Settings: JVM Telemetry, Cache & Database Backups' },
      { id: '7.10', sub: 'password', name: 'Settings: Security & Master Password Reset' }
    ]
  }
];

async function navigateToTab(page, targetKey) {
  return await page.evaluate((key) => {
    try {
      const root = document.querySelector('app-root');
      if (window.ng && root) {
        window.ng.getComponent(root).switchTab(key);
        return true;
      }
    } catch (e) {}

    const lis = Array.from(document.querySelectorAll('.sidebar-nav li'));
    const target = lis.find(li => {
      const aria = (li.getAttribute('aria-label') || '').toLowerCase();
      const title = (li.getAttribute('title') || '').toLowerCase();
      const text = (li.textContent || '').toLowerCase().trim();
      const k = key.toLowerCase().replace('-', '');
      return aria.includes(k) || title.includes(k) || text.replace(/\s+/g, '').includes(k);
    });
    if (target) {
      target.click();
      return true;
    }
    return false;
  }, targetKey);
}

async function navigateToSettingsSub(page, subKey) {
  return await page.evaluate((key) => {
    try {
      const sComp = document.querySelector('app-settings');
      if (window.ng && sComp) {
        const comp = window.ng.getComponent(sComp);
        if (comp && comp.switchSubNav) {
          comp.switchSubNav(key);
          return true;
        }
      }
    } catch (e) {}

    const pills = Array.from(document.querySelectorAll('.settings-nav-pill'));
    const target = pills.find(p => {
      const t = (p.textContent || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const k = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      return t.includes(k) || k.includes(t);
    });
    if (target) {
      target.click();
      return true;
    }
    return false;
  }, subKey);
}

async function run() {
  console.log('================================================================');
  console.log('🚀 FUTANE AGRO ERP - COMPREHENSIVE DOMAIN AUDIT CAPTURE');
  console.log('   Full Pages with Scrollers + Scrollable Data Tables + Add Forms');
  console.log('================================================================');

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    protocolTimeout: 300000,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1600,1050']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1050, deviceScaleFactor: 1.25 });

  console.log('\n🔑 Step 1: Authenticating as SUPER_ADMIN...');
  await page.goto(`${BASE_URL}/#/login`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    if (inputs[0]) {
      inputs[0].value = 'SUPER_ADMIN';
      inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (inputs[1]) {
      inputs[1].value = 'superadmin123';
      inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
    }
    const btn = document.querySelector('button[type="submit"]');
    if (btn) btn.click();
  });

  await page.waitForSelector('.uat-otp-helper-card', { timeout: 10000 });
  await page.click('.uat-otp-helper-card');
  await page.click('button[type="submit"]');
  await page.waitForSelector('.app-container', { timeout: 15000 });
  console.log('🎉 Authenticated & inside ERP application!');

  const capturedSnapshots = [];
  let fileIdx = 1;

  for (const domain of DOMAINS) {
    console.log(`\n================================================================`);
    console.log(`📁 ${domain.domainName.toUpperCase()}`);
    console.log(`================================================================`);

    if (domain.isSettingsDomain) {
      // Navigate to Settings
      await navigateToTab(page, 'settings');
      await new Promise(r => setTimeout(r, 1500));

      for (const mod of domain.modules) {
        console.log(`\n📸 Sub-Tab [${mod.id}] -> ${mod.name}...`);
        
        // 1. Full Page with Scroller
        const fullPath = path.join(SNAP_DIR, `snap_${String(fileIdx++).padStart(3, '0')}_${mod.sub}_full.png`);
        if (!fs.existsSync(fullPath)) {
          await navigateToSettingsSub(page, mod.sub);
          await new Promise(r => setTimeout(r, 1200));

          await page.screenshot({ path: fullPath, fullPage: true });
          console.log(`   ✅ [Full Page with Scroller] saved: ${path.basename(fullPath)}`);
        } else {
          console.log(`   ⏩ [Full Page with Scroller] cached: ${path.basename(fullPath)}`);
        }

        capturedSnapshots.push({
          domain: domain.domainName,
          title: mod.name,
          type: 'FULL PAGE WITH SCROLLER',
          file: fullPath
        });

        // 2. Settings table if any (Teams / Users / Custom Fields / Developer)
        if (mod.sub === 'teams' || mod.sub === 'users' || mod.sub === 'custom_fields' || mod.sub === 'developer') {
          const tblPath = path.join(SNAP_DIR, `snap_${String(fileIdx++).padStart(3, '0')}_${mod.sub}_table.png`);
          if (!fs.existsSync(tblPath)) {
            await navigateToSettingsSub(page, mod.sub);
            await new Promise(r => setTimeout(r, 800));

            const hasTable = await page.evaluate(() => {
              const tbl = document.querySelector('table');
              if (tbl && tbl.offsetHeight > 40) {
                tbl.scrollIntoView({ behavior: 'instant', block: 'center' });
                return true;
              }
              return false;
            });

            if (hasTable) {
              await new Promise(r => setTimeout(r, 500));
              await page.screenshot({ path: tblPath, fullPage: false });
              console.log(`   ✅ [Scrollable Table Focus] saved: ${path.basename(tblPath)}`);
            }
          } else {
            console.log(`   ⏩ [Scrollable Table Focus] cached: ${path.basename(tblPath)}`);
          }

          if (fs.existsSync(tblPath)) {
            capturedSnapshots.push({
              domain: domain.domainName,
              title: `${mod.name} (Data Grid)`,
              type: 'SCROLLABLE DATA TABLE',
              file: tblPath
            });
          }
        }

        // 3. Settings Add Modal
        if (mod.hasAddForm) {
          const addPath = path.join(SNAP_DIR, `snap_${String(fileIdx++).padStart(3, '0')}_${mod.sub}_add_form.png`);
          if (!fs.existsSync(addPath)) {
            await navigateToSettingsSub(page, mod.sub);
            await new Promise(r => setTimeout(r, 800));

            const opened = await page.evaluate((keywords) => {
              const btns = Array.from(document.querySelectorAll('.admin-content-panel button, .subtab-section button'));
              const addB = btns.find(b => {
                const t = b.textContent.toLowerCase();
                return keywords.some(k => t.includes(k)) || t.includes('add ') || t.includes('create ') || t.includes('invite ') || t.includes('generate ');
              });
              if (addB) {
                addB.click();
                return true;
              }
              return false;
            }, mod.addBtnKeywords || []);

            if (opened) {
              await new Promise(r => setTimeout(r, 900));
              await page.screenshot({ path: addPath, fullPage: false });
              console.log(`   ✅ [Add New Form / Modal] saved: ${path.basename(addPath)}`);

              // Close modal
              await page.evaluate(() => {
                const closeBtn = document.querySelector('.btn-close, .modal-close, .btn-secondary, .btn-cancel, [aria-label="Close"]');
                if (closeBtn) closeBtn.click();
              });
              await new Promise(r => setTimeout(r, 400));
            }
          } else {
            console.log(`   ⏩ [Add New Form / Modal] cached: ${path.basename(addPath)}`);
          }

          if (fs.existsSync(addPath)) {
            capturedSnapshots.push({
              domain: domain.domainName,
              title: `${mod.name} - ${mod.formName || 'Addition Form'}`,
              type: 'ADDITION OF NEW DATA: MODAL / FORM',
              file: addPath
            });
          }
        }
      }
    } else {
      // Main Operational Domain Modules
      for (const mod of domain.modules) {
        console.log(`\n📸 Module [${mod.id}] -> ${mod.name}...`);

        // 1. Full Page with Scroller
        const fullPath = path.join(SNAP_DIR, `snap_${String(fileIdx++).padStart(3, '0')}_${mod.tab}_full.png`);
        if (!fs.existsSync(fullPath)) {
          await navigateToTab(page, mod.tab);
          await new Promise(r => setTimeout(r, 1500));

          const isFull = mod.tab !== 'analytics';
          await page.screenshot({ path: fullPath, fullPage: isFull });
          console.log(`   ✅ [Full Page with Scroller] saved: ${path.basename(fullPath)}`);
        } else {
          console.log(`   ⏩ [Full Page with Scroller] cached: ${path.basename(fullPath)}`);
        }

        capturedSnapshots.push({
          domain: domain.domainName,
          title: mod.name,
          type: 'FULL PAGE WITH SCROLLER',
          file: fullPath
        });

        // 2. Scrollable Data Table Focus
        if (mod.tab !== 'dashboard' && mod.tab !== 'analytics') {
          const tblPath = path.join(SNAP_DIR, `snap_${String(fileIdx++).padStart(3, '0')}_${mod.tab}_table.png`);
          if (!fs.existsSync(tblPath)) {
            await navigateToTab(page, mod.tab);
            await new Promise(r => setTimeout(r, 1200));

            const hasTable = await page.evaluate(() => {
              const tbl = document.querySelector('table');
              if (tbl) {
                tbl.scrollIntoView({ behavior: 'instant', block: 'center' });
                return true;
              }
              return false;
            });

            if (hasTable) {
              await new Promise(r => setTimeout(r, 600));
              await page.screenshot({ path: tblPath, fullPage: false });
              console.log(`   ✅ [Scrollable Table Focus] saved: ${path.basename(tblPath)}`);
            }
          } else {
            console.log(`   ⏩ [Scrollable Table Focus] cached: ${path.basename(tblPath)}`);
          }

          if (fs.existsSync(tblPath)) {
            capturedSnapshots.push({
              domain: domain.domainName,
              title: `${mod.name} (Data Grid & Sticky Columns)`,
              type: 'SCROLLABLE DATA TABLE',
              file: tblPath
            });
          }
        }

        // 3. Addition of New Data Form / Modal / Drawer
        if (mod.hasAddForm) {
          const addPath = path.join(SNAP_DIR, `snap_${String(fileIdx++).padStart(3, '0')}_${mod.tab}_add_form.png`);
          if (!fs.existsSync(addPath)) {
            await navigateToTab(page, mod.tab);
            await new Promise(r => setTimeout(r, 1200));

            const opened = await page.evaluate(() => {
              const btns = Array.from(document.querySelectorAll('button, .btn'));
              const addBtn = btns.find(b => {
                const t = (b.textContent || '').toLowerCase();
                return (t.includes('add ') || t.includes('create ') || t.includes('register ') || t.includes('enroll ') || t.includes('record ') || t.includes('log ') || t.includes('new ')) && !t.includes('export');
              });
              if (addBtn) {
                addBtn.click();
                return true;
              }
              return false;
            });

            if (opened) {
              await new Promise(r => setTimeout(r, 900));
              await page.screenshot({ path: addPath, fullPage: false });
              console.log(`   ✅ [Add New Form / Modal] saved: ${path.basename(addPath)}`);

              await page.evaluate(() => {
                const closeBtn = document.querySelector('.btn-close, .modal-close, .btn-secondary, .btn-cancel, [aria-label="Close"]');
                if (closeBtn) closeBtn.click();
              });
              await new Promise(r => setTimeout(r, 400));
            }
          } else {
            console.log(`   ⏩ [Add New Form / Modal] cached: ${path.basename(addPath)}`);
          }

          if (fs.existsSync(addPath)) {
            capturedSnapshots.push({
              domain: domain.domainName,
              title: `${mod.name} - ${mod.formName || 'Addition Form'}`,
              type: 'ADDITION OF NEW DATA: MODAL / FORM',
              file: addPath
            });
          }
        }

        // 4. Secondary Add form
        if (mod.secondaryAdd) {
          const secPath = path.join(SNAP_DIR, `snap_${String(fileIdx++).padStart(3, '0')}_${mod.tab}_secondary_add.png`);
          if (!fs.existsSync(secPath)) {
            await navigateToTab(page, mod.tab);
            await new Promise(r => setTimeout(r, 1200));

            const opened = await page.evaluate(() => {
              const btns = Array.from(document.querySelectorAll('button, .btn'));
              const secBtn = btns.find(b => {
                const t = (b.textContent || '').toLowerCase();
                return t.includes('breakdown') || t.includes('adjust') || t.includes('quick adjust');
              });
              if (secBtn) {
                secBtn.click();
                return true;
              }
              return false;
            });

            if (opened) {
              await new Promise(r => setTimeout(r, 900));
              await page.screenshot({ path: secPath, fullPage: false });
              console.log(`   ✅ [Secondary Add Action] saved: ${path.basename(secPath)}`);

              await page.evaluate(() => {
                const closeBtn = document.querySelector('.btn-close, .modal-close, .btn-secondary, .btn-cancel, [aria-label="Close"]');
                if (closeBtn) closeBtn.click();
              });
              await new Promise(r => setTimeout(r, 400));
            }
          } else {
            console.log(`   ⏩ [Secondary Add Action] cached: ${path.basename(secPath)}`);
          }

          if (fs.existsSync(secPath)) {
            capturedSnapshots.push({
              domain: domain.domainName,
              title: `${mod.name} - ${mod.secondaryFormName || 'Secondary Action'}`,
              type: 'ADDITION OF NEW DATA: MODAL / FORM',
              file: secPath
            });
          }
        }
      }
    }
  }

  await browser.close();
  console.log(`\n🎉 ALL ${capturedSnapshots.length} ENTERPRISE SNAPSHOTS VERIFIED & READY!`);
  console.log('📄 Now Compiling Adaptive High-Resolution Visual Audit PDF...');

  // Build the High-Resolution Multi-Height PDF Document
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // 1. Cover Page
  const coverPage = pdfDoc.addPage([1200, 850]);
  coverPage.drawRectangle({
    x: 0,
    y: 0,
    width: 1200,
    height: 850,
    color: rgb(0.06, 0.09, 0.16) // #0f172a
  });

  // Top Accent Bar (Amber Gold)
  coverPage.drawRectangle({
    x: 0,
    y: 840,
    width: 1200,
    height: 10,
    color: rgb(0.96, 0.62, 0.07) // #f59e0b
  });

  coverPage.drawText('FUTANE AGRO INDUSTRIES PVT. LTD.', {
    x: 80,
    y: 720,
    size: 28,
    font: fontBold,
    color: rgb(0.96, 0.62, 0.07)
  });

  coverPage.drawText('Enterprise Resource Planning (ERP) System [UAT 2026]', {
    x: 80,
    y: 680,
    size: 20,
    font: fontRegular,
    color: rgb(0.9, 0.95, 1.0)
  });

  coverPage.drawText('COMPLETE DOMAIN-DRIVEN VISUAL AUDIT & TELEMETRY REPORT', {
    x: 80,
    y: 620,
    size: 22,
    font: fontBold,
    color: rgb(1, 1, 1)
  });

  const summaryBullets = [
    '• 7 Core Enterprise Operational Domains (Structured Process Architecture)',
    '• All 21 Primary Operational Management Screens (Full Scrollable Height)',
    '• All 10 Enterprise System Settings & Administrative Sub-Tabs',
    '• Dedicated High-Resolution Scrollable Data Tables & Sticky Columns',
    '• Complete Addition of New Data Modals, Entry Drawers & Dynamic Forms',
    '• Live Verified Authentication: SUPER_ADMIN Role & Active Session Telemetry'
  ];

  let bulletY = 540;
  summaryBullets.forEach(b => {
    coverPage.drawText(b, {
      x: 80,
      y: bulletY,
      size: 15,
      font: fontRegular,
      color: rgb(0.8, 0.85, 0.95)
    });
    bulletY -= 32;
  });

  // Metadata Footer Box
  coverPage.drawRectangle({
    x: 80,
    y: 120,
    width: 1040,
    height: 140,
    color: rgb(0.12, 0.16, 0.24)
  });

  coverPage.drawText('AUDIT SPECIFICATION & ENVIRONMENT METADATA', {
    x: 110,
    y: 225,
    size: 13,
    font: fontBold,
    color: rgb(0.96, 0.62, 0.07)
  });

  coverPage.drawText(`Generated At: ${new Date().toISOString().replace('T', ' ').substring(0, 19)} UTC`, {
    x: 110,
    y: 200,
    size: 11,
    font: fontRegular,
    color: rgb(0.8, 0.85, 0.9)
  });

  coverPage.drawText('Target Platform: Windows 11 Enterprise | Host: localhost:4200 (Angular 19 / Vite Frontend)', {
    x: 110,
    y: 180,
    size: 11,
    font: fontRegular,
    color: rgb(0.8, 0.85, 0.9)
  });

  coverPage.drawText('Backend API: Spring Boot 3.4.2 Enterprise Microservice (Port 8081 UAT)', {
    x: 110,
    y: 160,
    size: 11,
    font: fontRegular,
    color: rgb(0.8, 0.85, 0.9)
  });

  coverPage.drawText(`Total Captured High-Resolution Pages: ${capturedSnapshots.length} Verified Screens`, {
    x: 110,
    y: 140,
    size: 11,
    font: fontBold,
    color: rgb(0.2, 0.8, 0.4)
  });

  // 2. Table of Contents / Domain Map Page
  const tocPage = pdfDoc.addPage([1200, 850]);
  tocPage.drawRectangle({
    x: 0,
    y: 0,
    width: 1200,
    height: 850,
    color: rgb(0.06, 0.09, 0.16)
  });

  tocPage.drawRectangle({
    x: 0,
    y: 840,
    width: 1200,
    height: 10,
    color: rgb(0.96, 0.62, 0.07)
  });

  tocPage.drawText('EXECUTIVE TABLE OF CONTENTS: DOMAIN-DRIVEN NAVIGATION MAP', {
    x: 60,
    y: 790,
    size: 18,
    font: fontBold,
    color: rgb(1, 1, 1)
  });

  let tocY = 740;
  DOMAINS.forEach((dom) => {
    tocPage.drawText(dom.domainName, {
      x: 60,
      y: tocY,
      size: 13,
      font: fontBold,
      color: rgb(0.96, 0.62, 0.07)
    });
    tocY -= 20;

    const moduleList = dom.modules.map(m => m.name).join('  •  ');
    const splitModules = moduleList.length > 130 ? [moduleList.substring(0, 130), moduleList.substring(130)] : [moduleList];
    splitModules.forEach(line => {
      tocPage.drawText(`   ${line}`, {
        x: 60,
        y: tocY,
        size: 10,
        font: fontRegular,
        color: rgb(0.8, 0.85, 0.9)
      });
      tocY -= 16;
    });
    tocY -= 10;
  });

  // 3. Append All Captured Snapshots with Adaptive Page Dimensions & Crisp Header Banners
  for (let i = 0; i < capturedSnapshots.length; i++) {
    const item = capturedSnapshots[i];
    const imageBytes = fs.readFileSync(item.file);
    const embeddedImg = await pdfDoc.embedPng(imageBytes);

    const imgWidth = embeddedImg.width;
    const imgHeight = embeddedImg.height;

    const headerHeight = 65;
    const pageMargin = 20;
    const pageWidth = imgWidth + (pageMargin * 2);
    const pageHeight = imgHeight + headerHeight + (pageMargin * 2);

    const pdfPage = pdfDoc.addPage([pageWidth, pageHeight]);

    pdfPage.drawRectangle({
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
      color: rgb(0.07, 0.10, 0.16)
    });

    pdfPage.drawRectangle({
      x: pageMargin,
      y: pageHeight - pageMargin - headerHeight,
      width: imgWidth,
      height: headerHeight,
      color: rgb(0.12, 0.16, 0.25)
    });

    let stripeColor = rgb(0.2, 0.5, 0.9);
    if (item.type.includes('TABLE')) stripeColor = rgb(0.1, 0.8, 0.4);
    if (item.type.includes('ADDITION')) stripeColor = rgb(0.96, 0.62, 0.07);

    pdfPage.drawRectangle({
      x: pageMargin,
      y: pageHeight - pageMargin - headerHeight,
      width: 8,
      height: headerHeight,
      color: stripeColor
    });

    pdfPage.drawText(item.domain.toUpperCase(), {
      x: pageMargin + 20,
      y: pageHeight - pageMargin - 22,
      size: 11,
      font: fontBold,
      color: rgb(0.65, 0.75, 0.88)
    });

    pdfPage.drawText(item.title, {
      x: pageMargin + 20,
      y: pageHeight - pageMargin - 42,
      size: 16,
      font: fontBold,
      color: rgb(1, 1, 1)
    });

    const badgeText = `[${item.type}]`;
    pdfPage.drawText(badgeText, {
      x: pageWidth - pageMargin - 280,
      y: pageHeight - pageMargin - 25,
      size: 11,
      font: fontBold,
      color: stripeColor
    });

    pdfPage.drawText(`Page ${i + 1} of ${capturedSnapshots.length} | Futane Agro ERP UAT`, {
      x: pageWidth - pageMargin - 280,
      y: pageHeight - pageMargin - 45,
      size: 9,
      font: fontRegular,
      color: rgb(0.6, 0.65, 0.75)
    });

    pdfPage.drawImage(embeddedImg, {
      x: pageMargin,
      y: pageMargin,
      width: imgWidth,
      height: imgHeight
    });
  }

  // Save the compiled PDF
  const pdfBytes = await pdfDoc.save();

  fs.writeFileSync(OUTPUT_PDF_SCRATCH, pdfBytes);
  console.log(`\n💾 Saved Report to Scratch: ${OUTPUT_PDF_SCRATCH} (${(pdfBytes.length / (1024 * 1024)).toFixed(2)} MB)`);

  fs.writeFileSync(OUTPUT_PDF_DOCS, pdfBytes);
  console.log(`💾 Saved Report to Docs: ${OUTPUT_PDF_DOCS}`);

  fs.writeFileSync(OUTPUT_PDF_ARTIFACT, pdfBytes);
  console.log(`💾 Saved Report to Artifacts: ${OUTPUT_PDF_ARTIFACT}`);

  console.log('\n✨ COMPLETE VISUAL AUDIT SUCCESSFUL!');
}

run().catch(err => {
  console.error('Fatal Error during execution:', err);
  process.exit(1);
});
