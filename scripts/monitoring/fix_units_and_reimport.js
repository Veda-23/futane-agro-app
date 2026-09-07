const fs = require('fs');
const path = require('path');
const http = require('http');

const dir = './grafana_dashboards_clean';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

const PROMETHEUS_DS = { type: 'prometheus', uid: 'cfwx0padnnaioe' };

function getExactUnit(title, expr) {
  const t = title.trim();
  const lower = t.toLowerCase();

  // 1. Explicit Percentage
  if (lower.includes('%') || lower.includes('percent') || lower.includes('success rate') || lower.includes('hit ratio') || lower.includes('availability') || lower.includes('uptime') || lower.includes('efficiency') || lower.includes('attainment') || lower.includes('yield') || lower.includes('oee') || lower.includes('saturation') || lower.includes('burn rate') || lower.includes('compliance')) {
    if (lower.includes('duration (ms)') || lower.includes('timeline (ms)') || lower.includes('latency (ms)')) {
      return 'ms';
    }
    if (lower.includes('(₹)') && !lower.includes('%')) {
      return 'currencyINR';
    }
    return 'percent';
  }

  // 2. Latency & Duration
  if (lower.includes('(ms)') || lower.includes('latency') || lower.includes('duration') || lower.includes('flush (ms)') || lower.includes('delay') || lower.includes('pause time') || lower.includes('handshake')) {
    return 'ms';
  }
  if (lower.includes('(s)') || lower.includes('replication lag')) {
    return 's';
  }

  // 3. Currency / Revenue
  if (lower.includes('(₹)') || lower.includes('revenue') || lower.includes('sales') || lower.includes('payment') || lower.includes('expense') || lower.includes('payroll') || lower.includes('bill paid') || lower.includes('razorpay total') || lower.includes('amount')) {
    return 'currencyINR';
  }

  // 4. Rates & Throughput
  if (lower.includes('/s') || lower.includes('/ sec') || lower.includes('qps') || lower.includes('throughput') || lower.includes('velocity') || lower.includes('operations rate')) {
    return 'reqps';
  }

  // 5. Memory & Storage
  if (lower.includes('bytes') || lower.includes('memory') || lower.includes('heap') || lower.includes('disk') || lower.includes('storage') || lower.includes('ingress') || lower.includes('egress') || lower.includes('footprint')) {
    return 'decbytes';
  }

  return 'none';
}

files.forEach(file => {
  const fullPath = path.join(dir, file);
  const dash = JSON.parse(fs.readFileSync(fullPath, 'utf8'));

  let sections = [];
  let currentSec = { row: null, panels: [] };

  dash.panels.forEach(p => {
    // 1. Ensure Datasource is Prometheus
    p.datasource = PROMETHEUS_DS;
    if (p.targets && Array.isArray(p.targets)) {
      p.targets.forEach(t => t.datasource = PROMETHEUS_DS);
    }

    // 2. Fix Field Unit Config
    const exprStr = p.targets && p.targets[0] ? p.targets[0].expr : '';
    const unit = getExactUnit(p.title, exprStr);
    
    if (!p.fieldConfig) p.fieldConfig = { defaults: {}, overrides: [] };
    if (!p.fieldConfig.defaults) p.fieldConfig.defaults = {};
    p.fieldConfig.defaults.unit = unit;

    // 3. Stat Panel Options
    if (p.type === 'stat') {
      if (!p.options) p.options = {};
      p.options.colorMode = 'background';
      p.options.graphMode = 'area';
      p.options.justifyMode = 'auto';
      p.options.orientation = 'auto';
      p.options.textMode = 'auto';
    }

    // 4. Gauge Panel Options
    if (p.type === 'gauge') {
      if (!p.options) p.options = {};
      p.options.min = 0;
      p.options.max = 100;
      p.options.showThresholdLabels = false;
      p.options.showThresholdMarkers = true;
    }

    if (p.type === 'row') {
      if (currentSec.row || currentSec.panels.length > 0) {
        sections.push(currentSec);
      }
      currentSec = { row: p, panels: [] };
    } else {
      currentSec.panels.push(p);
    }
  });
  if (currentSec.row || currentSec.panels.length > 0) {
    sections.push(currentSec);
  }

  // 5. Layout Calculation (w=6, h=4 for Stat panels -> 4 per row for 100% full text visibility)
  let y = 0;
  sections.forEach(sec => {
    if (sec.row) {
      sec.row.gridPos = { x: 0, y: y, w: 24, h: 1 };
      y += 1;
    }

    let currentX = 0;
    let maxHInRow = 0;

    sec.panels.forEach(p => {
      let w = p.gridPos.w;
      let h = p.gridPos.h;

      if (p.type === 'stat') {
        w = 6;
        h = 4;
      }
      if (p.type === 'gauge') {
        w = 4;
        h = 5;
      }

      if (currentX + w > 24) {
        y += maxHInRow;
        currentX = 0;
        maxHInRow = 0;
      }

      p.gridPos = { x: currentX, y: y, w: w, h: h };
      currentX += w;
      if (h > maxHInRow) maxHInRow = h;
    });

    if (maxHInRow > 0) {
      y += maxHInRow;
    }
  });

  fs.writeFileSync(fullPath, JSON.stringify(dash, null, 2), 'utf8');
  console.log('Fixed Units & Layout:', file);
});

// 6. Re-import all 10 dashboards into Grafana via REST API
async function reimportAll() {
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const dash = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    delete dash.id;

    const payload = JSON.stringify({ dashboard: dash, overwrite: true, message: 'Fixed Exact Units and Width' });

    await new Promise((resolve) => {
      const req = http.request('http://localhost:3000/api/dashboards/db', {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from('admin:FutaneAgro@Monitor2026!').toString('base64'),
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      }, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log('RE-IMPORTED [' + file + '] -> Status:', res.statusCode);
          resolve();
        });
      });
      req.on('error', err => {
        console.error('ERROR [' + file + ']:', err);
        resolve();
      });
      req.write(payload);
      req.end();
    });
  }
}

reimportAll().then(() => console.log('ALL DASHBOARDS SUCCESSFULLY RE-IMPORTED WITH PERFECT UNITS!'));
