const { chromium } = require('playwright');
const path = require('path');

const ARTIFACTS = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/c1c6338c-1671-4e87-b480-7a9ae9928b58';

async function runTab6PaymentsAudit() {
  console.log('================================================================');
  console.log('🚀 TAB 6: CUSTOMER RECEIPTS & PAYMENT COLLECTIONS COMPREHENSIVE AUDIT');
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
  await page.goto('http://localhost:4200');
  await page.waitForTimeout(1500);

  const isAuth = await page.evaluate(() => !!localStorage.getItem('futane_token'));
  if (!isAuth) {
    console.log('   Entering credentials...');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1200);

    const otpInput = await page.$('input[name="otp"]');
    if (otpInput) {
      console.log('   Entering OTP 654321...');
      await page.fill('input[name="otp"]', '654321');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1200);
    }
  }

  // 2. Switch to Tab 6: Customer Receipts & Payment Collections
  console.log('2. Switching to Customer Receipts & Payment Collections (Tab 6)...');
  await page.waitForSelector('.sidebar-nav, li:has-text("Payment")', { timeout: 15000 });
  await page.click('li:has-text("Payment")');
  await page.waitForSelector('.payments-enterprise-container, table.enterprise-payments-table', { timeout: 15000 });
  await page.waitForTimeout(1200);

  // 3. Verify Breadcrumb
  const breadcrumb = await page.textContent('.payments-breadcrumb-bar');
  console.log(`3. Breadcrumb verified: "${breadcrumb.trim()}"`);

  // 4. Verify Stable Header
  const headerTitle = await page.textContent('.header-main-title');
  const headerDesc = await page.textContent('.header-desc-text');
  console.log(`4. Stable Header: Title="${headerTitle.trim()}", Subtitle="${headerDesc.trim()}"`);

  // 5. Verify Subtabs Navigation
  console.log('5. Auditing Subtabs Navigation...');
  const subtabs = ['All Receipts', 'UPI / Digital', 'Bank Transfer', 'Cash Receipts', 'Cheque Clearances', 'High Value (₹50k+)'];
  for (const tab of subtabs) {
    await page.click(`.subnav-tab-btn:has-text("${tab}")`);
    await page.waitForTimeout(300);
    const rows = await page.evaluate(() => document.querySelectorAll('.enterprise-payments-table tbody tr').length);
    console.log(`   Subtab "${tab}": rows count = ${rows}`);
  }
  await page.click('.subnav-tab-btn:has-text("All Receipts")');
  await page.waitForTimeout(300);

  // 6. Verify 5-Card Telemetry Ribbon
  console.log('6. Auditing 5-Card Financial Telemetry Ribbon...');
  const kpis = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.payments-kpi-ribbon .kpi-card')).map(card => ({
      label: card.querySelector('.kpi-label')?.textContent?.trim(),
      number: card.querySelector('.kpi-number')?.textContent?.trim(),
      meta: card.querySelector('.kpi-meta')?.textContent?.trim()
    }));
  });
  console.log('   KPIs:', JSON.stringify(kpis, null, 2));

  // 7. Verify Search Functionality
  console.log('7. Testing Search...');
  await page.fill('.search-input', 'Zomato');
  await page.waitForTimeout(400);
  let searchedRows = await page.evaluate(() => document.querySelectorAll('.enterprise-payments-table tbody tr').length);
  console.log(`   Search for "Zomato" yielded ${searchedRows} rows.`);
  await page.click('.btn-clear-search');
  await page.waitForTimeout(300);

  // 8. Verify Filters Popover
  console.log('8. Testing Filters Popover...');
  await page.click('.btn-filter-toggle');
  await page.waitForTimeout(300);
  const popoverVisible = await page.isVisible('.filter-popover-panel');
  console.log(`   Filter popover open: ${popoverVisible}`);
  if (popoverVisible) {
    // Select Payment Mode
    await page.locator('.filter-popover-body select').nth(1).selectOption('UPI');
    await page.click('.filter-popover-footer button');
    await page.waitForTimeout(400);
    const filterCount = await page.textContent('.filter-count-badge');
    const filteredRows = await page.evaluate(() => document.querySelectorAll('.enterprise-payments-table tbody tr').length);
    console.log(`   Filtered by UPI Channel: Active badge = "${filterCount}", rows = ${filteredRows}`);
    // Reset filters
    await page.click('.btn-reset-filters');
    await page.waitForTimeout(400);
  }

  // 9. Verify Density Controls
  console.log('9. Testing Table Density...');
  await page.click('.btn-density[title="Compact row height"]');
  await page.waitForTimeout(200);
  const isCompact = await page.evaluate(() => document.querySelector('.table-responsive-viewport')?.classList.contains('density-compact'));
  console.log(`   Compact density active: ${isCompact}`);
  await page.click('.btn-density[title="Normal row height"]');
  await page.waitForTimeout(200);

  // 10. Capture Desktop Full Page Screenshot
  await page.screenshot({ path: `${ARTIFACTS}/payments_phase6_desktop_fullpage.png`, fullPage: true });
  console.log('   ✓ Saved payments_phase6_desktop_fullpage.png');

  // 11. Verify Official Customer Receipt Voucher Modal
  console.log('10. Testing Customer Receipt Voucher Slip Modal...');
  const voucherBtn = await page.$('.btn-action-voucher, .voucher-ref-link');
  if (voucherBtn) {
    await voucherBtn.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${ARTIFACTS}/payments_phase6_voucher_modal.png` });
    console.log('   ✓ Saved payments_phase6_voucher_modal.png');
    // Close modal
    await page.click('.btn-close-modal');
    await page.waitForTimeout(300);
  }

  // 12. Verify Collapsible Add / Edit Form
  console.log('11. Testing Collapsible Record Payment Form...');
  const addBtn = await page.$('button.btn-header-action.btn-primary');
  if (addBtn) {
    await addBtn.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${ARTIFACTS}/payments_phase6_form_open.png` });
    console.log('   ✓ Saved payments_phase6_form_open.png');
    // Close form
    await page.click('button.btn-header-action.btn-primary');
    await page.waitForTimeout(300);
  }

  // 13. Verify Dark Mode
  console.log('12. Testing Dark Mode...');
  await page.evaluate(() => document.body.classList.add('dark-mode'));
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${ARTIFACTS}/payments_phase6_dark_mode.png`, fullPage: true });
  console.log('   ✓ Saved payments_phase6_dark_mode.png');
  await page.evaluate(() => document.body.classList.remove('dark-mode'));

  // 14. Auditing 7 Responsive Viewports
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
    await page.waitForTimeout(350);

    // If mobile sidebar is open, close it to view the page contents cleanly
    await page.evaluate(() => {
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) sidebar.classList.remove('open');
      const backdrop = document.querySelector('.sidebar-backdrop');
      if (backdrop) backdrop.style.display = 'none';
    });
    await page.waitForTimeout(200);

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    console.log(`   Viewport ${vp.width}px (${vp.name}): hasPageOverflow = ${hasHorizontalScroll}`);
    if (vp.width === 390) {
      await page.evaluate(() => {
        document.querySelectorAll('aside.sidebar, .sidebar-backdrop').forEach(el => el.style.display = 'none');
      });
      await page.waitForTimeout(200);
      await page.screenshot({ path: `${ARTIFACTS}/payments_phase6_responsive_390_mobile_sm.png` });
      console.log('   ✓ Saved payments_phase6_responsive_390_mobile_sm.png');
    }
  }

  console.log('\nAudit Complete! Console error count:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.log('Errors encountered:', consoleErrors.slice(0, 5));
  }
  console.log('════════════════════════════════════════════════════════════════\n');

  await browser.close();
}

runTab6PaymentsAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
