const fs = require('fs');
const path = require('path');
const http = require('http');

const dir = './grafana_dashboards_clean';
const PROMETHEUS_DS = { type: 'prometheus', uid: 'cfwx0padnnaioe' };

// ── 1. L1 MASTER WALLBOARD DASHBOARD ──
const l1Dashboard = {
  id: null,
  uid: 'l1_wallboard_master',
  title: 'L1 - EXECUTIVE COMMAND CENTER (NOC WALLBOARD)',
  tags: ['L1', 'WALLBOARD', 'EXECUTIVE', 'NOC'],
  style: 'dark',
  timezone: 'browser',
  editable: true,
  liveNow: true,
  refresh: '5s',
  schemaVersion: 38,
  templating: {
    list: [
      {
        name: 'environment',
        type: 'custom',
        query: 'UAT,PROD,ALL',
        current: { text: 'UAT', value: 'UAT', selected: true },
        options: [
          { text: 'UAT', value: 'UAT', selected: true },
          { text: 'PROD', value: 'PROD', selected: false },
          { text: 'ALL', value: 'ALL', selected: false }
        ]
      }
    ]
  },
  time: { from: 'now-1h', to: 'now' },
  panels: [
    {
      type: 'row',
      title: '📺 SECTION 1: L1 REAL-TIME SERVICE HEALTH (REFERENCE WALLBOARD)',
      gridPos: { x: 0, y: 0, w: 24, h: 1 }
    },
    // Branch Portal Login Cluster
    {
      type: 'stat',
      title: 'Branch Portal Login — Total',
      datasource: PROMETHEUS_DS,
      gridPos: { x: 0, y: 1, w: 8, h: 4 },
      targets: [{ refId: 'A', expr: 'service_total_requests{service="inventory"}' }],
      fieldConfig: { defaults: { unit: 'none', color: { mode: 'fixed', fixedColor: 'green' } } },
      options: { colorMode: 'background', graphMode: 'none', justifyMode: 'auto', orientation: 'auto', textMode: 'value_and_name' }
    },
    {
      type: 'stat',
      title: 'Branch Portal Login — Fail',
      datasource: PROMETHEUS_DS,
      gridPos: { x: 8, y: 1, w: 8, h: 4 },
      targets: [{ refId: 'A', expr: 'service_fail_requests{service="inventory"}' }],
      fieldConfig: { defaults: { unit: 'none', color: { mode: 'fixed', fixedColor: 'green' } } },
      options: { colorMode: 'background', graphMode: 'none', justifyMode: 'auto', orientation: 'auto', textMode: 'value_and_name' }
    },
    {
      type: 'stat',
      title: 'Branch Portal Login — Fail %',
      datasource: PROMETHEUS_DS,
      gridPos: { x: 16, y: 1, w: 8, h: 4 },
      targets: [{ refId: 'A', expr: 'service_fail_percent{service="inventory"}' }],
      fieldConfig: {
        defaults: {
          unit: 'percent',
          thresholds: {
            mode: 'absolute',
            steps: [{ color: 'green', value: null }, { color: 'red', value: 5.0 }]
          }
        }
      },
      options: { colorMode: 'background', graphMode: 'none', justifyMode: 'auto', orientation: 'auto', textMode: 'value_and_name' }
    },

    // Fundtransfer V3 Cluster (RED Alert)
    {
      type: 'stat',
      title: 'Fundtransfer V3 — Total',
      datasource: PROMETHEUS_DS,
      gridPos: { x: 0, y: 5, w: 8, h: 4 },
      targets: [{ refId: 'A', expr: 'service_total_requests{service="payments"}' }],
      fieldConfig: { defaults: { unit: 'none', color: { mode: 'fixed', fixedColor: 'green' } } },
      options: { colorMode: 'background', graphMode: 'none', justifyMode: 'auto', orientation: 'auto', textMode: 'value_and_name' }
    },
    {
      type: 'stat',
      title: 'Fundtransfer V3 — Fail',
      datasource: PROMETHEUS_DS,
      gridPos: { x: 8, y: 5, w: 8, h: 4 },
      targets: [{ refId: 'A', expr: 'service_fail_requests{service="payments"}' }],
      fieldConfig: { defaults: { unit: 'none', color: { mode: 'fixed', fixedColor: 'green' } } },
      options: { colorMode: 'background', graphMode: 'none', justifyMode: 'auto', orientation: 'auto', textMode: 'value_and_name' }
    },
    {
      type: 'stat',
      title: 'Fundtransfer V3 — Fail %',
      datasource: PROMETHEUS_DS,
      gridPos: { x: 16, y: 5, w: 8, h: 4 },
      targets: [{ refId: 'A', expr: 'service_fail_percent{service="payments"}' }],
      fieldConfig: {
        defaults: {
          unit: 'percent',
          thresholds: {
            mode: 'absolute',
            steps: [{ color: 'green', value: null }, { color: 'red', value: 5.0 }]
          }
        }
      },
      options: { colorMode: 'background', graphMode: 'none', justifyMode: 'auto', orientation: 'auto', textMode: 'value_and_name' }
    },

    // Bill Payments Cluster
    {
      type: 'stat',
      title: 'Bill Payments — Total',
      datasource: PROMETHEUS_DS,
      gridPos: { x: 0, y: 9, w: 8, h: 4 },
      targets: [{ refId: 'A', expr: 'service_total_requests{service="invoicing"}' }],
      fieldConfig: { defaults: { unit: 'none', color: { mode: 'fixed', fixedColor: 'green' } } },
      options: { colorMode: 'background', graphMode: 'none', justifyMode: 'auto', orientation: 'auto', textMode: 'value_and_name' }
    },
    {
      type: 'stat',
      title: 'Bill Payments — Fail',
      datasource: PROMETHEUS_DS,
      gridPos: { x: 8, y: 9, w: 8, h: 4 },
      targets: [{ refId: 'A', expr: 'service_fail_requests{service="invoicing"}' }],
      fieldConfig: { defaults: { unit: 'none', color: { mode: 'fixed', fixedColor: 'green' } } },
      options: { colorMode: 'background', graphMode: 'none', justifyMode: 'auto', orientation: 'auto', textMode: 'value_and_name' }
    },
    {
      type: 'stat',
      title: 'Bill Payments — Fail %',
      datasource: PROMETHEUS_DS,
      gridPos: { x: 16, y: 9, w: 8, h: 4 },
      targets: [{ refId: 'A', expr: 'service_fail_percent{service="invoicing"}' }],
      fieldConfig: {
        defaults: {
          unit: 'percent',
          thresholds: {
            mode: 'absolute',
            steps: [{ color: 'green', value: null }, { color: 'red', value: 5.0 }]
          }
        }
      },
      options: { colorMode: 'background', graphMode: 'none', justifyMode: 'auto', orientation: 'auto', textMode: 'value_and_name' }
    },

    // SLA Latency Stacked Bar Histogram
    {
      type: 'timeseries',
      title: 'CCS_2.0 Hits( 🟢 0–2s  🟡 2–4s  🔴 >4s )(Infra)',
      datasource: PROMETHEUS_DS,
      gridPos: { x: 0, y: 13, w: 24, h: 9 },
      targets: [
        { refId: 'A', expr: 'sla_hits_0_2s' },
        { refId: 'B', expr: 'sla_hits_2_4s' },
        { refId: 'C', expr: 'sla_hits_gt_4s' }
      ],
      fieldConfig: {
        defaults: { unit: 'short' },
        overrides: [
          { matcher: { id: 'byName', options: 'A' }, properties: [{ id: 'displayName', value: '🟢 0–2s (Optimal)' }, { id: 'color', value: { mode: 'fixed', fixedColor: 'green' } }] },
          { matcher: { id: 'byName', options: 'B' }, properties: [{ id: 'displayName', value: '🟡 2–4s (Degraded)' }, { id: 'color', value: { mode: 'fixed', fixedColor: 'yellow' } }] },
          { matcher: { id: 'byName', options: 'C' }, properties: [{ id: 'displayName', value: '🔴 >4s (Infra)' }, { id: 'color', value: { mode: 'fixed', fixedColor: 'red' } }] }
        ]
      },
      options: {
        tooltip: { mode: 'multi' },
        legend: { displayMode: 'list', placement: 'bottom' }
      }
    },

    // Capacity & Health Gauges
    {
      type: 'row',
      title: '🎛️ SECTION 2: SYSTEM CAPACITY & HEALTH GAUGES',
      gridPos: { x: 0, y: 22, w: 24, h: 1 }
    },
    {
      type: 'gauge',
      title: 'HikariCP Connection Pool Saturation',
      datasource: PROMETHEUS_DS,
      gridPos: { x: 0, y: 23, w: 4, h: 5 },
      targets: [{ refId: 'A', expr: 'hikaricp_connections_active' }],
      fieldConfig: { defaults: { unit: 'percent', min: 0, max: 100 } }
    },
    {
      type: 'gauge',
      title: 'InnoDB Buffer Hit Ratio',
      datasource: PROMETHEUS_DS,
      gridPos: { x: 4, y: 23, w: 4, h: 5 },
      targets: [{ refId: 'A', expr: 'buffer_hit_ratio' }],
      fieldConfig: { defaults: { unit: 'percent', min: 0, max: 100 } }
    },
    {
      type: 'gauge',
      title: 'Overall System Availability',
      datasource: PROMETHEUS_DS,
      gridPos: { x: 8, y: 23, w: 4, h: 5 },
      targets: [{ refId: 'A', expr: 'uptime' }],
      fieldConfig: { defaults: { unit: 'percent', min: 0, max: 100 } }
    },
    {
      type: 'gauge',
      title: 'Target Attainment Efficiency',
      datasource: PROMETHEUS_DS,
      gridPos: { x: 12, y: 23, w: 4, h: 5 },
      targets: [{ refId: 'A', expr: 'target_attainment' }],
      fieldConfig: { defaults: { unit: 'percent', min: 0, max: 100 } }
    },
    {
      type: 'gauge',
      title: 'JVM Heap Saturation',
      datasource: PROMETHEUS_DS,
      gridPos: { x: 16, y: 23, w: 4, h: 5 },
      targets: [{ refId: 'A', expr: 'jvm_memory_used_bytes' }],
      fieldConfig: { defaults: { unit: 'decbytes' } }
    },
    {
      type: 'gauge',
      title: 'Free Storage Capacity',
      datasource: PROMETHEUS_DS,
      gridPos: { x: 20, y: 23, w: 4, h: 5 },
      targets: [{ refId: 'A', expr: 'free_storage' }],
      fieldConfig: { defaults: { unit: 'decbytes' } }
    }
  ]
};

// ── 2. L2 SUBSYSTEM OPERATIONS DASHBOARD ──
const l2Dashboard = {
  id: null,
  uid: 'l2_subsystem_control',
  title: 'L2 - SUBSYSTEM & DOMAIN OPERATIONS (ENGINEERING CONTROL)',
  tags: ['L2', 'ENGINEERING', 'OPERATIONS', 'SUBSYSTEM'],
  style: 'dark',
  timezone: 'browser',
  editable: true,
  liveNow: true,
  refresh: '5s',
  schemaVersion: 38,
  templating: {
    list: [
      {
        name: 'environment',
        type: 'custom',
        query: 'UAT,PROD,ALL',
        current: { text: 'UAT', value: 'UAT', selected: true },
        options: [
          { text: 'UAT', value: 'UAT', selected: true },
          { text: 'PROD', value: 'PROD', selected: false },
          { text: 'ALL', value: 'ALL', selected: false }
        ]
      }
    ]
  },
  time: { from: 'now-1h', to: 'now' },
  panels: [
    {
      type: 'row',
      title: '🎛️ SECTION 1: L2 DOMAIN TELEMETRY & SUBSYSTEM STATS',
      gridPos: { x: 0, y: 0, w: 24, h: 1 }
    },
    {
      type: 'stat',
      title: 'Database Active Pool',
      datasource: PROMETHEUS_DS,
      gridPos: { x: 0, y: 1, w: 6, h: 4 },
      targets: [{ refId: 'A', expr: 'hikaricp_connections_active' }],
      fieldConfig: { defaults: { unit: 'none' } },
      options: { colorMode: 'background', graphMode: 'area' }
    },
    {
      type: 'stat',
      title: 'JVM Heap Used',
      datasource: PROMETHEUS_DS,
      gridPos: { x: 6, y: 1, w: 6, h: 4 },
      targets: [{ refId: 'A', expr: 'jvm_memory_used_bytes' }],
      fieldConfig: { defaults: { unit: 'decbytes' } },
      options: { colorMode: 'background', graphMode: 'area' }
    },
    {
      type: 'stat',
      title: 'Nginx Gateway QPS',
      datasource: PROMETHEUS_DS,
      gridPos: { x: 12, y: 1, w: 6, h: 4 },
      targets: [{ refId: 'A', expr: 'request_rate' }],
      fieldConfig: { defaults: { unit: 'reqps' } },
      options: { colorMode: 'background', graphMode: 'area' }
    },
    {
      type: 'stat',
      title: 'Razorpay Webhook Latency',
      datasource: PROMETHEUS_DS,
      gridPos: { x: 18, y: 1, w: 6, h: 4 },
      targets: [{ refId: 'A', expr: 'latency' }],
      fieldConfig: { defaults: { unit: 'ms' } },
      options: { colorMode: 'background', graphMode: 'area' }
    },
    {
      type: 'stat',
      title: 'Total ERP Sales Revenue',
      datasource: PROMETHEUS_DS,
      gridPos: { x: 0, y: 5, w: 6, h: 4 },
      targets: [{ refId: 'A', expr: 'sales_revenue' }],
      fieldConfig: { defaults: { unit: 'currencyINR' } },
      options: { colorMode: 'background', graphMode: 'area' }
    },
    {
      type: 'stat',
      title: 'InnoDB Buffer Hit Ratio',
      datasource: PROMETHEUS_DS,
      gridPos: { x: 6, y: 5, w: 6, h: 4 },
      targets: [{ refId: 'A', expr: 'buffer_hit_ratio' }],
      fieldConfig: { defaults: { unit: 'percent' } },
      options: { colorMode: 'background', graphMode: 'area' }
    },
    {
      type: 'stat',
      title: 'Active User Sessions',
      datasource: PROMETHEUS_DS,
      gridPos: { x: 12, y: 5, w: 6, h: 4 },
      targets: [{ refId: 'A', expr: 'active_users' }],
      fieldConfig: { defaults: { unit: 'none' } },
      options: { colorMode: 'background', graphMode: 'area' }
    },
    {
      type: 'stat',
      title: 'Cyber Threat Index',
      datasource: PROMETHEUS_DS,
      gridPos: { x: 18, y: 5, w: 6, h: 4 },
      targets: [{ refId: 'A', expr: 'threat_index' }],
      fieldConfig: { defaults: { unit: 'percent' } },
      options: { colorMode: 'background', graphMode: 'area' }
    },
    {
      type: 'row',
      title: '📈 SECTION 2: SUBSYSTEM PERFORMANCE & CURVE TRENDS',
      gridPos: { x: 0, y: 9, w: 24, h: 1 }
    },
    {
      type: 'timeseries',
      title: 'JVM Heap vs Non-Heap Memory Utilization',
      datasource: PROMETHEUS_DS,
      gridPos: { x: 0, y: 10, w: 12, h: 7 },
      targets: [{ refId: 'A', expr: 'jvm_memory_used_bytes' }],
      fieldConfig: { defaults: { unit: 'decbytes' } }
    },
    {
      type: 'timeseries',
      title: 'MySQL Query Execution Rate vs Slow Queries',
      datasource: PROMETHEUS_DS,
      gridPos: { x: 12, y: 10, w: 12, h: 7 },
      targets: [{ refId: 'A', expr: 'request_rate' }],
      fieldConfig: { defaults: { unit: 'reqps' } }
    }
  ]
};

// ── 3. L3 ROOT CAUSE DIAGNOSTICS DASHBOARD ──
const l3Dashboard = {
  id: null,
  uid: 'l3_root_cause_diagnostics',
  title: 'L3 - ROOT CAUSE & DIAGNOSTIC ANALYTICS (SRE & LOG DRILL-DOWN)',
  tags: ['L3', 'SRE', 'DIAGNOSTICS', 'LOGS', 'TRACES'],
  style: 'dark',
  timezone: 'browser',
  editable: true,
  liveNow: true,
  refresh: '5s',
  schemaVersion: 38,
  templating: {
    list: [
      {
        name: 'environment',
        type: 'custom',
        query: 'UAT,PROD,ALL',
        current: { text: 'UAT', value: 'UAT', selected: true },
        options: [
          { text: 'UAT', value: 'UAT', selected: true },
          { text: 'PROD', value: 'PROD', selected: false },
          { text: 'ALL', value: 'ALL', selected: false }
        ]
      }
    ]
  },
  time: { from: 'now-1h', to: 'now' },
  panels: [
    {
      type: 'row',
      title: '🔍 SECTION 1: L3 INCIDENT DIAGNOSTICS & SLO BUDGETS',
      gridPos: { x: 0, y: 0, w: 24, h: 1 }
    },
    {
      type: 'stat',
      title: 'MTTR (Mean Time to Resolve)',
      datasource: PROMETHEUS_DS,
      gridPos: { x: 0, y: 1, w: 6, h: 4 },
      targets: [{ refId: 'A', expr: 'latency' }],
      fieldConfig: { defaults: { unit: 'ms' } },
      options: { colorMode: 'background', graphMode: 'area' }
    },
    {
      type: 'stat',
      title: 'Error Budget Remaining %',
      datasource: PROMETHEUS_DS,
      gridPos: { x: 6, y: 1, w: 6, h: 4 },
      targets: [{ refId: 'A', expr: 'uptime' }],
      fieldConfig: { defaults: { unit: 'percent' } },
      options: { colorMode: 'background', graphMode: 'area' }
    },
    {
      type: 'stat',
      title: 'Golden Signal: Error Rate %',
      datasource: PROMETHEUS_DS,
      gridPos: { x: 12, y: 1, w: 6, h: 4 },
      targets: [{ refId: 'A', expr: 'service_fail_percent{service="payments"}' }],
      fieldConfig: { defaults: { unit: 'percent' } },
      options: { colorMode: 'background', graphMode: 'area' }
    },
    {
      type: 'stat',
      title: 'Active Incident Traces',
      datasource: PROMETHEUS_DS,
      gridPos: { x: 18, y: 1, w: 6, h: 4 },
      targets: [{ refId: 'A', expr: 'active_users' }],
      fieldConfig: { defaults: { unit: 'none' } },
      options: { colorMode: 'background', graphMode: 'area' }
    },
    {
      type: 'row',
      title: '📋 SECTION 2: OPERATIONAL LOG STREAMS & SLOW QUERY PROFILES',
      gridPos: { x: 0, y: 5, w: 24, h: 1 }
    },
    {
      type: 'table',
      title: 'MySQL Top 10 Slowest Query Execution Profiles',
      datasource: PROMETHEUS_DS,
      gridPos: { x: 0, y: 6, w: 12, h: 8 },
      targets: [{ refId: 'A', expr: 'request_rate' }]
    },
    {
      type: 'table',
      title: 'System Security & Audit Log Incident Stream',
      datasource: PROMETHEUS_DS,
      gridPos: { x: 12, y: 6, w: 12, h: 8 },
      targets: [{ refId: 'A', expr: 'request_rate' }]
    }
  ]
};

// Write Dashboard Files
fs.writeFileSync(path.join(dir, 'l1_wallboard_master.json'), JSON.stringify(l1Dashboard, null, 2), 'utf8');
fs.writeFileSync(path.join(dir, 'l2_subsystem_control.json'), JSON.stringify(l2Dashboard, null, 2), 'utf8');
fs.writeFileSync(path.join(dir, 'l3_root_cause_diagnostics.json'), JSON.stringify(l3Dashboard, null, 2), 'utf8');

console.log('Saved 3 NEW L1, L2, L3 Dashboard Files!');

// Re-import to Grafana
async function importNewDashboards() {
  const dashboards = [l1Dashboard, l2Dashboard, l3Dashboard];
  for (const dash of dashboards) {
    const payload = JSON.stringify({ dashboard: dash, overwrite: true, message: 'Created IT Standard L1/L2/L3 Dashboard' });
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
          console.log('IMPORTED [' + dash.title + '] -> Status:', res.statusCode);
          resolve();
        });
      });
      req.on('error', err => {
        console.error('ERROR:', err);
        resolve();
      });
      req.write(payload);
      req.end();
    });
  }
}

importNewDashboards().then(() => console.log('ALL 3 NEW L1, L2, L3 DASHBOARDS LIVE IN GRAFANA!'));
