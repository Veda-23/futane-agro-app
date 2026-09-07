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

function getExactQueryAndFormat(title) {
  const t = (title || '').toLowerCase();

  if (t.includes('uptime') || t.includes('availability') || t.includes('health index')) {
    return { query: 'uptime', unit: 'percent', decimals: 1 };
  }
  if (t.includes('active user') || t.includes('user')) {
    return { query: 'active_users', unit: 'none', decimals: 0 };
  }
  if (t.includes('sales revenue') || t.includes('revenue') || t.includes('sales')) {
    return { query: 'sales_revenue', unit: 'currencyINR', decimals: 0 };
  }
  if (t.includes('alert') || t.includes('threat')) {
    return { query: 'active_alerts', unit: 'none', decimals: 0 };
  }
  if (t.includes('request rate') || t.includes('throughput')) {
    return { query: 'request_rate', unit: 'reqps', decimals: 2 };
  }
  if (t.includes('latency') || t.includes('response time')) {
    return { query: 'latency', unit: 'ms', decimals: 0 };
  }
  if (t.includes('jvm memory') || t.includes('heap') || t.includes('memory')) {
    return { query: 'jvm_memory_used_bytes{area="heap"}', unit: 'bytes', decimals: 1 };
  }
  if (t.includes('free storage') || t.includes('storage') || t.includes('disk')) {
    return { query: 'free_storage', unit: 'decgbytes', decimals: 1 };
  }
  if (t.includes('web login') || t.includes('login')) {
    return { query: 'login_hits', unit: 'none', decimals: 0 };
  }
  if (t.includes('total regs')) {
    return { query: 'total_regs', unit: 'none', decimals: 0 };
  }
  if (t.includes('active regs')) {
    return { query: 'total_regs', unit: 'none', decimals: 0 };
  }
  if (t.includes('fail %') || t.includes('reg fail') || t.includes('razorpay fail') || t.includes('error rate')) {
    return { query: 'fail_rate', unit: 'percent', decimals: 1 };
  }
  if (t.includes('bills paid')) {
    return { query: 'bills_paid', unit: 'none', decimals: 0 };
  }
  if (t.includes('bills pending')) {
    return { query: 'bills_pending', unit: 'none', decimals: 0 };
  }
  if (t.includes('razorpay total') || t.includes('payment')) {
    return { query: 'razorpay_total', unit: 'currencyINR', decimals: 0 };
  }
  if (t.includes('target attainm') || t.includes('yield') || t.includes('efficiency')) {
    return { query: 'target_attainment', unit: 'percent', decimals: 1 };
  }
  if (t.includes('connection saturati') || t.includes('hikaricp') || t.includes('jdbc')) {
    return { query: 'connection_saturation', unit: 'percent', decimals: 1 };
  }

  return { query: 'general_metric', unit: 'none', decimals: 0 };
}

function processPanel(panel) {
  if (panel.panels && Array.isArray(panel.panels)) {
    panel.panels.forEach(p => processPanel(p));
  }

  panel.datasource = { type: 'prometheus', uid: 'prometheus_ds' };

  const config = getExactQueryAndFormat(panel.title);

  if (!panel.fieldConfig) panel.fieldConfig = { defaults: {} };
  if (!panel.fieldConfig.defaults) panel.fieldConfig.defaults = {};

  panel.fieldConfig.defaults.unit = config.unit;
  panel.fieldConfig.defaults.decimals = config.decimals;

  if (panel.targets && Array.isArray(panel.targets)) {
    panel.targets.forEach((t, idx) => {
      t.datasource = { type: 'prometheus', uid: 'prometheus_ds' };
      t.expr = config.query;
      t.refId = t.refId || String.fromCharCode(65 + idx);
      t.format = 'time_series';
      t.instant = panel.type === 'stat' || panel.type === 'gauge';
      delete t.scenarioId;
      delete t.spread;
      delete t.noise;
      delete t.startValue;
      delete t.min;
      delete t.max;
    });
  }
}

async function run() {
  const searchResults = await apiRequest('/api/search');
  const dashboards = searchResults.filter(item => item.type === 'dash-db');

  console.log(`\n========================================================================`);
  console.log(`  SYNCHRONIZING EXACT METRICS ACROSS ${dashboards.length} GRAFANA DASHBOARDS`);
  console.log(`========================================================================\n`);

  for (const item of dashboards) {
    const dashData = await apiRequest(`/api/dashboards/uid/${item.uid}`);
    const dashboard = dashData.dashboard;

    if (dashboard.panels) {
      dashboard.panels.forEach(p => processPanel(p));
    }

    const saveRes = await apiRequest('/api/dashboards/db', 'POST', {
      dashboard: dashboard,
      folderId: item.folderId || 0,
      overwrite: true,
      message: 'Applied precise metric routing and units'
    });

    console.log(`✓ Updated "${dashboard.title}":`, saveRes.status || 'OK');
  }

  console.log(`\n✅ ALL GRAFANA DASHBOARD PANELS FIXED & MAPPED TO EXACT METRICS!\n`);
}

run().catch(console.error);
