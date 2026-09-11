const { chromium } = require('@playwright/test');
const fs = require('fs');

const ARTIFACTS = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/c1c6338c-1671-4e87-b480-7a9ae9928b58';

async function runTab4DirectoryAudit() {
  console.log('================================================================');
  console.log('🚀 TAB 4: PARTIES, WHOLESALERS & DISTRIBUTORS DIRECTORY AUDIT');
  console.log('================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  console.log('1. Navigating and Authenticating...');
  await page.goto('http://localhost:4200', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const usernameInput = await page.$('input[placeholder*="Username" i], input[type="text"]');
  if (usernameInput) {
    console.log('   Entering credentials...');
    await page.fill('input[placeholder*="Username" i], input[type="text"]', 'SUPER_ADMIN');
    await page.fill('input[type="password"]', 'superadmin123');
    await page.click('button:has-text("Sign In to ERP"), button[type="submit"]');

    try {
      await page.waitForSelector('input[placeholder*="otp" i], input[name*="otp" i]', { timeout: 4000 });
      console.log('   Entering OTP 654321...');
      await page.fill('input[placeholder*="otp" i], input[name*="otp" i]', '654321');
      const verifyBtn = await page.$('button[type="submit"]');
      if (verifyBtn) await verifyBtn.click();
    } catch (e) {
      console.log('   OTP step passed or not required');
    }
  }

  console.log('2. Switching to Parties Tab (Tab 4)...');
  await page.waitForSelector('.sidebar-nav, li:has-text("Parties")', { timeout: 15000 });
  await page.click('li:has-text("Parties")');
  await page.waitForSelector('.party-screen-wrapper, table.enterprise-data-table', { timeout: 15000 });
  await page.waitForTimeout(1000);

  // 1. Verify Breadcrumb
  const breadcrumbText = await page.textContent('.party-breadcrumb');
  console.log(`3. Breadcrumb verified: "${breadcrumbText?.trim()}"`);

  // 2. Verify Stable Page Header
  const title = await page.textContent('.header-main-title');
  const subtitle = await page.textContent('.header-subtitle');
  console.log(`4. Stable Header: Title="${title?.trim()}", Subtitle="${subtitle?.trim()}"`);

  // 3. Verify Subtabs
  console.log('5. Auditing Subtabs Navigation...');
  const subtabs = [
    'All Accounts',
    'Wholesalers & Distributors',
    'GST Registered',
    'Maharashtra',
    'Inter-State'
  ];
  for (const tabText of subtabs) {
    const tabBtn = await page.$(`.subnav-tab-btn:has-text("${tabText}")`);
    if (tabBtn) {
      await tabBtn.click();
      await page.waitForTimeout(300);
      const rows = await page.evaluate(() => document.querySelectorAll('.enterprise-data-row').length);
      console.log(`   Subtab "${tabText}": rows count = ${rows}`);
    } else {
      console.warn(`   ⚠️ Subtab "${tabText}" not found`);
    }
  }
  // Return to All Accounts
  await page.click('.subnav-tab-btn:has-text("All Accounts")');
  await page.waitForTimeout(300);

  // 4. Verify Summary Strip directly above table
  const summaryText = await page.textContent('.party-directory-summary-strip');
  console.log(`6. Party Summary Telemetry Strip verified:`);
  console.log(`   "${summaryText?.replace(/\s+/g, ' ').trim()}"`);

  // 5. Verify Search Functionality
  console.log('7. Testing Search...');
  await page.fill('.form-control-search', 'Agro');
  await page.waitForTimeout(400);
  let searchedRows = await page.evaluate(() => document.querySelectorAll('.enterprise-data-row').length);
  console.log(`   Search for "Agro" yielded ${searchedRows} rows.`);
  await page.click('.btn-clear-search');
  await page.waitForTimeout(300);

  // 6. Verify Filters Popover
  console.log('8. Testing Filters Popover...');
  await page.click('.btn-filter-toggle');
  await page.waitForTimeout(300);
  const popoverVisible = await page.isVisible('.filter-popover-panel');
  console.log(`   Filter popover open: ${popoverVisible}`);
  if (popoverVisible) {
    await page.selectOption('.filter-popover-body select:nth-of-type(1)', 'Wholesaler');
    await page.click('.filter-popover-footer button');
    await page.waitForTimeout(400);
    const filterCount = await page.textContent('.filter-count-badge');
    const filteredRows = await page.evaluate(() => document.querySelectorAll('.enterprise-data-row').length);
    console.log(`   Filtered by Wholesaler: Active badge = "${filterCount}", rows = ${filteredRows}`);
    // Reset filters
    await page.click('.btn-reset-filters');
    await page.waitForTimeout(400);
  }

  // 7. Verify Density Controls
  console.log('9. Testing Table Density...');
  await page.click('.density-btn:has-text("Compact")');
  await page.waitForTimeout(200);
  const isCompact = await page.evaluate(() => document.querySelector('.table-wrapper-custom')?.classList.contains('table-compact'));
  console.log(`   Compact density active: ${isCompact}`);
  await page.click('.density-btn:has-text("Normal")');
  await page.waitForTimeout(200);

  // 8. Verify Table Columns & Badges
  console.log('10. Auditing Directory Table Columns...');
  const firstRow = await page.evaluate(() => {
    const r = document.querySelector('.enterprise-data-row');
    if (!r) return null;
    return {
      name: r.querySelector('.party-title')?.textContent?.trim(),
      type: r.querySelector('.badge-party-type')?.textContent?.trim(),
      phone: r.querySelector('.contact-number')?.textContent?.trim(),
      gst: r.querySelector('.td-gst')?.textContent?.trim(),
      location: r.querySelector('.td-location')?.textContent?.trim(),
      readiness: r.querySelector('.badge-readiness')?.textContent?.trim()
    };
  });
  console.log('   First Row Data:', JSON.stringify(firstRow, null, 2));

  // 9. Capture Desktop Full Page Screenshot
  await page.screenshot({ path: `${ARTIFACTS}/parties_phase4_desktop_fullpage.png`, fullPage: true });
  console.log('   ✓ Saved parties_phase4_desktop_fullpage.png');

  // 10. Verify Slide-in Drawer
  console.log('11. Testing Slide-in Drawer...');
  const viewBtn = await page.$('.btn-action-icon.btn-view');
  if (viewBtn) {
    await viewBtn.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${ARTIFACTS}/parties_phase4_drawer_open.png` });
    console.log('   ✓ Saved parties_phase4_drawer_open.png');
    await page.click('.drawer-close-btn');
    await page.waitForTimeout(300);
  }

  // 11. Verify Collapsible Add / Edit Form
  console.log('12. Testing Collapsible Add Party Form...');
  const addBtn = await page.$('button.btn-header-action:has-text("Add Party")');
  if (addBtn) {
    await addBtn.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${ARTIFACTS}/parties_phase4_form_open.png` });
    console.log('   ✓ Saved parties_phase4_form_open.png');
    // Close form
    await page.click('button.btn-header-action:has-text("Hide Form"), .btn-panel-close');
    await page.waitForTimeout(300);
  }

  // 12. Verify Dark Mode
  console.log('13. Testing Dark Mode...');
  await page.evaluate(() => document.body.classList.add('dark-mode'));
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${ARTIFACTS}/parties_phase4_dark_mode.png`, fullPage: true });
  console.log('   ✓ Saved parties_phase4_dark_mode.png');
  await page.evaluate(() => document.body.classList.remove('dark-mode'));

  // 13. Responsive Audits Across 7 Viewports
  console.log('14. Auditing 7 Responsive Viewports...');
  const viewports = [
    { name: '1920_ultrawide', width: 1920, height: 1080 },
    { name: '1440_desktop', width: 1440, height: 900 },
    { name: '1280_laptop', width: 1280, height: 800 },
    { name: '1024_tablet_ls', width: 1024, height: 768 },
    { name: '768_tablet_pt', width: 768, height: 1024 },
    { name: '480_mobile_lg', width: 480, height: 854 },
    { name: '390_mobile_sm', width: 390, height: 844 }
  ];

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(400);

    // If mobile sidebar is open, close it
    const closeSidebarBtn = await page.$('.sidebar-close-btn, .btn-close, .mobile-sidebar-close, .mobile-nav-close, .btn-close-sidebar');
    if (closeSidebarBtn && await closeSidebarBtn.isVisible()) {
      await closeSidebarBtn.click();
      await page.waitForTimeout(300);
    } else {
      const backdrop = await page.$('.sidebar-backdrop, .mobile-backdrop');
      if (backdrop && await backdrop.isVisible()) {
        await backdrop.click();
        await page.waitForTimeout(300);
      }
    }

    const scrollInfo = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      hasPageOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
    }));
    console.log(`   Viewport ${vp.width}px (${vp.name}): hasPageOverflow = ${scrollInfo.hasPageOverflow}`);
    await page.screenshot({ path: `${ARTIFACTS}/parties_phase4_responsive_${vp.name}.png` });
  }

  console.log('\nAudit Complete! Console error count:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.log('Errors encountered:', consoleErrors);
  }

  await browser.close();
  console.log('════════════════════════════════════════════════════════════════');
}

runTab4DirectoryAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
