import { chromium } from '@playwright/test';

async function testExpenses() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1339, height: 720 } });
  await page.goto('http://localhost:4300');
  await page.waitForSelector('#username, .sidebar', { timeout: 30000 });
  if (await page.locator('#username').isVisible()) {
    await page.fill('#username', 'SUPER_ADMIN');
    await page.fill('#password', 'superadmin123');
    await page.click('#login-submit-btn');
    await page.waitForTimeout(1000);
    if (await page.locator('.uat-otp-helper-pill').isVisible()) {
      await page.click('.uat-otp-helper-pill');
      await page.waitForTimeout(400);
      await page.locator('button:has-text("Verify"), button[type="submit"]').first().click();
    }
  }
  await page.waitForSelector('.sidebar', { timeout: 20000 });
  await page.evaluate(() => {
    const app = window.ng.getComponent(document.querySelector('app-root'));
    app.switchTab('expenses');
    window.ng.applyChanges(app);
  });
  await page.waitForSelector('app-expenses', { timeout: 15000 });
  const state = await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-expenses'));
    if (!comp) return 'NO COMPONENT';
    comp.openVoucherModal({
      id: 1,
      voucherNo: 'VCH-EXP-2026-0033',
      expenseCategory: 'Factory Plant Maintenance',
      paidTo: 'Apex Hydraulic Works',
      amount: 14500,
      paymentMode: 'NEFT / RTGS',
      expenseDate: '2026-10-10',
      approvedBy: 'Works Director',
      notes: 'Preventive overhaul'
    });
    window.ng.applyChanges(comp);
    return {
      showVoucherModal: comp.showVoucherModal,
      selected: !!comp.selectedExpenseForVoucher,
      htmlFound: !!document.querySelector('.voucher-modal-dialog'),
      dialogCount: document.querySelectorAll('.voucher-modal-dialog').length,
      allVoucherBackdrops: document.querySelectorAll('.voucher-modal-overlay, .voucher-modal-backdrop').length
    };
  });
  console.log('EXPENSES POP STATE:', state);
  await browser.close();
}

testExpenses().catch(console.error);
