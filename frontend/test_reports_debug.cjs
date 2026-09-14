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
  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.log('[Browser Error]', msg.text());
  });
  page.on('pageerror', err => console.log('[Page Error]', err.message));

  await page.addInitScript(() => {
    const mockUser = { id: 1, username: 'admin', name: 'Super Admin', role: 'SUPER_ADMIN' };
    sessionStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('user', JSON.stringify(mockUser));
    sessionStorage.setItem('activeTab', 'reports');
  });

  console.log('Navigating to reports...');
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  console.log('Finding subtabs in reports...');
  const subtabs = await page.evaluate(() => {
    const ribbon = document.querySelector('.reports-subtabs-bar .subtabs-scroll-container, .subtabs-scroll-container');
    if (!ribbon) return [];
    return Array.from(ribbon.querySelectorAll('button, .subnav-tab-btn')).map((b, idx) => ({
      index: idx,
      text: b.innerText.trim().replace(/\n/g, ' ')
    }));
  });
  console.log('Found subtabs:', subtabs);

  for (let i = 0; i < subtabs.length; i++) {
    console.log(`Clicking subtab [${i}]: ${subtabs[i].text}...`);
    try {
      await page.evaluate((idx) => {
        const ribbon = document.querySelector('.reports-subtabs-bar .subtabs-scroll-container, .subtabs-scroll-container');
        const btns = Array.from(ribbon.querySelectorAll('button, .subnav-tab-btn'));
        btns[idx].scrollIntoView();
        btns[idx].click();
      }, i);
      await page.waitForTimeout(500);
      console.log(`✓ Clicked subtab [${i}] successfully.`);
    } catch (e) {
      console.error(`Error on subtab [${i}]:`, e.message);
    }
  }

  await browser.close();
  if (server) server.close();
  console.log('Done test_reports_debug!');
})();
