const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/31dd588e-fd68-4426-9deb-3030e10b9d4e';

async function audit() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to root...');
  await page.goto('http://localhost:4200', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);

  // Set mock authentication
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

  await page.goto('http://localhost:4200', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // Navigate to Settings
  console.log('Clicking Settings in Sidebar...');
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('.nav-link, .sidebar-item, .sidebar-nav-item, span')).find(e => e.textContent.includes('Settings'));
    if (el) el.click();
  });
  await page.waitForTimeout(1000);

  // Navigate to WhatsApp & Alerts
  console.log('Clicking WhatsApp & Alerts subtab...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('.settings-nav-pill, button')).find(e => e.textContent.includes('WhatsApp & Alerts'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(1000);

  // 1. Desktop Initial View (WhatsApp Studio & Smartphone Preview)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase27_01_desktop_main.png') });
  console.log('Saved phase27_01_desktop_main.png');

  // 2. Select Template 3 (SMS Dispatch Quick SMS) to verify adaptive preview
  console.log('Selecting SMS template...');
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.notif-template-item'));
    const smsItem = items.find(i => i.textContent.includes('SMS') || i.textContent.includes('Dispatch Quick SMS'));
    if (smsItem) smsItem.click();
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase27_02_sms_preview.png') });
  console.log('Saved phase27_02_sms_preview.png');

  // 3. Test Search & Filter
  console.log('Testing search and filter...');
  const searchInput = await page.$('.notif-search-input');
  if (searchInput) {
    await searchInput.fill('Payment');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase27_03_search_filter.png') });
    console.log('Saved phase27_03_search_filter.png');
    // Clear
    await searchInput.fill('');
    await page.waitForTimeout(300);
  }

  // 4. Test Dispatch Simulator
  console.log('Simulating test dispatch...');
  await page.evaluate(() => {
    const simBtn = document.querySelector('.notif-btn-sim-send');
    if (simBtn) simBtn.click();
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase27_04_test_simulated.png') });
  console.log('Saved phase27_04_test_simulated.png');

  // 5. Switch to Recent Dispatch Logs view
  console.log('Switching to Recent Dispatch Logs view...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.notif-section-btn'));
    const logsBtn = btns.find(b => b.textContent.includes('Recent Dispatch Logs'));
    if (logsBtn) logsBtn.click();
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase27_05_dispatch_logs.png') });
  console.log('Saved phase27_05_dispatch_logs.png');

  // 6. Switch to Channel & Gateway Profiles view
  console.log('Switching to Channel & Gateway Profiles view...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.notif-section-btn'));
    const gwBtn = btns.find(b => b.textContent.includes('Gateway Profiles'));
    if (gwBtn) gwBtn.click();
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase27_06_gateways.png') });
  console.log('Saved phase27_06_gateways.png');

  // Switch back to Studio
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.notif-section-btn'));
    const studioBtn = btns.find(b => b.textContent.includes('Studio & Template Editor'));
    if (studioBtn) studioBtn.click();
  });
  await page.waitForTimeout(400);

  // 7. Open Add Template Modal
  console.log('Opening Add Template Modal...');
  await page.evaluate(() => {
    const addBtn = Array.from(document.querySelectorAll('.notif-btn-primary')).find(b => b.textContent.includes('Add Template'));
    if (addBtn) addBtn.click();
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase27_07_add_modal.png') });
  console.log('Saved phase27_07_add_modal.png');

  // Close modal
  await page.evaluate(() => {
    const closeBtn = document.querySelector('.notif-modal-close');
    if (closeBtn) closeBtn.click();
  });
  await page.waitForTimeout(400);

  // 8. Dark Mode View
  console.log('Testing Dark Mode...');
  await page.evaluate(() => {
    document.body.classList.add('dark-theme');
    document.body.setAttribute('data-theme', 'dark');
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase27_08_dark_mode.png') });
  console.log('Saved phase27_08_dark_mode.png');

  // Switch back to light mode
  await page.evaluate(() => {
    document.body.classList.remove('dark-theme');
    document.body.removeAttribute('data-theme');
  });

  // 9. Tablet View (768px)
  console.log('Testing Tablet (768px)...');
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    const backdrop = document.querySelector('.sidebar-backdrop');
    if (backdrop) backdrop.click();
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase27_09_tablet.png') });
  console.log('Saved phase27_09_tablet.png');

  // 10. Mobile View (390px)
  console.log('Testing Mobile (390px)...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    const backdrop = document.querySelector('.sidebar-backdrop');
    if (backdrop) backdrop.click();
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase27_10_mobile.png') });
  console.log('Saved phase27_10_mobile.png');

  await browser.close();
  console.log('ALL PHASE 27 AUDITS COMPLETED SUCCESSFULLY.');
}

audit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
