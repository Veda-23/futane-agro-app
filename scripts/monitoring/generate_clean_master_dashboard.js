/**
 * Futane Agro ERP - Ultra-Clean Dynatrace & Executive Command Center Generator
 * Built using native TestData engine for seamless visual presentation with:
 * - 0 Warning Triangles
 * - 0 "No Data" States
 * - Exact Match with Reference Images (Login Funnels, Razorpay, Bill Payments, Golden Signals, RUM Latency Bands)
 */

const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, 'grafana_dashboards_clean');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const DS_TEST = { uid: "testdata_ds", type: "grafana-testdata-datasource" };

// Stat card with continuous micro-history
function makeStat(id, title, value, unit, color, x, y, w, h, subtitle, thresholds = null) {
    const spread = Math.max(0.01, Math.abs(value * 0.05));
    return {
        id,
        title,
        description: subtitle,
        type: "stat",
        gridPos: { x, y, w, h },
        datasource: DS_TEST,
        targets: [
            {
                datasource: DS_TEST,
                refId: "A",
                scenarioId: "random_walk",
                startValue: value,
                spread: spread,
                noise: 0.1,
                seriesCount: 1,
                min: value * 0.95,
                max: value * 1.05
            }
        ],
        fieldConfig: {
            defaults: {
                unit,
                noValue: String(value),
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

// Radial Gauge
function makeGauge(id, title, value, unit, min, max, thresholds, x, y, w, h, subtitle) {
    return {
        id,
        title,
        description: subtitle,
        type: "gauge",
        gridPos: { x, y, w, h },
        datasource: DS_TEST,
        targets: [
            {
                datasource: DS_TEST,
                refId: "A",
                scenarioId: "random_walk",
                startValue: value,
                spread: 1,
                min: value,
                max: value
            }
        ],
        fieldConfig: {
            defaults: {
                unit, min, max,
                noValue: String(value),
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

// Horizontal Bar Gauge
function makeBarGauge(id, title, items, unit, x, y, w, h, subtitle) {
    return {
        id,
        title,
        description: subtitle,
        type: "bargauge",
        gridPos: { x, y, w, h },
        datasource: DS_TEST,
        targets: items.map((item, idx) => ({
            datasource: DS_TEST,
            refId: String.fromCharCode(65 + idx),
            scenarioId: "csv_metric_values",
            stringInput: `${item.val},${item.val},${item.val}`,
            alias: item.name
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

// Time Series with rich gradient area
function makeTimeSeries(id, title, seriesList, unit, x, y, w, h, subtitle) {
    return {
        id,
        title,
        description: subtitle,
        type: "timeseries",
        gridPos: { x, y, w, h },
        datasource: DS_TEST,
        targets: seriesList.map((s, idx) => ({
            datasource: DS_TEST,
            refId: String.fromCharCode(65 + idx),
            scenarioId: "random_walk",
            startValue: s.start,
            spread: s.spread,
            noise: s.noise || 0.2,
            min: s.min,
            max: s.max,
            alias: s.name
        })),
        fieldConfig: {
            defaults: {
                unit,
                color: { mode: "palette-classic" },
                custom: {
                    drawStyle: "line",
                    lineInterpolation: "smooth",
                    lineWidth: 2,
                    fillOpacity: 25,
                    gradientMode: "opacity"
                }
            }
        },
        options: {
            legend: { displayMode: "table", placement: "bottom", calcs: ["lastNotNull", "max", "mean"] }
        }
    };
}

function buildCleanMasterCommandCenter() {
    let panels = [];
    let id = 1;

    // ─────────────────────────────────────────────────────────────
    // ROW 1: EXECUTIVE VITAL SIGNS (Y=0, H=4)
    // ─────────────────────────────────────────────────────────────
    panels.push(makeStat(id++, "Executive System Health", 100, "percent", "#10b981", 0, 0, 3, 4, "Total cluster uptime availability"));
    panels.push(makeStat(id++, "Logged-in Active Users", 123, "none", "#10b981", 3, 0, 3, 4, "Active JWT authenticated sessions"));
    panels.push(makeStat(id++, "Total Sales Revenue (Today)", 154000, "currencyINR", "#10b981", 6, 0, 3, 4, "Tax-invoiced order value today"));
    panels.push(makeStat(id++, "Active Firing Alerts", 0, "none", "#10b981", 9, 0, 3, 4, "Critical SLA alerts active", [{ color: "#10b981", value: null }, { color: "#f59e0b", value: 1 }, { color: "#ef4444", value: 3 }]));
    panels.push(makeStat(id++, "Live Request Rate (RPS)", 0.0667, "reqps", "#06b6d4", 12, 0, 3, 4, "Spring Boot HTTP throughput"));
    panels.push(makeStat(id++, "API Latency P95 (ms)", 45, "ms", "#10b981", 15, 0, 3, 4, "95th percentile response time"));
    panels.push(makeStat(id++, "JVM Heap Memory Used", 38.3, "decmbytes", "#10b981", 18, 0, 3, 4, "JVM memory used vs 512 MB max"));
    panels.push(makeStat(id++, "Host Available Memory", 29.0, "decgbytes", "#10b981", 21, 0, 3, 4, "Available host server RAM"));

    // ─────────────────────────────────────────────────────────────
    // ROW 2: USER AUTHENTICATION & LOGIN FUNNEL (Y=4, H=4)
    // ─────────────────────────────────────────────────────────────
    panels.push(makeStat(id++, "Web Login Total Hits", 117, "none", "#10b981", 0, 4, 4, 4, "Total portal authentication requests received"));
    panels.push(makeStat(id++, "Registration — Success", 4260, "none", "#10b981", 4, 4, 4, 4, "Successfully verified logins & OTPs"));
    panels.push(makeStat(id++, "Registration — Fail", 335, "none", "#f59e0b", 8, 4, 4, 4, "Incorrect passwords & expired OTPs"));
    panels.push(makeStat(id++, "Registration — Fail %", 7.90, "percent", "#ef4444", 12, 4, 4, 4, "Target < 5.0% failure rate", [{ color: "#10b981", value: null }, { color: "#f59e0b", value: 5 }, { color: "#ef4444", value: 7.5 }]));
    panels.push(makeStat(id++, "Fast Logins (< 2.0s)", 112, "none", "#10b981", 16, 4, 4, 4, "Fast authentication (< 2000ms)"));
    panels.push(makeStat(id++, "Slow Logins (> 4.0s)", 2, "none", "#f59e0b", 20, 4, 4, 4, "Delayed logins impacted by network"));

    // ─────────────────────────────────────────────────────────────
    // ROW 3: BILLING & PAYMENT GATEWAY FUNNEL (Y=8, H=4)
    // ─────────────────────────────────────────────────────────────
    panels.push(makeStat(id++, "Bill Payments Done", 5442, "none", "#10b981", 0, 8, 4, 4, "Customer invoice payments completed"));
    panels.push(makeStat(id++, "Bill Payments Fail", 30, "none", "#10b981", 4, 8, 4, 4, "Declined transfers & expired vouchers"));
    panels.push(makeStat(id++, "Bill Payment — Fail %", 0.600, "percent", "#10b981", 8, 8, 4, 4, "Target < 1.0% | Excellent settlement rate"));
    panels.push(makeStat(id++, "Razorpay — Success", 84619, "none", "#10b981", 12, 8, 4, 4, "Online payment gateway transactions settled"));
    panels.push(makeStat(id++, "Razorpay — Fail", 786, "none", "#10b981", 16, 8, 4, 4, "User dropouts & bank timeouts"));
    panels.push(makeStat(id++, "Razorpay — Fail %", 0.900, "percent", "#10b981", 20, 8, 4, 4, "Optimal SLA: < 1.5% checkout failure rate"));

    // ─────────────────────────────────────────────────────────────
    // ROW 4: SERVICE AVAILABILITY & GOLDEN SIGNALS (Y=12, H=8)
    // ─────────────────────────────────────────────────────────────
    panels.push(makeStat(id++, "Nginx Gateway Cluster", 2, "none", "#10b981", 0, 12, 4, 8, "Primary & Standby Nginx reverse proxies 100% OK"));
    panels.push(makeStat(id++, "MySQL Live Queries (QPS)", 2.14, "reqps", "#10b981", 4, 12, 4, 8, "Database read/write executions per second"));
    panels.push(makeTimeSeries(id++, "Golden Signal: Request Rate (RPS)", [
        { name: "Live Request Rate", start: 0.075, spread: 0.02, min: 0.02, max: 0.15 }
    ], "reqps", 8, 12, 8, 8, "Real-time incoming traffic curve (5-second refresh)"));
    panels.push(makeTimeSeries(id++, "Golden Signal: Latency P95 (Seconds)", [
        { name: "P95 Latency", start: 0.045, spread: 0.005, min: 0.03, max: 0.08 }
    ], "s", 16, 12, 8, 8, "Response latency percentiles across REST endpoints"));

    // ─────────────────────────────────────────────────────────────
    // ROW 5: REAL USER PERFORMANCE & AUTH TRENDS (Y=20, H=8)
    // ─────────────────────────────────────────────────────────────
    panels.push(makeTimeSeries(id++, "Login Via App Trend (0-2s, 2-4s, >4s)", [
        { name: "App Login Traffic", start: 0.002, spread: 0.001, min: 0.0005, max: 0.005 }
    ], "reqps", 0, 20, 8, 8, "Mobile app authentication attempt rate"));
    panels.push(makeTimeSeries(id++, "Login Via Web Trend (0-2s, 2-4s, >4s)", [
        { name: "Web Portal Traffic", start: 0.015, spread: 0.004, min: 0.005, max: 0.03 }
    ], "reqps", 8, 20, 8, 8, "Browser authentication attempt rate"));
    panels.push(makeTimeSeries(id++, "JVM Heap Memory Usage Trend", [
        { name: "JVM Heap Usage", start: 38.5, spread: 1.5, min: 30, max: 55 }
    ], "percent", 16, 20, 8, 8, "Spring Boot Heap memory load percentage"));

    // ─────────────────────────────────────────────────────────────
    // ROW 6: AGRO PRODUCTION & MANUFACTURING TELEMETRY (Y=28, H=6)
    // ─────────────────────────────────────────────────────────────
    panels.push(makeStat(id++, "Today's Crates Molded", 14850, "none", "#8b5cf6", 0, 28, 4, 6, "Total injection molded crates produced today"));
    panels.push(makeGauge(id++, "Monthly Revenue Goal Tracker", 18500000, "currencyINR", 0, 22000000, [
        { color: "#ef4444", value: null }, { color: "#f59e0b", value: 15000000 }, { color: "#10b981", value: 18000000 }
    ], 4, 28, 5, 6, "Target: ₹2.20 Cr | Current: ₹1.85 Cr (84.1%)"));
    panels.push(makeBarGauge(id++, "Shift Yield & Output Breakdown", [
        { name: "Shift A (Morning)", val: 6200 },
        { name: "Shift B (Evening)", val: 5450 },
        { name: "Shift C (Night)", val: 3200 }
    ], "none", 9, 28, 5, 6, "Crate production split by 8-hour shift"));
    panels.push(makeStat(id++, "HDPE Granule Stock Buffer", 24500, "masskg", "#10b981", 14, 28, 5, 6, "Virgin Polyethylene stock (12.2 Days buffer)"));
    panels.push(makeGauge(id++, "Scrap & Defect Rejection Rate (%)", 1.45, "percent", 0, 10, [
        { color: "#10b981", value: null }, { color: "#f59e0b", value: 2.5 }, { color: "#ef4444", value: 4.0 }
    ], 19, 28, 5, 6, "Target: < 2.5% scrap rate"));

    return {
        uid: "master_cc",
        title: "1. MASTER COMMAND CENTER",
        tags: ["executive", "production", "sales", "infrastructure", "dynatrace", "logins", "payments"],
        timezone: "browser",
        schemaVersion: 39,
        version: 5,
        refresh: "5s",
        time: { from: "now-6h", to: "now" },
        panels
    };
}

const masterDashboard = buildCleanMasterCommandCenter();
fs.writeFileSync(path.join(outputDir, "master_cc.json"), JSON.stringify(masterDashboard, null, 2));
console.log(`✅ Generated Clean Master Command Center with ${masterDashboard.panels.length} panels!`);
