const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

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

const server = http.createServer((req, res) => {
  req.on('error', () => {});
  res.on('error', () => {});

  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  let pathname = parsedUrl.pathname;

  if (pathname.startsWith('/api/')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify([]));
  }

  // Check if file exists in DIST_ROOT
  let relativePath = pathname.replace(/^\/+/, '');
  let filePath = path.join(DIST_ROOT, relativePath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    const stream = fs.createReadStream(filePath);
    res.on('close', () => stream.destroy());
    return stream.pipe(res);
  }

  // SPA fallback
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

server.listen(PORT, async () => {
  console.log(`Server listening on port ${PORT}`);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE_ERROR:', err.message));

  await page.goto(`http://localhost:${PORT}`);

  // Inject session
  await page.evaluate(() => {
    const mockUser = {
      id: 1,
      username: 'admin',
      name: 'Super Administrator',
      role: 'SUPER_ADMIN',
      email: 'admin@futaneagro.com'
    };
    sessionStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('user', JSON.stringify(mockUser));
    sessionStorage.setItem('activeTab', 'dashboard');
    localStorage.setItem('activeTab', 'dashboard');
  });

  await page.reload();
  await page.waitForTimeout(2500);

  const mainVisible = await page.$eval('.main-content', el => !!el).catch(() => false);
  const loginVisible = await page.$eval('app-login', el => !!el).catch(() => false);
  console.log('Result -> main-content:', mainVisible, '| app-login:', loginVisible);

  await page.screenshot({ path: 'test_port4205_result.png' });
  console.log('Screenshot saved to test_port4205_result.png');

  await browser.close();
  server.close();
  process.exit(0);
});
