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

const zlib = require('zlib');

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
    const proxyHeaders = { ...req.headers, host: '127.0.0.1:8081' };
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
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
      }
      res.end(JSON.stringify({ error: 'Backend unreachable on port 8081', details: err.message }));
    });

    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
      proxyReq.end();
    } else {
      req.pipe(proxyReq);
    }
    return;
  }

  // Docs static route
  if (req.url.startsWith('/docs/')) {
    const cleanUrl = req.url.split('?')[0];
    const docFilePath = path.join(rootDir, cleanUrl);
    if (fs.existsSync(docFilePath) && !fs.statSync(docFilePath).isDirectory()) {
      const ext = path.extname(docFilePath);
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(docFilePath).pipe(res);
      return;
    }
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
  
  // Smart caching: Hashed chunks (.js, .css, fonts) are immutable (365 days cache)
  // index.html is no-cache to guarantee instant pickup of updates
  const isHashedAsset = ext !== '.html' && /[.-][a-zA-Z0-9_-]{8,}\.(js|css|woff2|png|svg)$/.test(filePath);
  const cacheControl = isHashedAsset 
    ? 'public, max-age=31536000, immutable' 
    : 'no-cache, no-store, must-revalidate';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end('Server Error: ' + err.message);
      return;
    }

    const acceptEncoding = req.headers['accept-encoding'] || '';
    const compressible = /text|javascript|json|svg|css/.test(contentType);

    if (compressible && acceptEncoding.includes('gzip')) {
      zlib.gzip(content, (gzErr, zipped) => {
        if (gzErr) {
          res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': cacheControl });
          res.end(content);
        } else {
          res.writeHead(200, {
            'Content-Type': contentType,
            'Content-Encoding': 'gzip',
            'Cache-Control': cacheControl
          });
          res.end(zipped);
        }
      });
    } else {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': cacheControl
      });
      res.end(content);
    }
  });
});

const PORT = process.env.PORT || parseInt(process.argv[2], 10) || 4300;

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
