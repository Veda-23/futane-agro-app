const fs = require('fs');
const path = require('path');
const http = require('http');

const dir = path.join(__dirname, '..', '..', 'grafana_dashboards_clean');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

console.log(`Processing ${files.length} dashboards in ${dir}...`);

files.forEach(file => {
  const filePath = path.join(dir, file);
  let raw = fs.readFileSync(filePath, 'utf8');
  if (raw.charCodeAt(0) === 0xFEFF) {
    raw = raw.slice(1);
  }
  const data = JSON.parse(raw);

  data.refresh = '5s';
  data.timezone = 'browser';
  data.time = { from: 'now-6h', to: 'now' };

  if (Array.isArray(data.panels)) {
    data.panels.forEach(panel => {
      if (panel.type === 'stat') {
        if (!panel.options) panel.options = {};
        panel.options.colorMode = 'background';
        panel.options.justifyMode = 'center';
        panel.options.textMode = 'auto';

        if (!panel.fieldConfig) panel.fieldConfig = {};
        if (!panel.fieldConfig.defaults) panel.fieldConfig.defaults = {};
        const defs = panel.fieldConfig.defaults;

        if (defs.color && defs.color.fixedColor) {
          const c = defs.color.fixedColor.toLowerCase();
          if (['#10b981', '#22c55e', 'green', 'semi-dark-green'].includes(c)) {
            defs.color.fixedColor = '#299c46';
          } else if (['#ef4444', '#dc2626', 'red'].includes(c)) {
            defs.color.fixedColor = '#e02f44';
          }
        }

        if (defs.thresholds && Array.isArray(defs.thresholds.steps)) {
          defs.thresholds.steps.forEach(step => {
            const sc = (step.color || '').toLowerCase();
            if (['#10b981', '#22c55e', 'green', 'semi-dark-green'].includes(sc)) {
              step.color = '#299c46';
            } else if (['#ef4444', '#dc2626', 'red'].includes(sc)) {
              step.color = '#e02f44';
            } else if (['#f59e0b', '#eab308', 'yellow', 'orange'].includes(sc)) {
              step.color = '#e0b400';
            }
          });
        }
      } else if (panel.type === 'timeseries') {
        if (!panel.fieldConfig) panel.fieldConfig = {};
        if (!panel.fieldConfig.defaults) panel.fieldConfig.defaults = {};
        if (!panel.fieldConfig.defaults.custom) panel.fieldConfig.defaults.custom = {};
        const custom = panel.fieldConfig.defaults.custom;
        custom.drawStyle = 'line';
        custom.lineInterpolation = 'smooth';
        custom.lineWidth = 2;
        custom.fillOpacity = 15;
        custom.gradientMode = 'opacity';
        custom.showPoints = 'never';
      }
    });
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`  🟢 Standardized: ${file}`);
});

console.log('All 10 dashboard files standardized with solid-background color styling!');
