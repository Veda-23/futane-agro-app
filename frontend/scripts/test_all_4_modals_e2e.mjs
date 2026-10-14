import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/c6f35e64-605e-4364-8857-ebfa705e7205/e2e_modal_verification';
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

async function runE2E() {
  console.log('--- STARTING COMPREHENSIVE E2E VERIFICATION FOR ALL 4 MODALS ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('1. Navigating to http://localhost:4300...');
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
  await page.waitForTimeout(2000);
  console.log('Successfully logged in and loaded ERP layout.');

  // =========================================================================
  // SCENARIO 1: Session Expired SweetAlert Modal
  // =========================================================================
  console.log('\n--- SCENARIO 1: Session Expired SweetAlert Modal ---');
  // Switch to settings tab
  await page.evaluate(() => {
    // @ts-ignore
    const appRoot = document.querySelector('app-root');
    // @ts-ignore
    if (appRoot && window.ng) window.ng.getComponent(appRoot)?.switchTab('settings');
  });
  await page.waitForTimeout(1500);

  // Fire Session Expired Alert via SettingsComponent notificationService
  const swalFired = await page.evaluate(() => {
    const setEl = document.querySelector('app-settings');
    // @ts-ignore
    if (setEl && window.ng) {
      // @ts-ignore
      const comp = window.ng.getComponent(setEl);
      if (comp && comp.notificationService) {
        comp.notificationService.showSessionExpired(() => {});
        return true;
      }
    }
    return false;
  });
  console.log('Session Expired triggered via NotificationService:', swalFired);
  await page.waitForSelector('.swal2-container', { timeout: 6000 });
  await page.waitForTimeout(500);

  const swalInfo = await page.evaluate(() => {
    const container = document.querySelector('.swal2-container');
    const popup = document.querySelector('.swal2-popup');
    const closeBtn = document.querySelector('.swal2-close');
    return {
      containerZIndex: container ? window.getComputedStyle(container).zIndex : null,
      popupZIndex: popup ? window.getComputedStyle(popup).zIndex : null,
      closeBtnVisible: !!closeBtn,
      closeBtnZIndex: closeBtn ? window.getComputedStyle(closeBtn).zIndex : null
    };
  });
  console.log('SweetAlert2 Metrics:', swalInfo);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_session_expired_modal.png') });
  console.log('Saved 01_session_expired_modal.png');

  // Dismiss SweetAlert
  await page.evaluate(() => {
    const closeBtn = document.querySelector('.swal2-close');
    if (closeBtn) closeBtn.click();
    else {
      const cancelBtn = document.querySelector('.swal2-cancel, .swal2-confirm');
      if (cancelBtn) cancelBtn.click();
    }
  });
  await page.waitForTimeout(600);

  // =========================================================================
  // SCENARIO 2: Commercial Sales Contract & Order Dossier Modal
  // =========================================================================
  console.log('\n--- SCENARIO 2: Commercial Sales Contract & Order Dossier ---');
  await page.evaluate(() => {
    // @ts-ignore
    const appRoot = document.querySelector('app-root');
    // @ts-ignore
    if (appRoot && window.ng) window.ng.getComponent(appRoot)?.switchTab('sales');
  });
  await page.waitForTimeout(2000);

  // Click View Dossier button in the table if visible, or trigger via component
  const dossierBtn = page.locator('.btn-action-receipt, .btn-row-action[title*="dossier"], .btn-row-action[title*="contract"]').first();
  if (await dossierBtn.count() > 0) {
    console.log('Clicking dossier action button in sales table...');
    await dossierBtn.click();
  } else {
    console.log('Triggering sales dossier via component instance...');
    await page.evaluate(() => {
      const salesEl = document.querySelector('app-sales');
      // @ts-ignore
      if (salesEl && window.ng) {
        // @ts-ignore
        const salesComp = window.ng.getComponent(salesEl);
        if (salesComp && salesComp.salesList && salesComp.salesList.length > 0) {
          salesComp.openSalesDossier(salesComp.salesList[0]);
        }
      }
    });
  }
  await page.waitForTimeout(1000);

  const salesLogoMetrics = await page.evaluate(() => {
    const logo = document.querySelector('.sales-dossier-dialog .letterhead-logo');
    const overlay = document.querySelector('.sales-dossier-overlay');
    const dialog = document.querySelector('.sales-dossier-dialog');
    if (!logo) return null;
    const rect = logo.getBoundingClientRect();
    const style = window.getComputedStyle(logo);
    return {
      renderedWidth: rect.width,
      renderedHeight: rect.height,
      computedMaxHeight: style.maxHeight,
      computedMaxWidth: style.maxWidth,
      objectFit: style.objectFit,
      overlayZIndex: overlay ? window.getComputedStyle(overlay).zIndex : null,
      dialogZIndex: dialog ? window.getComputedStyle(dialog).zIndex : null
    };
  });
  console.log('Sales Dossier Metrics:', salesLogoMetrics);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_sales_dossier_modal.png') });
  console.log('Saved 02_sales_dossier_modal.png');

  // Close Sales Dossier
  const closeDossierBtn = page.locator('.sales-dossier-dialog .btn-action-icon, .sales-dossier-dialog button:has(.bi-x)').first();
  if (await closeDossierBtn.count() > 0) {
    await closeDossierBtn.click();
  } else {
    await page.evaluate(() => {
      const salesEl = document.querySelector('app-sales');
      // @ts-ignore
      if (salesEl && window.ng) window.ng.getComponent(salesEl)?.closeSalesDossier();
    });
  }
  await page.waitForTimeout(600);

  // =========================================================================
  // SCENARIO 3: Material Outward & Dispatch Modal
  // =========================================================================
  console.log('\n--- SCENARIO 3: Material Outward & Dispatch Modal ---');
  await page.evaluate(() => {
    // @ts-ignore
    const appRoot = document.querySelector('app-root');
    // @ts-ignore
    if (appRoot && window.ng) window.ng.getComponent(appRoot)?.switchTab('dispatch');
  });
  await page.waitForTimeout(2000);

  // Click View Dispatch Dossier button in the table if visible, or trigger via component
  const dispatchDossierBtn = page.locator('.btn-row-action.btn-view, .btn-row-action[title*="Challan"]').first();
  if (await dispatchDossierBtn.count() > 0) {
    console.log('Clicking dispatch dossier button in dispatch table...');
    await dispatchDossierBtn.click();
  } else {
    console.log('Triggering dispatch dossier via component instance...');
    await page.evaluate(() => {
      const dispatchEl = document.querySelector('app-dispatch');
      // @ts-ignore
      if (dispatchEl && window.ng) {
        // @ts-ignore
        const dispatchComp = window.ng.getComponent(dispatchEl);
        if (dispatchComp && dispatchComp.dispatchesList && dispatchComp.dispatchesList.length > 0) {
          dispatchComp.openDispatchDossier(dispatchComp.dispatchesList[0]);
        }
      }
    });
  }
  await page.waitForTimeout(1000);

  const dispatchMetrics = await page.evaluate(() => {
    const logo = document.querySelector('.dispatch-dossier-dialog .letterhead-logo');
    const overlay = document.querySelector('.dispatch-dossier-overlay');
    const dialog = document.querySelector('.dispatch-dossier-dialog');
    return {
      logoRenderedHeight: logo ? logo.getBoundingClientRect().height : null,
      logoRenderedWidth: logo ? logo.getBoundingClientRect().width : null,
      overlayZIndex: overlay ? window.getComputedStyle(overlay).zIndex : null,
      dialogZIndex: dialog ? window.getComputedStyle(dialog).zIndex : null
    };
  });
  console.log('Dispatch Dossier Metrics:', dispatchMetrics);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '03_dispatch_dossier_modal.png') });
  console.log('Saved 03_dispatch_dossier_modal.png');

  // Close Dispatch Dossier
  await page.evaluate(() => {
    const dispatchEl = document.querySelector('app-dispatch');
    // @ts-ignore
    if (dispatchEl && window.ng) window.ng.getComponent(dispatchEl)?.closeDispatchDossier();
  });
  await page.waitForTimeout(600);

  // =========================================================================
  // SCENARIO 4: Payment Voucher Modal in Payments Tab
  // =========================================================================
  console.log('\n--- SCENARIO 4: Payment Receipt Voucher in Payments Tab ---');
  await page.evaluate(() => {
    // @ts-ignore
    const appRoot = document.querySelector('app-root');
    // @ts-ignore
    if (appRoot && window.ng) window.ng.getComponent(appRoot)?.switchTab('payments');
  });
  await page.waitForTimeout(2000);

  // Trigger voucher modal via component or table button
  const voucherBtn = page.locator('.voucher-ref-link, .btn-action-voucher').first();
  if (await voucherBtn.count() > 0) {
    console.log('Clicking voucher button in payments table...');
    await voucherBtn.click();
  } else {
    console.log('Triggering voucher modal via component instance...');
    await page.evaluate(() => {
      const payEl = document.querySelector('app-payments');
      // @ts-ignore
      if (payEl && window.ng) {
        // @ts-ignore
        const payComp = window.ng.getComponent(payEl);
        if (payComp && payComp.paymentsList && payComp.paymentsList.length > 0) {
          payComp.openVoucherModal(payComp.paymentsList[0]);
        }
      }
    });
  }
  await page.waitForTimeout(1000);

  const voucherMetrics = await page.evaluate(() => {
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
  console.log('Payment Voucher Metrics:', voucherMetrics);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '04_payment_voucher_modal.png') });
  console.log('Saved 04_payment_voucher_modal.png');

  await browser.close();
  console.log('\n--- ALL E2E VERIFICATIONS COMPLETE! ---');
}

runE2E().catch(console.error);
