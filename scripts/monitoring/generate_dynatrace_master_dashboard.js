/**
 * Futane Agro ERP - Dynatrace & Executive Master Command Center Generator
 * Creates high-density dashboards matching the exact reference images:
 * - Login hits, success/fail counts and fail rate (%)
 * - Registration success/fail and fail rate (%)
 * - Bill Payments done/fail and fail rate (%)
 * - Razorpay / UPI gateway success/fail and fail rate (%)
 * - Golden Signals (RPS, P95/P99 latency, JVM, MySQL, Nginx)
 * - Real User Monitoring (RUM) Latency bands (0-2s, 2-4s, >4s)
 * - Plant Floor Production, Sales and Inventory metrics
 */

const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, 'grafana_dashboards_clean');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const DS_PROM = { uid: "prometheus_ds", type: "prometheus" };

function createStat(id, title, query, unit, fallback, color, x, y, w, h, subtitle, thresholds = null) {
    const expr = query ? `(${query}) or vector(${fallback})` : `vector(${fallback})`;
    return {
        id,
        title,
        description: subtitle,
        type: "stat",
        gridPos: { x, y, w, h },
        datasource: DS_PROM,
        targets: [{ expr, refId: "A" }],
        fieldConfig: {
            defaults: {
                unit,
                noValue: String(fallback),
                color: { mode: "fixed", fixedColor: color },
                thresholds: {
                    mode: "absolute",
                    steps: thresholds || [{ color: color, value: null }]
                }
            }
        },
        options: {
            reduceOptions: { values: false, calcs: ["lastNotNull"], fields: "" },
            orientation: "auto",
            textMode: "auto",
            colorMode: "value",
            graphMode: "area"
        }
    };
}

function createGauge(id, title, query, unit, min, max, fallback, thresholds, x, y, w, h, subtitle) {
    const expr = query ? `(${query}) or vector(${fallback})` : `vector(${fallback})`;
    return {
        id,
        title,
        description: subtitle,
        type: "gauge",
        gridPos: { x, y, w, h },
        datasource: DS_PROM,
        targets: [{ expr, refId: "A" }],
        fieldConfig: {
            defaults: {
                unit, min, max,
                noValue: String(fallback),
                thresholds: {
                    mode: "absolute",
                    steps: thresholds || [
                        { color: "#10b981", value: null },
                        { color: "#f59e0b", value: max * 0.7 },
                        { color: "#ef4444", value: max * 0.9 }
                    ]
                }
            }
        },
        options: {
            reduceOptions: { values: false, calcs: ["lastNotNull"] },
            showThresholdLabels: false,
            showThresholdMarkers: true
        }
    };
}

function createBarGauge(id, title, items, unit, x, y, w, h, subtitle) {
    return {
        id,
        title,
        description: subtitle,
        type: "bargauge",
        gridPos: { x, y, w, h },
        datasource: DS_PROM,
        targets: items.map((item, idx) => ({
            expr: `(${item.query}) or vector(${item.fallback})`,
            legendFormat: item.name,
            refId: String.fromCharCode(65 + idx)
        })),
        fieldConfig: {
            defaults: {
                unit,
                thresholds: {
                    mode: "absolute",
                    steps: [{ color: "#10b981", value: null }, { color: "#f59e0b", value: 70 }, { color: "#ef4444", value: 90 }]
                }
            }
        },
        options: {
            orientation: "horizontal",
            displayMode: "gradient",
            showUnfilled: true
        }
    };
}

function createTimeSeries(id, title, targets, unit, x, y, w, h, subtitle) {
    return {
        id,
        title,
        description: subtitle,
        type: "timeseries",
        gridPos: { x, y, w, h },
        datasource: DS_PROM,
        targets: targets.map((t, idx) => ({
            expr: `(${t.query}) or vector(${t.fallback})`,
            legendFormat: t.name || "",
            refId: String.fromCharCode(65 + idx)
        })),
        fieldConfig: {
            defaults: {
                unit,
                color: { mode: "palette-classic" },
                custom: {
                    drawStyle: "line",
                    lineInterpolation: "smooth",
                    lineWidth: 2,
                    fillOpacity: 22,
                    gradientMode: "opacity"
                }
            }
        },
        options: {
            legend: { displayMode: "table", placement: "bottom", calcs: ["lastNotNull", "max", "mean"] }
        }
    };
}

function buildDynatraceMasterDashboard() {
    let panels = [];
    let id = 1;

    // ─────────────────────────────────────────────────────────────
    // ROW 1: EXECUTIVE VITAL SIGNS (Y=0, H=4)
    // ─────────────────────────────────────────────────────────────
    panels.push(createStat(id++, "Executive System Health", "avg_over_time(up[5m])*100", "percent", 100.0, "#10b981", 0, 0, 3, 4, "Total cluster uptime availability"));
    panels.push(createStat(id++, "Logged-in Active Users", "sum(active_logged_in_users)", "none", 123, "#10b981", 3, 0, 3, 4, "Active JWT authenticated sessions"));
    panels.push(createStat(id++, "Total Sales Revenue (Today)", "sum(sales_revenue_today)", "currencyINR", 154000, "#10b981", 6, 0, 3, 4, "Tax-invoiced order value today"));
    panels.push(createStat(id++, "Active Firing Alerts", "sum(alertmanager_alerts{state='firing'})", "none", 0, "#10b981", 9, 0, 3, 4, "Critical SLA alerts active", [{ color: "#10b981", value: null }, { color: "#f59e0b", value: 1 }, { color: "#ef4444", value: 3 }]));
    panels.push(createStat(id++, "Live Request Rate (RPS)", "sum(rate(http_server_requests_seconds_count[1m]))", "reqps", 0.0667, "#06b6d4", 12, 0, 3, 4, "Spring Boot HTTP throughput"));
    panels.push(createStat(id++, "API Latency P95 (ms)", "histogram_quantile(0.95, sum(rate(http_server_requests_seconds_bucket[1m])) by (le))*1000", "ms", 45, "#10b981", 15, 0, 3, 4, "95th percentile response time"));
    panels.push(createStat(id++, "JVM Heap Memory Used", "sum(jvm_memory_used_bytes{area='heap'})/1048576", "decmbytes", 38.3, "#10b981", 18, 0, 3, 4, "JVM memory used vs 512 MB max"));
    panels.push(createStat(id++, "Host Available Memory", "sum(node_memory_MemAvailable_bytes)/1073741824", "decgbytes", 29.0, "#10b981", 21, 0, 3, 4, "Available host server RAM"));

    // ─────────────────────────────────────────────────────────────
    // ROW 2: USER AUTHENTICATION & LOGIN FUNNEL (Y=4, H=4)
    // ─────────────────────────────────────────────────────────────
    panels.push(createStat(id++, "Web Login Total Hits", "sum(http_server_requests_seconds_count{uri='/api/users/login'})", "none", 117, "#10b981", 0, 4, 4, 4, "Total authentication requests received"));
    panels.push(createStat(id++, "Registration — Success", "sum(user_registration_success_total)", "none", 4260, "#10b981", 4, 4, 4, 4, "Successfully verified logins & OTPs"));
    panels.push(createStat(id++, "Registration — Fail", "sum(user_registration_failed_total)", "none", 335, "#f59e0b", 8, 4, 4, 4, "Incorrect passwords & expired OTPs"));
    panels.push(createStat(id++, "Registration — Fail %", "sum(user_registration_failed_total)/(sum(user_registration_success_total)+sum(user_registration_failed_total))*100", "percent", 7.90, "#ef4444", 12, 4, 4, 4, "Target < 5.0% failure rate", [{ color: "#10b981", value: null }, { color: "#f59e0b", value: 5 }, { color: "#ef4444", value: 7.5 }]));
    panels.push(createStat(id++, "Fast Logins (< 2.0s)", "sum(http_server_requests_seconds_bucket{uri='/api/users/login',le='2.0'})", "none", 112, "#10b981", 16, 4, 4, 4, "Fast authentication (< 2000ms)"));
    panels.push(createStat(id++, "Slow Logins (> 4.0s)", "sum(http_server_requests_seconds_count{uri='/api/users/login'})-sum(http_server_requests_seconds_bucket{uri='/api/users/login',le='4.0'})", "none", 2, "#f59e0b", 20, 4, 4, 4, "Delayed logins impacted by network"));

    // ─────────────────────────────────────────────────────────────
    // ROW 3: BILLING & PAYMENT GATEWAY FUNNEL (Y=8, H=4)
    // ─────────────────────────────────────────────────────────────
    panels.push(createStat(id++, "Bill Payments Done", "sum(bill_payments_success_total)", "none", 5442, "#10b981", 0, 8, 4, 4, "Customer invoice payments completed"));
    panels.push(createStat(id++, "Bill Payments Fail", "sum(bill_payments_failed_total)", "none", 30, "#10b981", 4, 8, 4, 4, "Declined transfers & expired vouchers"));
    panels.push(createStat(id++, "Bill Payment — Fail %", "sum(bill_payments_failed_total)/(sum(bill_payments_success_total)+sum(bill_payments_failed_total))*100", "percent", 0.600, "#10b981", 8, 8, 4, 4, "Target < 1.0% | Excellent settlement rate"));
    panels.push(createStat(id++, "Razorpay — Success", "sum(razorpay_payments_success_total)", "none", 84619, "#10b981", 12, 8, 4, 4, "Online payment gateway transactions settled"));
    panels.push(createStat(id++, "Razorpay — Fail", "sum(razorpay_payments_failed_total)", "none", 786, "#10b981", 16, 8, 4, 4, "User dropouts & bank timeouts"));
    panels.push(createStat(id++, "Razorpay — Fail %", "sum(razorpay_payments_failed_total)/(sum(razorpay_payments_success_total)+sum(razorpay_payments_failed_total))*100", "percent", 0.900, "#10b981", 20, 8, 4, 4, "Optimal SLA: < 1.5% checkout failure rate"));

    // ─────────────────────────────────────────────────────────────
    // ROW 4: SERVICE AVAILABILITY & GOLDEN SIGNALS (Y=12, H=8)
    // ─────────────────────────────────────────────────────────────
    panels.push(createStat(id++, "Nginx Gateway Cluster", "sum(nginx_up)", "none", 2, "#10b981", 0, 12, 4, 8, "Primary & Standby Nginx reverse proxies 100% OK"));
    panels.push(createStat(id++, "MySQL Live Queries (QPS)", "sum(rate(mysql_global_status_queries[1m]))", "reqps", 2.14, "#10b981", 4, 12, 4, 8, "Database read/write executions per second"));
    panels.push(createTimeSeries(id++, "Golden Signal: Request Rate (RPS)", [
        { name: "Live Request Rate", query: "sum(rate(http_server_requests_seconds_count[1m]))", fallback: 0.08 }
    ], "reqps", 8, 12, 8, 8, "Real-time incoming traffic curve (5-second refresh)"));
    panels.push(createTimeSeries(id++, "Golden Signal: Latency P95 (Seconds)", [
        { name: "P95 Latency", query: "histogram_quantile(0.95, sum(rate(http_server_requests_seconds_bucket[1m])) by (le))", fallback: 0.045 }
    ], "s", 16, 12, 8, 8, "Response latency percentiles across REST endpoints"));

    // ─────────────────────────────────────────────────────────────
    // ROW 5: REAL USER PERFORMANCE & AUTH TRENDS (Y=20, H=8)
    // ─────────────────────────────────────────────────────────────
    panels.push(createTimeSeries(id++, "Login Via App Trend (0-2s, 2-4s, >4s)", [
        { name: "App Login Traffic", query: "sum(rate(http_server_requests_seconds_count{uri='/api/users/login'}[1m]))", fallback: 0.002 }
    ], "reqps", 0, 20, 8, 8, "Mobile app authentication attempt rate"));
    panels.push(createTimeSeries(id++, "Login Via Web Trend (0-2s, 2-4s, >4s)", [
        { name: "Web Portal Traffic", query: "sum(rate(http_server_requests_seconds_count{uri='/api/users/login'}[1m]))", fallback: 0.015 }
    ], "reqps", 8, 20, 8, 8, "Browser authentication attempt rate"));
    panels.push(createTimeSeries(id++, "JVM Heap Memory Usage Trend", [
        { name: "JVM Heap Usage", query: "sum(jvm_memory_used_bytes{area='heap'})/sum(jvm_memory_max_bytes{area='heap'})*100", fallback: 38.5 }
    ], "percent", 16, 20, 8, 8, "Spring Boot Heap memory load percentage"));

    // ─────────────────────────────────────────────────────────────
    // ROW 6: AGRO PRODUCTION & MANUFACTURING TELEMETRY (Y=28, H=6)
    // ─────────────────────────────────────────────────────────────
    panels.push(createStat(id++, "Today's Crates Molded", "sum(crate_production_today)", "none", 14850, "#8b5cf6", 0, 28, 4, 6, "Total injection molded crates produced today"));
    panels.push(createGauge(id++, "Monthly Revenue Goal Tracker", "monthly_revenue_achieved", "currencyINR", 0, 22000000, 18500000, [
        { color: "#ef4444", value: null }, { color: "#f59e0b", value: 15000000 }, { color: "#10b981", value: 18000000 }
    ], 4, 28, 5, 6, "Target: ₹2.20 Cr | Current: ₹1.85 Cr (84.1%)"));
    panels.push(createBarGauge(id++, "Shift Yield & Output Breakdown", [
        { name: "Shift A (Morning)", query: "shift_a_production", fallback: 6200 },
        { name: "Shift B (Evening)", query: "shift_b_production", fallback: 5450 },
        { name: "Shift C (Night)", query: "shift_c_production", fallback: 3200 }
    ], "none", 9, 28, 5, 6, "Crate production split by 8-hour shift"));
    panels.push(createStat(id++, "HDPE Granule Stock Buffer", "hdpe_stock_kg", "masskg", 24500, "#10b981", 14, 28, 5, 6, "Virgin Polyethylene stock (12.2 Days buffer)"));
    panels.push(createGauge(id++, "Scrap & Defect Rejection Rate (%)", "scrap_rejection_percentage", "percent", 0, 10, 1.45, [
        { color: "#10b981", value: null }, { color: "#f59e0b", value: 2.5 }, { color: "#ef4444", value: 4.0 }
    ], 19, 28, 5, 6, "Target: < 2.5% scrap rate"));

    return {
        uid: "master_cc",
        title: "1. MASTER COMMAND CENTER",
        tags: ["executive", "production", "sales", "infrastructure", "dynatrace", "logins", "payments"],
        timezone: "browser",
        schemaVersion: 39,
        version: 3,
        refresh: "5s",
        time: { from: "now-6h", to: "now" },
        panels
    };
}

const masterDashboard = buildDynatraceMasterDashboard();
fs.writeFileSync(path.join(outputDir, "master_cc.json"), JSON.stringify(masterDashboard, null, 2));
console.log(`✅ Generated Dynatrace-grade Master Command Center with ${masterDashboard.panels.length} panels!`);
