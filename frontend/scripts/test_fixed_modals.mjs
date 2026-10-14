import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/c6f35e64-605e-4364-8857-ebfa705e7205/modal_fixes';
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:4300...');
  await page.goto('http://localhost:4300', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  // Login
  const usernameInput = await page.$('#username');
  if (usernameInput) {
    console.log('Logging in as SUPER_ADMIN...');
    await page.fill('#username', 'SUPER_ADMIN');
    await page.fill('#password', 'superadmin123');
    await page.click('#login-submit-btn');
    try {
      await page.waitForSelector('.uat-otp-helper-pill', { timeout: 4000 });
      await page.click('.uat-otp-helper-pill');
      await page.waitForTimeout(200);
      await page.click('#otp-verify-submit-btn');
    } catch (e) {}
    await page.waitForTimeout(2500);
  }

  // 1. Switch to Sales tab
  console.log('Switching to Sales tab...');
  await page.evaluate(() => {
    const appRoot = document.querySelector('app-root');
    if (appRoot && window.ng) {
      const comp = window.ng.getComponent(appRoot);
      if (comp && comp.switchTab) comp.switchTab('sales');
    }
  });
  await page.waitForTimeout(2000);

  // 2. Open Sales Dossier Modal
  console.log('Opening Sales Dossier Modal...');
  const openedDossier = await page.evaluate(() => {
    const salesCompEl = document.querySelector('app-sales');
    if (salesCompEl && window.ng) {
      const salesComp = window.ng.getComponent(salesCompEl);
      if (salesComp && salesComp.salesList && salesComp.salesList.length > 0) {
        salesComp.openSalesDossier(salesComp.salesList[0]);
        return true;
      }
    }
    return false;
  });
  console.log('Dossier opened via component API:', openedDossier);
  await page.waitForTimeout(1000);

  // Measure logo
  const logoInfo = await page.evaluate(() => {
    const logo = document.querySelector('.sales-dossier-dialog .letterhead-logo');
    if (!logo) return null;
    const rect = logo.getBoundingClientRect();
    const style = window.getComputedStyle(logo);
    return {
      width: rect.width,
      height: rect.height,
      maxHeight: style.maxHeight,
      objectFit: style.objectFit,
      display: style.display
    };
  });
  console.log('Measured Letterhead Logo in Sales Dossier:', logoInfo);

  const dossierScreenshot = path.join(ARTIFACT_DIR, 'sales_dossier_modal_fixed.png');
  await page.screenshot({ path: dossierScreenshot });
  console.log('Saved Sales Dossier screenshot:', dossierScreenshot);

  // Close dossier
  await page.evaluate(() => {
    const salesCompEl = document.querySelector('app-sales');
    if (salesCompEl && window.ng) {
      const salesComp = window.ng.getComponent(salesCompEl);
      if (salesComp && salesComp.closeSalesDossier) salesComp.closeSalesDossier();
    }
  });
  await page.waitForTimeout(800);

  // 3. Open Payment Voucher SweetAlert
  console.log('Opening Payment Voucher SweetAlert...');
  const openedVoucher = await page.evaluate(() => {
    const salesCompEl = document.querySelector('app-sales');
    if (salesCompEl && window.ng) {
      const salesComp = window.ng.getComponent(salesCompEl);
      if (salesComp && salesComp.salesList && salesComp.salesList.length > 0) {
        const sale = salesComp.salesList[0];
        salesComp.generateReceipt(sale, 885500, 'PAY-882910');
        return true;
      }
    }
    return false;
  });
  console.log('Payment Voucher opened:', openedVoucher);
  await page.waitForTimeout(1000);

  const voucherZIndex = await page.evaluate(() => {
    const container = document.querySelector('.swal2-container');
    const popup = document.querySelector('.swal2-popup');
    if (!container || !popup) return null;
    return {
      containerZIndex: window.getComputedStyle(container).zIndex,
      popupZIndex: window.getComputedStyle(popup).zIndex,
      containerDisplay: window.getComputedStyle(container).display,
      containerBackground: window.getComputedStyle(container).backgroundColor
    };
  });
  console.log('Payment Voucher SweetAlert metrics:', voucherZIndex);

  const voucherScreenshot = path.join(ARTIFACT_DIR, 'payment_voucher_modal_fixed.png');
  await page.screenshot({ path: voucherScreenshot });
  console.log('Saved Payment Voucher screenshot:', voucherScreenshot);

  // Close SweetAlert
  await page.evaluate(() => {
    const closeBtn = document.querySelector('.swal2-close, .swal2-cancel');
    if (closeBtn) closeBtn.click();
  });
  await page.waitForTimeout(800);

  // 4. Test Session Expired Modal on Settings (WhatsApp & Alerts) tab
  console.log('Switching to Settings (WhatsApp) tab...');
  await page.evaluate(() => {
    const appRoot = document.querySelector('app-root');
    if (appRoot && window.ng) {
      const comp = window.ng.getComponent(appRoot);
      if (comp && comp.switchTab) comp.switchTab('settings');
    }
  });
  await page.waitForTimeout(2000);

  // Trigger Session Expired SweetAlert from NotificationService
  console.log('Triggering Session Expired dialog...');
  await page.evaluate(() => {
    const appRoot = document.querySelector('app-root');
    if (appRoot && window.ng) {
      const comp = window.ng.getComponent(appRoot);
      if (comp && comp.notificationService) {
        comp.notificationService.showSessionExpired(() => {});
      }
    }
  });
  await page.waitForTimeout(1000);

  const sessionExpiredInfo = await page.evaluate(() => {
    const container = document.querySelector('.swal2-container');
    const popup = document.querySelector('.swal2-popup');
    if (!container || !popup) return null;
    return {
      containerZIndex: window.getComputedStyle(container).zIndex,
      popupZIndex: window.getComputedStyle(popup).zIndex,
      containerDisplay: window.getComputedStyle(container).display,
      containerBackground: window.getComputedStyle(container).backgroundColor
    };
  });
  console.log('Session Expired dialog metrics:', sessionExpiredInfo);

  const sessionExpiredScreenshot = path.join(ARTIFACT_DIR, 'session_expired_modal_fixed.png');
  await page.screenshot({ path: sessionExpiredScreenshot });
  console.log('Saved Session Expired screenshot:', sessionExpiredScreenshot);

  await browser.close();
  console.log('All modal checks completed successfully!');
}

run().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
