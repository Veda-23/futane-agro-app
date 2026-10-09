import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist/frontend/browser');
const outDir = path.resolve(__dirname, '../../artifacts_settings_qa');

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
  if (reqPath === '/' || !path.extname(reqPath)) reqPath = '/index.html';
  let filePath = path.join(distDir, reqPath);
  if (!fs.existsSync(filePath)) filePath = path.join(distDir, 'index.html');
  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, content) => {
    if (err) { res.writeHead(500); res.end('Error'); }
    else { res.writeHead(200, { 'Content-Type': contentType }); res.end(content); }
  });
});

const PORT = 4291;
server.listen(PORT, async () => {
  try {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1.5 });
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
    await page.waitForTimeout(1500);

    // Scroll to customizations grid
    await page.evaluate(() => {
      const grid = document.querySelector('.customizations-grid-layout');
      if (grid) {
        grid.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
    });
    await page.waitForTimeout(500);
    const gridShotPath = path.join(outDir, '01_Customizations_Grid_2_3_cards.png');
    await page.screenshot({ path: gridShotPath });
    console.log('Saved grid screenshot:', gridShotPath);
    await browser.close();
  } catch (e) {
    console.error(e);
  } finally {
    server.close();
    process.exit(0);
  }
});
