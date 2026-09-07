import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';
import { PDFDocument, rgb } from 'pdf-lib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const SNAP_DIR = path.join(__dirname, 'snapshots');
const OUTPUT_PDF = path.join(__dirname, 'Futane_Agro_ERP_All_Tabs_Visual_Report.pdf');

if (!fs.existsSync(SNAP_DIR)) {
  fs.mkdirSync(SNAP_DIR, { recursive: true });
}

const TABS = [
  { id: '01_dashboard', name: 'Executive Dashboard & KPI Command Center', url: 'http://localhost:4200/dashboard' },
  { id: '02_production', name: 'Manufacturing & Injection Molding Operations', url: 'http://localhost:4200/production' },
  { id: '03_inventory', name: 'Inventory & Raw Materials Warehouse', url: 'http://localhost:4200/inventory' },
  { id: '04_sales', name: 'Sales, Dispatches & Customer Orders', url: 'http://localhost:4200/sales' },
  { id: '05_invoices', name: 'GST Billing Hub & Tax Invoices', url: 'http://localhost:4200/invoices' },
  { id: '06_accounting', name: 'Financial Accounting & Banking', url: 'http://localhost:4200/accounting' },
  { id: '07_quality', name: 'Quality Assurance & Lab Inspection', url: 'http://localhost:4200/quality' },
  { id: '08_audit_logs', name: 'Security Audit Trail & Telemetry Logs', url: 'http://localhost:4200/audit-logs' },
  { id: '09_settings_branding', name: 'System Settings: 1. Branding & Themes', url: 'http://localhost:4200/settings', subtab: 'branding' },
  { id: '10_settings_billing', name: 'System Settings: 2. Multi-Company & Invoice Designer', url: 'http://localhost:4200/settings', subtab: 'billing' },
  { id: '11_settings_business_rules', name: 'System Settings: 3. ERP Business Rules & Round-off', url: 'http://localhost:4200/settings', subtab: 'business_rules' },
  { id: '12_settings_teams', name: 'System Settings: 4. Department Directory & Teams', url: 'http://localhost:4200/settings', subtab: 'teams' },
  { id: '13_settings_custom_fields', name: 'System Settings: 5. Dynamic Custom Fields', url: 'http://localhost:4200/settings', subtab: 'custom_fields' },
  { id: '14_settings_notifications', name: 'System Settings: 6. WhatsApp & Alert Engine', url: 'http://localhost:4200/settings', subtab: 'notifications' },
  { id: '15_settings_users', name: 'System Settings: 7. Users Directory & Granular RBAC', url: 'http://localhost:4200/settings', subtab: 'users' },
  { id: '16_settings_feature_flags', name: 'System Settings: 8. Enterprise Feature Flags', url: 'http://localhost:4200/settings', subtab: 'feature_flags' },
  { id: '17_settings_developer', name: 'System Settings: 9. Developer Hub & SRE Gateways', url: 'http://localhost:4200/settings', subtab: 'developer' },
  { id: '18_settings_governance', name: 'System Settings: 10. JVM Telemetry, Cache & Backup', url: 'http://localhost:4200/settings', subtab: 'governance' },
  { id: '19_settings_security', name: 'System Settings: 11. Security & Change Password', url: 'http://localhost:4200/settings', subtab: 'security' }
];

async function run() {
  console.log('🚀 Launching Microsoft Edge (Headless)...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1440,920']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 920, deviceScaleFactor: 1.5 });

  console.log('🔑 Authenticating as SUPER_ADMIN...');
  await page.goto('http://localhost:4200/login', { waitUntil: 'networkidle2' }).catch(() => {});

  // Inject authentication tokens into localStorage and sessionStorage
  await page.evaluate(() => {
    const userObj = {
      username: 'SUPER_ADMIN',
      fullName: 'Vedant Futane',
      role: 'SUPER_ADMIN',
      token: 'jwt_superadmin_master_token_2026',
      permissions: ['ALL']
    };
    localStorage.setItem('currentUser', JSON.stringify(userObj));
    localStorage.setItem('auth_token', 'jwt_superadmin_master_token_2026');
    localStorage.setItem('token', 'jwt_superadmin_master_token_2026');
    localStorage.setItem('fa_user', JSON.stringify(userObj));
    localStorage.setItem('userRole', 'SUPER_ADMIN');
    sessionStorage.setItem('currentUser', JSON.stringify(userObj));
  });

  const capturedImages = [];

  for (let i = 0; i < TABS.length; i++) {
    const tab = TABS[i];
    console.log(`📸 [${i + 1}/${TABS.length}] Capturing ${tab.name}...`);
    
    try {
      await page.goto(tab.url, { waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
      await new Promise(r => setTimeout(r, 700));

      if (tab.subtab) {
        // Trigger subtab click in Angular component
        await page.evaluate((subtabId) => {
          const btns = Array.from(document.querySelectorAll('.subnav-item-btn'));
          const subtabMap = {
            'branding': 0, 'billing': 1, 'business_rules': 2, 'teams': 3,
            'custom_fields': 4, 'notifications': 5, 'users': 6, 'feature_flags': 7,
            'developer': 8, 'governance': 9, 'security': 10
          };
          if (subtabMap[subtabId] !== undefined && btns[subtabMap[subtabId]]) {
            btns[subtabMap[subtabId]].click();
          }
        }, tab.subtab);
        await new Promise(r => setTimeout(r, 600));
      }

      const imgPath = path.join(SNAP_DIR, `${tab.id}.png`);
      await page.screenshot({ path: imgPath, fullPage: false });
      capturedImages.push({ ...tab, imgPath });
      console.log(`   ✅ Saved: ${path.basename(imgPath)}`);
    } catch (err) {
      console.error(`   ❌ Failed on ${tab.name}:`, err.message);
    }
  }

  await browser.close();
  console.log('🎉 All snapshots captured! Generating PDF report...');

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
    y: 440,
    size: 28,
    color: rgb(0.96, 0.62, 0.07) // #f59e0b
  });

  coverPage.drawText('Complete Enterprise Visual Layout & Tab Inspection Report', {
    x: 60,
    y: 390,
    size: 18,
    color: rgb(0.97, 0.98, 0.99)
  });

  coverPage.drawText(`Generated on: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`, {
    x: 60,
    y: 330,
    size: 12,
    color: rgb(0.58, 0.64, 0.72)
  });

  coverPage.drawText(`Total Screens Inspected: ${capturedImages.length} Tabs & Subtabs`, {
    x: 60,
    y: 300,
    size: 12,
    color: rgb(0.58, 0.64, 0.72)
  });

  coverPage.drawText('Coverage: Dashboard, Production, Inventory, Sales, Billing, Accounting, QA, Audit Logs, and all 11 System Settings Subtabs.', {
    x: 60,
    y: 250,
    size: 11,
    color: rgb(0.79, 0.83, 0.88)
  });

  // 2. Add each screenshot as a landscape slide page
  for (let i = 0; i < capturedImages.length; i++) {
    const item = capturedImages[i];
    if (fs.existsSync(item.imgPath)) {
      const page = pdfDoc.addPage([842, 595]);
      
      // Top header banner on page
      page.drawRectangle({
        x: 0,
        y: 545,
        width: 842,
        height: 50,
        color: rgb(0.06, 0.09, 0.16)
      });

      page.drawText(`[${i + 1}/${capturedImages.length}] ${item.name}`, {
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
      
      // Calculate image dimensions to fit nicely below header
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
  console.log(`✅ PDF Generated Successfully: ${OUTPUT_PDF} (${(pdfBytes.length / (1024 * 1024)).toFixed(2)} MB)`);
}

run().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
