const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/31dd588e-fd68-4426-9deb-3030e10b9d4e';

async function audit() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to root...');
  await page.goto('http://localhost:4200', { waitUntil: 'networkidle' });

  // Direct login as SUPER_ADMIN
  await page.evaluate(() => {
    const mockUser = {
      id: 1,
      username: 'admin',
      name: 'Neha Sharma',
      role: 'SUPER_ADMIN',
      email: 'admin@futaneagro.com'
    };
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('jwtToken', 'valid-mock-jwt-token');
  });

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Click Settings & Admin in Sidebar
  console.log('Clicking Settings & Admin in Sidebar...');
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('.nav-link, .sidebar-item, .sidebar-nav-item, span')).find(e => e.textContent.includes('Settings'));
    if (el) el.click();
  });
  await page.waitForTimeout(1200);

  // Switch to Business Rules subtab
  console.log('Clicking Business Rules subtab...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('.settings-nav-pill, button')).find(e => e.textContent.includes('Business Rules'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(1000);

  // 1. Desktop Top View
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'biz_rules_01_desktop_top.png') });
  console.log('Saved biz_rules_01_desktop_top.png');

  // 2. Scroll to GST & Manufacturing Shifts
  await page.evaluate(() => window.scrollBy(0, 450));
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'biz_rules_02_gst_shifts.png') });
  console.log('Saved biz_rules_02_gst_shifts.png');

  // 3. Scroll to Invoice Designer
  await page.evaluate(() => window.scrollBy(0, 550));
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'biz_rules_03_invoice_designer.png') });
  console.log('Saved biz_rules_03_invoice_designer.png');

  // Scroll back to top
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);

  // 4. Open Add Legal Entity Modal
  console.log('Opening Add Legal Entity modal...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(e => e.textContent.includes('Add Legal Entity'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'biz_rules_04_modal_add_company.png') });
  console.log('Saved biz_rules_04_modal_add_company.png');

  // Close modal
  await page.locator('.modal-close-btn').click();
  await page.waitForTimeout(400);

  // 5. Open Add Bank Account Modal
  console.log('Opening Add Bank Account modal...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(e => e.textContent.includes('Add Bank Account'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'biz_rules_05_modal_add_bank.png') });
  console.log('Saved biz_rules_05_modal_add_bank.png');

  // Close modal
  await page.locator('.modal-close-btn').click();
  await page.waitForTimeout(400);

  // 6. Dark Mode
  console.log('Testing Dark Mode...');
  await page.evaluate(() => {
    document.body.classList.add('dark-theme');
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'biz_rules_06_dark_mode_top.png') });
  await page.evaluate(() => window.scrollBy(0, 950));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'biz_rules_07_dark_invoice.png') });
  console.log('Saved dark mode screenshots');

  // Revert dark mode
  await page.evaluate(() => {
    document.body.classList.remove('dark-theme');
    window.scrollTo(0, 0);
  });

  // 7. Tablet (1024x768)
  console.log('Testing Tablet View (1024x768)...');
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    document.querySelector('.sidebar-backdrop')?.click();
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'biz_rules_08_tablet_top.png') });
  await page.evaluate(() => window.scrollBy(0, 800));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'biz_rules_09_tablet_invoice.png') });

  // 8. Mobile (390x844)
  console.log('Testing Mobile View (390x844)...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    document.querySelector('.sidebar-backdrop')?.click();
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'biz_rules_10_mobile_top.png') });
  await page.evaluate(() => window.scrollBy(0, 1100));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'biz_rules_11_mobile_invoice.png') });

  await browser.close();
  console.log('Audit completed successfully!');
}

audit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
