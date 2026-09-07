const http = require('http');

const auth = 'Basic ' + Buffer.from('admin:FutaneAgro@Monitor2026!').toString('base64');

function apiRequest(path) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: { 'Authorization': auth }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function auditPanels(panels, report) {
  for (const p of panels) {
    if (p.panels && Array.isArray(p.panels)) {
      auditPanels(p.panels, report);
    }
    if (p.targets && Array.isArray(p.targets)) {
      report.totalPanels++;
      for (const t of p.targets) {
        report.totalTargets++;
        if (t.scenarioId === 'random_walk' || (t.datasource && t.datasource.type === 'grafana-testdata-datasource') || t.datasource === 'testdata_ds') {
          report.randomWalkCount++;
          report.issues.push(`Panel "${p.title}" uses testdata/random_walk`);
        } else if (t.datasource && t.datasource.type === 'prometheus') {
          report.prometheusTargets++;
        }
      }
    }
  }
}

async function run() {
  const searchResults = await apiRequest('/api/search');
  const dashboards = searchResults.filter(item => item.type === 'dash-db');
  
  console.log(`\n==================================================`);
  console.log(`  GRAFANA FULL DASHBOARD INVENTORY AUDIT (${dashboards.length} DASHBOARDS)`);
  console.log(`==================================================\n`);
  
  const results = [];
  
  for (const item of dashboards) {
    const dashData = await apiRequest(`/api/dashboards/uid/${item.uid}`);
    const dash = dashData.dashboard;
    
    const report = {
      title: dash.title,
      uid: dash.uid,
      version: dash.version,
      refresh: dash.refresh || 'off',
      totalPanels: 0,
      totalTargets: 0,
      prometheusTargets: 0,
      randomWalkCount: 0,
      issues: []
    };
    
    if (dash.panels) {
      auditPanels(dash.panels, report);
    }
    
    results.push(report);
    
    console.log(`📊 [${report.uid}] "${report.title}"`);
    console.log(`   • Panels: ${report.totalPanels} | Targets: ${report.totalTargets} | Prometheus: ${report.prometheusTargets}`);
    console.log(`   • Random Walk Issues: ${report.randomWalkCount === 0 ? '✅ NONE (0)' : '❌ ' + report.randomWalkCount}`);
    console.log(`   • Refresh: ${report.refresh} | Version: ${report.version}`);
    if (report.issues.length > 0) {
      console.log(`   • Issues:`, report.issues);
    }
    console.log(``);
  }
  
  const totalPanelsAll = results.reduce((a, b) => a + b.totalPanels, 0);
  const totalRwAll = results.reduce((a, b) => a + b.randomWalkCount, 0);
  
  console.log(`==================================================`);
  console.log(`AUDIT SUMMARY:`);
  console.log(`Total Dashboards: ${dashboards.length}`);
  console.log(`Total Panels Audited: ${totalPanelsAll}`);
  console.log(`Total Fluctuating random_walk Targets: ${totalRwAll}`);
  console.log(`Overall Health Status: ${totalRwAll === 0 ? '🟢 100% HEALTHY & STABILIZED' : '🔴 ISSUES DETECTED'}`);
  console.log(`==================================================\n`);
}

run().catch(console.error);
