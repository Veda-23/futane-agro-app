import { chromium } from '@playwright/test';

async function testInvoicesTab() {
  console.log('Testing aligned Invoices tab on http://localhost:4300...');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  const start = Date.now();
  await page.goto('http://localhost:4300', { waitUntil: 'domcontentloaded' });
  console.log(`Page loaded in ${Date.now() - start}ms`);

  // Check if login is needed or already authenticated
  const needsLogin = await page.locator('#username').isVisible({ timeout: 3000 }).catch(() => false);
  if (needsLogin) {
    console.log('Logging in with SUPER_ADMIN...');
    await page.fill('#username', 'SUPER_ADMIN');
    await page.fill('#password', 'superadmin123');
    await page.click('#login-submit-btn');

    // Handle OTP if present
    const otpAppeared = await page.waitForSelector('.uat-otp-helper-pill, .sidebar', { timeout: 8000 }).catch(() => null);
    if (await page.locator('.uat-otp-helper-pill').isVisible().catch(() => false)) {
      console.log('Filling OTP...');
      await page.click('.uat-otp-helper-pill');
      await page.waitForTimeout(400);
      const submitBtn = page.locator('button[type="submit"]');
      if (await submitBtn.isVisible()) await submitBtn.click();
    }
  } else {
    console.log('Already authenticated!');
  }

  // Wait for sidebar
  await page.waitForSelector('.nav-menu-list, .sidebar', { timeout: 10000 });
  console.log('Sidebar found! Clicking Invoices in sidebar...');

  // Click the Invoices sidebar item
  const invoiceNavItem = page.locator('li').filter({ hasText: /Invoice/i }).first();
  await invoiceNavItem.waitFor({ timeout: 5000 });
  await invoiceNavItem.click();
  console.log('Clicked Invoices tab! Waiting for Invoices component to render...');

  // Wait for Structure 1, 2, 3
  await page.waitForSelector('.invoices-page-header, .invoices-telemetry-grid', { timeout: 10000 });
  await page.waitForTimeout(1500);

  // Validate Structure 1
  const headerTitle = await page.locator('.invoices-page-header .header-main-title').innerText().catch(() => 'N/A');
  console.log('Structure 1 Header:', headerTitle);

  // Validate Structure 2
  const kpiCount = await page.locator('.invoices-telemetry-grid .kpi-card').count();
  const kpiLabels = await page.locator('.invoices-telemetry-grid .kpi-label').allInnerTexts();
  console.log('Structure 2 KPI Cards count:', kpiCount, 'Labels:', kpiLabels);

  // Validate Structure 3
  const tableExists = await page.locator('.enterprise-table').isVisible().catch(() => false);
  const rowCount = await page.locator('.enterprise-table tbody tr').count();
  const actionBtns = await page.locator('.row-actions-group .btn-icon-action, .row-actions-group .btn-row-action').count();
  console.log(`Structure 3 Table visible: ${tableExists}, Rows: ${rowCount}, Action buttons: ${actionBtns}`);

  // Scroll to summary footer and capture bottom view
  const tfoot = page.locator('.table-summary-tfoot');
  if (await tfoot.isVisible()) {
    await tfoot.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const tfootPath = 'C:\\Users\\Vedant\\.gemini\\antigravity-ide\\brain\\2a404500-c039-4b3f-a3a7-20719c23b105\\invoices_tfoot_verified.png';
    await page.screenshot({ path: tfootPath });
    console.log('Captured tfoot screenshot at:', tfootPath);
  }

  await browser.close();
}

testInvoicesTab().catch(console.error);
