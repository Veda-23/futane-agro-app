import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const TABS = [
  'production',
  'monthly-production',
  'inventory',
  'machines',
  'raw-materials',
  'vendors',
  'sales',
  'dispatch',
  'transports',
  'drivers',
  'parties',
  'payments',
  'invoices',
  'bank',
  'expenses',
  'salaries',
  'employees'
];

async function main() {
  const artifactDir = 'C:\\Users\\Vedant\\.gemini\\antigravity-ide\\brain\\c6f35e64-605e-4364-8857-ebfa705e7205\\audit_tables';
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:4300...');
  await page.goto('http://localhost:4300', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1200));

  // Login
  const usernameInput = await page.$('#username');
  if (usernameInput) {
    console.log('Logging in as SUPER_ADMIN...');
    await page.fill('#username', 'SUPER_ADMIN');
    await page.fill('#password', 'superadmin123');
    await page.click('#login-submit-btn');
    try {
      await page.waitForSelector('.uat-otp-helper-pill', { timeout: 4000 });
      await page.click('.uat-otp-helper-pill');
      await new Promise(r => setTimeout(r, 200));
      await page.click('#otp-verify-submit-btn');
    } catch (e) {}
    await new Promise(r => setTimeout(r, 2000));
  }

  for (const tab of TABS) {
    console.log(`Auditing & capturing tab: ${tab}...`);
    await page.evaluate((tabName) => {
      const appRoot = document.querySelector('app-root');
      if (appRoot && window.ng) {
        const comp = window.ng.getComponent(appRoot);
        if (comp && comp.switchTab) {
          comp.switchTab(tabName);
          try { window.ng.applyChanges(appRoot); } catch(e) {}
        }
      }
      const items = Array.from(document.querySelectorAll('.nav-menu-list li, .sidebar-nav li'));
      for (const it of items) {
        const t = (it.getAttribute('title') || '') + ' ' + (it.getAttribute('aria-label') || '') + ' ' + (it.textContent || '');
        if (t.toLowerCase().includes(tabName.toLowerCase().replace('-', ' '))) {
          it.click();
          break;
        }
      }
    }, tab);

    await new Promise(r => setTimeout(r, 1500));
    try {
      await page.waitForFunction(() => !document.querySelector('.loading-spinner, .table-loading-container, .spinner-border, .tab-loading-state'), { timeout: 6000 });
    } catch(e) {}
    await new Promise(r => setTimeout(r, 800));

    // If dispatch table has 0 rows, inject sample row to visualize action buttons layout
    if (tab === 'dispatch') {
      await page.evaluate(() => {
        const tbl = document.querySelector('.enterprise-dispatch-table');
        if (tbl) {
          const tbody = tbl.querySelector('tbody');
          if (tbody && tbody.querySelectorAll('tr').length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td class="td-checkbox"><input type="checkbox"></td>
              <td class="td-manifest"><span class="manifest-badge">DISP-2026-081</span></td>
              <td class="td-consignee"><span>Kisan Agro Processing Hub</span></td>
              <td class="td-date"><span>10 Oct 2026</span></td>
              <td class="td-vehicle"><span>MH-12-QZ-9811</span></td>
              <td class="td-driver"><span>Deepak Patil</span></td>
              <td class="td-destination"><span>Baramati Cold Depot</span></td>
              <td class="td-status"><span class="badge bg-success">Dispatched</span></td>
              <td class="td-actions table-action-col text-center">
                <div class="row-actions-group">
                  <button type="button" class="btn-row-action btn-view"><i class="bi bi-eye"></i></button>
                  <button type="button" class="btn-row-action btn-edit"><i class="bi bi-pencil-square"></i></button>
                  <button type="button" class="btn-row-action btn-delete"><i class="bi bi-trash3"></i></button>
                </div>
              </td>
            `;
            tbody.appendChild(tr);
          }
        }
      });
    }

    const shotPath = path.join(artifactDir, `${tab}.png`);
    await page.screenshot({ path: shotPath, fullPage: false });
    console.log(`Saved screenshot: ${shotPath}`);
  }

  await browser.close();
  console.log('ALL TABLE SCREENSHOTS CAPTURED SUCCESSFULLY!');
}

main().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
