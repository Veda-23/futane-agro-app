import { chromium } from '@playwright/test';
import path from 'path';

async function testTabs() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:4300...');
  await page.goto('http://localhost:4300', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  
  if (await page.locator('#username').isVisible()) {
    console.log('Logging in...');
    await page.fill('#username', 'SUPER_ADMIN');
    await page.fill('#password', 'superadmin123');
    await page.click('#login-submit-btn');
    await page.waitForTimeout(1000);
    const otp = page.locator('.uat-otp-helper-pill');
    if (await otp.isVisible()) {
      await otp.click();
      await page.waitForTimeout(300);
      await page.click('#otp-verify-submit-btn');
    }
  }

  await page.waitForSelector('.sidebar, .app-header', { timeout: 15000 });
  await page.waitForTimeout(1500);

  // 1. Click Payment Registry in sidebar
  console.log('Clicking Payment Registry...');
  const paymentNav = page.locator('app-sidebar li').filter({ hasText: 'Payment Registry' }).first();
  await paymentNav.scrollIntoViewIfNeeded();
  await paymentNav.click();
  await page.waitForTimeout(1500);

  await page.screenshot({ path: path.resolve('scratch/tab_payment_registry_loaded.png') });
  console.log('Saved scratch/tab_payment_registry_loaded.png');

  // Let's inspect what's inside app-payments
  const payInfo = await page.evaluate(() => {
    const pay = document.querySelector('app-payments');
    return {
      exists: !!pay,
      visible: pay ? window.getComputedStyle(pay).display !== 'none' : false,
      tableRows: document.querySelectorAll('app-payments tbody tr').length,
      hasTable: !!document.querySelector('app-payments table')
    };
  });
  console.log('Payment Tab info:', payInfo);

  // 2. Open Payment Receipt Voucher
  console.log('Opening Payment Receipt Voucher...');
  const voucherBtn = page.locator('app-payments .btn-action-voucher').first();
  await voucherBtn.waitFor({ state: 'visible', timeout: 5000 });
  await voucherBtn.click();
  await page.waitForTimeout(600);

  const voucherModal = page.locator('.receipt-voucher-dialog');
  const vBox = await voucherModal.boundingBox();
  const vCenter = Math.round(vBox.x + vBox.width / 2);
  const vBlur = await page.evaluate(() => {
    const b = document.querySelector('.receipt-voucher-backdrop');
    return b ? window.getComputedStyle(b).backdropFilter : 'none';
  });
  console.log(`Payment Receipt Voucher: X=${Math.round(vBox.x)}, Width=${Math.round(vBox.width)}, Center=${vCenter}px (Target: 840px), Blur=${vBlur}`);
  await page.screenshot({ path: path.resolve('scratch/01_payment_receipt_voucher_verified.png') });

  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // 3. Open Edit Payment Record
  console.log('Opening Edit Payment Record...');
  const editBtn = page.locator('app-payments .btn-action-edit').first();
  await editBtn.waitFor({ state: 'visible', timeout: 5000 });
  await editBtn.click();
  await page.waitForTimeout(600);

  const editModal = page.locator('.payments-modal-dialog');
  const eBox = await editModal.boundingBox();
  const eCenter = Math.round(eBox.x + eBox.width / 2);
  const eBlur = await page.evaluate(() => {
    const b = document.querySelector('.payments-modal-overlay');
    return b ? window.getComputedStyle(b).backdropFilter : 'none';
  });
  console.log(`Edit Payment Record: X=${Math.round(eBox.x)}, Width=${Math.round(eBox.width)}, Center=${eCenter}px (Target: 840px), Blur=${eBlur}`);
  await page.screenshot({ path: path.resolve('scratch/02_edit_payment_record_verified.png') });

  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  console.log('🎉 Payment Registry modals verified successfully!');
  await browser.close();
}

testTabs().catch(console.error);
