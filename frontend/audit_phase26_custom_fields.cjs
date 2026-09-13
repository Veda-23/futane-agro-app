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

  // Click Extensible Fields subtab
  console.log('Clicking Extensible Fields subtab...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('.settings-nav-pill, button')).find(e => e.textContent.includes('Extensible Fields'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(1000);

  // 1. Desktop Initial View (PARTIES Entity)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase26_01_desktop_main.png') });
  console.log('Saved phase26_01_desktop_main.png');

  // 2. Switch Entity to INVOICES
  console.log('Switching to INVOICES entity...');
  await page.evaluate(() => {
    const pills = Array.from(document.querySelectorAll('.cf-entity-pill'));
    const invPill = pills.find(p => p.textContent.includes('INVOICES'));
    if (invPill) invPill.click();
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase26_02_switch_entity_invoices.png') });
  console.log('Saved phase26_02_switch_entity_invoices.png');

  // Switch back to PARTIES
  await page.evaluate(() => {
    const pills = Array.from(document.querySelectorAll('.cf-entity-pill'));
    const partyPill = pills.find(p => p.textContent.includes('PARTIES'));
    if (partyPill) partyPill.click();
  });
  await page.waitForTimeout(500);

  // 3. Test Search & Filter
  console.log('Testing search and filter...');
  const searchInput = await page.$('.cf-search-input');
  if (searchInput) {
    await searchInput.fill('Rating');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase26_03_search_filter.png') });
    console.log('Saved phase26_03_search_filter.png');
    // Clear search
    await searchInput.fill('');
    await page.waitForTimeout(300);
  }

  // 4. Open Add Dynamic Field Modal & Configure Options
  console.log('Opening Add Dynamic Field modal...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('.cf-btn-primary, button')).find(e => e.textContent.includes('Add Dynamic Field'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(600);

  // Switch to SELECT type and add options
  await page.evaluate(() => {
    const select = document.querySelector('.cf-modal-select');
    if (select) {
      select.value = 'SELECT';
      select.dispatchEvent(new Event('change'));
    }
  });
  await page.waitForTimeout(400);

  // Type an option and click Add
  const optInput = await page.$('.cf-add-opt-row input');
  if (optInput) {
    await optInput.fill('Wholesale VIP');
    await page.evaluate(() => {
      const addBtn = document.querySelector('.cf-btn-add-opt');
      if (addBtn) addBtn.click();
    });
    await page.waitForTimeout(300);
    await optInput.fill('Retail Tier A');
    await page.evaluate(() => {
      const addBtn = document.querySelector('.cf-btn-add-opt');
      if (addBtn) addBtn.click();
    });
    await page.waitForTimeout(300);
  }

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase26_04_modal_add_field.png') });
  console.log('Saved phase26_04_modal_add_field.png');

  // Close modal with Cancel button
  await page.evaluate(() => {
    const cancelBtn = document.querySelector('.cf-btn-modal-cancel');
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
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase26_05_dark_mode.png') });
  console.log('Saved phase26_05_dark_mode.png');

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
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase26_06_tablet.png') });
  console.log('Saved phase26_06_tablet.png');

  // 7. Mobile View (390px)
  console.log('Testing Mobile (390px)...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    const backdrop = document.querySelector('.sidebar-backdrop');
    if (backdrop) backdrop.click();
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase26_07_mobile.png') });
  console.log('Saved phase26_07_mobile.png');

  await browser.close();
  console.log('ALL PHASE 26 AUDITS COMPLETED SUCCESSFULLY.');
}

audit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
