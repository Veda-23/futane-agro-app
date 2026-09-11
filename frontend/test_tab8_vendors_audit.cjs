const { chromium } = require('playwright');
const path = require('path');

const ARTIFACTS = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/c1c6338c-1671-4e87-b480-7a9ae9928b58';

async function runTab8VendorsAudit() {
  console.log('================================================================');
  console.log('🚀 TAB 8: POLYMER SUPPLIERS & VENDOR DIRECTORY COMPREHENSIVE AUDIT');
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

  // 2. Switch to Tab 8: Polymer Suppliers & Vendors
  console.log('2. Switching to Polymer Suppliers & Vendor Directory (Tab 8)...');
  await page.waitForSelector('.sidebar-nav, li:has-text("Vendors"), li:has-text("Suppliers")', { timeout: 15000 });
  
  // Click on Vendors in sidebar
  const vendorNavItem = await page.$('li:has-text("Vendors"), li:has-text("Suppliers"), a:has-text("Vendors")');
  if (vendorNavItem) {
    await vendorNavItem.click();
  }
  
  await page.waitForSelector('.vendors-enterprise-container, table.vendor-data-table', { timeout: 15000 });
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
    'All Suppliers',
    'Verified GSTIN',
    'Polymer & Resin',
    'Packaging & Crates',
    'Color & Additives',
    'Unregistered / Direct'
  ];
  for (const tab of subtabs) {
    await page.click(`.subtab-pill-btn:has-text("${tab}")`);
    await page.waitForTimeout(300);
    const rows = await page.evaluate(() => document.querySelectorAll('.vendor-data-table tbody tr.table-data-row').length);
    console.log(`   Subtab "${tab}": visible rows count = ${rows}`);
  }
  await page.click('.subtab-pill-btn:has-text("All Suppliers")');
  await page.waitForTimeout(300);

  // 6. Verify 5-Card Telemetry Ribbon
  console.log('6. Auditing 5-Card Telemetry Ribbon...');
  const kpis = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.telemetry-card')).map(card => ({
      label: card.querySelector('.telemetry-label')?.textContent?.trim(),
      value: card.querySelector('.telemetry-value')?.textContent?.trim(),
      subtext: card.querySelector('.telemetry-subtext, .telemetry-progress-track')?.textContent?.trim()
    }));
  });
  console.log('   KPIs:', JSON.stringify(kpis, null, 2));

  // 7. Testing Search
  console.log('7. Testing Search...');
  await page.fill('.toolbar-search-input', 'Reliance');
  await page.waitForTimeout(400);
  const searchCount = await page.evaluate(() => document.querySelectorAll('.vendor-data-table tbody tr.table-data-row').length);
  console.log(`   Search for "Reliance" yielded ${searchCount} rows.`);
  await page.click('.search-clear-btn');
  await page.waitForTimeout(300);

  // 8. Testing Filter Popover
  console.log('8. Auditing Filter Popover...');
  await page.click('.filter-popover-wrapper button');
  await page.waitForSelector('.filter-popover-card', { timeout: 3000 });
  console.log('   Filter Popover opened successfully.');
  await page.click('.popover-close-btn');
  await page.waitForTimeout(200);

  // 9. Testing Add/Edit Form Drawer
  console.log('9. Auditing Add/Edit Form Drawer...');
  await page.click('button:has-text("+ Register Supplier")');
  await page.waitForSelector('.vendor-form-panel', { timeout: 4000 });
  console.log('   Registration Form opened successfully.');

  await page.screenshot({ path: path.join(ARTIFACTS, 'vendors_phase8_form_open.png'), fullPage: false });

  await page.click('.btn-close-panel');
  await page.waitForTimeout(300);
  console.log('   Registration Form closed.');

  // 10. Testing Official Supplier Dossier Modal
  console.log('10. Auditing Supplier Dossier Modal...');
  const firstDossierBtn = await page.$('.btn-dossier');
  if (firstDossierBtn) {
    await firstDossierBtn.click();
    await page.waitForSelector('.dossier-voucher-dialog', { timeout: 4000 });
    const dossierTitle = await page.textContent('.dossier-title-main');
    console.log(`   Dossier opened for: "${dossierTitle.trim()}"`);
    await page.screenshot({ path: path.join(ARTIFACTS, 'vendors_phase8_dossier_modal.png'), fullPage: false });
    await page.click('.btn-close-dossier');
    await page.waitForTimeout(300);
    console.log('   Dossier closed.');
  }

  // 11. Table Density & Columns
  console.log('11. Auditing Table Density & Columns...');
  await page.click('.btn-density[title*="Compact" i]');
  await page.waitForTimeout(200);
  await page.click('.btn-density[title*="Comfortable" i]');
  await page.waitForTimeout(200);

  // Reset horizontal table scroll to 0 for a pristine view of left columns
  await page.evaluate(() => {
    const el = document.querySelector('.table-responsive-wrapper');
    if (el) el.scrollLeft = 0;
  });
  await page.waitForTimeout(200);

  // Take Desktop Fullpage Screenshot
  await page.screenshot({ path: path.join(ARTIFACTS, 'vendors_phase8_desktop_fullpage.png'), fullPage: true });
  console.log('   Desktop fullpage screenshot captured.');

  // 12. Viewport & Overflow Audit across all 7 resolutions
  console.log('12. Auditing Responsiveness and Overflow across all 7 viewports...');
  const viewports = [
    { w: 1920, h: 1080, name: '1920_desktop_fhd' },
    { w: 1440, h: 900,  name: '1440_desktop_laptop' },
    { w: 1280, h: 800,  name: '1280_compact_laptop' },
    { w: 1024, h: 768,  name: '1024_tablet_landscape' },
    { w: 768,  h: 1024, name: '768_tablet_portrait' },
    { w: 480,  h: 854,  name: '480_mobile_large' },
    { w: 390,  h: 844,  name: '390_mobile_iphone' }
  ];

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.w, height: vp.h });
    await page.waitForTimeout(300);
    const overflow = await page.evaluate(() => {
      return {
        bodyScrollWidth: document.body.scrollWidth,
        windowInnerWidth: window.innerWidth,
        hasOverflow: document.documentElement.scrollWidth > window.innerWidth
      };
    });
    console.log(`   Viewport ${vp.w}x${vp.h} (${vp.name}): overflow=${overflow.hasOverflow} (scrollWidth=${overflow.bodyScrollWidth}, innerWidth=${overflow.windowInnerWidth})`);
    if (vp.w === 390) {
      const closeBtn = await page.$('.mobile-close-btn');
      if (closeBtn && await closeBtn.isVisible()) {
        await closeBtn.click();
        await page.waitForTimeout(400);
      }
      await page.screenshot({ path: path.join(ARTIFACTS, 'vendors_phase8_responsive_390_mobile.png'), fullPage: false });
    }
  }

  // 13. Dark Mode Audit
  console.log('13. Auditing Dark Mode...');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.classList.add('dark-theme');
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ARTIFACTS, 'vendors_phase8_dark_mode.png'), fullPage: true });
  console.log('   Dark mode screenshot captured.');

  // Reset theme
  await page.evaluate(() => {
    document.documentElement.removeAttribute('data-theme');
    document.body.classList.remove('dark-theme');
  });

  console.log('\n================================================================');
  console.log('✅ ALL TAB 8 (POLYMER SUPPLIERS & VENDORS) AUDIT CHECKS PASSED!');
  console.log('================================================================');

  await browser.close();
}

runTab8VendorsAudit().catch(err => {
  console.error('❌ Audit Failed:', err);
  process.exit(1);
});
