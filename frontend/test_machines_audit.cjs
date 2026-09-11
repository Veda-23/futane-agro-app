const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  const mockMachines = [
    { id: 1, machineName: 'Windsor Sprint 180T', machineCode: 'IMM-001', capacityPerHour: 450, installedDate: '2023-03-12', status: 'Running' },
    { id: 2, machineName: 'Toshiba EC100SX Electric', machineCode: 'IMM-002', capacityPerHour: 520, installedDate: '2023-07-20', status: 'Running' },
    { id: 3, machineName: 'L&T Demag Ergotech 200T', machineCode: 'IMM-003', capacityPerHour: 600, installedDate: '2023-11-05', status: 'Running' },
    { id: 4, machineName: 'Milacron Magna T Servo', machineCode: 'IMM-004', capacityPerHour: 480, installedDate: '2024-01-15', status: 'Under Maintenance' },
    { id: 5, machineName: 'Engel Victory 120T Tie-barless', machineCode: 'IMM-005', capacityPerHour: 380, installedDate: '2024-04-10', status: 'Idle' },
    { id: 6, machineName: 'Haitian Mars II 250T', machineCode: 'IMM-006', capacityPerHour: 650, installedDate: '2024-08-22', status: 'Breakdown' }
  ];

  const mockBreakdowns = [
    {
      id: 1,
      machine: mockMachines[5],
      machineId: 6,
      breakdownDate: '2025-02-18',
      description: 'Proportional hydraulic valve stuck; pressure fluctuation in injection stage',
      downtimeHours: 5.5,
      resolvedDate: ''
    },
    {
      id: 2,
      machine: mockMachines[3],
      machineId: 4,
      breakdownDate: '2025-02-10',
      description: 'Barrel zone 2 ceramic band heater burnout; replaced with standby stock',
      downtimeHours: 2.0,
      resolvedDate: '2025-02-10'
    },
    {
      id: 3,
      machine: mockMachines[0],
      machineId: 1,
      breakdownDate: '2025-01-14',
      description: 'Preventive calibration of toggle clamping mechanism and lubrication line purge',
      downtimeHours: 3.5,
      resolvedDate: '2025-01-15'
    }
  ];

  // Intercept backend API routes
  await page.route(url => url.pathname.includes('/machines'), route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockMachines)
    });
  });

  await page.route(url => url.pathname.includes('/machine-breakdowns'), route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockBreakdowns)
    });
  });

  // Seed authenticated user into browser storage
  await page.addInitScript(() => {
    const mockUser = {
      id: 1,
      username: 'admin',
      name: 'Vedant Mehare',
      role: 'SUPER_ADMIN',
      email: 'admin@futaneagro.com'
    };
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('jwtToken', 'mock-jwt-token-machines-audit');
    sessionStorage.setItem('user', JSON.stringify(mockUser));
    sessionStorage.setItem('jwtToken', 'mock-jwt-token-machines-audit');
  });

  console.log('Navigating to http://localhost:4200 ...');
  await page.goto('http://localhost:4200/', { waitUntil: 'networkidle', timeout: 30000 });

  // Dismiss any lingering overlay
  try {
    await page.keyboard.press('Escape');
    await page.evaluate(() => {
      const overlay = document.querySelector('vite-error-overlay');
      if (overlay) overlay.remove();
    });
  } catch (e) {}

  // Switch to machines tab
  console.log('Switching to machines tab...');
  await page.evaluate(() => {
    const navItems = Array.from(document.querySelectorAll('app-sidebar li'));
    const machineItem = navItems.find(el => el.textContent && (el.textContent.toLowerCase().includes('machine') || el.textContent.toLowerCase().includes('equipment')));
    if (machineItem) {
      machineItem.click();
    } else {
      const scope = window.ng?.getComponent?.(document.querySelector('app-root'));
      if (scope && scope.switchTab) scope.switchTab('machines');
    }
  });

  // Wait for machines module container
  await page.waitForSelector('.machines-module-container', { timeout: 10000 });
  await page.waitForTimeout(1200);

  const outDir = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/31dd588e-fd68-4426-9deb-3030e10b9d4e';

  // 1. Capture Main View
  console.log('Capturing machines_redesign_main.png...');
  await page.screenshot({
    path: path.join(outDir, 'machines_redesign_main.png'),
    fullPage: false
  });

  // 2. Switch to Breakdown Ledger Sub-Tab
  console.log('Switching to Breakdown Ledger sub-tab...');
  const breakdownTabBtn = page.locator('.sub-tab-btn', { hasText: 'Breakdown Ledger' });
  if (await breakdownTabBtn.isVisible({ timeout: 3000 })) {
    await breakdownTabBtn.click();
    await page.waitForTimeout(1000);
  }
  console.log('Capturing machines_breakdown_tab.png...');
  await page.screenshot({
    path: path.join(outDir, 'machines_breakdown_tab.png'),
    fullPage: false
  });

  // 3. Search Empty State
  console.log('Testing search empty state...');
  const searchInput = page.locator('.table-search-input');
  if (await searchInput.isVisible()) {
    await searchInput.fill('NonExistentUnitXYZ');
    await page.waitForTimeout(800);
  }
  console.log('Capturing machines_empty_state.png...');
  await page.screenshot({
    path: path.join(outDir, 'machines_empty_state.png'),
    fullPage: false
  });

  // Restore list and switch back to Machinery Fleet
  if (await searchInput.isVisible()) {
    await searchInput.fill('');
    await page.waitForTimeout(400);
  }
  const machinesTabBtn = page.locator('.sub-tab-btn', { hasText: 'Machinery Fleet' });
  if (await machinesTabBtn.isVisible()) {
    await machinesTabBtn.click();
    await page.waitForTimeout(800);
  }

  // 4. Edit Mode Active
  console.log('Activating Edit Mode on first machine...');
  const editBtn = page.locator('.btn-edit').first();
  if (await editBtn.isVisible({ timeout: 3000 })) {
    await editBtn.click();
    await page.waitForTimeout(800);
  }
  console.log('Capturing machines_edit_mode.png...');
  await page.screenshot({
    path: path.join(outDir, 'machines_edit_mode.png'),
    fullPage: false
  });

  console.log('Machines visual audit successfully completed!');
  await browser.close();
})().catch(err => {
  console.error('Audit run error:', err);
  process.exit(1);
});
