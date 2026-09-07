const fs = require('fs');
const path = require('path');
const http = require('http');

const dir = './grafana_dashboards_clean';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

const PROMETHEUS_DS = { type: 'prometheus', uid: 'cfwx0padnnaioe' };

function determineUnit(title, expr) {
  const t = (title + ' ' + (expr || '')).toLowerCase();
  
  if (t.includes('revenue') || t.includes('sales') || t.includes('payment') || t.includes('amount') || t.includes('razorpay') || t.includes('expense') || t.includes('salaries') || t.includes('bill')) {
    return 'currencyINR';
  }
  if (t.includes('%') || t.includes('percent') || t.includes('ratio') || t.includes('saturation') || t.includes('efficiency') || t.includes('attainment') || t.includes('yield') || t.includes('uptime') || t.includes('availability') || t.includes('hit') || t.includes('error rate') || t.includes('fail')) {
    return 'percent';
  }
  if (t.includes('latency') || t.includes('time') || t.includes('duration') || t.includes('flush') || t.includes('delay') || t.includes('(ms)')) {
    return 'ms';
  }
  if (t.includes('/s') || t.includes('rate') || t.includes('qps') || t.includes('throughput') || t.includes('velocity') || t.includes('operations')) {
    return 'reqps';
  }
  if (t.includes('bytes') || t.includes('memory') || t.includes('heap') || t.includes('disk') || t.includes('storage') || t.includes('ingress') || t.includes('egress') || t.includes('footprint')) {
    return 'decbytes';
  }
  return 'none';
}

files.forEach(file => {
  const fullPath = path.join(dir, file);
  const dash = JSON.parse(fs.readFileSync(fullPath, 'utf8'));

  // 1. Group panels into sections separated by rows
  let sections = [];
  let currentSec = { row: null, panels: [] };

  dash.panels.forEach(p => {
    // Fix Datasource UID to Prometheus
    p.datasource = PROMETHEUS_DS;
    if (p.targets && Array.isArray(p.targets)) {
      p.targets.forEach(t => t.datasource = PROMETHEUS_DS);
    }

    // Fix Unit
    const exprStr = p.targets && p.targets[0] ? p.targets[0].expr : '';
    const unit = determineUnit(p.title, exprStr);
    
    if (!p.fieldConfig) p.fieldConfig = { defaults: {}, overrides: [] };
    if (!p.fieldConfig.defaults) p.fieldConfig.defaults = {};
    if (unit !== 'none') {
      p.fieldConfig.defaults.unit = unit;
    }

    // Stat Styling
    if (p.type === 'stat') {
      if (!p.options) p.options = {};
      p.options.colorMode = 'background';
      p.options.graphMode = 'area';
      p.options.justifyMode = 'auto';
      p.options.orientation = 'auto';
      p.options.textMode = 'auto';
    }

    // Gauge Styling
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

  // 2. Re-calculate Grid Layout (w=6, h=4 for Stat panels -> 4 per row, NO truncation)
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
  console.log('Fixed & Saved:', file);
});

// 3. Re-import all fixed dashboards to Grafana
async function reimportAll() {
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const dash = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    delete dash.id;

    const payload = JSON.stringify({ dashboard: dash, overwrite: true, message: 'Fixed Datasource and Width' });

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

reimportAll().then(() => console.log('ALL DASHBOARDS SUCCESSFULLY RE-IMPORTED TO GRAFANA!'));
