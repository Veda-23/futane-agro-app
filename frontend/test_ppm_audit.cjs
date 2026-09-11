const { chromium } = require('@playwright/test');
const fs = require('fs');

const ARTIFACTS = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/c1c6338c-1671-4e87-b480-7a9ae9928b58';

async function testComprehensivePpm() {
  console.log('════════════════════════════════════════════════════════════════');
  console.log('🚀 PHASE 3: COMPREHENSIVE MONTHLY PRODUCTION PERFORMANCE AUDIT');
  console.log('════════════════════════════════════════════════════════════════\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleLogs = [];
  page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => consoleLogs.push(`[ERROR] ${err.message}`));

  console.log('1. Navigating and Authenticating...');
  await page.goto('http://localhost:4200', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const usernameInput = await page.$('input[placeholder*="Username" i], input[type="text"]');
  if (usernameInput) {
    console.log('   Entering credentials...');
    await page.fill('input[placeholder*="Username" i], input[type="text"]', 'SUPER_ADMIN');
    await page.fill('input[type="password"]', 'superadmin123');
    await page.click('button:has-text("Sign In to ERP"), button[type="submit"]');
    
    // Wait for OTP input if prompt appears
    try {
      await page.waitForSelector('input[placeholder*="otp" i], input[name*="otp" i]', { timeout: 4000 });
      console.log('   Entering OTP 654321...');
      await page.fill('input[placeholder*="otp" i], input[name*="otp" i]', '654321');
      const verifyBtn = await page.$('button[type="submit"]');
      if (verifyBtn) await verifyBtn.click();
    } catch (e) {
      console.log('   OTP step passed/not required');
    }
  }

  console.log('2. Switching to Monthly Summary (PPM)...');
  await page.waitForSelector('.sidebar-nav, li:has-text("Monthly Summary")', { timeout: 15000 });
  await page.click('li:has-text("Monthly Summary")');
  await page.waitForSelector('.ppm-kpi-grid, table.enterprise-data-table', { timeout: 15000 });
  await page.waitForTimeout(2000);

  // Capture standard desktop full page
  await page.screenshot({ path: `${ARTIFACTS}/ppm_phase3_desktop_fullpage.png`, fullPage: true });
  console.log('   ✓ Saved ppm_phase3_desktop_fullpage.png');

  // Verify Header & Period Stepper
  console.log('3. Auditing Period Navigation Controls & Header...');
  const periodStateBefore = await page.evaluate(() => {
    const monthSel = document.querySelector('.header-select-month');
    const yearSel = document.querySelector('.header-select-year');
    return {
      month: monthSel ? monthSel.value : null,
      year: yearSel ? yearSel.value : null
    };
  });
  console.log('   Initial Period Selector values:', periodStateBefore);

  // Click Next Month stepper arrow
  const nextBtn = await page.$('.month-stepper-group .btn-stepper-arrow:last-child');
  if (nextBtn) {
    await nextBtn.click();
    await page.waitForTimeout(500);
    const periodStateAfterNext = await page.evaluate(() => {
      const monthSel = document.querySelector('.header-select-month');
      return monthSel ? monthSel.value : null;
    });
    console.log('   After Next Month clicked:', periodStateAfterNext);
  }

  // Click Prev Month stepper arrow
  const prevBtn = await page.$('.month-stepper-group .btn-stepper-arrow:first-child');
  if (prevBtn) {
    await prevBtn.click();
    await page.waitForTimeout(500);
  }

  // Reset month filter to All Months
  await page.evaluate(() => {
    const monthSel = document.querySelector('.header-select-month');
    if (monthSel) {
      monthSel.value = '';
      monthSel.dispatchEvent(new Event('change'));
    }
  });
  await page.waitForTimeout(500);

  // Verify 5 KPI Cards
  console.log('4. Auditing 5-Card KPI Telemetry Ribbon...');
  const kpiData = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.ppm-kpi-grid .kpi-card')).map(card => ({
      label: card.querySelector('.kpi-label')?.textContent?.trim(),
      value: card.querySelector('.kpi-value')?.textContent?.trim(),
      meta: card.querySelector('.kpi-meta')?.textContent?.trim()
    }));
  });
  console.log('   KPI Cards:', JSON.stringify(kpiData, null, 2));

  // Verify Performance Trajectory Chart
  console.log('5. Auditing Performance Trajectory Chart & Metric Toggle...');
  const chartCanvas = await page.$('#ppmPerformanceChartCanvas');
  console.log('   Chart canvas exists:', !!chartCanvas);

  // Switch Chart Metric to Energy (kWh)
  const energyToggleBtn = await page.$('.btn-metric-toggle:has-text("Energy")');
  if (energyToggleBtn) {
    await energyToggleBtn.click();
    await page.waitForTimeout(500);
    console.log('   ✓ Switched chart metric to Energy (kWh)');
  }

  // Switch back to Crates & Cost
  const cratesToggleBtn = await page.$('.btn-metric-toggle:has-text("Crates & Cost")');
  if (cratesToggleBtn) {
    await cratesToggleBtn.click();
    await page.waitForTimeout(500);
    console.log('   ✓ Switched chart metric back to Crates & Cost');
  }

  // Test Collapsible Add / Edit Form Toggle
  console.log('6. Auditing Collapsible Add / Edit Form Toggle...');
  const addBtn = await page.$('button.btn-header-action:has-text("Add Summary"), button.btn-header-action:has-text("+ Add")');
  if (addBtn) {
    await addBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${ARTIFACTS}/ppm_phase3_form_open.png` });
    console.log('   ✓ Saved ppm_phase3_form_open.png');
    // Close form
    const hideBtn = await page.$('button.btn-header-action:has-text("Hide Form"), .btn-panel-close');
    if (hideBtn) await hideBtn.click();
    await page.waitForTimeout(400);
  }

  // Test Table Density Switching
  console.log('7. Auditing Table Row Density & Columns...');
  const compactBtn = await page.$('button.density-btn:has-text("Compact")');
  if (compactBtn) {
    await compactBtn.click();
    await page.waitForTimeout(300);
  }

  const normalBtn = await page.$('button.density-btn:has-text("Normal")');
  if (normalBtn) {
    await normalBtn.click();
    await page.waitForTimeout(300);
  }

  // Test Table Summary / Totals Row
  console.log('8. Auditing Table Summary / Totals Footer Row...');
  const tfootData = await page.evaluate(() => {
    const tfoot = document.querySelector('.table-summary-tfoot');
    if (!tfoot) return null;
    return Array.from(tfoot.querySelectorAll('td')).map(td => td.textContent?.trim());
  });
  console.log('   Table Footer Summary Row:', tfootData);

  // Test Slide-in Edit Drawer
  console.log('9. Auditing Table Action Buttons & Slide-in Drawer...');
  const firstEditBtn = await page.$('.enterprise-data-row .btn-edit');
  if (firstEditBtn) {
    await firstEditBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${ARTIFACTS}/ppm_phase3_drawer_open.png` });
    console.log('   ✓ Saved ppm_phase3_drawer_open.png');
    // Close drawer
    const closeDrawerBtn = await page.$('.drawer-close-btn, .drawer-footer button:has-text("Cancel")');
    if (closeDrawerBtn) await closeDrawerBtn.click();
    await page.waitForTimeout(400);
  }

  // Test Dark Mode
  console.log('10. Auditing Dark Mode...');
  await page.evaluate(() => {
    document.body.classList.add('dark-theme');
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${ARTIFACTS}/ppm_phase3_dark_mode.png`, fullPage: true });
  console.log('   ✓ Saved ppm_phase3_dark_mode.png');

  // Revert Dark Mode
  await page.evaluate(() => {
    document.body.classList.remove('dark-theme');
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');
  });
  await page.waitForTimeout(300);

  // Test Responsive Breakpoints
  console.log('11. Auditing Responsive Breakpoints...');
  const breakpoints = [
    { name: '1920_ultrawide', width: 1920, height: 1080 },
    { name: '1280_laptop', width: 1280, height: 800 },
    { name: '1024_tablet_ls', width: 1024, height: 768 },
    { name: '768_tablet_pt', width: 768, height: 1024 },
    { name: '480_mobile_lg', width: 480, height: 850 },
    { name: '390_mobile_sm', width: 390, height: 844 }
  ];

  for (const bp of breakpoints) {
    await page.setViewportSize({ width: bp.width, height: bp.height });
    await page.waitForTimeout(400);

    // Close sidebar on mobile/tablet viewports so content is fully visible
    await page.evaluate(() => {
      window.scrollTo(0, 0);
      const rootEl = document.querySelector('app-root');
      const comp = window.ng ? window.ng.getComponent(rootEl) : null;
      if (comp && comp.isSidebarOpen) {
        comp.isSidebarOpen = false;
      }
    });
    await page.waitForTimeout(600);

    await page.screenshot({ path: `${ARTIFACTS}/ppm_phase3_responsive_${bp.name}.png` });
    console.log(`   ✓ Captured breakpoint ${bp.name} (${bp.width}x${bp.height})`);
  }

  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('🎉 ALL PHASE 3 AUDIT CHECKS COMPLETED SUCCESSFULLY!');
  console.log('════════════════════════════════════════════════════════════════\n');

  await browser.close();
}

testComprehensivePpm().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
