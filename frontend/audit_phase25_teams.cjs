const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/31dd588e-fd68-4426-9deb-3030e10b9d4e';

async function audit() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to root...');
  await page.goto('http://localhost:4200', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);

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

  await page.goto('http://localhost:4200', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // Click Settings & Admin in Sidebar
  console.log('Clicking Settings in Sidebar...');
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('.nav-link, .sidebar-item, .sidebar-nav-item, span')).find(e => e.textContent.includes('Settings'));
    if (el) el.click();
  });
  await page.waitForTimeout(1000);

  // Click Teams & Depts subtab
  console.log('Clicking Teams & Depts subtab...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('.settings-nav-pill, button')).find(e => e.textContent.includes('Teams & Depts'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(1000);

  // 1. Desktop Initial Top View
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase25_01_desktop_top.png') });
  console.log('Saved phase25_01_desktop_top.png');

  // 2. Click Structure button on row 1 to expand personnel directory
  console.log('Expanding row 1 personnel structure...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.dept-action-btn, button'));
    const structBtn = btns.find(b => b.textContent.includes('Structure'));
    if (structBtn) structBtn.click();
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase25_02_expanded_structure.png') });
  console.log('Saved phase25_02_expanded_structure.png');

  // Collapse row 1 back
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.dept-action-btn, button'));
    const hideBtn = btns.find(b => b.textContent.includes('Hide'));
    if (hideBtn) hideBtn.click();
  });
  await page.waitForTimeout(300);

  // 3. Test Search Filter
  console.log('Testing search filter...');
  const searchInput = await page.$('.dept-search-input');
  if (searchInput) {
    await searchInput.fill('Logistics');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase25_03_search_filter.png') });
    console.log('Saved phase25_03_search_filter.png');
    // Clear search
    await searchInput.fill('');
    await page.waitForTimeout(300);
  }

  // 4. Open Add Department Modal
  console.log('Opening Add Department modal...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(e => e.textContent.includes('Add Department'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase25_04_modal_add_dept.png') });
  console.log('Saved phase25_04_modal_add_dept.png');

  // Close modal with Cancel button
  await page.evaluate(() => {
    const cancelBtn = Array.from(document.querySelectorAll('.dept-modal-content button, button')).find(e => e.textContent.trim() === 'Cancel');
    if (cancelBtn) cancelBtn.click();
  });
  await page.waitForTimeout(400);

  // 5. Dark Mode View
  console.log('Testing Dark Mode...');
  await page.evaluate(() => {
    document.body.classList.add('dark-theme');
    document.body.setAttribute('data-theme', 'dark');
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase25_05_dark_mode.png') });
  console.log('Saved phase25_05_dark_mode.png');

  // Switch back to light mode
  await page.evaluate(() => {
    document.body.classList.remove('dark-theme');
    document.body.removeAttribute('data-theme');
  });

  // 6. Tablet View (768px)
  console.log('Testing Tablet (768px)...');
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    const backdrop = document.querySelector('.sidebar-backdrop');
    if (backdrop) backdrop.click();
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase25_06_tablet.png') });
  console.log('Saved phase25_06_tablet.png');

  // 7. Mobile View (390px)
  console.log('Testing Mobile (390px)...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    const backdrop = document.querySelector('.sidebar-backdrop');
    if (backdrop) backdrop.click();
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase25_07_mobile.png') });
  console.log('Saved phase25_07_mobile.png');

  await browser.close();
  console.log('ALL PHASE 25 AUDITS COMPLETED SUCCESSFULLY.');
}

audit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
