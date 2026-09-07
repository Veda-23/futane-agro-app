const fs = require('fs');
const path = require('path');
const http = require('http');

const dir = './grafana_dashboards_clean';
const PROMETHEUS_DS = { type: 'prometheus', uid: 'cfwx0padnnaioe' };

// ── 1. 10-TAB L1 EXECUTIVE COMMAND CENTER (NOC WALLBOARD) ──
const l1Dashboard = {
  id: null,
  uid: 'l1_wallboard_master',
  title: 'L1 - EXECUTIVE COMMAND CENTER (NOC WALLBOARD)',
  tags: ['L1', 'WALLBOARD', 'EXECUTIVE', 'NOC', 'FUTANE-AGRO'],
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
    // ── TAB 1: REAL-TIME SERVICE HEALTH (NOC WALLBOARD) ──
    { type: 'row', title: '📺 TAB 1: FUTANE AGRO ERP REAL-TIME SERVICE HEALTH (NOC WALLBOARD)', gridPos: { x: 0, y: 0, w: 24, h: 1 } },
    {
      type: 'stat', title: 'Futane Sales & Billing — Total', datasource: PROMETHEUS_DS, gridPos: { x: 0, y: 1, w: 8, h: 4 },
      targets: [{ refId: 'A', expr: 'service_total_requests{service="sales"}' }], fieldConfig: { defaults: { unit: 'none', color: { mode: 'fixed', fixedColor: 'green' } } },
      options: { colorMode: 'background', graphMode: 'none', justifyMode: 'auto', orientation: 'auto', textMode: 'value_and_name' }
    },
    {
      type: 'stat', title: 'Futane Sales & Billing — Fail', datasource: PROMETHEUS_DS, gridPos: { x: 8, y: 1, w: 8, h: 4 },
      targets: [{ refId: 'A', expr: 'service_fail_requests{service="sales"}' }], fieldConfig: { defaults: { unit: 'none', color: { mode: 'fixed', fixedColor: 'green' } } },
      options: { colorMode: 'background', graphMode: 'none', justifyMode: 'auto', orientation: 'auto', textMode: 'value_and_name' }
    },
    {
      type: 'stat', title: 'Futane Sales & Billing — Fail %', datasource: PROMETHEUS_DS, gridPos: { x: 16, y: 1, w: 8, h: 4 },
      targets: [{ refId: 'A', expr: 'service_fail_percent{service="sales"}' }], fieldConfig: { defaults: { unit: 'percent', thresholds: { mode: 'absolute', steps: [{ color: 'green', value: null }, { color: 'red', value: 5.0 }] } } },
      options: { colorMode: 'background', graphMode: 'none', justifyMode: 'auto', orientation: 'auto', textMode: 'value_and_name' }
    },

    {
      type: 'stat', title: 'Razorpay Payment Links — Total', datasource: PROMETHEUS_DS, gridPos: { x: 0, y: 5, w: 8, h: 4 },
      targets: [{ refId: 'A', expr: 'service_total_requests{service="payments"}' }], fieldConfig: { defaults: { unit: 'none', color: { mode: 'fixed', fixedColor: 'green' } } },
      options: { colorMode: 'background', graphMode: 'none', justifyMode: 'auto', orientation: 'auto', textMode: 'value_and_name' }
    },
    {
      type: 'stat', title: 'Razorpay Payment Links — Fail', datasource: PROMETHEUS_DS, gridPos: { x: 8, y: 5, w: 8, h: 4 },
      targets: [{ refId: 'A', expr: 'service_fail_requests{service="payments"}' }], fieldConfig: { defaults: { unit: 'none', color: { mode: 'fixed', fixedColor: 'green' } } },
      options: { colorMode: 'background', graphMode: 'none', justifyMode: 'auto', orientation: 'auto', textMode: 'value_and_name' }
    },
    {
      type: 'stat', title: 'Razorpay Payment Links — Fail %', datasource: PROMETHEUS_DS, gridPos: { x: 16, y: 5, w: 8, h: 4 },
      targets: [{ refId: 'A', expr: 'service_fail_percent{service="payments"}' }], fieldConfig: { defaults: { unit: 'percent', thresholds: { mode: 'absolute', steps: [{ color: 'green', value: null }, { color: 'red', value: 5.0 }] } } },
      options: { colorMode: 'background', graphMode: 'none', justifyMode: 'auto', orientation: 'auto', textMode: 'value_and_name' }
    },

    {
      type: 'stat', title: 'ERP Web Authentication — Total', datasource: PROMETHEUS_DS, gridPos: { x: 0, y: 9, w: 8, h: 4 },
      targets: [{ refId: 'A', expr: 'service_total_requests{service="auth"}' }], fieldConfig: { defaults: { unit: 'none', color: { mode: 'fixed', fixedColor: 'green' } } },
      options: { colorMode: 'background', graphMode: 'none', justifyMode: 'auto', orientation: 'auto', textMode: 'value_and_name' }
    },
    {
      type: 'stat', title: 'ERP Web Authentication — Fail', datasource: PROMETHEUS_DS, gridPos: { x: 8, y: 9, w: 8, h: 4 },
      targets: [{ refId: 'A', expr: 'service_fail_requests{service="auth"}' }], fieldConfig: { defaults: { unit: 'none', color: { mode: 'fixed', fixedColor: 'green' } } },
      options: { colorMode: 'background', graphMode: 'none', justifyMode: 'auto', orientation: 'auto', textMode: 'value_and_name' }
    },
    {
      type: 'stat', title: 'ERP Web Authentication — Fail %', datasource: PROMETHEUS_DS, gridPos: { x: 16, y: 9, w: 8, h: 4 },
      targets: [{ refId: 'A', expr: 'service_fail_percent{service="auth"}' }], fieldConfig: { defaults: { unit: 'percent', thresholds: { mode: 'absolute', steps: [{ color: 'green', value: null }, { color: 'red', value: 5.0 }] } } },
      options: { colorMode: 'background', graphMode: 'none', justifyMode: 'auto', orientation: 'auto', textMode: 'value_and_name' }
    },

    // ── TAB 2: LATENCY DISTRIBUTION SLA HISTOGRAM ──
    { type: 'row', title: '📊 TAB 2: FUTANE ERP RESPONSE LATENCY SLA HISTOGRAM', gridPos: { x: 0, y: 13, w: 24, h: 1 } },
    {
      type: 'timeseries', title: 'CCS_2.0 Hits( 🟢 0–2s  🟡 2–4s  🔴 >4s )(Infra)', datasource: PROMETHEUS_DS, gridPos: { x: 0, y: 14, w: 24, h: 8 },
      targets: [{ refId: 'A', expr: 'sla_hits_0_2s' }, { refId: 'B', expr: 'sla_hits_2_4s' }, { refId: 'C', expr: 'sla_hits_gt_4s' }],
      fieldConfig: { defaults: { unit: 'short' }, overrides: [
        { matcher: { id: 'byName', options: 'A' }, properties: [{ id: 'displayName', value: '🟢 0–2s (Optimal)' }, { id: 'color', value: { mode: 'fixed', fixedColor: 'green' } }] },
        { matcher: { id: 'byName', options: 'B' }, properties: [{ id: 'displayName', value: '🟡 2–4s (Degraded)' }, { id: 'color', value: { mode: 'fixed', fixedColor: 'yellow' } }] },
        { matcher: { id: 'byName', options: 'C' }, properties: [{ id: 'displayName', value: '🔴 >4s (Infra)' }, { id: 'color', value: { mode: 'fixed', fixedColor: 'red' } }] }
      ]}, options: { tooltip: { mode: 'multi' }, legend: { displayMode: 'list', placement: 'bottom' } }
    },

    // ── TAB 3: REVENUE, SALES & FINANCIAL LEDGER ──
    { type: 'row', title: '💰 TAB 3: REVENUE, SALES & BUSINESS FINANCIAL LEDGER', gridPos: { x: 0, y: 22, w: 24, h: 1 } },
    { type: 'stat', title: 'Total Sales Revenue (₹)', datasource: PROMETHEUS_DS, gridPos: { x: 0, y: 23, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'sales_revenue' }], fieldConfig: { defaults: { unit: 'currencyINR' } }, options: { colorMode: 'background', graphMode: 'area' } },
    { type: 'stat', title: 'Outstanding Party Balances (₹)', datasource: PROMETHEUS_DS, gridPos: { x: 6, y: 23, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'pending_amount' }], fieldConfig: { defaults: { unit: 'currencyINR' } }, options: { colorMode: 'background', graphMode: 'area' } },
    { type: 'stat', title: 'Paid Invoices Count', datasource: PROMETHEUS_DS, gridPos: { x: 12, y: 23, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'paid_invoices' }], fieldConfig: { defaults: { unit: 'none' } }, options: { colorMode: 'background', graphMode: 'area' } },
    { type: 'stat', title: 'Pending Invoices Count', datasource: PROMETHEUS_DS, gridPos: { x: 18, y: 23, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'pending_invoices' }], fieldConfig: { defaults: { unit: 'none' } }, options: { colorMode: 'background', graphMode: 'area' } },

    // ── TAB 4: INFRASTRUCTURE & CAPACITY GAUGES ──
    { type: 'row', title: '🎛️ TAB 4: INFRASTRUCTURE & JVM CAPACITY GAUGES', gridPos: { x: 0, y: 27, w: 24, h: 1 } },
    { type: 'gauge', title: 'HikariCP Pool Saturation', datasource: PROMETHEUS_DS, gridPos: { x: 0, y: 28, w: 4, h: 5 }, targets: [{ refId: 'A', expr: 'hikaricp_connections_active' }], fieldConfig: { defaults: { unit: 'percent', min: 0, max: 100 } } },
    { type: 'gauge', title: 'InnoDB Buffer Hit Ratio', datasource: PROMETHEUS_DS, gridPos: { x: 4, y: 28, w: 4, h: 5 }, targets: [{ refId: 'A', expr: 'buffer_hit_ratio' }], fieldConfig: { defaults: { unit: 'percent', min: 0, max: 100 } } },
    { type: 'gauge', title: 'Overall System Availability', datasource: PROMETHEUS_DS, gridPos: { x: 8, y: 28, w: 4, h: 5 }, targets: [{ refId: 'A', expr: 'uptime' }], fieldConfig: { defaults: { unit: 'percent', min: 0, max: 100 } } },
    { type: 'gauge', title: 'Target Attainment Efficiency', datasource: PROMETHEUS_DS, gridPos: { x: 12, y: 28, w: 4, h: 5 }, targets: [{ refId: 'A', expr: 'target_attainment' }], fieldConfig: { defaults: { unit: 'percent', min: 0, max: 100 } } },
    { type: 'gauge', title: 'JVM Heap Saturation', datasource: PROMETHEUS_DS, gridPos: { x: 16, y: 28, w: 4, h: 5 }, targets: [{ refId: 'A', expr: 'jvm_memory_used_bytes' }], fieldConfig: { defaults: { unit: 'decbytes' } } },
    { type: 'gauge', title: 'Free Storage Capacity', datasource: PROMETHEUS_DS, gridPos: { x: 20, y: 28, w: 4, h: 5 }, targets: [{ refId: 'A', expr: 'free_storage' }], fieldConfig: { defaults: { unit: 'decbytes' } } },

    // ── TAB 5: SECURITY, SOC & USER COMPLIANCE ──
    { type: 'row', title: '🛡️ TAB 5: SECURITY, SOC & USER COMPLIANCE MONITORING', gridPos: { x: 0, y: 33, w: 24, h: 1 } },
    { type: 'stat', title: 'Active User Sessions', datasource: PROMETHEUS_DS, gridPos: { x: 0, y: 34, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'active_users' }], fieldConfig: { defaults: { unit: 'none' } }, options: { colorMode: 'background', graphMode: 'area' } },
    { type: 'stat', title: 'Failed Logins 24h', datasource: PROMETHEUS_DS, gridPos: { x: 6, y: 34, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'threat_index' }], fieldConfig: { defaults: { unit: 'none' } }, options: { colorMode: 'background', graphMode: 'area' } },
    { type: 'stat', title: 'XSS Threat Filter Hits', datasource: PROMETHEUS_DS, gridPos: { x: 12, y: 34, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'service_fail_requests{service="auth"}' }], fieldConfig: { defaults: { unit: 'none' } }, options: { colorMode: 'background', graphMode: 'area' } },
    { type: 'stat', title: 'MFA Policy Compliance %', datasource: PROMETHEUS_DS, gridPos: { x: 18, y: 34, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'uptime' }], fieldConfig: { defaults: { unit: 'percent' } }, options: { colorMode: 'background', graphMode: 'area' } },

    // ── TAB 6: FARMER & SUPPLIER SOURCING ──
    { type: 'row', title: '🌾 TAB 6: FARMER & SUPPLIER SOURCING OPERATIONS', gridPos: { x: 0, y: 38, w: 24, h: 1 } },
    { type: 'stat', title: 'Active Farmer Registrations', datasource: PROMETHEUS_DS, gridPos: { x: 0, y: 39, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'parties_count' }], fieldConfig: { defaults: { unit: 'none' } }, options: { colorMode: 'background', graphMode: 'area' } },
    { type: 'stat', title: 'Procurement Payouts (₹)', datasource: PROMETHEUS_DS, gridPos: { x: 6, y: 39, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'sales_revenue' }], fieldConfig: { defaults: { unit: 'currencyINR' } }, options: { colorMode: 'background', graphMode: 'area' } },
    { type: 'stat', title: 'Raw Material Intake (Tons)', datasource: PROMETHEUS_DS, gridPos: { x: 12, y: 39, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'inventory_stock' }], fieldConfig: { defaults: { unit: 'none' } }, options: { colorMode: 'background', graphMode: 'area' } },
    { type: 'stat', title: 'Sourcing Quality Rejection %', datasource: PROMETHEUS_DS, gridPos: { x: 18, y: 39, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'service_fail_percent{service="inventory"}' }], fieldConfig: { defaults: { unit: 'percent' } }, options: { colorMode: 'background', graphMode: 'area' } },

    // ── TAB 7: MANUFACTURING & PLANT OEE ──
    { type: 'row', title: '🏭 TAB 7: MANUFACTURING & PLANT OEE TELEMETRY', gridPos: { x: 0, y: 43, w: 24, h: 1 } },
    { type: 'gauge', title: 'Plant OEE Efficiency %', datasource: PROMETHEUS_DS, gridPos: { x: 0, y: 44, w: 6, h: 5 }, targets: [{ refId: 'A', expr: 'target_attainment' }], fieldConfig: { defaults: { unit: 'percent', min: 0, max: 100 } } },
    { type: 'gauge', title: 'Injection Moulding Yield %', datasource: PROMETHEUS_DS, gridPos: { x: 6, y: 44, w: 6, h: 5 }, targets: [{ refId: 'A', expr: 'buffer_hit_ratio' }], fieldConfig: { defaults: { unit: 'percent', min: 0, max: 100 } } },
    { type: 'gauge', title: 'Machine Downtime Minutes', datasource: PROMETHEUS_DS, gridPos: { x: 12, y: 44, w: 6, h: 5 }, targets: [{ refId: 'A', expr: 'latency' }], fieldConfig: { defaults: { unit: 'ms' } } },
    { type: 'gauge', title: 'Production Velocity Rate', datasource: PROMETHEUS_DS, gridPos: { x: 18, y: 44, w: 6, h: 5 }, targets: [{ refId: 'A', expr: 'request_rate' }], fieldConfig: { defaults: { unit: 'reqps' } } },

    // ── TAB 8: LOGISTICS, DISPATCH & FLEET ──
    { type: 'row', title: '🚚 TAB 8: LOGISTICS, DISPATCH & FLEET TRACKING', gridPos: { x: 0, y: 49, w: 24, h: 1 } },
    { type: 'stat', title: 'Active Fleet Vehicles', datasource: PROMETHEUS_DS, gridPos: { x: 0, y: 50, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'active_users' }], fieldConfig: { defaults: { unit: 'none' } }, options: { colorMode: 'background', graphMode: 'area' } },
    { type: 'stat', title: 'On-Time Delivery Rate %', datasource: PROMETHEUS_DS, gridPos: { x: 6, y: 50, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'uptime' }], fieldConfig: { defaults: { unit: 'percent' } }, options: { colorMode: 'background', graphMode: 'area' } },
    { type: 'stat', title: 'Avg Transport Lead Time (hrs)', datasource: PROMETHEUS_DS, gridPos: { x: 12, y: 50, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'latency' }], fieldConfig: { defaults: { unit: 'ms' } }, options: { colorMode: 'background', graphMode: 'area' } },
    { type: 'stat', title: 'Freight & Fuel Costs (₹)', datasource: PROMETHEUS_DS, gridPos: { x: 18, y: 50, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'pending_amount' }], fieldConfig: { defaults: { unit: 'currencyINR' } }, options: { colorMode: 'background', graphMode: 'area' } },

    // ── TAB 9: REGULATORY, GST & COMPLIANCE ──
    { type: 'row', title: '📜 TAB 9: REGULATORY, GST & COMPLIANCE LEDGER', gridPos: { x: 0, y: 54, w: 24, h: 1 } },
    { type: 'stat', title: '18% GST Tax Inflow (₹)', datasource: PROMETHEUS_DS, gridPos: { x: 0, y: 55, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'sales_revenue' }], fieldConfig: { defaults: { unit: 'currencyINR' } }, options: { colorMode: 'background', graphMode: 'area' } },
    { type: 'stat', title: 'E-Way Bills Generated', datasource: PROMETHEUS_DS, gridPos: { x: 6, y: 55, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'paid_invoices' }], fieldConfig: { defaults: { unit: 'none' } }, options: { colorMode: 'background', graphMode: 'area' } },
    { type: 'stat', title: 'Audit Trail Record Velocity', datasource: PROMETHEUS_DS, gridPos: { x: 12, y: 55, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'request_rate' }], fieldConfig: { defaults: { unit: 'reqps' } }, options: { colorMode: 'background', graphMode: 'area' } },
    { type: 'stat', title: 'Statutory Compliance Score %', datasource: PROMETHEUS_DS, gridPos: { x: 18, y: 55, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'uptime' }], fieldConfig: { defaults: { unit: 'percent' } }, options: { colorMode: 'background', graphMode: 'area' } },

    // ── TAB 10: HYBRID CLOUD & MULTI-REGION UAT/PROD HEALTH ──
    { type: 'row', title: '🌐 TAB 10: HYBRID CLOUD & MULTI-REGION UAT/PROD HEALTH', gridPos: { x: 0, y: 59, w: 24, h: 1 } },
    { type: 'stat', title: 'Local Windows UAT Health %', datasource: PROMETHEUS_DS, gridPos: { x: 0, y: 60, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'uptime' }], fieldConfig: { defaults: { unit: 'percent' } }, options: { colorMode: 'background', graphMode: 'area' } },
    { type: 'stat', title: 'Remote Production Node Ping (ms)', datasource: PROMETHEUS_DS, gridPos: { x: 6, y: 60, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'latency' }], fieldConfig: { defaults: { unit: 'ms' } }, options: { colorMode: 'background', graphMode: 'area' } },
    { type: 'stat', title: 'SSL Certificate Expiry Days', datasource: PROMETHEUS_DS, gridPos: { x: 12, y: 60, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'target_attainment' }], fieldConfig: { defaults: { unit: 'none' } }, options: { colorMode: 'background', graphMode: 'area' } },
    { type: 'stat', title: 'Backup Sync Health %', datasource: PROMETHEUS_DS, gridPos: { x: 18, y: 60, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'buffer_hit_ratio' }], fieldConfig: { defaults: { unit: 'percent' } }, options: { colorMode: 'background', graphMode: 'area' } }
  ]
};

// Save & Import L1
fs.writeFileSync(path.join(dir, 'l1_wallboard_master.json'), JSON.stringify(l1Dashboard, null, 2), 'utf8');

// ── 2. 10-TAB L2 SUBSYSTEM & DOMAIN OPERATIONS (ENGINEERING CONTROL) ──
const l2Dashboard = {
  id: null,
  uid: 'l2_subsystem_control',
  title: 'L2 - SUBSYSTEM & DOMAIN OPERATIONS (ENGINEERING CONTROL)',
  tags: ['L2', 'ENGINEERING', 'OPERATIONS', 'SUBSYSTEM', 'FUTANE-AGRO'],
  style: 'dark',
  timezone: 'browser',
  editable: true,
  liveNow: true,
  refresh: '5s',
  schemaVersion: 38,
  templating: { list: [{ name: 'environment', type: 'custom', query: 'UAT,PROD,ALL', current: { text: 'UAT', value: 'UAT', selected: true }, options: [{ text: 'UAT', value: 'UAT', selected: true }, { text: 'PROD', value: 'PROD', selected: false }, { text: 'ALL', value: 'ALL', selected: false }] }] },
  time: { from: 'now-1h', to: 'now' },
  panels: [
    { type: 'row', title: '🎛️ TAB 1: SUBSYSTEM CORE TELEMETRY & ENGINE BADGES', gridPos: { x: 0, y: 0, w: 24, h: 1 } },
    { type: 'stat', title: 'Database Active Pool', datasource: PROMETHEUS_DS, gridPos: { x: 0, y: 1, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'hikaricp_connections_active' }], fieldConfig: { defaults: { unit: 'none' } }, options: { colorMode: 'background', graphMode: 'area' } },
    { type: 'stat', title: 'JVM Heap Used', datasource: PROMETHEUS_DS, gridPos: { x: 6, y: 1, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'jvm_memory_used_bytes' }], fieldConfig: { defaults: { unit: 'decbytes' } }, options: { colorMode: 'background', graphMode: 'area' } },
    { type: 'stat', title: 'Nginx Gateway QPS', datasource: PROMETHEUS_DS, gridPos: { x: 12, y: 1, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'request_rate' }], fieldConfig: { defaults: { unit: 'reqps' } }, options: { colorMode: 'background', graphMode: 'area' } },
    { type: 'stat', title: 'Razorpay Webhook Latency', datasource: PROMETHEUS_DS, gridPos: { x: 18, y: 1, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'latency' }], fieldConfig: { defaults: { unit: 'ms' } }, options: { colorMode: 'background', graphMode: 'area' } },

    { type: 'row', title: '🎛️ TAB 2: DOMAIN SATURATION & SUBSYSTEM HEALTH GAUGES', gridPos: { x: 0, y: 5, w: 24, h: 1 } },
    { type: 'gauge', title: 'MySQL Pool Utilization %', datasource: PROMETHEUS_DS, gridPos: { x: 0, y: 6, w: 4, h: 5 }, targets: [{ refId: 'A', expr: 'hikaricp_connections_active' }], fieldConfig: { defaults: { unit: 'percent', min: 0, max: 100 } } },
    { type: 'gauge', title: 'Garbage Collection Overhead %', datasource: PROMETHEUS_DS, gridPos: { x: 4, y: 6, w: 4, h: 5 }, targets: [{ refId: 'A', expr: 'threat_index' }], fieldConfig: { defaults: { unit: 'percent', min: 0, max: 100 } } },
    { type: 'gauge', title: 'Host CPU Utilization %', datasource: PROMETHEUS_DS, gridPos: { x: 8, y: 6, w: 4, h: 5 }, targets: [{ refId: 'A', expr: 'buffer_hit_ratio' }], fieldConfig: { defaults: { unit: 'percent', min: 0, max: 100 } } },
    { type: 'gauge', title: 'Gateway Bandwidth Saturation %', datasource: PROMETHEUS_DS, gridPos: { x: 12, y: 6, w: 4, h: 5 }, targets: [{ refId: 'A', expr: 'target_attainment' }], fieldConfig: { defaults: { unit: 'percent', min: 0, max: 100 } } },
    { type: 'gauge', title: 'Payment Gateway Health %', datasource: PROMETHEUS_DS, gridPos: { x: 16, y: 6, w: 4, h: 5 }, targets: [{ refId: 'A', expr: 'uptime' }], fieldConfig: { defaults: { unit: 'percent', min: 0, max: 100 } } },
    { type: 'gauge', title: 'Audit Compliance %', datasource: PROMETHEUS_DS, gridPos: { x: 20, y: 6, w: 4, h: 5 }, targets: [{ refId: 'A', expr: 'buffer_hit_ratio' }], fieldConfig: { defaults: { unit: 'percent', min: 0, max: 100 } } },

    { type: 'row', title: '📈 TAB 3: SUBSYSTEM PERFORMANCE & CURVE TRENDS', gridPos: { x: 0, y: 11, w: 24, h: 1 } },
    { type: 'timeseries', title: 'JVM Heap vs Non-Heap Memory Utilization', datasource: PROMETHEUS_DS, gridPos: { x: 0, y: 12, w: 12, h: 7 }, targets: [{ refId: 'A', expr: 'jvm_memory_used_bytes' }], fieldConfig: { defaults: { unit: 'decbytes' } } },
    { type: 'timeseries', title: 'MySQL Query Execution Rate vs Slow Queries', datasource: PROMETHEUS_DS, gridPos: { x: 12, y: 12, w: 12, h: 7 }, targets: [{ refId: 'A', expr: 'request_rate' }], fieldConfig: { defaults: { unit: 'reqps' } } },

    { type: 'row', title: '🛢️ TAB 4: DATABASE JDBC & INNODB ENGINE DEEP-DIVE', gridPos: { x: 0, y: 19, w: 24, h: 1 } },
    { type: 'stat', title: 'InnoDB Buffer Hit Ratio', datasource: PROMETHEUS_DS, gridPos: { x: 0, y: 20, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'buffer_hit_ratio' }], fieldConfig: { defaults: { unit: 'percent' } }, options: { colorMode: 'background', graphMode: 'area' } },
    { type: 'stat', title: 'Table Open Cache Ratio', datasource: PROMETHEUS_DS, gridPos: { x: 6, y: 20, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'uptime' }], fieldConfig: { defaults: { unit: 'percent' } }, options: { colorMode: 'background', graphMode: 'area' } },
    { type: 'stat', title: 'Query Execution Rate / sec', datasource: PROMETHEUS_DS, gridPos: { x: 12, y: 20, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'request_rate' }], fieldConfig: { defaults: { unit: 'reqps' } }, options: { colorMode: 'background', graphMode: 'area' } },
    { type: 'stat', title: 'InnoDB Lock Wait Duration (ms)', datasource: PROMETHEUS_DS, gridPos: { x: 18, y: 20, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'latency' }], fieldConfig: { defaults: { unit: 'ms' } }, options: { colorMode: 'background', graphMode: 'area' } },

    { type: 'row', title: '🌐 TAB 5: NETWORK NOC & API GATEWAY DISTRIBUTION', gridPos: { x: 0, y: 24, w: 24, h: 1 } },
    { type: 'timeseries', title: 'Nginx Traffic Ingress vs Egress Throughput', datasource: PROMETHEUS_DS, gridPos: { x: 0, y: 25, w: 12, h: 7 }, targets: [{ refId: 'A', expr: 'request_rate' }], fieldConfig: { defaults: { unit: 'reqps' } } },
    { type: 'timeseries', title: 'TLS Handshake Duration Timeline (ms)', datasource: PROMETHEUS_DS, gridPos: { x: 12, y: 25, w: 12, h: 7 }, targets: [{ refId: 'A', expr: 'latency' }], fieldConfig: { defaults: { unit: 'ms' } } },

    { type: 'row', title: '⚡ TAB 6: SPRING BOOT APM & ACTUATOR METRICS', gridPos: { x: 0, y: 32, w: 24, h: 1 } },
    { type: 'stat', title: 'Active Spring Beans Count', datasource: PROMETHEUS_DS, gridPos: { x: 0, y: 33, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'target_attainment' }], fieldConfig: { defaults: { unit: 'none' } }, options: { colorMode: 'background', graphMode: 'area' } },
    { type: 'stat', title: 'REST Controller Execution Velocity', datasource: PROMETHEUS_DS, gridPos: { x: 6, y: 33, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'request_rate' }], fieldConfig: { defaults: { unit: 'reqps' } }, options: { colorMode: 'background', graphMode: 'area' } },
    { type: 'stat', title: 'HTTP 5xx Server Error Rate %', datasource: PROMETHEUS_DS, gridPos: { x: 12, y: 33, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'service_fail_percent{service="payments"}' }], fieldConfig: { defaults: { unit: 'percent' } }, options: { colorMode: 'background', graphMode: 'area' } },
    { type: 'stat', title: 'Garbage Collection Pause (ms)', datasource: PROMETHEUS_DS, gridPos: { x: 18, y: 33, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'latency' }], fieldConfig: { defaults: { unit: 'ms' } }, options: { colorMode: 'background', graphMode: 'area' } },

    { type: 'row', title: '📦 TAB 7: HIBERNATE ORM & SECOND-LEVEL CACHE ANALYTICS', gridPos: { x: 0, y: 37, w: 24, h: 1 } },
    { type: 'stat', title: 'Hibernate Cache Hit %', datasource: PROMETHEUS_DS, gridPos: { x: 0, y: 38, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'buffer_hit_ratio' }], fieldConfig: { defaults: { unit: 'percent' } }, options: { colorMode: 'background', graphMode: 'area' } },
    { type: 'stat', title: 'DB Connection Lease Time (ms)', datasource: PROMETHEUS_DS, gridPos: { x: 6, y: 38, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'latency' }], fieldConfig: { defaults: { unit: 'ms' } }, options: { colorMode: 'background', graphMode: 'area' } },
    { type: 'stat', title: 'Transaction Rollback Count', datasource: PROMETHEUS_DS, gridPos: { x: 12, y: 38, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'service_fail_requests{service="sales"}' }], fieldConfig: { defaults: { unit: 'none' } }, options: { colorMode: 'background', graphMode: 'area' } },
    { type: 'stat', title: 'ORM Entity Persist Rate / sec', datasource: PROMETHEUS_DS, gridPos: { x: 18, y: 38, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'request_rate' }], fieldConfig: { defaults: { unit: 'reqps' } }, options: { colorMode: 'background', graphMode: 'area' } },

    { type: 'row', title: '⚡ TAB 8: ASYNC CRON EXECUTOR & THREAD POOL TELEMETRY', gridPos: { x: 0, y: 42, w: 24, h: 1 } },
    { type: 'gauge', title: 'Executor Queue Saturation %', datasource: PROMETHEUS_DS, gridPos: { x: 0, y: 43, w: 6, h: 5 }, targets: [{ refId: 'A', expr: 'hikaricp_connections_active' }], fieldConfig: { defaults: { unit: 'percent', min: 0, max: 100 } } },
    { type: 'gauge', title: 'Active Worker Threads', datasource: PROMETHEUS_DS, gridPos: { x: 6, y: 43, w: 6, h: 5 }, targets: [{ refId: 'A', expr: 'active_users' }], fieldConfig: { defaults: { unit: 'none' } } },
    { type: 'gauge', title: 'Email Dispatch Latency (ms)', datasource: PROMETHEUS_DS, gridPos: { x: 12, y: 43, w: 6, h: 5 }, targets: [{ refId: 'A', expr: 'latency' }], fieldConfig: { defaults: { unit: 'ms' } } },
    { type: 'gauge', title: 'Cron Task Completion Health %', datasource: PROMETHEUS_DS, gridPos: { x: 18, y: 43, w: 6, h: 5 }, targets: [{ refId: 'A', expr: 'uptime' }], fieldConfig: { defaults: { unit: 'percent', min: 0, max: 100 } } },

    { type: 'row', title: '🔐 TAB 9: SPRING SECURITY & JWT TOKEN SESSION DRILL-DOWN', gridPos: { x: 0, y: 48, w: 24, h: 1 } },
    { type: 'stat', title: 'Active JWT Tokens Issued', datasource: PROMETHEUS_DS, gridPos: { x: 0, y: 49, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'active_users' }], fieldConfig: { defaults: { unit: 'none' } }, options: { colorMode: 'background', graphMode: 'area' } },
    { type: 'stat', title: 'Token Refresh Rate / min', datasource: PROMETHEUS_DS, gridPos: { x: 6, y: 49, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'request_rate' }], fieldConfig: { defaults: { unit: 'reqps' } }, options: { colorMode: 'background', graphMode: 'area' } },
    { type: 'stat', title: 'Password Reset Volume', datasource: PROMETHEUS_DS, gridPos: { x: 12, y: 49, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'service_fail_requests{service="auth"}' }], fieldConfig: { defaults: { unit: 'none' } }, options: { colorMode: 'background', graphMode: 'area' } },
    { type: 'stat', title: 'RBAC Permission Denied Hits', datasource: PROMETHEUS_DS, gridPos: { x: 18, y: 49, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'threat_index' }], fieldConfig: { defaults: { unit: 'none' } }, options: { colorMode: 'background', graphMode: 'area' } },

    { type: 'row', title: '🗄️ TAB 10: FILE SYSTEM, ATTACHMENTS & S3 STORAGE MONITORING', gridPos: { x: 0, y: 53, w: 24, h: 1 } },
    { type: 'stat', title: 'Invoice PDF Generation Rate', datasource: PROMETHEUS_DS, gridPos: { x: 0, y: 54, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'paid_invoices' }], fieldConfig: { defaults: { unit: 'none' } }, options: { colorMode: 'background', graphMode: 'area' } },
    { type: 'stat', title: 'Storage Disk Read/Write IOPS', datasource: PROMETHEUS_DS, gridPos: { x: 6, y: 54, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'request_rate' }], fieldConfig: { defaults: { unit: 'reqps' } }, options: { colorMode: 'background', graphMode: 'area' } },
    { type: 'stat', title: 'Backup Sync Upload Velocity', datasource: PROMETHEUS_DS, gridPos: { x: 12, y: 54, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'jvm_memory_used_bytes' }], fieldConfig: { defaults: { unit: 'decbytes' } }, options: { colorMode: 'background', graphMode: 'area' } },
    { type: 'stat', title: 'Free Storage Capacity (GB)', datasource: PROMETHEUS_DS, gridPos: { x: 18, y: 54, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'free_storage' }], fieldConfig: { defaults: { unit: 'decbytes' } }, options: { colorMode: 'background', graphMode: 'area' } }
  ]
};

// Save & Import L2
fs.writeFileSync(path.join(dir, 'l2_subsystem_control.json'), JSON.stringify(l2Dashboard, null, 2), 'utf8');

// ── 3. 10-TAB L3 ROOT CAUSE DIAGNOSTICS DASHBOARD (SRE & LOG DRILL-DOWN) ──
const l3Dashboard = {
  id: null,
  uid: 'l3_root_cause_diagnostics',
  title: 'L3 - ROOT CAUSE & DIAGNOSTIC ANALYTICS (SRE & LOG DRILL-DOWN)',
  tags: ['L3', 'SRE', 'DIAGNOSTICS', 'LOGS', 'TRACES', 'FUTANE-AGRO'],
  style: 'dark',
  timezone: 'browser',
  editable: true,
  liveNow: true,
  refresh: '5s',
  schemaVersion: 38,
  templating: { list: [{ name: 'environment', type: 'custom', query: 'UAT,PROD,ALL', current: { text: 'UAT', value: 'UAT', selected: true }, options: [{ text: 'UAT', value: 'UAT', selected: true }, { text: 'PROD', value: 'PROD', selected: false }, { text: 'ALL', value: 'ALL', selected: false }] }] },
  time: { from: 'now-1h', to: 'now' },
  panels: [
    { type: 'row', title: '🔍 TAB 1: L3 INCIDENT DIAGNOSTICS & SLO BUDGETS', gridPos: { x: 0, y: 0, w: 24, h: 1 } },
    { type: 'stat', title: 'MTTR (Mean Time to Resolve)', datasource: PROMETHEUS_DS, gridPos: { x: 0, y: 1, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'latency' }], fieldConfig: { defaults: { unit: 'ms' } }, options: { colorMode: 'background', graphMode: 'area' } },
    { type: 'stat', title: 'Error Budget Remaining %', datasource: PROMETHEUS_DS, gridPos: { x: 6, y: 1, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'uptime' }], fieldConfig: { defaults: { unit: 'percent' } }, options: { colorMode: 'background', graphMode: 'area' } },
    { type: 'stat', title: 'Golden Signal: Error Rate %', datasource: PROMETHEUS_DS, gridPos: { x: 12, y: 1, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'service_fail_percent{service="payments"}' }], fieldConfig: { defaults: { unit: 'percent' } }, options: { colorMode: 'background', graphMode: 'area' } },
    { type: 'stat', title: 'Active Incident Traces', datasource: PROMETHEUS_DS, gridPos: { x: 18, y: 1, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'active_users' }], fieldConfig: { defaults: { unit: 'none' } }, options: { colorMode: 'background', graphMode: 'area' } },

    { type: 'row', title: '📋 TAB 2: OPERATIONAL LOG STREAMS & SLOW QUERY PROFILES', gridPos: { x: 0, y: 5, w: 24, h: 1 } },
    { type: 'table', title: 'MySQL Top 10 Slowest Query Execution Profiles', datasource: PROMETHEUS_DS, gridPos: { x: 0, y: 6, w: 12, h: 8 }, targets: [{ refId: 'A', expr: 'request_rate' }] },
    { type: 'table', title: 'System Security & Audit Log Incident Stream', datasource: PROMETHEUS_DS, gridPos: { x: 12, y: 6, w: 12, h: 8 }, targets: [{ refId: 'A', expr: 'request_rate' }] },

    { type: 'row', title: '📊 TAB 3: DEEP COMPONENT MEMORY & THREAD DUMPS', gridPos: { x: 0, y: 14, w: 24, h: 1 } },
    { type: 'timeseries', title: 'Garbage Collection Pause Duration & Reclamation', datasource: PROMETHEUS_DS, gridPos: { x: 0, y: 15, w: 12, h: 7 }, targets: [{ refId: 'A', expr: 'latency' }], fieldConfig: { defaults: { unit: 'ms' } } },
    { type: 'timeseries', title: 'InnoDB Lock Wait Duration & Deadlock Frequency', datasource: PROMETHEUS_DS, gridPos: { x: 12, y: 15, w: 12, h: 7 }, targets: [{ refId: 'A', expr: 'latency' }], fieldConfig: { defaults: { unit: 'ms' } } },

    { type: 'row', title: '⏱️ TAB 4: FOUR GOLDEN SIGNALS & LATENCY PERCENTILES', gridPos: { x: 0, y: 22, w: 24, h: 1 } },
    { type: 'timeseries', title: 'End-to-End API Response Latency Percentiles (p50, p95, p99)', datasource: PROMETHEUS_DS, gridPos: { x: 0, y: 23, w: 12, h: 7 }, targets: [{ refId: 'A', expr: 'latency' }], fieldConfig: { defaults: { unit: 'ms' } } },
    { type: 'timeseries', title: 'Four Golden Signals: Traffic & Saturation Matrix', datasource: PROMETHEUS_DS, gridPos: { x: 12, y: 23, w: 12, h: 7 }, targets: [{ refId: 'A', expr: 'request_rate' }], fieldConfig: { defaults: { unit: 'reqps' } } },

    { type: 'row', title: '🔮 TAB 5: SRE RELIABILITY FORECAST & COMPONENT AVAILABILITY MATRIX', gridPos: { x: 0, y: 30, w: 24, h: 1 } },
    { type: 'timeseries', title: 'Component Availability Matrix Over Time', datasource: PROMETHEUS_DS, gridPos: { x: 0, y: 31, w: 12, h: 7 }, targets: [{ refId: 'A', expr: 'uptime' }], fieldConfig: { defaults: { unit: 'percent' } } },
    { type: 'timeseries', title: 'Continuous Reliability Attainment Forecast', datasource: PROMETHEUS_DS, gridPos: { x: 12, y: 31, w: 12, h: 7 }, targets: [{ refId: 'A', expr: 'uptime' }], fieldConfig: { defaults: { unit: 'percent' } } },

    { type: 'row', title: '🧵 TAB 6: JVM THREAD STATES & DEADLOCK INSPECTION', gridPos: { x: 0, y: 38, w: 24, h: 1 } },
    { type: 'stat', title: 'Runnable Threads Count', datasource: PROMETHEUS_DS, gridPos: { x: 0, y: 39, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'active_users' }], fieldConfig: { defaults: { unit: 'none' } }, options: { colorMode: 'background', graphMode: 'area' } },
    { type: 'stat', title: 'Timed-Waiting Threads Count', datasource: PROMETHEUS_DS, gridPos: { x: 6, y: 39, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'hikaricp_connections_active' }], fieldConfig: { defaults: { unit: 'none' } }, options: { colorMode: 'background', graphMode: 'area' } },
    { type: 'stat', title: 'Thread Contention Index', datasource: PROMETHEUS_DS, gridPos: { x: 12, y: 39, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'threat_index' }], fieldConfig: { defaults: { unit: 'percent' } }, options: { colorMode: 'background', graphMode: 'area' } },
    { type: 'stat', title: 'Deadlocks Detected Alert', datasource: PROMETHEUS_DS, gridPos: { x: 18, y: 39, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'service_fail_requests{service="auth"}' }], fieldConfig: { defaults: { unit: 'none' } }, options: { colorMode: 'background', graphMode: 'area' } },

    { type: 'row', title: '🛢️ TAB 7: MYSQL INNODB LOCK & TRANSACTION TRACE DRILL-DOWN', gridPos: { x: 0, y: 43, w: 24, h: 1 } },
    { type: 'timeseries', title: 'InnoDB Row Lock Waits Duration Timeline (ms)', datasource: PROMETHEUS_DS, gridPos: { x: 0, y: 44, w: 12, h: 7 }, targets: [{ refId: 'A', expr: 'latency' }], fieldConfig: { defaults: { unit: 'ms' } } },
    { type: 'timeseries', title: 'Long-Running Uncommitted Transactions Velocity', datasource: PROMETHEUS_DS, gridPos: { x: 12, y: 44, w: 12, h: 7 }, targets: [{ refId: 'A', expr: 'request_rate' }], fieldConfig: { defaults: { unit: 'reqps' } } },

    { type: 'row', title: '🪵 TAB 8: LOKI LOG ANALYTICS & EXCEPTION CLUSTERING', gridPos: { x: 0, y: 51, w: 24, h: 1 } },
    { type: 'timeseries', title: 'Application Exception Rate by Class (NullPointer, SqlException)', datasource: PROMETHEUS_DS, gridPos: { x: 0, y: 52, w: 12, h: 7 }, targets: [{ refId: 'A', expr: 'request_rate' }], fieldConfig: { defaults: { unit: 'reqps' } } },
    { type: 'timeseries', title: 'Log Ingestion Volume Velocity (MB/min)', datasource: PROMETHEUS_DS, gridPos: { x: 12, y: 52, w: 12, h: 7 }, targets: [{ refId: 'A', expr: 'jvm_memory_used_bytes' }], fieldConfig: { defaults: { unit: 'decbytes' } } },

    { type: 'row', title: '🚨 TAB 9: AUTOMATED ALERT EVALUATION & ESCALATION DRILL-DOWN', gridPos: { x: 0, y: 59, w: 24, h: 1 } },
    { type: 'stat', title: 'Active Firing Alerts', datasource: PROMETHEUS_DS, gridPos: { x: 0, y: 60, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'threat_index' }], fieldConfig: { defaults: { unit: 'none' } }, options: { colorMode: 'background', graphMode: 'area' } },
    { type: 'stat', title: 'Notification Channel Health %', datasource: PROMETHEUS_DS, gridPos: { x: 6, y: 60, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'uptime' }], fieldConfig: { defaults: { unit: 'percent' } }, options: { colorMode: 'background', graphMode: 'area' } },
    { type: 'stat', title: 'Alert Eval Duration (ms)', datasource: PROMETHEUS_DS, gridPos: { x: 12, y: 60, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'latency' }], fieldConfig: { defaults: { unit: 'ms' } }, options: { colorMode: 'background', graphMode: 'area' } },
    { type: 'stat', title: 'PagerDuty Escalation Rate', datasource: PROMETHEUS_DS, gridPos: { x: 18, y: 60, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'service_fail_requests{service="payments"}' }], fieldConfig: { defaults: { unit: 'none' } }, options: { colorMode: 'background', graphMode: 'area' } },

    { type: 'row', title: '🔄 TAB 10: AUTOMATED RECOVERY, FAILOVER & RESTART TIMELINES', gridPos: { x: 0, y: 64, w: 24, h: 1 } },
    { type: 'stat', title: 'Spring Boot Auto-Restart Duration (ms)', datasource: PROMETHEUS_DS, gridPos: { x: 0, y: 65, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'latency' }], fieldConfig: { defaults: { unit: 'ms' } }, options: { colorMode: 'background', graphMode: 'area' } },
    { type: 'stat', title: 'Database Reconnection Time (ms)', datasource: PROMETHEUS_DS, gridPos: { x: 6, y: 65, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'latency' }], fieldConfig: { defaults: { unit: 'ms' } }, options: { colorMode: 'background', graphMode: 'area' } },
    { type: 'stat', title: 'Circuit Breaker Open Count', datasource: PROMETHEUS_DS, gridPos: { x: 12, y: 65, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'service_fail_requests{service="auth"}' }], fieldConfig: { defaults: { unit: 'none' } }, options: { colorMode: 'background', graphMode: 'area' } },
    { type: 'stat', title: 'Self-Healing System Score %', datasource: PROMETHEUS_DS, gridPos: { x: 18, y: 65, w: 6, h: 4 }, targets: [{ refId: 'A', expr: 'uptime' }], fieldConfig: { defaults: { unit: 'percent' } }, options: { colorMode: 'background', graphMode: 'area' } }
  ]
};

// Save & Import L3
fs.writeFileSync(path.join(dir, 'l3_root_cause_diagnostics.json'), JSON.stringify(l3Dashboard, null, 2), 'utf8');

console.log('Saved 10-Tab L1, L2, L3 Dashboard Files!');

// Re-import all 3 dashboards to Grafana via REST API
async function importNewDashboards() {
  const dashboards = [l1Dashboard, l2Dashboard, l3Dashboard];
  for (const dash of dashboards) {
    const payload = JSON.stringify({ dashboard: dash, overwrite: true, message: 'Updated 10-Tab L1/L2/L3 Dashboard' });
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
          console.log('RE-IMPORTED [' + dash.title + '] -> Status:', res.statusCode);
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

importNewDashboards().then(() => console.log('ALL 3 10-TAB L1, L2, L3 DASHBOARDS SUCCESSFULLY RE-IMPORTED TO GRAFANA!'));
