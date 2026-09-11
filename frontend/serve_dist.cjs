const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, 'dist', 'frontend', 'browser');
const port = 4200;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
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
  const parsedUrl = new URL(req.url, `http://localhost:${port}`);
  let pathname = parsedUrl.pathname;

  // Handle mock api fallbacks if any slip past Playwright routes
  if (pathname.startsWith('/api/')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify([]));
  }

  let filePath = path.join(root, pathname);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    return fs.createReadStream(filePath).pipe(res);
  }

  // Fallback to index.html for SPA
  const indexPath = path.join(root, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return fs.createReadStream(indexPath).pipe(res);
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(port, () => {
  console.log(`STATIC_SERVER_READY_ON_PORT_${port}`);
});
