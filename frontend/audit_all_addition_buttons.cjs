const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ARTIFACT_DIR = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/63ae1ca7-044a-4a77-a0c6-a06dc2558ecf/addition_audit';
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

const DIST_ROOT = path.join(__dirname, 'dist', 'frontend', 'browser');
const PORT = 4205;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

function startServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      req.on('error', () => {});
      res.on('error', () => {});

      const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
      let pathname = parsedUrl.pathname;

      if (pathname.startsWith('/api/') || pathname.startsWith('/ws-erp/')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify([]));
      }

      let relativePath = pathname.replace(/^\/+/, '');
      let filePath = path.join(DIST_ROOT, relativePath);

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath);
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        const stream = fs.createReadStream(filePath);
        res.on('close', () => stream.destroy());
        return stream.pipe(res);
      }

      const indexPath = path.join(DIST_ROOT, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        const stream = fs.createReadStream(indexPath);
        res.on('close', () => stream.destroy());
        return stream.pipe(res);
      }

      res.writeHead(404);
      res.end('Not found');
    });

    server.on('error', reject);
    server.listen(PORT, () => {
      console.log(`[Embedded Server] Running on http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

const TABS = [
  'dashboard',
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
  'billinghub',
  'bank',
  'expenses',
  'salaries',
  'employees',
  'reports',
  'analytics',
  'audit-logs',
  'settings'
];

async function runAudit() {
  const server = await startServer();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const auditLog = [];
  const errors = [];

  page.on('pageerror', err => {
    errors.push({ type: 'pageerror', message: err.message });
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push({ type: 'console.error', text: msg.text() });
    }
  });

  // Navigate once to bootstrap origin
  await page.goto(`http://localhost:${PORT}`);

  for (const tab of TABS) {
    console.log(`\n======================================================`);
    console.log(`>>> Auditing Tab: [${tab.toUpperCase()}]`);
    console.log(`======================================================`);

    try {
      // Re-inject fresh auth and activeTab on EVERY tab so session never expires
      await page.evaluate((t) => {
        const mockUser = {
          id: 1,
          username: 'admin',
          name: 'Super Administrator',
          role: 'SUPER_ADMIN',
          email: 'admin@futaneagro.com'
        };
        sessionStorage.setItem('user', JSON.stringify(mockUser));
        localStorage.setItem('user', JSON.stringify(mockUser));
        sessionStorage.setItem('activeTab', t);
        localStorage.setItem('activeTab', t);
        sessionStorage.setItem('loginTime', new Date().toString());
      }, tab);

      await page.reload();
      await page.waitForSelector('.main-content', { timeout: 10000 });
      await page.waitForTimeout(500);

      const baseScreenshot = path.join(ARTIFACT_DIR, `${tab}_base.png`);
      await page.screenshot({ path: baseScreenshot });

      const pageTitle = await page.$eval('.header-main-title, h1, h2', el => el.innerText.trim()).catch(() => tab);

      // 1. Detect Subtabs
      const subtabs = await page.$$eval(
        '.subtab-pill-btn, .subnav-tab-btn, .yono-tab-btn, .settings-nav-pill, .doc-type-pill, .nav-pills button',
        btns => btns.map((b, idx) => ({
          index: idx,
          text: b.innerText.trim().replace(/\n/g, ' '),
          isActive: b.classList.contains('active') || b.getAttribute('aria-selected') === 'true'
        }))
      );
      console.log(`  Page Title: "${pageTitle}"`);
      console.log(`  Subtabs detected (${subtabs.length}):`, subtabs.map(s => s.text).join(' | ') || 'None');

      // 2. Detect Addition Buttons
      const additionButtons = await page.$$eval(
        '.main-content button, .main-content a.btn',
        btns => btns
          .filter(b => {
            const c = b.className || '';
            if (c.includes('subtab') || c.includes('subnav') || c.includes('nav-link') || c.includes('yono-tab') || c.includes('page-link') || c.includes('dropdown-item')) {
              return false;
            }
            const text = b.innerText.trim();
            const isAction = /\b(Add|New|Register|Enroll|Create|Log\s+|Record\s+|Process\s+)/i.test(text);
            const isExcluded = /\b(Export|Clear|Reset|Filter|Columns|Refresh|Cancel|Close|Back|Search|Edit|Delete|Download|Print)\b/i.test(text);
            return isAction && !isExcluded && b.offsetWidth > 0 && b.offsetHeight > 0;
          })
          .map(b => ({
            text: b.innerText.trim().replace(/\n/g, ' '),
            classes: b.className
          }))
      );

      console.log(`  Addition buttons found (${additionButtons.length}):`, additionButtons.map(b => b.text).join(' | ') || 'None');

      const tabAudit = {
        tab,
        pageTitle,
        subtabs,
        additionButtons,
        buttonTests: [],
        subtabTests: []
      };

      // 3. Test Each Addition Button
      for (let i = 0; i < additionButtons.length; i++) {
        const btn = additionButtons[i];
        console.log(`    -> Testing Addition Button [${i + 1}/${additionButtons.length}]: "${btn.text}"`);

        const btnLocator = page.locator('.main-content button, .main-content a.btn').filter({ hasText: btn.text }).first();

        try {
          await btnLocator.click({ timeout: 2500 });
          await page.waitForTimeout(500);

          const modal = await page.$('.modal.show, [role="dialog"].show, .erp-modal');
          const drawer = await page.$('.drawer-panel, .erp-drawer.open, .slide-drawer.open, .side-drawer.open, [class*="drawer"][style*="display: block"], [class*="drawer"].open');
          const inlineForm = await page.$('form:visible, .entry-form:visible, .creation-form:visible, .form-container:visible, .sales-form-card:visible, .erp-form-card:visible');

          const modalVisible = !!modal;
          const drawerVisible = !!drawer;
          const formVisible = !!inlineForm;
          const currentTab = await page.evaluate(() => sessionStorage.getItem('activeTab'));
          const didNavigate = currentTab !== tab;
          const didOpenAnything = modalVisible || drawerVisible || formVisible || didNavigate;

          const openScreenshot = path.join(ARTIFACT_DIR, `${tab}_btn_${i}_open.png`);
          await page.screenshot({ path: openScreenshot });

          const formElementsCount = await page.evaluate(() => {
            return document.querySelectorAll('input:not([type="hidden"]), select, textarea').length;
          });

          console.log(`       Outcome: Modal=${modalVisible}, Drawer=${drawerVisible}, InlineForm=${formVisible}, Navigated=${didNavigate} (Form Controls=${formElementsCount})`);

          let issue = null;
          if (!didOpenAnything) {
            issue = `BUTTON_NO_ACTION: Button "${btn.text}" was clicked but no modal, drawer, or form opened.`;
            console.warn(`       ⚠️ ISSUE: ${issue}`);
          }

          tabAudit.buttonTests.push({
            button: btn.text,
            modalVisible,
            drawerVisible,
            formVisible,
            didNavigate,
            didOpenAnything,
            formElementsCount,
            issue,
            screenshot: path.basename(openScreenshot)
          });

          // Close button attempts
          const closeBtn = page.locator(
            '.drawer-close-btn, .erp-drawer-header button, .btn-action-icon, .btn-close-form, .modal-header .btn-close, [aria-label="Close"], button:has-text("Close Form"), button:has-text("Cancel"), button:has-text("Close")'
          ).first();

          if (await closeBtn.isVisible().catch(() => false)) {
            await closeBtn.click({ timeout: 1200 }).catch(() => {});
            await page.waitForTimeout(300);
          }

          // Force remove all overlays and open classes
          await page.evaluate(() => {
            document.querySelectorAll('.drawer-backdrop, .modal-backdrop, .erp-drawer-overlay').forEach(el => el.remove());
            document.querySelectorAll('.drawer-panel, .erp-drawer, .modal, .sales-form-card').forEach(el => {
              el.classList.remove('open', 'show');
            });
          });
          await page.waitForTimeout(200);

        } catch (err) {
          console.error(`       Error clicking button "${btn.text}":`, err.message);
          tabAudit.buttonTests.push({
            button: btn.text,
            issue: `CLICK_ERROR: ${err.message}`
          });
          await page.evaluate(() => {
            document.querySelectorAll('.drawer-backdrop, .modal-backdrop, .erp-drawer-overlay').forEach(el => el.remove());
          }).catch(() => {});
        }
      }

      // 4. Test Subtabs
      for (let s = 0; s < subtabs.length; s++) {
        const sub = subtabs[s];
        console.log(`    -> Testing Subtab [${s + 1}/${subtabs.length}]: "${sub.text}"`);

        try {
          // Clean overlays before clicking subtab
          await page.evaluate(() => {
            document.querySelectorAll('.drawer-backdrop, .modal-backdrop, .erp-drawer-overlay').forEach(el => el.remove());
          });

          const subLocator = page.locator('.subtab-pill-btn, .subnav-tab-btn, .yono-tab-btn, .settings-nav-pill, .doc-type-pill, .nav-pills button').nth(s);
          if (await subLocator.isVisible()) {
            await subLocator.click({ timeout: 2000 });
            await page.waitForTimeout(400);

            const subScreenshot = path.join(ARTIFACT_DIR, `${tab}_sub_${s}.png`);
            await page.screenshot({ path: subScreenshot });

            const contentCheck = await page.evaluate(() => {
              const table = document.querySelector('table');
              const emptyState = document.querySelector('app-empty-state, .empty-state');
              const kpiCards = document.querySelectorAll('.kpi-card-v2, .kpi-card, .metric-card');
              const rows = document.querySelectorAll('tbody tr');
              return {
                hasTable: !!table,
                rowCount: rows.length,
                hasEmptyState: !!emptyState,
                kpiCount: kpiCards.length
              };
            });

            tabAudit.subtabTests.push({
              subtab: sub.text,
              hasTable: contentCheck.hasTable,
              rowCount: contentCheck.rowCount,
              hasEmptyState: contentCheck.hasEmptyState,
              kpiCount: contentCheck.kpiCount,
              screenshot: path.basename(subScreenshot)
            });
          }
        } catch (err) {
          console.error(`       Error clicking subtab "${sub.text}":`, err.message);
          tabAudit.subtabTests.push({
            subtab: sub.text,
            issue: `SUBTAB_ERROR: ${err.message}`
          });
        }
      }

      auditLog.push(tabAudit);
    } catch (tabErr) {
      console.error(`  ❌ Error during tab [${tab}]:`, tabErr.message);
      const errScreenshot = path.join(ARTIFACT_DIR, `${tab}_error.png`);
      await page.screenshot({ path: errScreenshot }).catch(() => {});
      auditLog.push({
        tab,
        issue: `TAB_FATAL_ERROR: ${tabErr.message}`,
        screenshot: path.basename(errScreenshot)
      });
    }
  }

  await browser.close();
  server.close();

  const reportPath = path.join(ARTIFACT_DIR, 'comprehensive_audit_results.json');
  fs.writeFileSync(reportPath, JSON.stringify({ auditLog, errors }, null, 2));

  console.log(`\n======================================================`);
  console.log(`AUDIT COMPLETE! All 23 tabs, subtabs, and buttons checked.`);
  console.log(`Results written to: ${reportPath}`);
  console.log(`======================================================`);
}

runAudit().catch(err => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
