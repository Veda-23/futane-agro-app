const { chromium } = require('@playwright/test');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 4205;
const DIST_DIR = path.join(__dirname, 'dist', 'frontend', 'browser');

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
      let pathname = parsedUrl.pathname.replace(/^\/+/, '');
      let filePath = path.join(DIST_DIR, pathname);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        res.writeHead(200);
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

async function test() {
  const server = await startServer();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  await context.addInitScript(() => {
    const mockUser = { id: 1, username: 'admin', name: 'Admin', role: 'SUPER_ADMIN' };
    window.sessionStorage.setItem('user', JSON.stringify(mockUser));
    window.localStorage.setItem('user', JSON.stringify(mockUser));
  });

  const page = await context.newPage();
  page.on('console', msg => { if (msg.type() === 'error') console.log('[Console Error]', msg.text()); });
  page.on('pageerror', err => console.log('[Page Error]', err.message));

  const testTabs = ['reports', 'analytics', 'audit-logs', 'settings'];

  for (const tab of testTabs) {
    console.log(`\nTesting Tab: ${tab}`);
    await page.evaluate(t => {
      sessionStorage.setItem('activeTab', t);
      localStorage.setItem('activeTab', t);
    }, tab);

    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const title = await page.$eval('h1, h2, .header-main-title', el => el.innerText).catch(() => 'No Title');
    console.log(`  Title: ${title.replace(/\n/g, ' ')}`);

    if (tab === 'reports') {
      const subtabs = await page.$$eval('.subnav-tab-btn', btns => btns.map(b => b.innerText.trim().replace(/\n/g, ' ')));
      console.log(`  Reports subtabs (${subtabs.length}):`, subtabs);

      for (let i = 0; i < subtabs.length; i++) {
        console.log(`  Clicking subtab ${i}: ${subtabs[i]}`);
        try {
          await page.evaluate((idx) => {
            const btns = document.querySelectorAll('.subnav-tab-btn');
            if (btns[idx]) {
              btns[idx].scrollIntoView();
              btns[idx].click();
            }
          }, i);
          await page.waitForTimeout(500);
          console.log(`    Successfully clicked subtab ${i}`);
        } catch (e) {
          console.log(`    Failed to click subtab ${i}:`, e.message);
        }
      }
    }
  }

  await browser.close();
  if (server) server.close();
  console.log('\nTest finished successfully!');
}

test().catch(err => console.error('Test error:', err));
