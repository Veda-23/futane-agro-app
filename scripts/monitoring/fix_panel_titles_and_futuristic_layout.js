const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', '..', 'grafana_dashboards_clean');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

console.log(`Polishing all ${files.length} dashboards for crystal-clear titles & futuristic UI...`);

// Mapping of long truncated titles to clean, punchy, futuristic titles that NEVER get cut off
const titleMap = {
  // Master CC
  "Executive System Health": "System Uptime",
  "Logged-in Active Users": "Active Users",
  "Total Sales Revenue": "Sales Revenue",
  "Active Firing Alerts": "Active Alerts",
  "Live Request Rate": "Request Rate",
  "API Latency P95": "API Latency",
  "JVM Heap Memory Used / Max": "JVM Memory",
  "Host Available Storage": "Free Storage",
  "Web Login Total Hits": "Login Hits",
  "User Registrations Total": "Total Regs",
  "User Registrations Active": "Active Regs",
  "Registration — Fail %": "Reg Fail %",
  "Bill Payment Successful": "Bills Paid",
  "Bill Payment Pending": "Bills Pending",
  "Bill Payment Fail Rate": "Bill Fail %",
  "Razorpay Total Transactions": "Razorpay Total",
  "Razorpay Dues / Issues": "Razorpay Dues",
  "Razorpay Error Rate": "Razorpay Fail %",
  "Nginx Gateway Status": "Gateway Status",
  "MySQL Live Query Rate": "MySQL QPS",
  "Golden Signal: Request Rate (RPS)": "Request Rate (RPS)",
  "Golden Signal: Latency P95 (Seconds)": "Latency P95 (ms)",
  "Login Via App Trend (0-2s, 2-4s, >4s)": "App Login Latency Trend",
  "Login Via Web Trend (0-2s, 2-4s, >4s)": "Web Login Latency Trend",
  "JVM Heap Memory Usage Trend": "JVM Heap Memory Trend",

  // APM
  "JVM Heap Memory Used": "Heap Memory",
  "GC Pause Time": "GC Pause Time",
  "Live Thread Count": "Live Threads",
  "CPU Load Percentage": "CPU Load",
  "HTTP 5xx Server Errors": "5xx Errors",
  "HTTP Request Rate by Endpoint": "Endpoint Request Rate",
  "Response Time Heatmap": "Response Heatmap",
  "Tomcat Worker Threads": "Worker Threads",

  // Business ERP
  "Daily PPD Production": "Daily Production",
  "Monthly PPM Production": "Monthly PPM",
  "Gross Sales Revenue": "Gross Sales",
  "18% GST Tax Collected": "18% GST Tax",
  "Daily Dispatches Completed": "Dispatches",
  "HDPE Raw Stock Balance": "HDPE Stock",
  "Factory Operating Expenses": "Factory Expenses",

  // DB Obs
  "HikariCP Active Connections": "Active JDBC",
  "HikariCP Idle Connections": "Idle JDBC",
  "Connection Acquire Time": "Acquire Time",
  "MySQL Queries Per Second": "MySQL QPS",
  "InnoDB Buffer Pool Hit Ratio": "Buffer Hit %",
  "Row Operations Rate": "Row Ops Rate",

  // Infra
  "Host CPU Utilization": "Host CPU %",
  "System Memory Utilization": "Memory Used",
  "Root Storage Available": "Disk Free %",
  "System Load Average": "Load Avg (1m)",
  "Disk IOPS Throughput": "Disk IOPS",
  "Network Interface Ingress": "Net Ingress",
  "Network Interface Egress": "Net Egress",

  // Security SOC
  "Failed Login Attempts": "Failed Logins",
  "Locked User Accounts": "Locked Users",
  "MFA Verification Success Rate": "MFA Success %",
  "IP Rate Limiter Blocks": "Rate Blocks",

  // SRE
  "Current System Availability": "Availability %",
  "Remaining Error Budget": "Error Budget",
  "Mean Time to Recover": "MTTR",
  "Active System Outages": "Outages"
};

function shortenTitle(title) {
  if (!title) return "Metric";
  if (titleMap[title]) return titleMap[title];
  
  // Clean generic suffixes and make concise
  return title
    .replace(/^Executive\s+/i, '')
    .replace(/^Golden Signal:\s+/i, '')
    .replace(/\s+\(.*\)$/, '')
    .replace(/\s+Percentage/i, ' %')
    .replace(/\s+Utilization/i, ' %')
    .replace(/\s+Throughput/i, '')
    .trim();
}

files.forEach(file => {
  const filePath = path.join(dir, file);
  let raw = fs.readFileSync(filePath, 'utf8');
  if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
  const data = JSON.parse(raw);

  data.refresh = '5s';
  data.timezone = 'browser';
  data.time = { from: 'now-6h', to: 'now' };

  if (Array.isArray(data.panels)) {
    data.panels.forEach((panel, idx) => {
      // 1. Apply crystal clear, non-truncated titles
      panel.title = shortenTitle(panel.title);

      // 2. Format Stat Panels
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
      // 3. Format Timeseries Panels
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
  console.log(`  🟢 Polished: ${file}`);
});

console.log('All 10 dashboard JSON files successfully updated with crystal-clear titles!');
