const { chromium } = require('@playwright/test');
const http = require('http');
const path = require('path');
const fs = require('fs');

const PORT = 4208;
const DIST_DIR = path.join(__dirname, 'dist', 'frontend', 'browser');
const ARTIFACT_DIR = path.join(
  'C:', 'Users', 'Vedant', '.gemini', 'antigravity-ide', 'brain',
  '63ae1ca7-044a-4a77-a0c6-a06dc2558ecf'
);
const SHOTS_DIR = path.join(ARTIFACT_DIR, 'verified_modern_tabs');
if (!fs.existsSync(SHOTS_DIR)) fs.mkdirSync(SHOTS_DIR, { recursive: true });

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
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5
  });

  await context.addInitScript(() => {
    const mockUser = { id: 1, username: 'admin', name: 'Super Admin', role: 'SUPER_ADMIN' };
    sessionStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('user', JSON.stringify(mockUser));
  });

  const page = await context.newPage();
  await page.route('**/ws-erp/**', r => r.abort());
  await page.route('**/sockjs/**', r => r.abort());

  // Mock API routes with realistic sample data
  await page.route('**/api/**', async (route) => {
    const url = route.request().url();
    if (url.includes('/sales')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 101, saleId: 101, date: '2026-09-12', partyId: 1, party: { partyName: 'AgroFresh Maharashtra Ltd', city: 'Pune' }, crateType: 'Standard 20kg Apple Crate', crateMaterial: 'HDPE Virgin', quantity: 1200, rate: 240, totalAmount: 288000, paid: 288000, remaining: 0 },
          { id: 102, saleId: 102, date: '2026-09-11', partyId: 2, party: { partyName: 'Nashik Valley Cold Storage', city: 'Nashik' }, crateType: 'Heavy Duty Grape Crate', crateMaterial: 'PP Polymer', quantity: 800, rate: 310, totalAmount: 248000, paid: 100000, remaining: 148000 }
        ])
      });
    }
    if (url.includes('/parties')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, partyId: 'P-001', partyName: 'AgroFresh Maharashtra Ltd', city: 'Pune', state: 'Maharashtra', gstNumber: '27AABCA1122D1Z4', partyContact: '9822114477' },
          { id: 2, partyId: 'P-002', partyName: 'Nashik Valley Cold Storage', city: 'Nashik', state: 'Maharashtra', gstNumber: '27AABCN3344E1Z6', partyContact: '9422556688' }
        ])
      });
    }
    if (url.includes('/payments')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1101, paymentDate: '2026-09-12', partyName: 'AgroFresh Maharashtra Ltd', invoiceNo: 'INV-2026-089', amountReceived: 288000, paymentMode: 'BANK_TRANSFER' },
          { id: 1102, paymentDate: '2026-09-11', partyName: 'Nashik Valley Cold Storage', invoiceNo: 'INV-2026-088', amountReceived: 100000, paymentMode: 'UPI' }
        ])
      });
    }
    if (url.includes('/production/ppd') || url.includes('/ppd')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 201, ppdId: 201, date: '2026-09-12', shift: 'Shift 1 (Day)', crateType: 'Apple Crate', rawMaterialUsed: 1450, totalProduction: 1200, successful: 1182, rejected: 18 }
        ])
      });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });

  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);

  const tabsToVerify = ['production', 'sales', 'parties', 'payments'];

  for (const tab of tabsToVerify) {
    console.log(`Capturing verified tab: ${tab}...`);
    await page.evaluate((t) => {
      sessionStorage.setItem('activeTab', t);
      localStorage.setItem('activeTab', t);
    }, tab);

    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForSelector('.main-content, .content-body', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(600);

    const shotPath = path.join(SHOTS_DIR, `${tab}_modern_reference_look.png`);
    await page.screenshot({ path: shotPath });
    console.log(`✓ Saved: ${shotPath}`);
  }

  await browser.close();
  if (server) server.close();
  console.log('Verification completed successfully!');
})();
