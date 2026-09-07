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

function formatPanel(panel) {
  if (panel.panels && Array.isArray(panel.panels)) {
    panel.panels.forEach(p => formatPanel(p));
  }

  // Ensure top-level datasource is prometheus_ds
  panel.datasource = { type: 'prometheus', uid: 'prometheus_ds' };

  if (!panel.fieldConfig) panel.fieldConfig = { defaults: {} };
  if (!panel.fieldConfig.defaults) panel.fieldConfig.defaults = {};

  const title = (panel.title || '').toLowerCase();

  // Decimal & Unit Formatting
  if (title.includes('sales revenue') || title.includes('revenue') || title.includes('settlement') || title.includes('financial') || title.includes('cost')) {
    panel.fieldConfig.defaults.unit = 'currencyINR';
    panel.fieldConfig.defaults.decimals = 0;
  } else if (title.includes('uptime') || title.includes('efficiency') || title.includes('yield') || title.includes('fail %') || title.includes('saturation') || title.includes('rate %')) {
    panel.fieldConfig.defaults.unit = 'percent';
    panel.fieldConfig.defaults.decimals = 1;
  } else if (title.includes('request rate') || title.includes('throughput') || title.includes('req/s')) {
    panel.fieldConfig.defaults.unit = 'reqps';
    panel.fieldConfig.defaults.decimals = 2;
  } else if (title.includes('latency') || title.includes('response time') || title.includes('duration')) {
    panel.fieldConfig.defaults.unit = 'ms';
    panel.fieldConfig.defaults.decimals = 0;
  } else if (title.includes('memory') || title.includes('heap') || title.includes('storage') || title.includes('disk') || title.includes('ram')) {
    panel.fieldConfig.defaults.unit = title.includes('storage') ? 'decgbytes' : 'bytes';
    panel.fieldConfig.defaults.decimals = 1;
  } else if (title.includes('user') || title.includes('hits') || title.includes('regs') || title.includes('bills') || title.includes('razorpay') || title.includes('alerts') || title.includes('count') || title.includes('threads') || title.includes('pool') || title.includes('total') || title.includes('active')) {
    panel.fieldConfig.defaults.unit = 'none';
    panel.fieldConfig.defaults.decimals = 0;
  }

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
  console.log(`Formatting and setting integer units on ${dashboards.length} dashboards...`);

  for (const item of dashboards) {
    const dashData = await apiRequest(`/api/dashboards/uid/${item.uid}`);
    const dashboard = dashData.dashboard;

    if (dashboard.panels) {
      dashboard.panels.forEach(p => formatPanel(p));
    }

    const saveRes = await apiRequest('/api/dashboards/db', 'POST', {
      dashboard: dashboard,
      folderId: item.folderId || 0,
      overwrite: true,
      message: 'Applied integer units (decimals: 0) and live Prometheus bridge'
    });

    console.log(`✓ Formatted "${dashboard.title}":`, saveRes.status || 'OK');
  }

  console.log('\n✅ All Grafana dashboard panels updated with clean integer formatting!');
}

run().catch(console.error);
