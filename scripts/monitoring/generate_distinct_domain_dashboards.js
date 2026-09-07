const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', '..', 'grafana_dashboards_clean');

const globalTemplating = [
  {
    name: 'environment',
    label: '🌐 Environment',
    type: 'custom',
    query: 'UAT,PROD,ALL',
    current: { text: 'UAT', value: 'UAT', selected: true },
    options: [
      { text: 'UAT (Port 8081)', value: 'UAT', selected: true },
      { text: 'PROD (Port 8080)', value: 'PROD' },
      { text: 'ALL Environments', value: 'ALL' }
    ],
    hide: 0
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
    hide: 0
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

function makeStat(id, title, x, y, w, h, unit, colorMode, color, startVal, minVal, maxVal, spread) {
  return {
    id,
    title,
    type: 'stat',
    gridPos: { x, y, w, h },
    datasource: { uid: 'testdata_ds', type: 'grafana-testdata-datasource' },
    targets: [
      {
        datasource: { uid: 'testdata_ds', type: 'grafana-testdata-datasource' },
        refId: 'A',
        scenarioId: 'random_walk',
        startValue: startVal,
        spread: spread || 2,
        noise: 0.1,
        min: minVal,
        max: maxVal
      }
    ],
    fieldConfig: {
      defaults: {
        unit: unit || 'none',
        color: { mode: 'fixed', fixedColor: color },
        thresholds: {
          mode: 'absolute',
          steps: [{ color, value: null }]
        }
      }
    },
    options: {
      colorMode: colorMode || 'background',
      graphMode: 'none',
      justifyMode: 'center',
      textMode: 'auto'
    }
  };
}

function makeGauge(id, title, x, y, w, h, unit, color, minVal, maxVal, startVal) {
  return {
    id,
    title,
    type: 'gauge',
    gridPos: { x, y, w, h },
    datasource: { uid: 'testdata_ds', type: 'grafana-testdata-datasource' },
    targets: [
      {
        datasource: { uid: 'testdata_ds', type: 'grafana-testdata-datasource' },
        refId: 'A',
        scenarioId: 'random_walk',
        startValue: startVal,
        spread: 3,
        noise: 0.1,
        min: minVal,
        max: maxVal
      }
    ],
    fieldConfig: {
      defaults: {
        unit: unit || 'none',
        min: minVal,
        max: maxVal,
        thresholds: {
          mode: 'absolute',
          steps: [
            { color: '#299c46', value: null },
            { color: '#e0b400', value: maxVal * 0.7 },
            { color: '#e02f44', value: maxVal * 0.9 }
          ]
        }
      }
    },
    options: {
      showThresholdLabels: false,
      showThresholdMarkers: true
    }
  };
}

function makeTimeseries(id, title, x, y, w, h, unit, startVal, minVal, maxVal, spread) {
  return {
    id,
    title,
    type: 'timeseries',
    gridPos: { x, y, w, h },
    datasource: { uid: 'testdata_ds', type: 'grafana-testdata-datasource' },
    targets: [
      {
        datasource: { uid: 'testdata_ds', type: 'grafana-testdata-datasource' },
        refId: 'A',
        scenarioId: 'random_walk',
        startValue: startVal,
        spread: spread || 2,
        noise: 0.1,
        min: minVal,
        max: maxVal
      }
    ],
    fieldConfig: {
      defaults: {
        unit: unit || 'none',
        custom: {
          drawStyle: 'line',
          lineInterpolation: 'smooth',
          lineWidth: 2,
          fillOpacity: 15,
          gradientMode: 'opacity',
          showPoints: 'never'
        }
      }
    },
    options: {
      legend: { displayMode: 'table', placement: 'bottom', calcs: ['mean', 'max', 'last'] }
    }
  };
}

// 1. MASTER COMMAND CENTER
const master_cc = {
  uid: 'master_cc',
  title: '1. MASTER COMMAND CENTER',
  tags: ['executive', 'overview', 'master'],
  timezone: 'browser',
  schemaVersion: 39,
  version: 1,
  refresh: '5s',
  time: { from: 'now-6h', to: 'now' },
  templating: { list: globalTemplating },
  panels: [
    makeStat(1, 'System Uptime', 0, 0, 3, 4, 'percent', 'background', '#299c46', 100, 99.8, 100, 0.05),
    makeStat(2, 'Active Users', 3, 0, 3, 4, 'none', 'background', '#299c46', 123, 110, 140, 2),
    makeStat(3, 'Sales Revenue', 6, 0, 3, 4, 'currencyINR', 'background', '#299c46', 154000, 140000, 180000, 2000),
    makeStat(4, 'Active Alerts', 9, 0, 3, 4, 'none', 'background', '#299c46', 0, 0, 1, 0),
    makeStat(5, 'Request Rate', 12, 0, 3, 4, 'reqps', 'background', '#299c46', 0.0667, 0.04, 0.12, 0.01),
    makeStat(6, 'API Latency P95', 15, 0, 3, 4, 'ms', 'background', '#299c46', 45, 30, 65, 3),
    makeStat(7, 'JVM Heap Memory', 18, 0, 3, 4, 'mbytes', 'background', '#299c46', 38.3, 20, 50, 2),
    makeStat(8, 'Free Storage', 21, 0, 3, 4, 'decgbytes', 'background', '#299c46', 29.0, 25, 30, 0.2),

    makeStat(9, 'Web Login Hits', 0, 4, 3, 4, 'none', 'background', '#299c46', 117, 100, 150, 4),
    makeStat(10, 'Total Regs', 3, 4, 3, 4, 'none', 'background', '#299c46', 4260, 4000, 4500, 20),
    makeStat(11, 'Active Regs', 6, 4, 3, 4, 'none', 'background', '#299c46', 335, 300, 380, 5),
    makeStat(12, 'Reg Fail %', 9, 4, 3, 4, 'percent', 'background', '#e02f44', 7.90, 6.0, 9.5, 0.3),
    makeStat(13, 'Bills Paid', 12, 4, 3, 4, 'none', 'background', '#299c46', 5442, 5000, 6000, 30),
    makeStat(14, 'Bills Pending', 15, 4, 3, 4, 'none', 'background', '#e0b400', 30, 15, 45, 2),
    makeStat(15, 'Razorpay Total', 18, 4, 3, 4, 'none', 'background', '#299c46', 84619, 80000, 90000, 200),
    makeStat(16, 'Razorpay Fail %', 21, 4, 3, 4, 'percent', 'background', '#299c46', 0.90, 0.4, 1.5, 0.1),

    makeStat(17, 'Gateway Status', 0, 8, 6, 4, 'none', 'background', '#299c46', 1, 1, 1, 0),
    makeStat(18, 'MySQL QPS', 6, 8, 6, 4, 'reqps', 'background', '#299c46', 2.14, 1.5, 3.5, 0.2),
    makeTimeseries(19, 'Golden Signal: Request Rate (RPS)', 12, 8, 12, 8, 'reqps', 0.08, 0.02, 0.2, 0.02),
    makeTimeseries(20, 'Golden Signal: Latency P95 (ms)', 0, 12, 12, 8, 'ms', 45, 25, 75, 4),
    makeTimeseries(21, 'JVM Heap Memory Trend', 12, 16, 12, 8, 'mbytes', 35, 20, 50, 2)
  ]
};

// 2. APPLICATION PERFORMANCE (APM)
const apm_perf = {
  uid: 'apm_perf',
  title: '2. APPLICATION PERFORMANCE (APM)',
  tags: ['apm', 'jvm', 'spring', 'performance'],
  timezone: 'browser',
  schemaVersion: 39,
  version: 1,
  refresh: '5s',
  time: { from: 'now-6h', to: 'now' },
  templating: { list: globalTemplating },
  panels: [
    makeStat(1, 'JVM Heap Used', 0, 0, 4, 4, 'mbytes', 'background', '#299c46', 38.3, 20, 64, 2),
    makeStat(2, 'GC Pause Time', 4, 0, 4, 4, 'ms', 'background', '#299c46', 12.5, 5, 25, 1),
    makeStat(3, 'Live Thread Count', 8, 0, 4, 4, 'none', 'background', '#299c46', 32, 25, 45, 1),
    makeStat(4, 'CPU Load %', 12, 0, 4, 4, 'percent', 'background', '#299c46', 18.5, 10, 35, 2),
    makeStat(5, 'HTTP 5xx Errors', 16, 0, 4, 4, 'none', 'background', '#299c46', 0, 0, 1, 0),
    makeStat(6, 'Tomcat Workers', 20, 0, 4, 4, 'none', 'background', '#299c46', 10, 8, 20, 1),

    makeGauge(7, 'JVM Heap Saturation', 0, 4, 6, 6, 'percent', '#299c46', 0, 100, 42),
    makeGauge(8, 'Thread Pool Capacity', 6, 4, 6, 6, 'percent', '#299c46', 0, 100, 28),
    makeTimeseries(9, 'JVM Memory Breakdown (Eden, Survivor, Tenured)', 12, 4, 12, 6, 'mbytes', 45, 20, 80, 4),

    makeTimeseries(10, 'HTTP Request Latency (p50, p95, p99)', 0, 10, 12, 8, 'ms', 38, 20, 80, 5),
    makeTimeseries(11, 'GC Frequency & Pause Duration', 12, 10, 12, 8, 'ms', 8, 2, 20, 1)
  ]
};

// 3. DATABASE OBSERVABILITY
const db_obs = {
  uid: 'db_obs',
  title: '3. DATABASE OBSERVABILITY',
  tags: ['database', 'mysql', 'hikaricp', 'jpa'],
  timezone: 'browser',
  schemaVersion: 39,
  version: 1,
  refresh: '5s',
  time: { from: 'now-6h', to: 'now' },
  templating: { list: globalTemplating },
  panels: [
    makeStat(1, 'Active JDBC Pool', 0, 0, 4, 4, 'none', 'background', '#299c46', 4, 1, 15, 1),
    makeStat(2, 'Idle Connections', 4, 0, 4, 4, 'none', 'background', '#299c46', 46, 35, 50, 1),
    makeStat(3, 'Acquire Time', 8, 0, 4, 4, 'ms', 'background', '#299c46', 0.85, 0.2, 2.5, 0.1),
    makeStat(4, 'MySQL QPS', 12, 0, 4, 4, 'reqps', 'background', '#299c46', 2.14, 1.0, 5.0, 0.3),
    makeStat(5, 'Buffer Hit %', 16, 0, 4, 4, 'percent', 'background', '#299c46', 99.8, 98.5, 100, 0.1),
    makeStat(6, 'Slow Queries', 20, 0, 4, 4, 'none', 'background', '#299c46', 0, 0, 1, 0),

    makeGauge(7, 'HikariCP Pool Saturation', 0, 4, 6, 6, 'percent', '#299c46', 0, 100, 12),
    makeGauge(8, 'InnoDB Buffer Hit Ratio', 6, 4, 6, 6, 'percent', '#299c46', 0, 100, 99.8),
    makeTimeseries(9, 'MySQL Query Rate (Select, Insert, Update, Delete)', 12, 4, 12, 6, 'reqps', 2.5, 1.0, 6.0, 0.4),

    makeTimeseries(10, 'Connection Acquire Latency (ms)', 0, 10, 12, 8, 'ms', 0.8, 0.1, 2.0, 0.1),
    makeTimeseries(11, 'InnoDB Row Operations Rate / sec', 12, 10, 12, 8, 'ops', 14, 5, 30, 2)
  ]
};

// 4. NETWORK & NGINX NOC
const network_noc = {
  uid: 'network_noc',
  title: '4. NETWORK & NGINX NOC',
  tags: ['network', 'nginx', 'traffic', 'noc'],
  timezone: 'browser',
  schemaVersion: 39,
  version: 1,
  refresh: '5s',
  time: { from: 'now-6h', to: 'now' },
  templating: { list: globalTemplating },
  panels: [
    makeStat(1, 'Active Connections', 0, 0, 4, 4, 'none', 'background', '#299c46', 18, 10, 30, 2),
    makeStat(2, 'Nginx RPS', 4, 0, 4, 4, 'reqps', 'background', '#299c46', 4.8, 2.0, 10.0, 0.5),
    makeStat(3, 'HTTP 2xx Success %', 8, 0, 4, 4, 'percent', 'background', '#299c46', 99.4, 98.0, 100, 0.2),
    makeStat(4, 'HTTP 4xx Client Err', 12, 0, 4, 4, 'none', 'background', '#e0b400', 3, 1, 8, 1),
    makeStat(5, 'WebSocket Sessions', 16, 0, 4, 4, 'none', 'background', '#299c46', 7, 4, 12, 1),
    makeStat(6, 'SSL Cert Valid Days', 20, 0, 4, 4, 'days', 'background', '#299c46', 78, 60, 90, 0),

    makeGauge(7, 'Gateway Throughput Capacity', 0, 4, 6, 6, 'percent', '#299c46', 0, 100, 14),
    makeGauge(8, 'Network Bandwidth Saturation', 6, 4, 6, 6, 'percent', '#299c46', 0, 100, 8),
    makeTimeseries(9, 'Network Traffic Ingress vs Egress (MB/s)', 12, 4, 12, 6, 'mbytes', 1.8, 0.5, 4.5, 0.3),

    makeTimeseries(10, 'HTTP Status Codes Breakdown (2xx, 4xx, 5xx)', 0, 10, 12, 8, 'reqps', 4.5, 2.0, 9.0, 0.5),
    makeTimeseries(11, 'WebSocket Live Message Ingestion Rate', 12, 10, 12, 8, 'ops', 12, 4, 25, 2)
  ]
};

// 5. DOCKER & SERVER INFRASTRUCTURE
const infra_obs = {
  uid: 'infra_obs',
  title: '5. DOCKER & SERVER INFRASTRUCTURE',
  tags: ['infrastructure', 'host', 'cpu', 'memory', 'disk'],
  timezone: 'browser',
  schemaVersion: 39,
  version: 1,
  refresh: '5s',
  time: { from: 'now-6h', to: 'now' },
  templating: { list: globalTemplating },
  panels: [
    makeStat(1, 'Host CPU %', 0, 0, 4, 4, 'percent', 'background', '#299c46', 22.4, 12, 45, 2),
    makeStat(2, 'Memory Used', 4, 0, 4, 4, 'decgbytes', 'background', '#299c46', 2.85, 2.2, 4.0, 0.1),
    makeStat(3, 'Disk Free %', 8, 0, 4, 4, 'percent', 'background', '#299c46', 74.5, 70, 80, 0.2),
    makeStat(4, 'Load Average 1m', 12, 0, 4, 4, 'none', 'background', '#299c46', 0.42, 0.1, 1.2, 0.05),
    makeStat(5, 'Disk IOPS', 16, 0, 4, 4, 'iops', 'background', '#299c46', 34, 15, 60, 3),
    makeStat(6, 'Docker Containers', 20, 0, 4, 4, 'none', 'background', '#299c46', 4, 4, 4, 0),

    makeGauge(7, 'Host CPU Utilization', 0, 4, 6, 6, 'percent', '#299c46', 0, 100, 22.4),
    makeGauge(8, 'RAM Utilization', 6, 4, 6, 6, 'percent', '#299c46', 0, 100, 36.5),
    makeTimeseries(9, 'Per-Core CPU Load (User, System, IOWait)', 12, 4, 12, 6, 'percent', 24, 10, 50, 3),

    makeTimeseries(10, 'Host Memory Distribution (Active, Cache, Free)', 0, 10, 12, 8, 'decgbytes', 3.2, 2.0, 4.5, 0.2),
    makeTimeseries(11, 'Disk Read/Write IO Throughput (MB/s)', 12, 10, 12, 8, 'mbytes', 4.2, 1.0, 12.0, 0.8)
  ]
};

// 6. BUSINESS KPI & REVENUE
const business_erp = {
  uid: 'business_erp',
  title: '6. BUSINESS KPI & REVENUE',
  tags: ['business', 'production', 'sales', 'gst', 'revenue'],
  timezone: 'browser',
  schemaVersion: 39,
  version: 1,
  refresh: '5s',
  time: { from: 'now-6h', to: 'now' },
  templating: { list: globalTemplating },
  panels: [
    makeStat(1, 'Daily Production', 0, 0, 4, 4, 'none', 'background', '#299c46', 1850, 1600, 2200, 30),
    makeStat(2, 'Monthly PPM Total', 4, 0, 4, 4, 'none', 'background', '#299c46', 48500, 45000, 55000, 200),
    makeStat(3, 'Today Gross Sales', 8, 0, 4, 4, 'currencyINR', 'background', '#299c46', 154000, 130000, 190000, 3000),
    makeStat(4, '18% GST Tax', 12, 0, 4, 4, 'currencyINR', 'background', '#299c46', 27720, 23000, 34000, 500),
    makeStat(5, 'Dispatches Today', 16, 0, 4, 4, 'none', 'background', '#299c46', 14, 8, 20, 1),
    makeStat(6, 'HDPE Stock (kg)', 20, 0, 4, 4, 'none', 'background', '#299c46', 14200, 12000, 18000, 200),

    makeGauge(7, 'Daily Production Target', 0, 4, 6, 6, 'percent', '#299c46', 0, 100, 92.5),
    makeGauge(8, 'Monthly Sales Target', 6, 4, 6, 6, 'percent', '#299c46', 0, 100, 78.0),
    makeTimeseries(9, 'Daily Production Run-Rate by Shift', 12, 4, 12, 6, 'none', 180, 120, 250, 10),

    makeTimeseries(10, 'Live Invoicing & Gross Revenue Stream (₹)', 0, 10, 12, 8, 'currencyINR', 150000, 110000, 220000, 5000),
    makeTimeseries(11, 'HDPE Raw Material Burnout vs Restock', 12, 10, 12, 8, 'none', 14000, 11000, 18000, 200)
  ]
};

// 7. PAYMENT OBSERVABILITY
const payment_obs = {
  uid: 'payment_obs',
  title: '7. PAYMENT OBSERVABILITY',
  tags: ['payment', 'razorpay', 'upi', 'receivables', 'dues'],
  timezone: 'browser',
  schemaVersion: 39,
  version: 1,
  refresh: '5s',
  time: { from: 'now-6h', to: 'now' },
  templating: { list: globalTemplating },
  panels: [
    makeStat(1, 'Today Realized Cash', 0, 0, 4, 4, 'currencyINR', 'background', '#299c46', 165000, 140000, 200000, 3000),
    makeStat(2, 'Pending Receivables', 4, 0, 4, 4, 'currencyINR', 'background', '#e0b400', 95900, 75000, 120000, 2000),
    makeStat(3, 'Razorpay Volume', 8, 0, 4, 4, 'currencyINR', 'background', '#299c46', 84619, 70000, 95000, 1500),
    makeStat(4, 'Razorpay Success %', 12, 0, 4, 4, 'percent', 'background', '#299c46', 99.1, 97.5, 100, 0.2),
    makeStat(5, 'Driver Rent Dues', 16, 0, 4, 4, 'currencyINR', 'background', '#e0b400', 14200, 10000, 20000, 400),
    makeStat(6, 'Salary Disbursed', 20, 0, 4, 4, 'currencyINR', 'background', '#299c46', 185000, 185000, 185000, 0),

    makeGauge(7, 'Collection Efficiency', 0, 4, 6, 6, 'percent', '#299c46', 0, 100, 84.5),
    makeGauge(8, 'Razorpay Gateway Health', 6, 4, 6, 6, 'percent', '#299c46', 0, 100, 99.1),
    makeTimeseries(9, 'Daily Payment Inflow vs Outstanding Dues (₹)', 12, 4, 12, 6, 'currencyINR', 160000, 120000, 210000, 4000),

    makeTimeseries(10, 'Razorpay Transaction Velocity (Count / min)', 0, 10, 12, 8, 'ops', 18, 8, 30, 2),
    makeTimeseries(11, 'Transport Rent Advances vs Remaining Balance', 12, 10, 12, 8, 'currencyINR', 14000, 8000, 22000, 500)
  ]
};

// 8. SECURITY & AUDIT SOC
const security_soc = {
  uid: 'security_soc',
  title: '8. SECURITY & AUDIT SOC',
  tags: ['security', 'auth', 'rbac', 'audit', 'soc'],
  timezone: 'browser',
  schemaVersion: 39,
  version: 1,
  refresh: '5s',
  time: { from: 'now-6h', to: 'now' },
  templating: { list: globalTemplating },
  panels: [
    makeStat(1, 'Failed Logins 24h', 0, 0, 4, 4, 'none', 'background', '#299c46', 2, 0, 5, 1),
    makeStat(2, 'Locked Accounts', 4, 0, 4, 4, 'none', 'background', '#299c46', 0, 0, 1, 0),
    makeStat(3, 'MFA Success %', 8, 0, 4, 4, 'percent', 'background', '#299c46', 98.5, 95.0, 100, 0.3),
    makeStat(4, 'Rate Limit Blocks', 12, 0, 4, 4, 'none', 'background', '#299c46', 0, 0, 2, 0),
    makeStat(5, 'Admin Sessions', 16, 0, 4, 4, 'none', 'background', '#299c46', 3, 2, 5, 0),
    makeStat(6, 'Security Score', 20, 0, 4, 4, 'percent', 'background', '#299c46', 100, 98, 100, 0),

    makeGauge(7, 'Authentication Success Rate', 0, 4, 6, 6, 'percent', '#299c46', 0, 100, 98.5),
    makeGauge(8, 'SOC Threat Level', 6, 4, 6, 6, 'percent', '#299c46', 0, 100, 5.0),
    makeTimeseries(9, 'Login Attempts (Success vs Invalid Password vs Locked)', 12, 4, 12, 6, 'ops', 12, 5, 25, 2),

    makeTimeseries(10, 'MFA / OTP Verification Delivery Latency', 0, 10, 12, 8, 'ms', 450, 200, 800, 40),
    makeTimeseries(11, 'RBAC Activity by User Role (Admin, Operator, Viewer)', 12, 10, 12, 8, 'ops', 24, 10, 45, 3)
  ]
};

// 9. LOGS & REALTIME ALERTS
const logs_events = {
  uid: 'logs_events',
  title: '9. LOGS & REALTIME ALERTS',
  tags: ['logs', 'events', 'audit', 'alerts'],
  timezone: 'browser',
  schemaVersion: 39,
  version: 1,
  refresh: '5s',
  time: { from: 'now-6h', to: 'now' },
  templating: { list: globalTemplating },
  panels: [
    makeStat(1, 'Log Velocity', 0, 0, 4, 4, 'linespm', 'background', '#299c46', 420, 300, 600, 20),
    makeStat(2, 'Critical Errors', 4, 0, 4, 4, 'none', 'background', '#299c46', 0, 0, 1, 0),
    makeStat(3, 'Audit Log Entries', 8, 0, 4, 4, 'none', 'background', '#299c46', 1280, 1100, 1500, 15),
    makeStat(4, 'Soft Delete Ops', 12, 0, 4, 4, 'none', 'background', '#299c46', 3, 1, 8, 1),
    makeStat(5, 'Warn Log Rate', 16, 0, 4, 4, 'none', 'background', '#e0b400', 8, 4, 15, 1),
    makeStat(6, 'Audit Health %', 20, 0, 4, 4, 'percent', 'background', '#299c46', 100, 99, 100, 0),

    makeGauge(7, 'Log Ingestion Buffer Saturation', 0, 4, 6, 6, 'percent', '#299c46', 0, 100, 18.2),
    makeGauge(8, 'Error Ratio over Total Logs', 6, 4, 6, 6, 'percent', '#299c46', 0, 100, 0.4),
    makeTimeseries(9, 'Log Streams Velocity (INFO, WARN, ERROR, DEBUG)', 12, 4, 12, 6, 'linespm', 450, 300, 650, 25),

    makeTimeseries(10, 'Entity Change Audit Stream (Sales, CRM, PPD, HR)', 0, 10, 12, 8, 'ops', 18, 8, 35, 2),
    makeTimeseries(11, 'Exception & Stack Trace Occurrences', 12, 10, 12, 8, 'none', 0, 0, 2, 0)
  ]
};

// 10. SRE OPERATIONS & RELIABILITY
const sre_ops = {
  uid: 'sre_ops',
  title: '10. SRE OPERATIONS & RELIABILITY',
  tags: ['sre', 'sli', 'slo', 'reliability', 'golden-signals'],
  timezone: 'browser',
  schemaVersion: 39,
  version: 1,
  refresh: '5s',
  time: { from: 'now-6h', to: 'now' },
  templating: { list: globalTemplating },
  panels: [
    makeStat(1, 'Availability %', 0, 0, 4, 4, 'percent', 'background', '#299c46', 99.98, 99.9, 100, 0.01),
    makeStat(2, 'Error Budget Rem %', 4, 0, 4, 4, 'percent', 'background', '#299c46', 98.4, 95.0, 100, 0.2),
    makeStat(3, 'MTTR (Minutes)', 8, 0, 4, 4, 'm', 'background', '#299c46', 2.4, 1.0, 5.0, 0.2),
    makeStat(4, 'Active Incidents', 12, 0, 4, 4, 'none', 'background', '#299c46', 0, 0, 0, 0),
    makeStat(5, 'Golden Traffic', 16, 0, 4, 4, 'reqps', 'background', '#299c46', 4.8, 2.0, 10.0, 0.4),
    makeStat(6, 'Golden Error %', 20, 0, 4, 4, 'percent', 'background', '#299c46', 0.02, 0.0, 0.1, 0.01),

    makeGauge(7, 'Monthly 99.9% SLO Attainment', 0, 4, 6, 6, 'percent', '#299c46', 0, 100, 99.98),
    makeGauge(8, 'Error Budget Burn Rate', 6, 4, 6, 6, 'percent', '#299c46', 0, 100, 1.6),
    makeTimeseries(9, 'Four Golden Signals: Traffic & Saturation Matrix', 12, 4, 12, 6, 'reqps', 4.5, 2.0, 8.5, 0.4),

    makeTimeseries(10, 'Golden Signal: End-to-End Latency Duration', 0, 10, 12, 8, 'ms', 42, 25, 75, 3),
    makeTimeseries(11, 'SLO Error Budget Burn Timeline (30-Day Window)', 12, 10, 12, 8, 'percent', 98.4, 95.0, 100, 0.2)
  ]
};

const allDashboards = [
  master_cc,
  apm_perf,
  db_obs,
  network_noc,
  infra_obs,
  business_erp,
  payment_obs,
  security_soc,
  logs_events,
  sre_ops
];

allDashboards.forEach(d => {
  const filePath = path.join(dir, `${d.uid}.json`);
  fs.writeFileSync(filePath, JSON.stringify(d, null, 2), 'utf8');
  console.log(`  🟢 Generated Unique Domain Dashboard: ${d.title} (${d.uid}.json)`);
});

console.log('All 10 unique, domain-specific dashboards generated successfully!');
