const http = require('http');

const auth = 'Basic ' + Buffer.from('admin:FutaneAgro@Monitor2026!').toString('base64');

function apiRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Authorization': auth,
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
      });
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

function getSmartUnitAndDecimals(title, panelType) {
  const t = (title || '').toLowerCase();

  // 1. Currency (₹)
  if (t.includes('revenue') || t.includes('sales') || (t.includes('razorpay') && !t.includes('fail') && !t.includes('%')) || t.includes('settlement') || t.includes('cost') || t.includes('expense') || t.includes('dues') || t.includes('financial') || t.includes('target ₹')) {
    return { unit: 'currencyINR', decimals: 0, category: 'CURRENCY (₹)' };
  }

  // 2. Percentages (%)
  if (t.includes('%') || t.includes('percent') || t.includes('uptime') || t.includes('availability') || t.includes('efficiency') || t.includes('yield') || t.includes('fail %') || t.includes('saturation') || t.includes('attainm') || t.includes('utilization') || t.includes('threat index') || t.includes('health index') || t.includes('error rate') || t.includes('sla') || t.includes('slo')) {
    return { unit: 'percent', decimals: 1, category: 'PERCENT (%)' };
  }

  // 3. Request Rates (req/s, ops/s)
  if (t.includes('req/s') || t.includes('request rate') || t.includes('throughput') || t.includes('ops/s') || t.includes('velocity')) {
    return { unit: 'reqps', decimals: 2, category: 'RATE (req/s)' };
  }

  // 4. Time / Latency (ms)
  if (t.includes('latency') || t.includes('response time') || t.includes('duration') || t.includes('downtime')) {
    return { unit: 'ms', decimals: 0, category: 'LATENCY (ms)' };
  }

  // 5. Memory / Storage (Bytes / GB)
  if (t.includes('storage') || t.includes('disk') || t.includes('filesystem')) {
    return { unit: 'decgbytes', decimals: 1, category: 'STORAGE (GB)' };
  }
  if (t.includes('memory') || t.includes('jvm') || t.includes('heap') || t.includes('ram')) {
    return { unit: 'bytes', decimals: 1, category: 'MEMORY (Bytes)' };
  }

  // 6. Whole Numbers / Counts (Integers: 0, 1, 2, 12, 142)
  return { unit: 'none', decimals: 0, category: 'NUMBER (Count)' };
}

function processPanel(panel, auditStats) {
  if (panel.panels && Array.isArray(panel.panels)) {
    panel.panels.forEach(p => processPanel(p, auditStats));
  }

  panel.datasource = { type: 'prometheus', uid: 'prometheus_ds' };

  if (!panel.fieldConfig) panel.fieldConfig = { defaults: {} };
  if (!panel.fieldConfig.defaults) panel.fieldConfig.defaults = {};

  const formatting = getSmartUnitAndDecimals(panel.title, panel.type);

  panel.fieldConfig.defaults.unit = formatting.unit;
  panel.fieldConfig.defaults.decimals = formatting.decimals;

  auditStats[formatting.category] = (auditStats[formatting.category] || 0) + 1;

  if (panel.targets && Array.isArray(panel.targets)) {
    panel.targets.forEach(t => {
      t.datasource = { type: 'prometheus', uid: 'prometheus_ds' };
      delete t.scenarioId;
      delete t.spread;
      delete t.noise;
      delete t.startValue;
      delete t.min;
      delete t.max;
      t.instant = panel.type === 'stat' || panel.type === 'gauge';
    });
  }
}

async function run() {
  const searchResults = await apiRequest('/api/search');
  const dashboards = searchResults.filter(item => item.type === 'dash-db');

  console.log(`\n========================================================================`);
  console.log(`  AUDITING & APPLYING SMART NUMBER/PERCENT/CURRENCY UNITS ACROSS ${dashboards.length} DASHBOARDS`);
  console.log(`========================================================================\n`);

  const globalStats = {};

  for (const item of dashboards) {
    const dashData = await apiRequest(`/api/dashboards/uid/${item.uid}`);
    const dashboard = dashData.dashboard;

    const dashStats = {};

    if (dashboard.panels) {
      dashboard.panels.forEach(p => processPanel(p, dashStats));
    }

    // Merge into global
    for (const [k, v] of Object.entries(dashStats)) {
      globalStats[k] = (globalStats[k] || 0) + v;
    }

    const saveRes = await apiRequest('/api/dashboards/db', 'POST', {
      dashboard: dashboard,
      folderId: item.folderId || 0,
      overwrite: true,
      message: 'Applied smart percentage vs number vs currency unit standards'
    });

    console.log(`📊 "${dashboard.title}" (uid: ${dashboard.uid})`);
    for (const [cat, count] of Object.entries(dashStats)) {
      console.log(`   • ${cat}: ${count} panels`);
    }
    console.log(`   Status: ${saveRes.status || 'OK'}\n`);
  }

  console.log(`========================================================================`);
  console.log(`GLOBAL UNIT STANDARDIZATION SUMMARY (ALL PANELS):`);
  for (const [cat, count] of Object.entries(globalStats)) {
    console.log(`   ✓ ${cat}: ${count} panels formatted`);
  }
  console.log(`========================================================================\n`);
}

run().catch(console.error);
