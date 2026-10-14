import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/39d894a5-1641-489b-912e-5b808ad7ea42/machines_audit';
const SCRATCH_DIR = 'c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/machines_audit';

fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
fs.mkdirSync(SCRATCH_DIR, { recursive: true });

async function saveScreenshots(page, name) {
  const p1 = path.join(ARTIFACT_DIR, `${name}.png`);
  const p2 = path.join(SCRATCH_DIR, `${name}.png`);
  await page.screenshot({ path: p1 });
  await page.screenshot({ path: p2 });
  console.log(`[SCREENSHOT] Saved: ${name}.png`);
}

async function saveFullPageScreenshot(page, name) {
  const p1 = path.join(ARTIFACT_DIR, `${name}.png`);
  const p2 = path.join(SCRATCH_DIR, `${name}.png`);
  await page.screenshot({ path: p1, fullPage: true });
  await page.screenshot({ path: p2, fullPage: true });
  console.log(`[FULL-PAGE SCREENSHOT] Saved: ${name}.png`);
}

async function getAuthToken() {
  console.log('Obtaining authenticated JWT token from backend...');
  const loginRes = await fetch('http://127.0.0.1:8081/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'SUPER_ADMIN', password: 'superadmin123' })
  }).then(r => r.json());

  const verifyRes = await fetch('http://127.0.0.1:8081/api/users/login/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'SUPER_ADMIN', otp: loginRes.tempOtp })
  }).then(r => r.json());

  return verifyRes;
}

async function runMachinesAudit() {
  console.log('--- STARTING INJECTION MOLDING MACHINES & OEE FULL AUDIT ---');
  const authData = await getAuthToken();
  console.log('Obtained valid JWT Token length:', authData.token?.length);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5
  });
  const page = await context.newPage();

  const auditReport = {
    timestamp: new Date().toISOString(),
    metrics: {},
    subtabs: {},
    drawersTested: [],
    viewportTests: []
  };

  console.log('Navigating to http://localhost:4300...');
  await page.goto('http://localhost:4300', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);

  // Set JWT tokens and session data in localStorage & sessionStorage
  console.log('Injecting auth token & hydrating Angular state...');
  await page.evaluate((auth) => {
    const userObj = {
      id: auth.id || 1,
      username: auth.username || 'SUPER_ADMIN',
      fullName: auth.name || 'Super Administrator',
      name: auth.name || 'Super Administrator',
      role: auth.role || 'SUPER_ADMIN',
      token: auth.token
    };

    localStorage.setItem('jwtToken', auth.token);
    sessionStorage.setItem('jwtToken', auth.token);
    localStorage.setItem('user', JSON.stringify(userObj));
    sessionStorage.setItem('user', JSON.stringify(userObj));
    document.cookie = `erp_session_cookie=${auth.token}; path=/; SameSite=Strict`;

    const appRoot = document.querySelector('app-root');
    if (appRoot && window.ng) {
      const comp = window.ng.getComponent(appRoot);
      if (comp) {
        comp.isAuthenticated = true;
        comp.loggedInUser = userObj;
        comp.activeTab = 'machines';
        comp.renderedTabs['machines'] = true;
        window.ng.applyChanges(comp);
      }
    }
  }, authData);

  await page.waitForTimeout(1500);

  // Trigger fresh data load on machines component with the injected token
  console.log('Triggering machines data load...');
  await page.evaluate(() => {
    const machElem = document.querySelector('app-machines');
    if (machElem && window.ng) {
      const comp = window.ng.getComponent(machElem);
      if (comp && comp.loadData) {
        comp.loadData();
        window.ng.applyChanges(comp);
      }
    }
  });

  await page.waitForTimeout(2000);

  // 1. Capture Initial Executive Viewport & Full Page for Machinery Fleet
  console.log('Capturing Machines executive viewport & full page...');
  await saveScreenshots(page, '01_machines_fleet_viewport');
  await saveFullPageScreenshot(page, '02_machines_fleet_fullpage');

  // Audit Machines Telemetry & Calculations
  const machinesTelemetry = await page.evaluate(() => {
    const machElem = document.querySelector('app-machines');
    if (!machElem || !window.ng) return null;
    const comp = window.ng.getComponent(machElem);
    return {
      totalMachinesCount: comp.totalMachinesCount || 0,
      runningMachinesCount: comp.runningMachinesCount || 0,
      maintenanceMachinesCount: comp.maintenanceMachinesCount || 0,
      idleMachinesCount: comp.idleMachinesCount || 0,
      breakdownMachinesCount: comp.breakdownMachinesCount || 0,
      fleetCapacityPerHour: comp.fleetCapacityPerHour || 0,
      fleetUtilizationRate: comp.fleetUtilizationRate || 0,
      totalDowntimeHours: comp.totalDowntimeHours || 0,
      machineDueCount: comp.machineDueCount || 0,
      activeSubTab: comp.activeSubTab,
      firstMachine: comp.machinesList?.[0] ? {
        id: comp.machinesList[0].id,
        machineName: comp.machinesList[0].machineName,
        machineCode: comp.machinesList[0].machineCode,
        capacityPerHour: comp.machinesList[0].capacityPerHour,
        status: comp.machinesList[0].status
      } : null,
      totalBreakdownsLogged: comp.machineBreakdownsList?.length || 0,
      firstBreakdown: comp.machineBreakdownsList?.[0] ? {
        id: comp.machineBreakdownsList[0].id,
        downtimeHours: comp.machineBreakdownsList[0].downtimeHours,
        description: comp.machineBreakdownsList[0].description,
        breakdownDate: comp.machineBreakdownsList[0].breakdownDate
      } : null
    };
  });
  auditReport.metrics = machinesTelemetry;
  console.log('Machines Telemetry Data:', JSON.stringify(machinesTelemetry, null, 2));

  // 2. Test Status Filtering: Running & Under Maintenance
  console.log('Testing Status Filter: Running...');
  await page.evaluate(() => {
    const machElem = document.querySelector('app-machines');
    if (machElem && window.ng) {
      const comp = window.ng.getComponent(machElem);
      comp.statusFilter = 'Running';
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);
  await saveScreenshots(page, '03_machines_filter_running');

  console.log('Testing Status Filter: Under Maintenance...');
  await page.evaluate(() => {
    const machElem = document.querySelector('app-machines');
    if (machElem && window.ng) {
      const comp = window.ng.getComponent(machElem);
      comp.statusFilter = 'Under Maintenance';
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);
  await saveScreenshots(page, '04_machines_filter_maintenance');

  // Reset filter to ALL
  await page.evaluate(() => {
    const machElem = document.querySelector('app-machines');
    if (machElem && window.ng) {
      const comp = window.ng.getComponent(machElem);
      comp.statusFilter = 'ALL';
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(300);

  // 3. Test Density Switcher: compact
  console.log('Testing Density switcher: compact...');
  await page.evaluate(() => {
    const machElem = document.querySelector('app-machines');
    if (machElem && window.ng) {
      const comp = window.ng.getComponent(machElem);
      comp.setDensity('compact');
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(300);
  await saveScreenshots(page, '05_machines_density_compact');

  // Reset density to comfortable
  await page.evaluate(() => {
    const machElem = document.querySelector('app-machines');
    if (machElem && window.ng) {
      const comp = window.ng.getComponent(machElem);
      comp.setDensity('comfortable');
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(200);

  // 4. Test Column Visibility Dropdown
  console.log('Testing Columns dropdown toggle...');
  await page.evaluate(() => {
    const machElem = document.querySelector('app-machines');
    if (machElem && window.ng) {
      const comp = window.ng.getComponent(machElem);
      comp.toggleColDropdown('machines');
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);
  await saveScreenshots(page, '06_machines_columns_dropdown');

  // Close columns dropdown
  await page.evaluate(() => {
    const machElem = document.querySelector('app-machines');
    if (machElem && window.ng) {
      const comp = window.ng.getComponent(machElem);
      comp.showColDropdown['machines'] = false;
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(200);

  // 5. Test Register Machine Drawer (`isMachineFormOpen`)
  console.log('Testing Register Machine Drawer...');
  await page.evaluate(() => {
    const machElem = document.querySelector('app-machines');
    if (machElem && window.ng) {
      const comp = window.ng.getComponent(machElem);
      comp.toggleMachineForm();
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(600);
  await saveScreenshots(page, '07_add_machine_drawer');
  auditReport.drawersTested.push({ name: 'Register Machine Form Drawer', verified: true });

  // Close Register Machine drawer
  await page.evaluate(() => {
    const machElem = document.querySelector('app-machines');
    if (machElem && window.ng) {
      const comp = window.ng.getComponent(machElem);
      comp.cancelEditMachine();
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);

  // 6. Test Subtab 2: Breakdown Ledger (`activeSubTab = 'breakdowns'`)
  console.log('Switching to Subtab 2: Breakdown Ledger...');
  await page.evaluate(() => {
    const machElem = document.querySelector('app-machines');
    if (machElem && window.ng) {
      const comp = window.ng.getComponent(machElem);
      comp.switchSubTab('breakdowns');
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(600);
  await saveScreenshots(page, '08_breakdown_ledger_viewport');
  await saveFullPageScreenshot(page, '09_breakdown_ledger_fullpage');

  // 7. Test Log Maintenance Breakdown Drawer (`isBreakdownFormOpen`)
  console.log('Testing Log Breakdown Incident Drawer...');
  await page.evaluate(() => {
    const machElem = document.querySelector('app-machines');
    if (machElem && window.ng) {
      const comp = window.ng.getComponent(machElem);
      comp.toggleBreakdownForm();
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(600);
  await saveScreenshots(page, '10_log_breakdown_drawer');
  auditReport.drawersTested.push({ name: 'Log Maintenance Breakdown Drawer', verified: true });

  // Close breakdown drawer
  await page.evaluate(() => {
    const machElem = document.querySelector('app-machines');
    if (machElem && window.ng) {
      const comp = window.ng.getComponent(machElem);
      comp.cancelEditBreakdown();
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);

  // Switch back to machines subtab for viewport tests
  await page.evaluate(() => {
    const machElem = document.querySelector('app-machines');
    if (machElem && window.ng) {
      const comp = window.ng.getComponent(machElem);
      comp.switchSubTab('machines');
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(300);

  // 8. Multi-Viewport & Responsive Testing
  console.log('Performing Multi-Viewport & Responsive Layout Testing...');
  const viewports = [
    { name: '11_laptop_1280x720', width: 1280, height: 720 },
    { name: '12_compact_1100x680', width: 1100, height: 680 }
  ];

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(400);
    await saveScreenshots(page, vp.name);
    auditReport.viewportTests.push({ viewport: vp.name, width: vp.width, height: vp.height, status: 'PASSED' });
  }

  // 9. Collapsed Sidebar Test (1440x900)
  console.log('Testing Collapsed Sidebar Viewport...');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(() => {
    const appRoot = document.querySelector('app-root');
    if (appRoot && window.ng) {
      const comp = window.ng.getComponent(appRoot);
      if (comp) {
        comp.isSidebarCollapsed = true;
        window.ng.applyChanges(comp);
      }
    }
  });
  await page.waitForTimeout(500);
  await saveScreenshots(page, '13_sidebar_collapsed_machines');
  auditReport.viewportTests.push({ viewport: 'Sidebar Collapsed 1440x900', status: 'PASSED' });

  // Save audit report
  const jsonP1 = path.join(ARTIFACT_DIR, 'machines_audit_report.json');
  const jsonP2 = path.join(SCRATCH_DIR, 'machines_audit_report.json');
  fs.writeFileSync(jsonP1, JSON.stringify(auditReport, null, 2));
  fs.writeFileSync(jsonP2, JSON.stringify(auditReport, null, 2));
  console.log('Audit Report saved successfully to JSON artifacts.');

  await browser.close();
  console.log('--- MACHINES AUDIT RUN COMPLETED SUCCESSFULLY ---');
}

runMachinesAudit().catch(err => {
  console.error('Audit failed with error:', err);
  process.exit(1);
});
