const fs = require('fs');

const dashboard = {
  "uid": "erp-l1-command-center",
  "title": "Main Executive Command Center",
  "tags": ["enterprise", "noc", "l1"],
  "timezone": "browser",
  "schemaVersion": 38,
  "version": 1,
  "refresh": "10s",
  "graphTooltip": 1,
  "time": {
    "from": "now-6h",
    "to": "now"
  },
  "templating": {
    "list": [
      {
        "name": "environment",
        "type": "constant",
        "query": "PROD",
        "hide": 2
      }
    ]
  },
  "panels": []
};

let panelId = 1;
let currentY = 0;

// Helper to create a row
function addRow(title, height = 1) {
  dashboard.panels.push({
    "id": panelId++,
    "type": "row",
    "title": title,
    "gridPos": { "h": 1, "w": 24, "x": 0, "y": currentY }
  });
  currentY += 1;
}

// Helper to create a stat panel
function addStatPanel(title, query, expr, w, h, x) {
  dashboard.panels.push({
    "id": panelId++,
    "title": title,
    "type": "stat",
    "datasource": { "type": "prometheus", "uid": "prometheus" },
    "gridPos": { "h": h, "w": w, "x": x, "y": currentY },
    "targets": [
      {
        "expr": expr,
        "refId": "A"
      }
    ],
    "options": {
      "colorMode": "background",
      "graphMode": "none",
      "justifyMode": "auto"
    }
  });
}

// Helper to create a timeseries panel
function addTimeSeriesPanel(title, expr, w, h, x) {
  dashboard.panels.push({
    "id": panelId++,
    "title": title,
    "type": "timeseries",
    "datasource": { "type": "prometheus", "uid": "prometheus" },
    "gridPos": { "h": h, "w": w, "x": x, "y": currentY },
    "targets": [
      {
        "expr": expr,
        "refId": "A"
      }
    ]
  });
}

// Row 1: Global Health
addRow("Global Health & Core Metrics");
addStatPanel("Global Health Score", "prometheus", "100", 3, 4, 0);
addStatPanel("ERP Availability", "prometheus", 'up{job="erp-backend"}', 3, 4, 3);
addStatPanel("Critical Alerts", "prometheus", 'count(ALERTS{severity="critical", state="firing"})', 2, 4, 6);
addStatPanel("Warning Alerts", "prometheus", 'count(ALERTS{severity="warning", state="firing"})', 2, 4, 8);
addStatPanel("Logged Users", "prometheus", "sum(erp_active_sessions)", 2, 4, 10);
// MySQL mock metrics for dashboard (in reality these use mysql datasource)
addStatPanel("Today's Revenue", "prometheus", "sum(daily_revenue)", 3, 4, 12);
addStatPanel("Today's Orders", "prometheus", "sum(daily_orders)", 3, 4, 15);
addStatPanel("Today's Production", "prometheus", "sum(daily_production)", 3, 4, 18);
addStatPanel("DB Health", "prometheus", "mysql_up", 1.5, 4, 21);
addStatPanel("API Health", "prometheus", "probe_success", 1.5, 4, 22.5);
currentY += 4;

// Row 2: Golden Signals
addRow("Golden Signals (SRE)");
addTimeSeriesPanel("Latency (95th)", "histogram_quantile(0.95, rate(http_server_requests_seconds_bucket[5m]))", 6, 6, 0);
addTimeSeriesPanel("Traffic (RPS)", "rate(http_server_requests_seconds_count[5m])", 6, 6, 6);
addTimeSeriesPanel("Errors (5xx)", 'rate(http_server_requests_seconds_count{status=~"5.."}[5m])', 6, 6, 12);
addTimeSeriesPanel("Saturation (CPU)", "process_cpu_usage", 6, 6, 18);
currentY += 6;

// Row 3: Application Status
addRow("Application Infrastructure Status");
dashboard.panels.push({
  "id": panelId++,
  "title": "Service Map Status",
  "type": "state-timeline",
  "datasource": { "type": "prometheus", "uid": "prometheus" },
  "gridPos": { "h": 4, "w": 24, "x": 0, "y": currentY },
  "targets": [{ "expr": 'up{job=~"frontend|backend|mysql|redis|node|nginx"}', "refId": "A" }]
});
currentY += 4;

// Row 4: Business KPIs
addRow("Live Business KPIs");
dashboard.panels.push({
  "id": panelId++,
  "title": "Business Module Activity",
  "type": "bargauge",
  "datasource": { "type": "prometheus", "uid": "prometheus" },
  "gridPos": { "h": 5, "w": 24, "x": 0, "y": currentY },
  "targets": [{ "expr": 'sum by (module) (erp_business_activity_total)', "refId": "A" }]
});
currentY += 5;

// Row 5: Infrastructure
addRow("Physical Infrastructure (Oracle VM)");
addStatPanel("CPU Usage %", "prometheus", '100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)', 3, 6, 0);
addStatPanel("RAM Usage %", "prometheus", '(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100', 3, 6, 3);
addStatPanel("Disk Usage %", "prometheus", '100 - (node_filesystem_avail_bytes / node_filesystem_size_bytes * 100)', 3, 6, 6);
addStatPanel("Swap Usage %", "prometheus", '(node_memory_SwapTotal_bytes - node_memory_SwapFree_bytes) / node_memory_SwapTotal_bytes * 100', 3, 6, 9);
addTimeSeriesPanel("Load Average", "node_load1", 4, 6, 12);
addStatPanel("Temperature", "prometheus", "node_hwmon_temp_celsius", 2, 6, 16);
addStatPanel("Docker Health", "prometheus", 'engine_daemon_container_states_containers{state="running"}', 2, 6, 18);
addTimeSeriesPanel("Network I/O", "rate(node_network_receive_bytes_total[5m])", 4, 6, 20);
currentY += 6;

// Save JSON
fs.writeFileSync('c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/l1-command-center.json', JSON.stringify(dashboard, null, 2));
console.log("Dashboard JSON generated successfully!");
