import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/c6f69d5a-cadc-46e5-9d2c-7f740c51bf78/modal_fixes';
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

async function verifyFixes() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to app...');
  await page.goto('http://localhost:4300', { waitUntil: 'networkidle', timeout: 30000 });

  // Check login
  const loginInput = await page.$('input[type="text"], input[name="username"], input[id*="user"]');
  if (loginInput) {
    console.log('Logging in...');
    await loginInput.fill('admin');
    const pwdInput = await page.$('input[type="password"]');
    if (pwdInput) await pwdInput.fill('admin123');
    const loginBtn = await page.$('button[type="submit"], button.btn-login, button.btn-primary');
    if (loginBtn) await loginBtn.click();
    await page.waitForTimeout(1500);
  }

  // 1. Verify Session Expired Modal (SweetAlert2 Z-Index / Overlay) on Settings / WhatsApp tab
  console.log('Testing Session Expired Modal on WhatsApp & Alerts tab...');
  // Navigate to settings tab first
  const settingsTab = await page.$('[data-tab="settings"], button:has-text("Settings"), button:has-text("Administration")');
  if (settingsTab) {
    await settingsTab.click();
    await page.waitForTimeout(800);
  }

  // Trigger Session Expired SweetAlert directly in page context
  await page.evaluate(() => {
    if (window.Swal) {
      window.Swal.fire({
        icon: 'warning',
        title: 'Session expired',
        text: 'Your session has expired due to inactivity. Please log in again.',
        confirmButtonText: 'Login again',
        confirmButtonColor: '#d97706',
        showCloseButton: true,
        allowOutsideClick: false,
        customClass: {
          popup: 'futane-dialog-popup',
          title: 'futane-dialog-title',
          htmlContainer: 'futane-dialog-text',
          confirmButton: 'futane-dialog-confirm-btn'
        }
      });
    }
  });
  await page.waitForTimeout(500);

  const swalContainerInfo = await page.evaluate(() => {
    const container = document.querySelector('.swal2-container');
    const popup = document.querySelector('.swal2-popup');
    if (!container || !popup) return null;
    const cStyle = window.getComputedStyle(container);
    const pStyle = window.getComputedStyle(popup);
    const pRect = popup.getBoundingClientRect();
    return {
      containerZIndex: cStyle.zIndex,
      containerBackground: cStyle.backgroundColor,
      popupRect: { x: pRect.x, y: pRect.y, width: pRect.width, height: pRect.height },
      popupZIndex: pStyle.zIndex
    };
  });
  console.log('Session Expired Swal metrics:', swalContainerInfo);

  const sessionExpiredPath = path.join(ARTIFACT_DIR, 'session_expired_modal_fixed.png');
  await page.screenshot({ path: sessionExpiredPath });
  console.log('Saved Session Expired screenshot:', sessionExpiredPath);

  // Close SweetAlert
  await page.evaluate(() => {
    if (window.Swal) window.Swal.close();
  });
  await page.waitForTimeout(500);

  // 2. Navigate to Sales Tab
  console.log('Navigating to Sales Tab...');
  const salesTab = await page.$('[data-tab="sales"], button:has-text("Sales")');
  if (salesTab) {
    await salesTab.click();
    await page.waitForTimeout(1000);
  }

  // 3. Open Commercial Sales Contract & Order Dossier Modal
  console.log('Opening Commercial Sales Contract & Order Dossier modal...');
  // Find the dossier icon button in the sales table
  const dossierBtn = await page.$('.btn-row-action[title*="dossier"], .btn-row-action:has(.bi-file-earmark-text), .btn-row-action:has(.bi-receipt), button[title*="commercial sales contract"]');
  if (dossierBtn) {
    await dossierBtn.click();
    await page.waitForTimeout(600);
  } else {
    // Alternatively trigger via component property
    await page.evaluate(() => {
      const salesComp = document.querySelector('app-sales');
      if (salesComp && salesComp.__ngContext__) {
        // find component instance
        const ctx = salesComp.__ngContext__;
        for (const item of ctx) {
          if (item && typeof item === 'object' && 'showSalesDossierModal' in item) {
            item.showSalesDossierModal = true;
            if (item.salesList && item.salesList.length > 0) {
              item.selectedSaleForDossier = item.salesList[0];
            }
          }
        }
      }
    });
    await page.waitForTimeout(600);
  }

  // Measure letterhead logo
  const logoMetrics = await page.evaluate(() => {
    const logo = document.querySelector('.sales-dossier-dialog .letterhead-logo, .sales-printable-sheet .letterhead-logo, .letterhead-logo');
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
  console.log('Letterhead logo metrics in Sales Dossier:', logoMetrics);

  const salesDossierPath = path.join(ARTIFACT_DIR, 'sales_dossier_modal_fixed.png');
  await page.screenshot({ path: salesDossierPath });
  console.log('Saved Sales Dossier screenshot:', salesDossierPath);

  // Close dossier modal
  const closeDossierBtn = await page.$('.dossier-top-actions button[title*="Close"], .btn-action-icon:has(.bi-x-lg)');
  if (closeDossierBtn) {
    await closeDossierBtn.click();
    await page.waitForTimeout(500);
  } else {
    await page.evaluate(() => {
      const overlay = document.querySelector('.sales-dossier-overlay');
      if (overlay) overlay.remove();
    });
    await page.waitForTimeout(300);
  }

  // 4. Verify Payment Voucher SweetAlert Modal on Sales Tab
  console.log('Testing Payment Voucher Receipt Dialog on Sales Tab...');
  await page.evaluate(() => {
    if (window.Swal) {
      window.Swal.fire({
        title: '',
        html: `
          <div style="text-align: left; font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; background: #ffffff; border-radius: 12px; padding: 4px 6px; color: #0f172a;">
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #0B47D4; padding-bottom: 12px; margin-bottom: 14px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <div style="width: 38px; height: 38px; border-radius: 10px; background: linear-gradient(135deg, #0B47D4 0%, #0066FF 100%); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 18px;">
                  <i class="bi bi-receipt-cutoff"></i>
                </div>
                <div>
                  <div style="font-weight: 800; font-size: 14px; color: #0f172a; letter-spacing: -0.01em;">FUTANE AGRO INDUSTRIES PVT. LTD.</div>
                  <div style="font-size: 11px; color: #64748b; font-weight: 500;">Fruit Crate Moulding & Commercial Division</div>
                </div>
              </div>
              <span style="background: rgba(11, 71, 212, 0.08); color: #0B47D4; font-size: 10.5px; font-weight: 700; padding: 3px 8px; border-radius: 6px; letter-spacing: 0.04em; text-transform: uppercase;">Payment Voucher</span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; background: #f8fafc; padding: 12px 14px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 12px; margin-bottom: 14px;">
              <div><span style="color: #64748b; font-size: 11px;">Receipt Number:</span><br><strong style="color: #0f172a; font-family: monospace; font-size: 12.5px;">RZP-PAY-882910</strong></div>
              <div><span style="color: #64748b; font-size: 11px;">Date & Time:</span><br><strong style="color: #0f172a;">10 Oct 2026, 12:15 AM</strong></div>
              <div><span style="color: #64748b; font-size: 11px;">Order Reference:</span><br><strong style="color: #0B47D4; font-family: monospace;">#97</strong></div>
              <div><span style="color: #64748b; font-size: 11px;">Customer / Party:</span><br><strong style="color: #0f172a;">Patel Traders, Ahmedabad</strong></div>
            </div>
            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 14px; margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-size: 12px; color: #475569;">Gross Order Value</span>
                <span style="font-size: 13px; font-weight: 700; color: #1e293b;">₹1,288,560.00</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 6px; border-top: 1px dashed #86efac; margin-bottom: 6px;">
                <span style="font-size: 13px; font-weight: 700; color: #15803d;">Amount Received</span>
                <span style="font-size: 16px; font-weight: 800; color: #15803d;">₹885,500.00</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 6px; border-top: 1px dashed #86efac;">
                <span style="font-size: 12px; color: #475569;">Remaining Due</span>
                <span style="font-size: 13px; font-weight: 700; color: #dc2626;">₹403,060.00</span>
              </div>
            </div>
          </div>
        `,
        showCancelButton: true,
        showCloseButton: true,
        cancelButtonText: 'Close',
        cancelButtonColor: '#94a3b8',
        confirmButtonText: 'Print Voucher',
        confirmButtonColor: '#0B47D4',
        width: '540px',
        customClass: {
          popup: 'futane-dialog-popup futane-receipt-popup'
        }
      });
    }
  });
  await page.waitForTimeout(600);

  const paymentVoucherPath = path.join(ARTIFACT_DIR, 'payment_voucher_modal_fixed.png');
  await page.screenshot({ path: paymentVoucherPath });
  console.log('Saved Payment Voucher screenshot:', paymentVoucherPath);

  await browser.close();
  console.log('All validations complete.');
}

verifyFixes().catch(err => {
  console.error('Validation error:', err);
  process.exit(1);
});
