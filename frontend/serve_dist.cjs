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

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

const server = http.createServer((req, res) => {
  req.on('error', (err) => {
    console.error('Request error:', err.message);
  });

  res.on('error', (err) => {
    console.error('Response error:', err.message);
  });

  const parsedUrl = new URL(req.url, `http://localhost:${port}`);
  let pathname = parsedUrl.pathname;

  // Forward /api/ requests to active Spring Boot backend on port 8081
  if (pathname.startsWith('/api/')) {
    const proxyHeaders = { ...req.headers };
    proxyHeaders.host = '127.0.0.1:8081';
    const proxyReq = http.request({
      hostname: '127.0.0.1',
      port: 8081,
      path: req.url,
      method: req.method,
      headers: proxyHeaders
    }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });
    proxyReq.on('error', (err) => {
      console.error('API Proxy error to port 8081:', err.message);
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Backend unreachable on port 8081', details: err.message }));
      }
    });
    return req.pipe(proxyReq);
  }

  let filePath = path.join(root, pathname);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    const stream = fs.createReadStream(filePath);
    stream.on('error', () => { if (!res.headersSent) res.writeHead(500); res.end(); });
    res.on('close', () => { stream.destroy(); });
    return stream.pipe(res);
  }

  // Fallback to index.html for SPA
  const indexPath = path.join(root, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    const stream = fs.createReadStream(indexPath);
    stream.on('error', () => { if (!res.headersSent) res.writeHead(500); res.end(); });
    res.on('close', () => { stream.destroy(); });
    return stream.pipe(res);
  }

  res.writeHead(404);
  res.end('Not found');
});

server.on('clientError', (err, socket) => {
  if (err.code === 'ECONNRESET' || !socket.writable) return;
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

server.on('error', (err) => {
  console.error('Server error:', err.message);
});

server.listen(port, () => {
  console.log(`STATIC_SERVER_READY_ON_PORT_${port}`);
});

