const http = require('http');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

function getDistPath() {
  const pBrowser = path.join(rootDir, 'frontend', 'dist', 'frontend', 'browser');
  const pDirect = path.join(rootDir, 'frontend', 'dist', 'frontend');
  if (fs.existsSync(path.join(pBrowser, 'index.html'))) return pBrowser;
  if (fs.existsSync(path.join(pDirect, 'index.html'))) return pDirect;
  return pBrowser;
}

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
  // Proxy API and WebSocket requests to Spring Boot UAT backend (port 8081)
  if (req.url.startsWith('/api') || req.url.startsWith('/ws-erp')) {
    const proxyReq = http.request({
      hostname: '127.0.0.1',
      port: 8081,
      path: req.url,
      method: req.method,
      headers: req.headers
    }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', (err) => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Backend unreachable on port 8081', details: err.message }));
    });

    req.pipe(proxyReq, { end: true });
    return;
  }

  // Static files and Angular SPA routing
  const distPath = getDistPath();
  let cleanUrl = req.url.split('?')[0];
  let filePath = path.join(distPath, cleanUrl);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(distPath, 'index.html');
  }
  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end('Server Error: ' + err.message);
    } else {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      res.end(content, 'utf-8');
    }

  });
});

const PORT = 4200;

server.on('error', (err) => {
  console.error('Server error:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

server.listen(PORT, () => {
  console.log(`Futane Agro ERP Frontend serving at http://127.0.0.1:${PORT} (and http://localhost:${PORT})`);
  console.log(`Serving assets from: ${getDistPath()}`);
  console.log(`Proxying /api to http://127.0.0.1:8081`);
});
