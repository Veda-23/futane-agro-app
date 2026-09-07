const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, 'grafana_dashboards_clean');
if (fs.existsSync(outputDir)) {
    const files = fs.readdirSync(outputDir);
    for (const file of files) {
        fs.unlinkSync(path.join(outputDir, file));
    }
} else {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Global Datasource References
const DS_PROM = { uid: "prometheus_ds", type: "prometheus" };
const DS_LOKI = { uid: "loki_ds", type: "loki" };
const DS_ALERT = { uid: "alertmanager_ds", type: "alertmanager" };
const DS_MYSQL = { uid: "mysql_ds", type: "mysql" };

// Helper to create Stat Panel
function createStatPanel(id, title, query, ds, unit = "none", x = 0, y = 0, w = 6, h = 4, color = "orange") {
    return {
        id,
        title,
        type: "stat",
        gridPos: { x, y, w, h },
        datasource: ds,
        targets: [
            ds.type === "mysql" ? { rawSql: query, format: "table" } :
            ds.type === "loki" ? { expr: query, refId: "A" } :
            { expr: query, refId: "A" }
        ],
        fieldConfig: {
            defaults: {
                unit,
                color: { mode: "thresholds" },
                thresholds: {
                    mode: "absolute",
                    steps: [
                        { color: "green", value: null },
                        { color: "red", value: 80 }
                    ]
                }
            }
        },
        options: {
            reduceOptions: { values: false, calcs: ["lastNotNull"], fields: "" },
            orientation: "auto",
            textMode: "auto",
            colorMode: "value"
        }
    };
}

// Helper to create Time Series Panel
function createTimeSeriesPanel(id, title, query, ds, unit = "none", x = 0, y = 0, w = 12, h = 8) {
    return {
        id,
        title,
        type: "timeseries",
        gridPos: { x, y, w, h },
        datasource: ds,
        targets: [
            ds.type === "mysql" ? { rawSql: query, format: "time_series" } :
            { expr: query, refId: "A" }
        ],
        fieldConfig: {
            defaults: {
                unit,
                custom: {
                    drawStyle: "line",
                    lineInterpolation: "smooth",
                    lineWidth: 2,
                    fillOpacity: 15,
                    gradientMode: "opacity"
                }
            }
        }
    };
}

// Helper to create Log Panel
function createLogPanel(id, title, query, ds, x = 0, y = 0, w = 24, h = 10) {
    return {
        id,
        title,
        type: "logs",
        gridPos: { x, y, w, h },
        datasource: ds,
        targets: [{ expr: query, refId: "A" }],
        options: {
            showLabels: false,
            wrapLogMessage: true,
            enableLogDetails: true,
            sortOrder: "Descending"
        }
    };
}

// 1. MASTER COMMAND CENTER
const dash1 = {
    title: "1. MASTER COMMAND CENTER",
    uid: "master_cc",
    tags: ["master", "command-center", "executive", "erp"],
    timezone: "browser",
    schemaVersion: 38,
    refresh: "10s",
    panels: [
        createStatPanel(1, "Overall System Health Score", "up{job='spring-boot'}", DS_PROM, "percentunit", 0, 0, 6, 4),
        createStatPanel(2, "Active Firing Alerts", "ALERTS{alertstate='firing'}", DS_PROM, "none", 6, 0, 6, 4),
        createStatPanel(3, "Total Sales Revenue Today", "SELECT COALESCE(SUM(total_amount), 0) FROM t_sales WHERE DATE(created_at) = CURRENT_DATE()", DS_MYSQL, "currencyINR", 12, 0, 6, 4),
        createStatPanel(4, "JVM Heap Memory Usage", "jvm_memory_used_bytes{area='heap'}", DS_PROM, "bytes", 18, 0, 6, 4),
        createTimeSeriesPanel(5, "Golden Signal: Request Rate (RPS)", "sum(rate(http_server_requests_seconds_count[1m]))", DS_PROM, "reqps", 0, 4, 12, 8),
        createTimeSeriesPanel(6, "Golden Signal: Latency P95 (Seconds)", "histogram_quantile(0.95, sum(rate(http_server_requests_seconds_bucket[5m])) by (le))", DS_PROM, "s", 12, 4, 12, 8)
    ]
};

// 2. APPLICATION PERFORMANCE
const dash2 = {
    title: "2. APPLICATION PERFORMANCE",
    uid: "apm_perf",
    tags: ["apm", "spring-boot", "performance"],
    timezone: "browser",
    schemaVersion: 38,
    refresh: "10s",
    panels: [
        createTimeSeriesPanel(1, "HTTP Request Rate by URI", "sum(rate(http_server_requests_seconds_count[1m])) by (uri)", DS_PROM, "reqps", 0, 0, 12, 8),
        createTimeSeriesPanel(2, "API Response Time Latency (P50, P95, P99)", "histogram_quantile(0.95, sum(rate(http_server_requests_seconds_bucket[5m])) by (le))", DS_PROM, "s", 12, 0, 12, 8),
        createTimeSeriesPanel(3, "JVM Memory Usage (Heap vs Non-Heap)", "jvm_memory_used_bytes", DS_PROM, "bytes", 0, 8, 12, 8),
        createTimeSeriesPanel(4, "Garbage Collection Pause Time", "rate(jvm_gc_pause_seconds_sum[2m])", DS_PROM, "s", 12, 8, 12, 8)
    ]
};

// 3. DATABASE OBSERVABILITY
const dash3 = {
    title: "3. DATABASE OBSERVABILITY",
    uid: "db_obs",
    tags: ["database", "mysql", "performance"],
    timezone: "browser",
    schemaVersion: 38,
    refresh: "10s",
    panels: [
        createStatPanel(1, "MySQL Active Connections", "SELECT COUNT(*) FROM information_schema.processlist WHERE command != 'Sleep'", DS_MYSQL, "none", 0, 0, 6, 4),
        createStatPanel(2, "Total Customer Parties", "SELECT COUNT(*) FROM t_crm_party", DS_MYSQL, "none", 6, 0, 6, 4),
        createStatPanel(3, "Total Sales Orders", "SELECT COUNT(*) FROM t_sales", DS_MYSQL, "none", 12, 0, 6, 4),
        createStatPanel(4, "Total Payment Collections", "SELECT COUNT(*) FROM t_payment_collection", DS_MYSQL, "none", 18, 0, 6, 4),
        createTimeSeriesPanel(5, "MySQL Query Time Distribution", "mysql_global_status_queries", DS_PROM, "ops", 0, 4, 12, 8),
        createTimeSeriesPanel(6, "MySQL Buffer Pool Data Pages", "mysql_global_status_innodb_buffer_pool_pages_data", DS_PROM, "short", 12, 4, 12, 8)
    ]
};

// 4. NETWORK & NGINX
const dash4 = {
    title: "4. NETWORK & NGINX",
    uid: "network_noc",
    tags: ["network", "nginx", "noc"],
    timezone: "browser",
    schemaVersion: 38,
    refresh: "10s",
    panels: [
        createTimeSeriesPanel(1, "Nginx Inbound/Outbound Traffic", "sum(rate(node_network_receive_bytes_total{device!='lo'}[2m]))", DS_PROM, "Bps", 0, 0, 12, 8),
        createTimeSeriesPanel(2, "TCP Active Connections", "node_netstat_Tcp_CurrEstab", DS_PROM, "short", 12, 0, 12, 8)
    ]
};

// 5. DOCKER & SERVER
const dash5 = {
    title: "5. DOCKER & SERVER",
    uid: "infra_obs",
    tags: ["docker", "server", "infrastructure"],
    timezone: "browser",
    schemaVersion: 38,
    refresh: "10s",
    panels: [
        createStatPanel(1, "CPU Usage %", "100 - (avg(rate(node_cpu_seconds_total{mode='idle'}[2m])) * 100)", DS_PROM, "percent", 0, 0, 6, 4),
        createStatPanel(2, "RAM Usage %", "(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100", DS_PROM, "percent", 6, 0, 6, 4),
        createStatPanel(3, "Disk Used %", "(1 - (node_filesystem_avail_bytes{mountpoint='/'} / node_filesystem_size_bytes{mountpoint='/'})) * 100", DS_PROM, "percent", 12, 0, 6, 4),
        createStatPanel(4, "Running Docker Containers", "count(container_last_seen)", DS_PROM, "none", 18, 0, 6, 4),
        createTimeSeriesPanel(5, "Network Traffic In/Out", "rate(node_network_receive_bytes_total[2m])", DS_PROM, "Bps", 0, 4, 12, 8),
        createTimeSeriesPanel(6, "Disk I/O Read/Write Rate", "rate(node_disk_read_bytes_total[2m])", DS_PROM, "Bps", 12, 4, 12, 8)
    ]
};

// 6. BUSINESS KPI
const dash6 = {
    title: "6. BUSINESS KPI",
    uid: "business_erp",
    tags: ["business", "erp", "revenue"],
    timezone: "browser",
    schemaVersion: 38,
    refresh: "10s",
    panels: [
        createStatPanel(1, "Total Sales Revenue", "SELECT COALESCE(SUM(total_amount), 0) FROM t_sales", DS_MYSQL, "currencyINR", 0, 0, 6, 4),
        createStatPanel(2, "Outstanding Due Balances", "SELECT COALESCE(SUM(remaining_amount), 0) FROM t_sales", DS_MYSQL, "currencyINR", 6, 0, 6, 4),
        createStatPanel(3, "Total Payment Collections", "SELECT COALESCE(SUM(amount_received), 0) FROM t_payment_collection", DS_MYSQL, "currencyINR", 12, 0, 6, 4),
        createStatPanel(4, "Total Crate Production Volume", "SELECT COALESCE(SUM(total_production), 0) FROM t_production_daily", DS_MYSQL, "none", 18, 0, 6, 4)
    ]
};

// 7. PAYMENT OBSERVABILITY (Razorpay)
const dash7 = {
    title: "7. PAYMENT OBSERVABILITY",
    uid: "payment_obs",
    tags: ["payment", "razorpay", "checkout", "webhook"],
    timezone: "browser",
    schemaVersion: 38,
    refresh: "10s",
    panels: [
        createStatPanel(1, "Total Payment Links Generated", "SELECT COUNT(*) FROM t_payment_link", DS_MYSQL, "none", 0, 0, 6, 4),
        createStatPanel(2, "Completed Razorpay Payments", "SELECT COUNT(*) FROM t_payment_link WHERE status = 'PAID'", DS_MYSQL, "none", 6, 0, 6, 4),
        createStatPanel(3, "Razorpay Total Revenue Collected", "SELECT COALESCE(SUM(amount), 0) FROM t_payment_link WHERE status = 'PAID'", DS_MYSQL, "currencyINR", 12, 0, 6, 4),
        createStatPanel(4, "Outstanding Sale Dues", "SELECT COALESCE(SUM(remaining_amount), 0) FROM t_sales", DS_MYSQL, "currencyINR", 18, 0, 6, 4),
        createLogPanel(5, "Razorpay Payment & Webhook Execution Logs", '{job="futane-backend"} |= "Razorpay"', DS_LOKI, 0, 4, 24, 10)
    ]
};

// 8. SECURITY & AUDIT
const dash8 = {
    title: "8. SECURITY & AUDIT",
    uid: "security_soc",
    tags: ["security", "soc", "audit", "jwt"],
    timezone: "browser",
    schemaVersion: 38,
    refresh: "10s",
    panels: [
        createStatPanel(1, "SSL Certificate Expiry Days", "probe_ssl_earliest_cert_expiry - time()", DS_PROM, "d", 0, 0, 8, 4),
        createStatPanel(2, "HTTP 4xx Unauthorized Errors", "sum(rate(http_server_requests_seconds_count{status=~'4..'}[5m]))", DS_PROM, "reqps", 8, 0, 8, 4),
        createStatPanel(3, "HTTP 5xx Server Errors", "sum(rate(http_server_requests_seconds_count{status=~'5..'}[5m]))", DS_PROM, "reqps", 16, 0, 8, 4),
        createLogPanel(4, "JWT & User Security Audit Trail", '{job="futane-backend"} |= "JWT" or "Login" or "Audit"', DS_LOKI, 0, 4, 24, 10)
    ]
};

// 9. LOGS & ALERTS
const dash9 = {
    title: "9. LOGS & ALERTS",
    uid: "logs_events",
    tags: ["logs", "alerts", "loki"],
    timezone: "browser",
    schemaVersion: 38,
    refresh: "10s",
    panels: [
        createStatPanel(1, "Active Alertmanager Firing Alerts", "ALERTS{alertstate='firing'}", DS_PROM, "none", 0, 0, 12, 4),
        createStatPanel(2, "System SLA Availability %", "avg_over_time(up{job='spring-boot'}[24h]) * 100", DS_PROM, "percent", 12, 0, 12, 4),
        createLogPanel(3, "Aggregated System Logs (Spring + Nginx)", '{job=~"futane-backend|nginx"}', DS_LOKI, 0, 4, 24, 10)
    ]
};

// 10. SRE OPERATIONS
const dash10 = {
    title: "10. SRE OPERATIONS",
    uid: "sre_ops",
    tags: ["sre", "slo", "sla", "ops"],
    timezone: "browser",
    schemaVersion: 38,
    refresh: "10s",
    panels: [
        createStatPanel(1, "Service Availability (SLA Target 99.9%)", "avg_over_time(up{job='spring-boot'}[24h]) * 100", DS_PROM, "percent", 0, 0, 8, 4),
        createStatPanel(2, "Error Budget Remaining %", "(1 - sum(rate(http_server_requests_seconds_count{status=~'5..'}[1h])) / sum(rate(http_server_requests_seconds_count[1h]))) * 100", DS_PROM, "percent", 8, 0, 8, 4),
        createStatPanel(3, "Mean Time To Detect (MTTD)", "vector(0)", DS_PROM, "s", 16, 0, 8, 4),
        createTimeSeriesPanel(4, "API Golden Signals (RPS & Latency)", "sum(rate(http_server_requests_seconds_count[1m]))", DS_PROM, "reqps", 0, 4, 24, 8)
    ]
};

const allDashboards = [dash1, dash2, dash3, dash4, dash5, dash6, dash7, dash8, dash9, dash10];

allDashboards.forEach(d => {
    const file = path.join(outputDir, `${d.uid}.json`);
    fs.writeFileSync(file, JSON.stringify(d, null, 2));
    console.log(`Generated dashboard: ${d.title} (${d.uid}.json)`);
});
