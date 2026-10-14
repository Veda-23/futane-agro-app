import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/c6f35e64-605e-4364-8857-ebfa705e7205/e2e_modal_verification';
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

async function runScenario4() {
  console.log('Testing Scenario 4: Payment Voucher Modal on Payments Tab...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:4300...');
  await page.goto('http://localhost:4300', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);

  // Check login
  const loginInput = await page.$('#username');
  if (loginInput) {
    console.log('Logging in as SUPER_ADMIN...');
    await page.fill('#username', 'SUPER_ADMIN');
    await page.fill('#password', 'superadmin123');
    await page.click('#login-submit-btn');

    await page.waitForSelector('.uat-otp-helper-pill, .sidebar', { timeout: 10000 }).catch(() => null);
    const otpPill = await page.$('.uat-otp-helper-pill');
    if (otpPill) {
      console.log('Clicking OTP pill...');
      await otpPill.click();
      await page.waitForTimeout(300);
      const otpSubmit = await page.$('#otp-verify-submit-btn');
      if (otpSubmit) await otpSubmit.click();
    }
  }

  await page.waitForSelector('.sidebar, .app-header', { timeout: 15000 });
  await page.waitForTimeout(1500);

  // Switch to payments tab
  console.log('Switching to Payments tab via component API...');
  await page.evaluate(() => {
    // @ts-ignore
    const appRoot = document.querySelector('app-root');
    // @ts-ignore
    if (appRoot && window.ng) window.ng.getComponent(appRoot)?.switchTab('payments');
  });
  await page.waitForTimeout(2000);

  // Open voucher modal
  console.log('Opening voucher modal...');
  const opened = await page.evaluate(() => {
    const payEl = document.querySelector('app-payments');
    // @ts-ignore
    if (payEl && window.ng) {
      // @ts-ignore
      const payComp = window.ng.getComponent(payEl);
      if (payComp && payComp.paymentsList && payComp.paymentsList.length > 0) {
        payComp.openVoucherModal(payComp.paymentsList[0]);
        return true;
      }
    }
    return false;
  });
  console.log('Voucher modal opened:', opened);
  await page.waitForTimeout(1000);

  const metrics = await page.evaluate(() => {
    const backdrop = document.querySelector('.receipt-voucher-backdrop');
    const dialog = document.querySelector('.receipt-voucher-dialog');
    const logo = document.querySelector('.voucher-company-logo');
    return {
      backdropZIndex: backdrop ? window.getComputedStyle(backdrop).zIndex : null,
      dialogZIndex: dialog ? window.getComputedStyle(dialog).zIndex : null,
      dialogRect: dialog ? {
        top: dialog.getBoundingClientRect().top,
        left: dialog.getBoundingClientRect().left,
        width: dialog.getBoundingClientRect().width,
        height: dialog.getBoundingClientRect().height
      } : null,
      logoRenderedHeight: logo ? logo.getBoundingClientRect().height : null,
      logoRenderedWidth: logo ? logo.getBoundingClientRect().width : null
    };
  });
  console.log('Scenario 4 Metrics:', metrics);

  const voucherScreenshot = path.join(ARTIFACT_DIR, '04_payment_voucher_modal.png');
  await page.screenshot({ path: voucherScreenshot });
  console.log('Saved Scenario 4 screenshot:', voucherScreenshot);

  await browser.close();
  console.log('Scenario 4 complete!');
}

runScenario4().catch(console.error);
