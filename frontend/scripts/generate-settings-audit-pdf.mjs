import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import { PDFDocument } from 'pdf-lib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist/frontend/browser');
const outDir = path.resolve(__dirname, '../../artifacts_settings_qa');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 1. Simple HTTP Server for Angular SPA
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || !path.extname(reqPath)) {
    reqPath = '/index.html';
  }
  let filePath = path.join(distDir, reqPath);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(distDir, 'index.html');
  }

  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end('Server Error');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

const PORT = 4288;

server.listen(PORT, async () => {
  console.log(`Server running at http://localhost:${PORT}`);
  try {
    await runAuditAndGeneratePDF();
  } catch (err) {
    console.error('Audit script failed:', err);
  } finally {
    server.close();
    process.exit(0);
  }
});

async function runAuditAndGeneratePDF() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    deviceScaleFactor: 1.5
  });

  await context.addInitScript(() => {
    const user = { username: 'SUPER_ADMIN', role: 'SUPER_ADMIN', name: 'Super Admin', token: 'mock-jwt-token-admin' };
    localStorage.setItem('user', JSON.stringify(user));
    sessionStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('jwtToken', 'mock-jwt-token-admin');
    sessionStorage.setItem('jwtToken', 'mock-jwt-token-admin');
    sessionStorage.setItem('activeTab', 'settings');
  });

  const page = await context.newPage();
  await page.goto(`http://localhost:${PORT}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Fallback login if needed
  const pwdInput = await page.$('input[type="password"]');
  if (pwdInput) {
    await page.fill('input[type="text"]', 'SUPER_ADMIN');
    await page.fill('input[type="password"]', 'superadmin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
  }

  // Ensure settings tab is loaded
  const hasSettings = await page.$('.admin-control-center');
  if (!hasSettings) {
    const navItem = await page.$('li:has-text("Settings"), a:has-text("Settings"), [title*="Settings"]');
    if (navItem) await navItem.click();
    await page.waitForSelector('.admin-control-center', { timeout: 10000 });
  }

  const subtabs = [
    { id: 'enterprise_customizations', btnId: '#subtab-enterprise-customizations', name: '01_Customizations_Hub' },
    { id: 'branding', btnId: '#subtab-branding', name: '02_Branding_Themes' },
    { id: 'business-rules', btnId: '#subtab-business-rules', name: '03_Business_Rules' },
    { id: 'teams', btnId: '#subtab-teams', name: '04_Teams_Departments' },
    { id: 'custom_fields', btnId: '#subtab-custom-fields', name: '05_Extensible_Fields' },
    { id: 'notifications', btnId: '#subtab-notifications', name: '06_WhatsApp_Alerts' },
    { id: 'users', btnId: '#subtab-users', name: '07_Users_RBAC' },
    { id: 'features', btnId: '#subtab-features', name: '08_Feature_Flags' },
    { id: 'developer', btnId: '#subtab-developer', name: '09_Developer_Hub' },
    { id: 'governance', btnId: '#subtab-governance', name: '10_System_Telemetry' },
    { id: 'password', btnId: '#subtab-password', name: '11_Security_Console' }
  ];

  const screenshots = [];

  console.log('📸 Capturing Screenshots for all 11 Settings tabs with scrolling...');

  for (const tab of subtabs) {
    console.log(`Processing Tab: ${tab.name}...`);
    await page.click(tab.btnId);
    await page.waitForTimeout(600);

    // Scroll to top of window
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);

    // Verify KPI card metrics in this tab
    const kpiMetrics = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.subtab-section:not([style*="display: none"]) .hub-kpi-card, .sec-console-section .hub-kpi-card, .devhub-subtab-section .hub-kpi-card'));
      return cards.map(c => {
        const rect = c.getBoundingClientRect();
        const label = c.querySelector('.hub-kpi-label')?.textContent?.trim();
        const value = c.querySelector('.hub-kpi-value')?.textContent?.trim();
        const icon = c.querySelector('.hub-kpi-icon');
        const iconRect = icon ? icon.getBoundingClientRect() : null;
        return {
          height: Math.round(rect.height),
          label,
          value,
          iconWidth: iconRect ? Math.round(iconRect.width) : null,
          iconHeight: iconRect ? Math.round(iconRect.height) : null
        };
      });
    });

    console.log(`  KPI cards count: ${kpiMetrics.length}`);
    if (kpiMetrics.length > 0) {
      console.log(`  Heights: ${kpiMetrics.map(k => k.height + 'px').join(', ')}`);
      console.log(`  Icons: ${kpiMetrics.map(k => `${k.iconWidth}x${k.iconHeight}`).join(', ')}`);
    }

    // 1. Viewport screenshot (Top with KPI cards and sticky subtabs)
    const topPath = path.join(outDir, `${tab.name}_top.png`);
    await page.screenshot({ path: topPath, fullPage: false });
    screenshots.push(topPath);

    // 2. Scroll down to show table with scrollbar ("with scrolee")
    const hasTable = await page.evaluate(() => {
      const tbl = document.querySelector('.settings-table-scroll, .devhub-table-scroll, .cf-table-scroll, .notif-table-scroll, .users-table-container, table');
      if (tbl) {
        tbl.scrollIntoView({ behavior: 'instant', block: 'center' });
        // Scroll slightly horizontally to demonstrate visible scrollbar
        tbl.scrollLeft = 80;
        return true;
      }
      return false;
    });

    await page.waitForTimeout(400);

    if (hasTable) {
      const tablePath = path.join(outDir, `${tab.name}_table_scrolled.png`);
      await page.screenshot({ path: tablePath, fullPage: false });
      screenshots.push(tablePath);
    }
  }

  await browser.close();

  // 3. Compile all screenshots into a single multi-page PDF using pdf-lib
  console.log('\n📄 Compiling screenshots into PDF document...');
  const pdfDoc = await PDFDocument.create();

  for (const imgPath of screenshots) {
    if (!fs.existsSync(imgPath)) continue;
    const imgBytes = fs.readFileSync(imgPath);
    const img = await pdfDoc.embedPng(imgBytes);
    
    // Create page matching image aspect ratio
    const page = pdfDoc.addPage([img.width, img.height]);
    page.drawImage(img, {
      x: 0,
      y: 0,
      width: img.width,
      height: img.height
    });
  }

  const pdfBytes = await pdfDoc.save();
  const pdfPath = path.join(outDir, 'Futane_Agro_ERP_Settings_All_Tabs_Audit.pdf');
  fs.writeFileSync(pdfPath, pdfBytes);

  console.log(`\n🎉 PDF Generated Successfully!`);
  console.log(`Path: ${pdfPath}`);
  console.log(`Total Pages / Screenshots: ${screenshots.length}`);
}
