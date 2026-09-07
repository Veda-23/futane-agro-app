const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', '..', 'grafana_dashboards_clean');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

console.log(`Building Dynatrace-Grade Multi-Format Dashboards for ${files.length} files...`);

const globalTemplating = [
  {
    name: 'environment',
    label: '🌐 Environment',
    type: 'custom',
    query: 'PROD,UAT,ALL',
    current: { text: 'UAT', value: 'UAT', selected: true },
    options: [
      { text: 'PROD (Port 8080)', value: 'PROD' },
      { text: 'UAT (Port 8081)', value: 'UAT', selected: true },
      { text: 'ALL Environments', value: 'ALL' }
    ],
    hide: 0,
    includeAll: false,
    multi: false
  },
  {
    name: 'module',
    label: '📦 Module',
    type: 'custom',
    query: 'ALL,Sales,Production,CRM,Transport,HR,Billing,Inventory,Security',
    current: { text: 'ALL', value: 'ALL', selected: true },
    options: [
      { text: 'ALL Modules', value: 'ALL', selected: true },
      { text: 'Sales & GST Engine', value: 'Sales' },
      { text: 'Production (PPD/PPM)', value: 'Production' },
      { text: 'CRM & Parties', value: 'CRM' },
      { text: 'Transports & Logistics', value: 'Transport' },
      { text: 'HR & Payroll', value: 'HR' },
      { text: 'Billing & Invoices', value: 'Billing' },
      { text: 'Inventory & Raw Materials', value: 'Inventory' },
      { text: 'Security & Auth', value: 'Security' }
    ],
    hide: 0,
    includeAll: true,
    multi: true
  },
  {
    name: 'interval',
    label: '⏱️ Resolution',
    type: 'interval',
    query: '10s,30s,1m,5m,15m,1h',
    current: { text: '1m', value: '1m', selected: true },
    options: [
      { text: '10s', value: '10s' },
      { text: '30s', value: '30s' },
      { text: '1m', value: '1m', selected: true },
      { text: '5m', value: '5m' },
      { text: '15m', value: '15m' },
      { text: '1h', value: '1h' }
    ],
    hide: 0
  },
  {
    name: 'severity',
    label: '🚨 Severity',
    type: 'custom',
    query: 'ALL,CRITICAL,ERROR,WARN,INFO',
    current: { text: 'ALL', value: 'ALL', selected: true },
    options: [
      { text: 'ALL', value: 'ALL', selected: true },
      { text: 'CRITICAL', value: 'CRITICAL' },
      { text: 'ERROR', value: 'ERROR' },
      { text: 'WARN', value: 'WARN' },
      { text: 'INFO', value: 'INFO' }
    ],
    hide: 0
  }
];

files.forEach(file => {
  const filePath = path.join(dir, file);
  let raw = fs.readFileSync(filePath, 'utf8');
  if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
  const data = JSON.parse(raw);

  data.refresh = '5s';
  data.timezone = 'browser';
  data.time = { from: 'now-6h', to: 'now' };
  data.templating = { list: globalTemplating };

  if (Array.isArray(data.panels)) {
    data.panels.forEach(panel => {
      // Enhance stat panels with solid background colors
      if (panel.type === 'stat') {
        if (!panel.options) panel.options = {};
        panel.options.colorMode = 'background';
        panel.options.justifyMode = 'center';
        panel.options.textMode = 'auto';
        panel.options.graphMode = 'none';

        if (!panel.fieldConfig) panel.fieldConfig = {};
        if (!panel.fieldConfig.defaults) panel.fieldConfig.defaults = {};
        const defs = panel.fieldConfig.defaults;

        const titleLower = (panel.title || '').toLowerCase();
        if (titleLower.includes('fail') || titleLower.includes('error') || titleLower.includes('critical') || titleLower.includes('outage') || titleLower.includes('locked')) {
          defs.color = { mode: 'fixed', fixedColor: '#e02f44' };
          defs.thresholds = { mode: 'absolute', steps: [{ color: '#e02f44', value: null }] };
        } else if (titleLower.includes('warning') || titleLower.includes('pending') || titleLower.includes('due') || titleLower.includes('downtime')) {
          defs.color = { mode: 'fixed', fixedColor: '#e0b400' };
          defs.thresholds = { mode: 'absolute', steps: [{ color: '#e0b400', value: null }] };
        } else {
          defs.color = { mode: 'fixed', fixedColor: '#299c46' };
          defs.thresholds = { mode: 'absolute', steps: [{ color: '#299c46', value: null }] };
        }
      } 
      // Enhance timeseries panels
      else if (panel.type === 'timeseries') {
        if (!panel.fieldConfig) panel.fieldConfig = {};
        if (!panel.fieldConfig.defaults) panel.fieldConfig.defaults = {};
        const custom = panel.fieldConfig.defaults.custom || {};
        custom.drawStyle = 'line';
        custom.lineInterpolation = 'smooth';
        custom.lineWidth = 2;
        custom.fillOpacity = 15;
        custom.gradientMode = 'opacity';
        custom.showPoints = 'never';
        panel.fieldConfig.defaults.custom = custom;
      }
    });
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`  🟢 Dynatrace Enhancements Applied: ${file}`);
});

console.log('All 10 dashboards successfully upgraded with Dynatrace Template Filters & Multi-Format Graph Schemas!');
