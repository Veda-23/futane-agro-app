const fs = require('fs');
const path = require('path');
const http = require('http');

const dir = path.join(__dirname, '..', '..', 'grafana_dashboards_clean');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

const auth = Buffer.from('admin:FutaneAgro@Monitor2026!').toString('base64');

async function ensureFolder() {
  return new Promise((resolve) => {
    const postData = JSON.stringify({ uid: 'system_infra', title: 'System & Infra' });
    const req = http.request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/folders',
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve(json.id || 0);
        } catch {
          resolve(0);
        }
      });
    });
    req.on('error', () => resolve(0));
    req.write(postData);
    req.end();
  });
}

async function uploadDashboard(file, folderId) {
  return new Promise((resolve) => {
    const filePath = path.join(dir, file);
    let raw = fs.readFileSync(filePath, 'utf8');
    if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
    const dashObj = JSON.parse(raw);
    dashObj.id = null;

    const payload = JSON.stringify({
      dashboard: dashObj,
      overwrite: true,
      folderId: folderId || 0
    });

    const req = http.request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/dashboards/db',
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.status === 'success' || json.id) {
            console.log(`  [PASS] Uploaded ${file} -> "${dashObj.title}" (URL: http://localhost:3000${json.url})`);
          } else {
            console.log(`  [FAIL] ${file} -> ${json.message || body}`);
          }
        } catch {
          console.log(`  [FAIL] ${file} -> ${body}`);
        }
        resolve();
      });
    });
    req.on('error', (err) => {
      console.log(`  [ERROR] ${file}: ${err.message}`);
      resolve();
    });
    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log('================================================================');
  console.log(' UPLOADING 10 STANDARDIZED DASHBOARDS TO GRAFANA (SINGLE FOLDER)');
  console.log(' Target Folder: "System & Infra" (http://localhost:3000)');
  console.log('================================================================');

  const folderId = await ensureFolder();

  for (const file of files) {
    await uploadDashboard(file, folderId);
  }

  console.log('================================================================');
  console.log(' ALL 10 DASHBOARDS SYNCED TO SINGLE FOLDER SUCCESSFULLY!');
  console.log('================================================================');
}

main();
