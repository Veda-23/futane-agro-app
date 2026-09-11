const { chromium } = require('playwright');
const path = require('path');

const ARTIFACTS = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/c1c6338c-1671-4e87-b480-7a9ae9928b58';

async function runTab7RawMaterialsAudit() {
  console.log('================================================================');
  console.log('🚀 TAB 7: POLYMER RAW MATERIALS & PP GRANULES COMPREHENSIVE AUDIT');
  console.log('================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  // 1. Navigate and Authenticate
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
      await page.waitForSelector('input[placeholder*="otp" i], input[name*="otp" i], input[placeholder*="●"]', { timeout: 4000 });
      console.log('   Entering OTP 654321...');
      await page.fill('input[placeholder*="otp" i], input[name*="otp" i], input[placeholder*="●"]', '654321');
      const verifyBtn = await page.$('button[type="submit"], button:has-text("Verify")');
      if (verifyBtn) await verifyBtn.click();
      await page.waitForTimeout(1500);
    } catch (e) {
      console.log('   OTP step passed or not required');
    }
  }

  // 2. Switch to Tab 7: Raw Materials
  console.log('2. Switching to Raw Materials (Tab 7)...');
  await page.waitForSelector('.sidebar-nav, li:has-text("Raw Materials")', { timeout: 15000 });
  await page.click('li:has-text("Raw Materials")');
  await page.waitForSelector('.raw-materials-enterprise-container, table.enterprise-raw-table', { timeout: 15000 });
  await page.waitForTimeout(1200);

  // 3. Verify Breadcrumb
  const breadcrumb = await page.textContent('.breadcrumb-nav');
  console.log(`3. Breadcrumb verified: "${breadcrumb.trim()}"`);

  // 4. Verify Stable Header
  const headerTitle = await page.textContent('.header-main-title');
  const headerDesc = await page.textContent('.header-desc-text');
  console.log(`4. Stable Header: Title="${headerTitle.trim()}", Subtitle="${headerDesc.trim()}"`);

  // 5. Verify Subtabs Navigation
  console.log('5. Auditing Subtabs Navigation...');
  const subtabs = [
    'All Materials',
    'Virgin Polymer (HDPE / PP)',
    'Recycled & Compounds',
    'Masterbatch & Additives',
    'Packaging & Cartons',
    'High Volume (1,000+ kg)'
  ];
  for (const tab of subtabs) {
    await page.click(`.subtab-pill-btn:has-text("${tab}")`);
    await page.waitForTimeout(300);
    const rows = await page.evaluate(() => document.querySelectorAll('.enterprise-raw-table tbody tr').length);
    console.log(`   Subtab "${tab}": rows count = ${rows}`);
  }
  await page.click('.subtab-pill-btn:has-text("All Materials")');
  await page.waitForTimeout(300);

  // 6. Verify 5-Card Telemetry Ribbon
  console.log('6. Auditing 5-Card Telemetry Ribbon...');
  const kpis = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.telemetry-card')).map(card => ({
      label: card.querySelector('.telemetry-label')?.textContent?.trim(),
      number: card.querySelector('.telemetry-number')?.textContent?.trim(),
      meta: card.querySelector('.telemetry-meta')?.textContent?.trim()
    }));
  });
  console.log('   KPIs:', JSON.stringify(kpis, null, 2));

  // 7. Testing Search
  console.log('7. Testing Search...');
  await page.fill('.search-field', 'Virgin');
  await page.waitForTimeout(400);
  const searchCount = await page.evaluate(() => document.querySelectorAll('.enterprise-raw-table tbody tr').length);
  console.log(`   Search for "Virgin" yielded ${searchCount} rows.`);
  await page.click('.clear-search-btn');
  await page.waitForTimeout(300);

  // 8. Testing Filters Popover
  console.log('8. Testing Filters Popover...');
  await page.click('.filter-trigger-btn');
  await page.waitForTimeout(300);
  const isPopoverVisible = await page.isVisible('.filter-popover-panel');
  console.log(`   Filter popover open: ${isPopoverVisible}`);

  await page.selectOption('.filter-select:has(option[value="masterbatch"])', 'masterbatch');
  await page.click('.popover-footer-row button:has-text("Apply Filters")');
  await page.waitForTimeout(400);

  const filteredCount = await page.evaluate(() => document.querySelectorAll('.enterprise-raw-table tbody tr').length);
  const activeBadge = await page.textContent('.filter-badge');
  console.log(`   Filtered by Masterbatch: Active badge = "${activeBadge.trim()}", rows = ${filteredCount}`);

  await page.click('button:has-text("Reset")');
  await page.waitForTimeout(300);

  // 9. Testing Table Density
  console.log('9. Testing Table Density...');
  await page.click('.density-btn:has-text("Compact")');
  await page.waitForTimeout(200);
  const isCompact = await page.evaluate(() => document.querySelector('.table-container').classList.contains('table-compact'));
  console.log(`   Compact density active: ${isCompact}`);

  // Capture Desktop Fullpage
  await page.screenshot({ path: path.join(ARTIFACTS, 'raw_materials_phase7_desktop_fullpage.png'), fullPage: true });
  console.log('   ✓ Saved raw_materials_phase7_desktop_fullpage.png');

  // 10. Testing Add/Edit Form
  console.log('10. Testing Add / Edit Procurement Form...');
  await page.click('button:has-text("+ Log Procurement Batch")');
  await page.waitForTimeout(400);
  const isFormOpen = await page.isVisible('#raw-material-form-container');
  console.log(`   Form open: ${isFormOpen}`);

  const previewVal = await page.textContent('.total-preview-cost');
  console.log(`   Live batch calculation preview: "${previewVal.trim()}"`);
  await page.screenshot({ path: path.join(ARTIFACTS, 'raw_materials_phase7_form_open.png'), fullPage: false });
  console.log('   ✓ Saved raw_materials_phase7_form_open.png');

  await page.click('#raw-material-form-container button:has-text("Cancel")');
  await page.waitForTimeout(300);

  // 11. Testing Goods Receipt Note (GRN) Inspection Modal
  console.log('11. Testing Goods Receipt Note (GRN) Inspection Modal...');
  await page.click('.enterprise-raw-table tbody tr:first-child .btn-inspect');
  await page.waitForTimeout(500);
  const isModalOpen = await page.isVisible('.grn-voucher-dialog');
  console.log(`   GRN Modal visible: ${isModalOpen}`);

  const voucherRef = await page.textContent('.grn-meta-banner .meta-item:first-child .meta-value');
  console.log(`   Inspected Voucher: "${voucherRef.trim()}"`);
  await page.screenshot({ path: path.join(ARTIFACTS, 'raw_materials_phase7_grn_modal.png'), fullPage: false });
  console.log('   ✓ Saved raw_materials_phase7_grn_modal.png');

  await page.click('.btn-close-modal');
  await page.waitForTimeout(300);

  // 12. Testing Dark Mode
  console.log('12. Testing Dark Mode...');
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.setAttribute('data-theme', 'dark');
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ARTIFACTS, 'raw_materials_phase7_dark_mode.png'), fullPage: true });
  console.log('   ✓ Saved raw_materials_phase7_dark_mode.png');

  // Reset to light mode
  await page.evaluate(() => {
    document.documentElement.removeAttribute('data-theme');
    document.body.removeAttribute('data-theme');
  });
  await page.waitForTimeout(300);

  // 13. Auditing 7 Responsive Viewports
  console.log('13. Auditing 7 Responsive Viewports...');
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

    // If tablet/mobile, ensure sidebar doesn't obstruct view
    if (vp.width <= 1024) {
      await page.evaluate(() => {
        document.querySelectorAll('aside.sidebar, .sidebar-backdrop').forEach(el => el.style.display = 'none');
      });
      await page.waitForTimeout(200);
    }

    const hasPageOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    console.log(`   Viewport ${vp.width}px (${vp.name}): hasPageOverflow = ${hasPageOverflow}`);

    if (vp.width === 390) {
      await page.screenshot({ path: path.join(ARTIFACTS, 'raw_materials_phase7_responsive_390_mobile_sm.png'), fullPage: true });
      console.log('   ✓ Saved raw_materials_phase7_responsive_390_mobile_sm.png');
    }
  }

  console.log(`\nAudit Complete! Console error count: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.log('Errors encountered:', consoleErrors.slice(0, 10));
  }
  console.log('════════════════════════════════════════════════════════════════\n');

  await browser.close();
}

runTab7RawMaterialsAudit().catch(err => {
  console.error('Audit failed with error:', err);
  process.exit(1);
});
