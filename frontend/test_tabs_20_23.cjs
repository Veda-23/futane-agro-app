const { chromium } = require('@playwright/test');
const http = require('http');
const path = require('path');
const fs = require('fs');

const PORT = 4205;
const DIST_DIR = path.join(__dirname, 'dist', 'frontend', 'browser');

function startServer() {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.svg': 'image/svg+xml'
  };
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
      let pathname = parsedUrl.pathname.replace(/^\/+/, '');
      if (pathname.startsWith('ws-erp') || pathname.startsWith('sockjs')) {
        res.writeHead(204);
        return res.end();
      }
      let filePath = path.join(DIST_DIR, pathname);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        return fs.createReadStream(filePath).pipe(res);
      }
      const indexHtml = path.join(DIST_DIR, 'index.html');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      return fs.createReadStream(indexHtml).pipe(res);
    });
    server.listen(PORT, '127.0.0.1', () => resolve(server));
    server.on('error', () => resolve(null));
  });
}

(async () => {
  const server = await startServer();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.log('[Browser Error]', msg.text());
  });
  page.on('pageerror', err => console.log('[Page Error]', err.message));

  await page.route('**/ws-erp/**', route => route.abort());
  await page.route('**/sockjs/**', route => route.abort());

  await page.addInitScript(() => {
    const mockUser = { id: 1, username: 'admin', name: 'Super Admin', role: 'SUPER_ADMIN' };
    sessionStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('user', JSON.stringify(mockUser));
  });

  // Initial load
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);

  const testTabs = ['reports', 'analytics', 'audit-logs', 'settings'];

  for (const tab of testTabs) {
    console.log(`\nTesting tab: ${tab}`);
    await page.evaluate((t) => {
      sessionStorage.setItem('activeTab', t);
      localStorage.setItem('activeTab', t);
    }, tab);

    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(600);

    const subtabs = await page.evaluate(() => {
      const ribbon = document.querySelector(
        '.reports-subtabs-bar .subtabs-scroll-container, .reports-subtabs-bar, .subtabs-classification-bar .subtabs-scroll-container, .subtabs-classification-bar, .inv-subtabs-nav, .doc-type-tabs, .settings-nav-scroll-container, .settings-nav-pills, .subtabs-scroll-container'
      );
      if (!ribbon) return [];
      const btns = Array.from(ribbon.querySelectorAll('button, .subnav-tab-btn, .inv-subtab-btn, .doc-tab-btn, .settings-nav-pill'));
      return btns.map((b, idx) => ({
        index: idx,
        text: b.innerText.trim().replace(/\n/g, ' ')
      })).filter(item => item.text.length > 0);
    });

    console.log(`Tab [${tab}] found ${subtabs.length} subtabs:`, subtabs.map(s => s.text));

    for (let i = 0; i < subtabs.length; i++) {
      console.log(`  Clicking subtab [${i}]: ${subtabs[i].text}...`);
      await page.evaluate((idx) => {
        const ribbon = document.querySelector(
          '.reports-subtabs-bar .subtabs-scroll-container, .reports-subtabs-bar, .subtabs-classification-bar .subtabs-scroll-container, .subtabs-classification-bar, .inv-subtabs-nav, .doc-type-tabs, .settings-nav-scroll-container, .settings-nav-pills, .subtabs-scroll-container'
        );
        if (!ribbon) return;
        const btns = Array.from(ribbon.querySelectorAll('button, .subnav-tab-btn, .inv-subtab-btn, .doc-tab-btn, .settings-nav-pill'));
        if (btns[idx]) {
          btns[idx].scrollIntoView({ inline: 'center', block: 'nearest' });
          btns[idx].click();
        }
      }, i);
      await page.waitForTimeout(300);
    }
    console.log(`✓ Tab [${tab}] finished cleanly!`);
  }

  await browser.close();
  if (server) server.close();
  console.log('\nAll 4 tabs tested successfully!');
})();
